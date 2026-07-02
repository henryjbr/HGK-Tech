-- Execute no Supabase SQL Editor AFTER supabase-schema.sql.
-- This migration encrypts personal data at column level and removes public
-- writes to tables. Keep the encryption key in Vault; never copy it to clients.

begin;

create extension if not exists pgcrypto;
create extension if not exists supabase_vault cascade;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from vault.secrets where name = 'hgk_contact_data_key'
  ) then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'hgk_contact_data_key',
      'AES-256 key for HGK personal data'
    );
  end if;
end
$$;

create or replace function private.data_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'hgk_contact_data_key'
  limit 1;
$$;

create or replace function private.encrypt_text(value text)
returns bytea
language sql
volatile
strict
security definer
set search_path = ''
as $$
  select extensions.pgp_sym_encrypt(
    value,
    private.data_key(),
    'cipher-algo=aes256, compress-algo=1'
  );
$$;

create or replace function private.decrypt_text(value bytea)
returns text
language sql
stable
strict
security definer
set search_path = ''
as $$
  select extensions.pgp_sym_decrypt(value, private.data_key());
$$;

revoke all on function private.data_key() from public, anon, authenticated;
revoke all on function private.encrypt_text(text) from public, anon, authenticated;
revoke all on function private.decrypt_text(bytea) from public, anon, authenticated;

alter table public.dashboard_admins
  add column if not exists mfa_required boolean not null default false;

update public.dashboard_admins
set role = 'proprietario'
where email = 'geraldopoliveira@gmail.com';

create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dashboard_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
      and (
        mfa_required = false
        or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      )
  );
$$;

create or replace function public.is_dashboard_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dashboard_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
      and role = 'proprietario'
      and (
        mfa_required = false
        or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      )
  );
$$;

revoke all on function public.is_dashboard_admin() from public;
revoke all on function public.is_dashboard_owner() from public;
grant execute on function public.is_dashboard_admin() to authenticated;
grant execute on function public.is_dashboard_owner() to authenticated;

-- Encrypt all contact PII, including existing records.
alter table public.contact_submissions
  add column if not exists name_encrypted bytea,
  add column if not exists email_encrypted bytea,
  add column if not exists phone_encrypted bytea,
  add column if not exists company_encrypted bytea,
  add column if not exists goal_encrypted bytea,
  add column if not exists notes_encrypted bytea,
  add column if not exists referrer_encrypted bytea,
  add column if not exists user_agent_encrypted bytea,
  add column if not exists visitor_id_encrypted bytea,
  add column if not exists session_id_encrypted bytea,
  add column if not exists session_hash bytea;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contact_submissions'
      and column_name = 'name'
  ) then
    update public.contact_submissions
    set
      name_encrypted = private.encrypt_text(name),
      email_encrypted = private.encrypt_text(email::text),
      phone_encrypted = private.encrypt_text(phone),
      company_encrypted = private.encrypt_text(company),
      goal_encrypted = private.encrypt_text(goal),
      notes_encrypted = private.encrypt_text(notes),
      referrer_encrypted = private.encrypt_text(referrer),
      user_agent_encrypted = private.encrypt_text(user_agent),
      visitor_id_encrypted = private.encrypt_text(visitor_id),
      session_id_encrypted = private.encrypt_text(session_id),
      session_hash = extensions.digest(coalesce(session_id, id::text), 'sha256')
    where name_encrypted is null;
  end if;
end
$$;

alter table public.contact_submissions
  alter column name_encrypted set not null,
  alter column email_encrypted set not null;

alter table public.contact_submissions
  drop column if exists name,
  drop column if exists email,
  drop column if exists phone,
  drop column if exists company,
  drop column if exists goal,
  drop column if exists notes,
  drop column if exists referrer,
  drop column if exists user_agent,
  drop column if exists visitor_id,
  drop column if exists session_id;

create index if not exists contact_submissions_session_hash_idx
  on public.contact_submissions (session_hash, created_at desc);

-- Login user agents may identify a device, so encrypt those too.
alter table public.dashboard_login_events
  add column if not exists user_agent_encrypted bytea;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dashboard_login_events'
      and column_name = 'user_agent'
  ) then
    update public.dashboard_login_events
    set user_agent_encrypted = private.encrypt_text(user_agent)
    where user_agent is not null and user_agent_encrypted is null;
  end if;
end
$$;

alter table public.dashboard_login_events
  drop column if exists user_agent;

-- Analytics identifiers are one-way hashes; raw identifiers are erased.
alter table public.analytics_events
  add column if not exists visitor_hash bytea,
  add column if not exists session_hash bytea;

update public.analytics_events
set
  visitor_hash = case when visitor_id is null then visitor_hash else extensions.digest(visitor_id, 'sha256') end,
  session_hash = case when session_id is null then session_hash else extensions.digest(session_id, 'sha256') end,
  visitor_id = null,
  session_id = null,
  metadata = metadata - 'company' - 'message';

create index if not exists analytics_events_visitor_hash_idx
  on public.analytics_events (visitor_hash);
create index if not exists analytics_events_session_hash_idx
  on public.analytics_events (session_hash);

create or replace view public.analytics_daily_summary
with (security_invoker = true) as
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_name = 'page_view') as page_views,
  count(distinct visitor_hash) filter (where visitor_hash is not null) as unique_visitors,
  count(distinct session_hash) filter (where session_hash is not null) as sessions,
  count(*) filter (where event_name = 'contact_submit') as contact_submits,
  count(*) filter (where event_name = 'contact_focus') as contact_starts,
  count(*) filter (where event_name = 'cta_click') as cta_clicks
from public.analytics_events
group by 1;

-- The public website can only call these narrow, validated functions.
create or replace function public.submit_contact(
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_company text,
  contact_goal text,
  contact_language text,
  contact_page_path text,
  contact_referrer text,
  contact_user_agent text,
  contact_visitor_id text,
  contact_session_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid := gen_random_uuid();
  normalized_email text := lower(trim(contact_email));
  normalized_session text := left(coalesce(contact_session_id, ''), 128);
  fingerprint bytea := extensions.digest(normalized_session, 'sha256');
begin
  if length(trim(coalesce(contact_name, ''))) not between 2 and 120
    or length(normalized_email) not between 5 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(coalesce(contact_phone, '')) > 32
    or length(coalesce(contact_company, '')) > 160
    or length(coalesce(contact_goal, '')) > 160
    or length(coalesce(contact_page_path, '')) > 500
    or length(normalized_session) < 16
  then
    raise exception 'invalid contact data' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.contact_submissions
    where session_hash = fingerprint
      and created_at > now() - interval '15 minutes'
  ) >= 3 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.contact_submissions (
    id, name_encrypted, email_encrypted, phone_encrypted,
    company_encrypted, goal_encrypted, language, page_path,
    referrer_encrypted, user_agent_encrypted, visitor_id_encrypted,
    session_id_encrypted, session_hash
  ) values (
    new_id,
    private.encrypt_text(trim(contact_name)),
    private.encrypt_text(normalized_email),
    private.encrypt_text(nullif(trim(contact_phone), '')),
    private.encrypt_text(nullif(trim(contact_company), '')),
    private.encrypt_text(nullif(trim(contact_goal), '')),
    left(contact_language, 12),
    left(contact_page_path, 500),
    private.encrypt_text(nullif(left(contact_referrer, 1000), '')),
    private.encrypt_text(nullif(left(contact_user_agent, 1000), '')),
    private.encrypt_text(nullif(left(contact_visitor_id, 128), '')),
    private.encrypt_text(normalized_session),
    fingerprint
  );

  return new_id;
end;
$$;

create or replace function public.track_analytics_event(
  tracked_event_name text,
  tracked_page_path text,
  tracked_page_title text,
  tracked_element_label text,
  tracked_element_href text,
  tracked_section_id text,
  tracked_language text,
  tracked_visitor_id text,
  tracked_session_id text,
  tracked_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_events constant text[] := array[
    'page_view', 'contact_focus', 'contact_submit', 'contact_submit_error',
    'cta_click', 'interaction_click', 'nav_click', 'language_change', 'section_view'
  ];
  fingerprint bytea := extensions.digest(left(coalesce(tracked_session_id, ''), 128), 'sha256');
begin
  if not (tracked_event_name = any(allowed_events))
    or length(coalesce(tracked_session_id, '')) < 16
    or length(coalesce(tracked_page_path, '')) > 500
  then
    raise exception 'invalid analytics event' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.analytics_events
    where session_hash = fingerprint
      and created_at > now() - interval '1 minute'
  ) >= 60 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.analytics_events (
    event_name, page_path, page_title, element_label, element_href,
    section_id, language, visitor_hash, session_hash, metadata
  ) values (
    tracked_event_name,
    left(tracked_page_path, 500),
    left(tracked_page_title, 300),
    left(tracked_element_label, 200),
    left(tracked_element_href, 500),
    left(tracked_section_id, 120),
    left(tracked_language, 12),
    extensions.digest(left(coalesce(tracked_visitor_id, ''), 128), 'sha256'),
    fingerprint,
    jsonb_build_object(
      'viewport_width', tracked_metadata -> 'viewport_width',
      'viewport_height', tracked_metadata -> 'viewport_height',
      'goal', left(tracked_metadata ->> 'goal', 160),
      'has_company', tracked_metadata -> 'has_company'
    )
  );
end;
$$;

-- Admin functions decrypt only after RLS-equivalent authorization succeeds.
create or replace function public.list_contact_submissions(result_limit integer default 100)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  company text,
  goal text,
  language text,
  page_path text,
  status text,
  notes text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'access denied' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    private.decrypt_text(c.name_encrypted),
    private.decrypt_text(c.email_encrypted),
    private.decrypt_text(c.phone_encrypted),
    private.decrypt_text(c.company_encrypted),
    private.decrypt_text(c.goal_encrypted),
    c.language,
    c.page_path,
    c.status,
    private.decrypt_text(c.notes_encrypted),
    c.created_at
  from public.contact_submissions c
  order by c.created_at desc
  limit least(greatest(result_limit, 1), 100);
end;
$$;

create or replace function public.update_contact_status(contact_id uuid, next_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'access denied' using errcode = '42501';
  end if;
  if next_status not in ('novo', 'em_contato', 'convertido', 'arquivado') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  update public.contact_submissions
  set status = next_status
  where id = contact_id;
end;
$$;

create or replace function public.record_dashboard_login(event_type text, user_agent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_dashboard_admin() or $1 not in ('login', 'logout') then
    raise exception 'access denied' using errcode = '42501';
  end if;

  insert into public.dashboard_login_events (
    email, event_type, user_agent_encrypted
  ) values (
    lower(auth.jwt() ->> 'email'),
    $1,
    private.encrypt_text(nullif(left($2, 1000), ''))
  );
end;
$$;

create or replace function public.list_dashboard_logins()
returns table (
  id bigint,
  email citext,
  event_type text,
  user_agent text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_dashboard_admin() then
    raise exception 'access denied' using errcode = '42501';
  end if;

  return query
  select
    e.id, e.email, e.event_type,
    private.decrypt_text(e.user_agent_encrypted), e.created_at
  from public.dashboard_login_events e
  order by e.created_at desc
  limit 30;
end;
$$;

create or replace function public.authorize_dashboard_member(
  member_email text,
  member_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(member_email));
begin
  if not public.is_dashboard_owner() then
    raise exception 'owner access required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from auth.users where lower(email) = normalized_email
  ) then
    raise exception 'create and confirm this user in Auth first'
      using errcode = '22023';
  end if;

  insert into public.dashboard_admins (
    email, full_name, role, is_active
  ) values (
    normalized_email, nullif(left(trim(member_name), 120), ''),
    'operador', true
  )
  on conflict (email) do update
  set
    full_name = excluded.full_name,
    is_active = true;
end;
$$;

-- Remove broad public writes and expose only the RPC surface.
drop policy if exists "Public can insert contacts" on public.contact_submissions;
drop policy if exists "Public can insert analytics events" on public.analytics_events;
drop policy if exists "Admins can insert dashboard admins" on public.dashboard_admins;
drop policy if exists "Admins can update dashboard admins" on public.dashboard_admins;
drop policy if exists "Admins can delete dashboard admins" on public.dashboard_admins;

create policy "Owners can insert dashboard admins"
on public.dashboard_admins for insert to authenticated
with check (public.is_dashboard_owner());

create policy "Owners can update dashboard admins"
on public.dashboard_admins for update to authenticated
using (public.is_dashboard_owner())
with check (public.is_dashboard_owner());

create policy "Owners can delete dashboard admins"
on public.dashboard_admins for delete to authenticated
using (public.is_dashboard_owner());

revoke all on public.contact_submissions from anon;
revoke all on public.analytics_events from anon;
revoke all on function public.submit_contact(
  text, text, text, text, text, text, text, text, text, text, text
) from public;
revoke all on function public.track_analytics_event(
  text, text, text, text, text, text, text, text, text, jsonb
) from public;

grant execute on function public.submit_contact(
  text, text, text, text, text, text, text, text, text, text, text
) to anon;
grant execute on function public.track_analytics_event(
  text, text, text, text, text, text, text, text, text, jsonb
) to anon;
grant execute on function public.list_contact_submissions(integer) to authenticated;
grant execute on function public.update_contact_status(uuid, text) to authenticated;
grant execute on function public.record_dashboard_login(text, text) to authenticated;
grant execute on function public.list_dashboard_logins() to authenticated;
grant execute on function public.authorize_dashboard_member(text, text) to authenticated;
grant usage on schema public to authenticated;
grant select on public.analytics_daily_summary to authenticated;
grant select on public.dashboard_admins to authenticated;

commit;

-- Atualiza imediatamente o cache de rotas da API após criar funções e grants.
notify pgrst, 'reload schema';
