-- Run this once in the Supabase SQL Editor for the Web Skillet project.
-- Tracks every plan switch a client makes, so you can see who's on what
-- plan (and when they changed) for billing purposes.

create table public.plan_changes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) not null,
  plan_name text not null,
  changed_at timestamptz not null default now()
);

alter table public.plan_changes enable row level security;

-- Clients can only see and log their own plan changes.
create policy "Clients can view their own plan changes"
  on public.plan_changes for select
  using (auth.uid() = user_id);

create policy "Clients can insert their own plan changes"
  on public.plan_changes for insert
  with check (auth.uid() = user_id);

-- As the project owner, you can see every client's plan history in the
-- Table Editor (Table Editor -> plan_changes) regardless of RLS, since
-- the dashboard uses your privileged service role.

-- Per-client billing details set by you from the admin dashboard only
-- (clients never fill this in themselves): whether you built them a
-- website (a fixed, one-time $2,000 sale, separate from their monthly
-- service plan), whether they're currently on a monthly subscription
-- at all, and — only if so — the exact monthly amount they're billed.
-- website_completed_at, checkin_email_sent_at, and feedback_email_sent_at
-- back the scheduled lifecycle emails (see the /api/cron/lifecycle-emails
-- route): a one-time feedback request 14 days after the website goes
-- live, and a recurring "how's it going / want to upgrade" check-in 30
-- days after the current plan started, each sent at most once per cycle.
create table public.client_profiles (
  user_id uuid primary key references auth.users (id),
  has_website boolean not null default false,
  has_subscription boolean not null default false,
  monthly_amount numeric,
  website_completed_at timestamptz,
  checkin_email_sent_at timestamptz,
  feedback_email_sent_at timestamptz,
  signup_survey_sent_at timestamptz,
  referral_code text unique,
  updated_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;

create policy "Clients can view their own profile"
  on public.client_profiles for select
  using (auth.uid() = user_id);

-- If you already ran an earlier version of this file, client_profiles
-- exists already (with or without a "website" text column), and
-- client_current_plans still reads the old shape. Run this instead of
-- the "create table" above to migrate it (drop the view FIRST if it
-- depends on a "website" column you're removing — dropping a column
-- before the view errors with "cannot drop column ... because other
-- objects depend on it"):
-- drop view if exists public.client_current_plans;
-- alter table public.client_profiles
--   add column if not exists has_website boolean not null default false,
--   add column if not exists has_subscription boolean not null default false,
--   add column if not exists monthly_amount numeric;
-- alter table public.client_profiles drop column if exists website;
-- -- Anyone with a monthly_amount already set was implicitly a
-- -- subscriber under the old shape — carry that forward:
-- update public.client_profiles set has_subscription = true where monthly_amount is not null;
-- -- Lifecycle-email tracking columns (safe to run even if the table
-- -- already has has_website/has_subscription/monthly_amount):
-- alter table public.client_profiles
--   add column if not exists website_completed_at timestamptz,
--   add column if not exists checkin_email_sent_at timestamptz,
--   add column if not exists feedback_email_sent_at timestamptz,
--   add column if not exists signup_survey_sent_at timestamptz,
--   add column if not exists referral_code text unique;
-- -- Anyone already marked has_website = true had their website
-- -- completed at some unknown past point — backdate it far enough
-- -- that the one-time feedback email fires on the very next cron run:
-- update public.client_profiles
-- set website_completed_at = now() - interval '15 days'
-- where has_website = true and website_completed_at is null;

-- Admin view: one row per client showing their CURRENT plan (the most
-- recent entry in plan_changes), their billing details, and their
-- email. Query this anytime from the SQL Editor to see who's on what
-- plan and what they're actually paying.
--
-- "create or replace view" can only APPEND new columns at the end —
-- inserting has_subscription before monthly_amount counts as renaming
-- an existing column, which Postgres rejects. Drop the view first
-- whenever the column list changes shape, then recreate it:
drop view if exists public.client_current_plans;
create view public.client_current_plans as
select distinct on (pc.user_id)
  pc.user_id,
  u.email,
  pc.plan_name as current_plan,
  pc.changed_at as plan_since,
  coalesce(cp.has_website, false) as has_website,
  coalesce(cp.has_subscription, false) as has_subscription,
  cp.monthly_amount,
  cp.website_completed_at,
  cp.checkin_email_sent_at,
  cp.feedback_email_sent_at
from public.plan_changes pc
join auth.users u on u.id = pc.user_id
left join public.client_profiles cp on cp.user_id = pc.user_id
order by pc.user_id, pc.changed_at desc;

-- Locked down to the SQL Editor / dashboard only — not exposed through
-- the public API, so client emails and plans can't be fetched by anyone
-- using the anon key.
revoke all on public.client_current_plans from anon, authenticated;

-- To check current plans at any time, run:
-- select * from public.client_current_plans order by plan_since desc;

-- Cooldown: reject a plan change if the client's last one was less than
-- 30 days ago, so plans can't be switched repeatedly mid-billing-cycle.
-- Skipped for the SQL Editor / dashboard ("postgres") and for the admin
-- dashboard's API route, which writes using the service_role key.
create or replace function public.enforce_plan_change_cooldown()
returns trigger as $$
declare
  last_change timestamptz;
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  select changed_at into last_change
  from public.plan_changes
  where user_id = new.user_id
  order by changed_at desc
  limit 1;

  if last_change is not null and new.changed_at < last_change + interval '30 days' then
    raise exception 'Plan changes are limited to once every 30 days. Next change available %',
      to_char(last_change + interval '30 days', 'YYYY-MM-DD');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists plan_change_cooldown on public.plan_changes;
create trigger plan_change_cooldown
  before insert on public.plan_changes
  for each row execute function public.enforce_plan_change_cooldown();

-- Plan CHANGE REQUESTS: a client asking to switch plans no longer takes
-- effect immediately. It lands here as a pending request; nothing in
-- plan_changes (and therefore nothing on their bill) changes until you
-- approve it from the admin dashboard, which is what actually inserts
-- the row into plan_changes.
create table public.plan_requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) not null,
  plan_name text not null,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  resolved_at timestamptz
);

alter table public.plan_requests enable row level security;

create policy "Clients can view their own plan requests"
  on public.plan_requests for select
  using (auth.uid() = user_id);

create policy "Clients can insert their own plan requests"
  on public.plan_requests for insert
  with check (auth.uid() = user_id);

-- Same 30-day cooldown as before, but now checked at REQUEST time
-- against the last REAL change (plan_changes), plus a check that
-- there isn't already a pending request sitting unresolved. Skipped
-- for the SQL Editor / admin API (service_role) — i.e. you approving a
-- request bypasses the cooldown by design ("unless it gets approved").
create or replace function public.enforce_plan_request_cooldown()
returns trigger as $$
declare
  last_change timestamptz;
  already_pending boolean;
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  select changed_at into last_change
  from public.plan_changes
  where user_id = new.user_id
  order by changed_at desc
  limit 1;

  if last_change is not null and new.requested_at < last_change + interval '30 days' then
    raise exception 'Plan changes are limited to once every 30 days. Next request available %',
      to_char(last_change + interval '30 days', 'YYYY-MM-DD');
  end if;

  select exists(
    select 1 from public.plan_requests
    where user_id = new.user_id and status = 'pending'
  ) into already_pending;

  if already_pending then
    raise exception 'You already have a pending plan request.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists plan_request_cooldown on public.plan_requests;
create trigger plan_request_cooldown
  before insert on public.plan_requests
  for each row execute function public.enforce_plan_request_cooldown();

-- Contact form inquiries land here instead of going straight to email —
-- the admin dashboard reads this table directly. Locked down entirely
-- (no anon/authenticated access); the /api/contact and /api/admin/*
-- routes both write/read using the service_role key.
create table public.contact_messages (
  id bigint generated always as identity primary key,
  business_name text not null,
  phone text not null,
  email text not null,
  address text,
  is_startup boolean not null default false,
  services text[],
  message text,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

-- Referrals: every client has a short referral_code (see
-- client_profiles.referral_code, generated automatically). When
-- someone signs up or submits the contact form mentioning that code,
-- one row lands here crediting the referrer — purely a tracking log
-- for you to review and pay out manually, no automatic discounting or
-- payment happens from this table.
create table public.referrals (
  id bigint generated always as identity primary key,
  referrer_user_id uuid references auth.users (id) not null,
  referred_email text not null,
  source text not null check (source in ('contact', 'signup')),
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;
revoke all on public.referrals from anon, authenticated;

-- ---------------------------------------------------------------------
-- Admin operations (run these from the SQL Editor whenever needed)
-- ---------------------------------------------------------------------

-- 1. Look up a client's user_id from their email:
-- select id, email from auth.users where email = 'client@example.com';

-- 2. Force-set a client's plan right now (bypasses the cooldown since
--    you're running this as postgres; also resets their 30-day timer
--    to start from now):
-- insert into public.plan_changes (user_id, plan_name)
-- values ('<user-id-from-step-1>', 'Growth+');

-- 3. Clear a client's lock without changing their plan (backdates their
--    last change so the 30-day cooldown reads as already expired):
-- update public.plan_changes
-- set changed_at = now() - interval '31 days'
-- where id = (
--   select id from public.plan_changes
--   where user_id = '<user-id-from-step-1>'
--   order by changed_at desc
--   limit 1
-- );
