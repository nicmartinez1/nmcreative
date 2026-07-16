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

-- Admin view: one row per client showing their CURRENT plan (the most
-- recent entry in plan_changes) alongside their email. Query this
-- anytime from the SQL Editor to see who's on what plan.
create or replace view public.client_current_plans as
select distinct on (pc.user_id)
  u.email,
  pc.plan_name as current_plan,
  pc.changed_at as plan_since
from public.plan_changes pc
join auth.users u on u.id = pc.user_id
order by pc.user_id, pc.changed_at desc;

-- Locked down to the SQL Editor / dashboard only — not exposed through
-- the public API, so client emails and plans can't be fetched by anyone
-- using the anon key.
revoke all on public.client_current_plans from anon, authenticated;

-- To check current plans at any time, run:
-- select * from public.client_current_plans order by plan_since desc;
