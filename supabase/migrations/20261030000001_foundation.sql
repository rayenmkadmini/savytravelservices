-- SAVY TRAVEL SERVICES — 0001 Foundation
-- Roles, profiles, shared helpers. Supabase (PostgreSQL 15+).

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enumerations
-- ------------------------------------------------------------
create type public.user_role as enum ('super_admin', 'admin', 'customer');
create type public.app_locale as enum ('fr', 'en', 'ar');

-- ------------------------------------------------------------
-- Generic helpers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Multilingual text is stored as {"fr": "...", "en": "...", "ar": "..."}.
-- French is the default locale and is required; other locales are optional.
create or replace function public.is_i18n(value jsonb, required boolean default true)
returns boolean
language sql
immutable
as $$
  select case
    when value is null then not required
    when jsonb_typeof(value) <> 'object' then false
    when required and coalesce(length(trim(value ->> 'fr')), 0) = 0 then false
    else not exists (
      select 1 from jsonb_object_keys(value) k where k not in ('fr', 'en', 'ar')
    )
  end;
$$;

-- ------------------------------------------------------------
-- Roles (reference table) & profiles
-- ------------------------------------------------------------
create table public.roles (
  id public.user_role primary key,
  label text not null,
  description text not null
);

insert into public.roles (id, label, description) values
  ('super_admin', 'Super Admin', 'Full access, including user and role management.'),
  ('admin', 'Admin', 'Manages bookings, content, customers and settings.'),
  ('customer', 'Customer', 'Submits and tracks own booking and visa requests.');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (length(full_name) <= 120),
  phone text check (phone is null or length(phone) <= 40),
  nationality text check (nationality is null or length(nationality) <= 80),
  date_of_birth date,
  preferred_locale public.app_locale not null default 'fr',
  role public.user_role not null default 'customer' references public.roles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Role helpers. SECURITY DEFINER so they can be used inside RLS policies
-- without recursive policy evaluation on public.profiles.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- True when the statement runs with elevated database privileges
-- (service role key on the server, or SQL editor / migrations).
-- Uses session_user, not current_user: inside SECURITY DEFINER functions
-- current_user is the function owner, while API requests always connect
-- as "authenticator".
create or replace function public.is_privileged_context()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') = 'service_role'
      or session_user in ('postgres', 'supabase_admin');
$$;

-- Create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_locale text := new.raw_user_meta_data ->> 'preferred_locale';
begin
  insert into public.profiles (id, email, full_name, phone, preferred_locale)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 40), ''),
    case when requested_locale in ('fr', 'en', 'ar')
         then requested_locale::public.app_locale else 'fr' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profile email in sync when the auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.handle_user_email_change();

-- Role changes: only super admins (or privileged server contexts) may change
-- a role, nobody may change their own role, and the last super admin can
-- never be demoted.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_privileged_context() then
      if not public.is_super_admin() then
        raise exception 'Only a super admin can change roles' using errcode = '42501';
      end if;
      if new.id = auth.uid() then
        raise exception 'You cannot change your own role' using errcode = '42501';
      end if;
    end if;
    if old.role = 'super_admin'
       and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
      raise exception 'At least one super admin must remain' using errcode = '23514';
    end if;
  end if;
  if new.email is distinct from old.email and not public.is_privileged_context() then
    -- Email is owned by auth.users; it is synced by trigger only.
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
before update on public.profiles
for each row execute function public.guard_profile_role();

-- Bootstrap helper, callable only from the SQL editor / service role:
--   select public.grant_role('owner@example.com', 'super_admin');
create or replace function public.grant_role(target_email text, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_privileged_context() then
    raise exception 'grant_role can only be run with elevated privileges' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where lower(email) = lower(target_email);
  if not found then
    raise exception 'No user with email %', target_email;
  end if;
end;
$$;

revoke all on function public.grant_role(text, public.user_role) from public, anon, authenticated;
