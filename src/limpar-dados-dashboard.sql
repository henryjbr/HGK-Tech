-- Limpa os dados operacionais do dashboard e preserva somente Geraldo Pedroso.
-- Execute este arquivo no SQL Editor do Supabase.

begin;

do $$
begin
  if not exists (
    select 1
    from auth.users
    where lower(email) = 'geraldopoliveira@gmail.com'
  ) then
    raise exception 'Limpeza cancelada: o login de Geraldo não existe em auth.users.';
  end if;

  if not exists (
    select 1
    from public.dashboard_admins
    where lower(email::text) = 'geraldopoliveira@gmail.com'
  ) then
    raise exception 'Limpeza cancelada: Geraldo não existe em public.dashboard_admins.';
  end if;
end
$$;

-- Métricas de visualização e interação.
delete from public.analytics_events;

-- Contatos recebidos pelo site.
delete from public.contact_submissions;

-- Histórico de entradas e saídas do dashboard.
delete from public.dashboard_login_events;

-- Remove todos os funcionários do dashboard, preservando o proprietário.
delete from public.dashboard_admins
where lower(email::text) <> 'geraldopoliveira@gmail.com';

update public.dashboard_admins
set
  full_name = 'Geraldo Pedroso',
  role = 'proprietario',
  is_active = true
where lower(email::text) = 'geraldopoliveira@gmail.com';

-- Remove os logins dos demais funcionários no Supabase Auth.
delete from auth.users
where lower(email) <> 'geraldopoliveira@gmail.com';

do $$
declare
  analytics_count bigint;
  contacts_count bigint;
  login_events_count bigint;
  dashboard_users_count bigint;
  auth_users_count bigint;
begin
  select count(*) into analytics_count from public.analytics_events;
  select count(*) into contacts_count from public.contact_submissions;
  select count(*) into login_events_count from public.dashboard_login_events;
  select count(*) into dashboard_users_count from public.dashboard_admins;
  select count(*) into auth_users_count from auth.users;

  if analytics_count <> 0
    or contacts_count <> 0
    or login_events_count <> 0
    or dashboard_users_count <> 1
    or auth_users_count <> 1
  then
    raise exception
      'Verificação falhou: métricas %, contatos %, eventos %, admins %, auth %.',
      analytics_count,
      contacts_count,
      login_events_count,
      dashboard_users_count,
      auth_users_count;
  end if;
end
$$;

commit;

select email, full_name, role, is_active
from public.dashboard_admins;
