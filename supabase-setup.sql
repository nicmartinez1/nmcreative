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

-- Links each client to the actual website you built for them (set by
-- you from the admin dashboard — clients never fill this in themselves).
create table public.client_profiles (
  user_id uuid primary key references auth.users (id),
  website text,
  updated_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;

create policy "Clients can view their own profile"
  on public.client_profiles for select
  using (auth.uid() = user_id);

-- Admin view: one row per client showing their CURRENT plan (the most
-- recent entry in plan_changes), their website, and their email. Query
-- this anytime from the SQL Editor to see who's on what plan.
create or replace view public.client_current_plans as
select distinct on (pc.user_id)
  u.email,
  pc.plan_name as current_plan,
  pc.changed_at as plan_since,
  cp.website
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
