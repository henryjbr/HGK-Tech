create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.dashboard_admins (
  email citext primary key,
  full_name text,
  role text not null default 'operador',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.dashboard_admins
add column if not exists full_name text;

alter table public.dashboard_admins
add column if not exists role text not null default 'operador';

alter table public.dashboard_admins
add column if not exists is_active boolean not null default true;

create table if not exists public.dashboard_login_events (
  id bigserial primary key,
  email citext not null,
  event_type text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_login_events_created_at_idx on public.dashboard_login_events (created_at desc);
create index if not exists dashboard_login_events_email_idx on public.dashboard_login_events (email);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  phone text,
  company text,
  goal text,
  language text,
  page_path text,
  referrer text,
  user_agent text,
  visitor_id text,
  session_id text,
  status text not null default 'novo',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions
add column if not exists phone text;

create table if not exists public.analytics_events (
  id bigserial primary key,
  event_name text not null,
  page_path text,
  page_title text,
  element_label text,
  element_href text,
  section_id text,
  language text,
  visitor_id text,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx on public.contact_submissions (status);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
create index if not exists analytics_events_visitor_idx on public.analytics_events (visitor_id);

create or replace view public.analytics_daily_summary
with (security_invoker = true) as
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_name = 'page_view') as page_views,
  count(distinct visitor_id) filter (where visitor_id is not null) as unique_visitors,
  count(distinct session_id) filter (where session_id is not null) as sessions,
  count(*) filter (where event_name = 'contact_submit') as contact_submits,
  count(*) filter (where event_name = 'contact_focus') as contact_starts,
  count(*) filter (where event_name = 'cta_click') as cta_clicks
from public.analytics_events
group by 1;

create or replace view public.analytics_event_breakdown
with (security_invoker = true) as
select
  event_name,
  count(*) as total,
  max(created_at) as last_seen_at
from public.analytics_events
group by event_name;

alter table public.dashboard_admins enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.analytics_events enable row level security;

create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dashboard_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
  );
$$;

drop policy if exists "Admins can read dashboard admins" on public.dashboard_admins;
create policy "Admins can read dashboard admins"
on public.dashboard_admins
for select
to authenticated
using (public.is_dashboard_admin());

drop policy if exists "Admins can insert dashboard admins" on public.dashboard_admins;
create policy "Admins can insert dashboard admins"
on public.dashboard_admins
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists "Admins can update dashboard admins" on public.dashboard_admins;
create policy "Admins can update dashboard admins"
on public.dashboard_admins
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists "Admins can delete dashboard admins" on public.dashboard_admins;
create policy "Admins can delete dashboard admins"
on public.dashboard_admins
for delete
to authenticated
using (public.is_dashboard_admin());

alter table public.dashboard_login_events enable row level security;

drop policy if exists "Admins can read login events" on public.dashboard_login_events;
create policy "Admins can read login events"
on public.dashboard_login_events
for select
to authenticated
using (public.is_dashboard_admin());

drop policy if exists "Admins can insert login events" on public.dashboard_login_events;
create policy "Admins can insert login events"
on public.dashboard_login_events
for insert
to authenticated
with check (public.is_dashboard_admin());

drop policy if exists "Public can insert contacts" on public.contact_submissions;
create policy "Public can insert contacts"
on public.contact_submissions
for insert
to anon
with check (true);

drop policy if exists "Admins can read contacts" on public.contact_submissions;
create policy "Admins can read contacts"
on public.contact_submissions
for select
to authenticated
using (public.is_dashboard_admin());

drop policy if exists "Admins can update contacts" on public.contact_submissions;
create policy "Admins can update contacts"
on public.contact_submissions
for update
to authenticated
using (public.is_dashboard_admin())
with check (public.is_dashboard_admin());

drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
on public.analytics_events
for insert
to anon
with check (true);

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_dashboard_admin());

grant usage on schema public to anon, authenticated;
grant insert on public.contact_submissions to anon;
grant insert on public.analytics_events to anon;
grant select, update on public.contact_submissions to authenticated;
grant select on public.analytics_events to authenticated;
grant select on public.analytics_daily_summary to authenticated;
grant select on public.analytics_event_breakdown to authenticated;
grant select, insert, update, delete on public.dashboard_admins to authenticated;
grant select, insert on public.dashboard_login_events to authenticated;
grant usage, select on sequence public.analytics_events_id_seq to anon, authenticated;
grant usage, select on sequence public.dashboard_login_events_id_seq to authenticated;

insert into public.dashboard_admins (email)
values ('geraldopoliveira@gmail.com')
on conflict (email) do nothing;
