-- SAVY TRAVEL SERVICES — complete schema (migrations 0001-0006), for the Supabase SQL editor.
-- Run ONCE on an empty project. Does not include demo data (supabase/seed.sql).
begin;

-- ===== 20261030000001_foundation.sql =====
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

-- ===== 20261030000002_catalog.sql =====
-- SAVY TRAVEL SERVICES — 0002 Catalog & editorial content
-- Everything here is managed from the admin dashboard.

create type public.currency_code as enum ('TND', 'EUR', 'USD');

-- ------------------------------------------------------------
-- Destinations
-- ------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n(name)),
  country jsonb not null check (public.is_i18n(country)),
  tagline jsonb check (public.is_i18n(tagline, false)),
  description jsonb check (public.is_i18n(description, false)),
  region text not null default 'international' check (region in ('tunisia', 'international')),
  image_url text,
  image_credit text check (image_credit is null or length(image_credit) <= 200),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index destinations_published_idx on public.destinations (is_published, sort_order);
create trigger destinations_set_updated_at before update on public.destinations
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Travel packages
-- ------------------------------------------------------------
create table public.travel_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination_id uuid references public.destinations (id) on delete set null,
  title jsonb not null check (public.is_i18n(title)),
  summary jsonb check (public.is_i18n(summary, false)),
  description jsonb check (public.is_i18n(description, false)),
  category text not null default 'leisure'
    check (category in ('leisure', 'culture', 'adventure', 'honeymoon', 'family', 'pilgrimage', 'business', 'group')),
  duration_days integer not null check (duration_days between 1 and 90),
  duration_nights integer not null check (duration_nights between 0 and 90),
  price_from numeric(12, 2) check (price_from is null or price_from >= 0),
  currency public.currency_code not null default 'TND',
  -- One item per line, per locale.
  included jsonb check (public.is_i18n(included, false)),
  excluded jsonb check (public.is_i18n(excluded, false)),
  -- [{ "day": 1, "title": {i18n}, "description": {i18n} }]
  itinerary jsonb not null default '[]'::jsonb check (jsonb_typeof(itinerary) = 'array'),
  cover_image_url text,
  image_credit text check (image_credit is null or length(image_credit) <= 200),
  max_travelers integer check (max_travelers is null or max_travelers > 0),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index travel_packages_destination_idx on public.travel_packages (destination_id);
create index travel_packages_published_idx on public.travel_packages (is_published, is_featured, sort_order);
create trigger travel_packages_set_updated_at before update on public.travel_packages
for each row execute function public.set_updated_at();

create table public.package_images (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.travel_packages (id) on delete cascade,
  url text not null,
  alt jsonb check (public.is_i18n(alt, false)),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index package_images_package_idx on public.package_images (package_id, sort_order);

-- ------------------------------------------------------------
-- Hotels & rooms (agency-curated catalog)
-- ------------------------------------------------------------
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination_id uuid references public.destinations (id) on delete set null,
  name text not null check (length(name) between 2 and 160),
  city text not null check (length(city) between 2 and 120),
  address text,
  stars smallint check (stars between 1 and 5),
  description jsonb check (public.is_i18n(description, false)),
  amenities text[] not null default '{}',
  price_from numeric(12, 2) check (price_from is null or price_from >= 0),
  currency public.currency_code not null default 'TND',
  cover_image_url text,
  gallery text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hotels_destination_idx on public.hotels (destination_id);
create index hotels_published_idx on public.hotels (is_published, sort_order);
create index hotels_city_idx on public.hotels (lower(city));
create trigger hotels_set_updated_at before update on public.hotels
for each row execute function public.set_updated_at();

create table public.hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  name jsonb not null check (public.is_i18n(name)),
  description jsonb check (public.is_i18n(description, false)),
  board text not null default 'room_only'
    check (board in ('room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive')),
  max_adults smallint not null default 2 check (max_adults between 1 and 12),
  max_children smallint not null default 0 check (max_children between 0 and 12),
  price_from numeric(12, 2) check (price_from is null or price_from >= 0),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hotel_rooms_hotel_idx on public.hotel_rooms (hotel_id, sort_order);
create trigger hotel_rooms_set_updated_at before update on public.hotel_rooms
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Visa information
-- ------------------------------------------------------------
create table public.visa_countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  iso_code char(2) not null check (iso_code ~ '^[A-Z]{2}$'),
  name jsonb not null check (public.is_i18n(name)),
  overview jsonb check (public.is_i18n(overview, false)),
  image_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_countries_set_updated_at before update on public.visa_countries
for each row execute function public.set_updated_at();

create table public.visa_types (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.visa_countries (id) on delete cascade,
  category text not null default 'tourist'
    check (category in ('tourist', 'business', 'student', 'family', 'transit', 'work', 'medical', 'other')),
  name jsonb not null check (public.is_i18n(name)),
  description jsonb check (public.is_i18n(description, false)),
  -- One document per line, per locale.
  required_documents jsonb check (public.is_i18n(required_documents, false)),
  processing_time jsonb check (public.is_i18n(processing_time, false)),
  fee_info jsonb check (public.is_i18n(fee_info, false)),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visa_types_country_idx on public.visa_types (country_id, sort_order);
create trigger visa_types_set_updated_at before update on public.visa_types
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Editorial content
-- ------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination_id uuid references public.destinations (id) on delete set null,
  title jsonb not null check (public.is_i18n(title)),
  excerpt jsonb check (public.is_i18n(excerpt, false)),
  body jsonb check (public.is_i18n(body, false)),
  cover_image_url text,
  image_credit text check (image_credit is null or length(image_credit) <= 200),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_published_idx on public.articles (is_published, published_at desc);
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create or replace function public.articles_set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger articles_published_at before insert or update on public.articles
for each row execute function public.articles_set_published_at();

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 2 and 120),
  position jsonb not null check (public.is_i18n(position)),
  bio jsonb check (public.is_i18n(bio, false)),
  photo_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger team_members_set_updated_at before update on public.team_members
for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  author_name text not null check (length(author_name) between 2 and 120),
  author_location text check (author_location is null or length(author_location) <= 120),
  content text not null check (length(content) between 10 and 1500),
  rating smallint not null check (rating between 1 and 5),
  locale public.app_locale not null default 'fr',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_published_idx on public.testimonials (is_published, sort_order);
create trigger testimonials_set_updated_at before update on public.testimonials
for each row execute function public.set_updated_at();

-- Customers may submit testimonials; publication is always an admin decision.
create or replace function public.guard_testimonial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and not public.is_privileged_context() then
    new.is_published := false;
    new.sort_order := 0;
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger testimonials_guard before insert on public.testimonials
for each row execute function public.guard_testimonial();

-- ===== 20261030000003_bookings.sql =====
-- SAVY TRAVEL SERVICES — 0003 Booking requests, visa requests, payments, notifications
--
-- Workflow
--   1. Customer submits a request (status = pending, payment = unpaid).
--   2. Admin reviews (under_review), confirms price & availability (confirmed,
--      quoted_amount set) or rejects.
--   3. Admin sends a payment link (Konnect / Flouci) or bank-transfer details.
--   4. Payment is verified server-side only; booking payment_status follows.
--
-- Status rules are enforced here so no client can bypass them.

create type public.service_type as enum ('flight', 'hotel', 'package', 'tour', 'business', 'custom');
create type public.booking_status as enum ('pending', 'under_review', 'confirmed', 'rejected', 'cancelled');
create type public.payment_state as enum ('unpaid', 'awaiting_payment', 'partially_paid', 'paid', 'refunded');
create type public.travel_class as enum ('economy', 'premium_economy', 'business', 'first');
create type public.passenger_type as enum ('adult', 'child', 'infant');
create type public.visa_request_status as enum ('pending', 'under_review', 'documents_requested', 'submitted', 'completed', 'cancelled');
create type public.payment_provider as enum ('konnect', 'flouci', 'bank_transfer', 'cash');
create type public.payment_record_status as enum ('pending', 'completed', 'failed', 'cancelled', 'refunded');

create sequence public.booking_reference_seq;
create sequence public.visa_reference_seq;

create or replace function public.next_reference(prefix text, seq regclass)
returns text
language sql
volatile
as $$
  select prefix || '-' || to_char(now() at time zone 'Africa/Tunis', 'YYMM') || '-'
         || lpad(nextval(seq)::text, 5, '0');
$$;

-- ------------------------------------------------------------
-- Bookings
-- ------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_reference('SAVY', 'public.booking_reference_seq'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_type public.service_type not null,
  package_id uuid references public.travel_packages (id) on delete set null,
  hotel_id uuid references public.hotels (id) on delete set null,
  room_id uuid references public.hotel_rooms (id) on delete set null,
  destination_id uuid references public.destinations (id) on delete set null,
  origin text check (origin is null or length(origin) <= 120),
  destination text check (destination is null or length(destination) <= 120),
  departure_date date,
  return_date date,
  adults smallint not null default 1 check (adults between 1 and 20),
  children smallint not null default 0 check (children between 0 and 20),
  infants smallint not null default 0 check (infants between 0 and 10),
  rooms smallint check (rooms is null or rooms between 1 and 20),
  travel_class public.travel_class,
  budget numeric(12, 2) check (budget is null or budget >= 0),
  budget_currency public.currency_code,
  notes text check (notes is null or length(notes) <= 4000),
  contact_name text not null check (length(contact_name) between 2 and 120),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text not null check (length(contact_phone) between 6 and 40),
  locale public.app_locale not null default 'fr',
  status public.booking_status not null default 'pending',
  payment_status public.payment_state not null default 'unpaid',
  quoted_amount numeric(12, 2) check (quoted_amount is null or quoted_amount >= 0),
  quoted_currency public.currency_code not null default 'TND',
  customer_message text check (customer_message is null or length(customer_message) <= 4000),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_order check (
    return_date is null or departure_date is null or return_date >= departure_date
  ),
  constraint bookings_confirmed_needs_quote check (
    status <> 'confirmed' or quoted_amount is not null
  )
);

create index bookings_user_idx on public.bookings (user_id, created_at desc);
create index bookings_status_idx on public.bookings (status, created_at desc);
create index bookings_payment_status_idx on public.bookings (payment_status);
create index bookings_package_idx on public.bookings (package_id);
create index bookings_hotel_idx on public.bookings (hotel_id);
create index bookings_created_idx on public.bookings (created_at desc);

create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

create table public.booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  passenger_type public.passenger_type not null default 'adult',
  full_name text not null check (length(full_name) between 2 and 120),
  date_of_birth date,
  nationality text check (nationality is null or length(nationality) <= 80),
  passport_number text check (passport_number is null or length(passport_number) <= 30),
  passport_expiry date,
  created_at timestamptz not null default now()
);

create index booking_passengers_booking_idx on public.booking_passengers (booking_id);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index booking_status_history_booking_idx on public.booking_status_history (booking_id, created_at);

-- Internal staff notes, never visible to customers.
create table public.booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  visa_request_id uuid,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index booking_notes_booking_idx on public.booking_notes (booking_id, created_at);

-- ------------------------------------------------------------
-- Visa requests
-- ------------------------------------------------------------
create table public.visa_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_reference('VISA', 'public.visa_reference_seq'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_id uuid references public.visa_countries (id) on delete set null,
  visa_type_id uuid references public.visa_types (id) on delete set null,
  destination_country text not null check (length(destination_country) between 2 and 120),
  category text not null default 'tourist'
    check (category in ('tourist', 'business', 'student', 'family', 'transit', 'work', 'medical', 'other')),
  nationality text not null check (length(nationality) between 2 and 80),
  travel_date date,
  travelers smallint not null default 1 check (travelers between 1 and 20),
  message text check (message is null or length(message) <= 4000),
  contact_name text not null check (length(contact_name) between 2 and 120),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text not null check (length(contact_phone) between 6 and 40),
  locale public.app_locale not null default 'fr',
  status public.visa_request_status not null default 'pending',
  customer_message text check (customer_message is null or length(customer_message) <= 4000),
  service_fee numeric(12, 2) check (service_fee is null or service_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visa_requests_user_idx on public.visa_requests (user_id, created_at desc);
create index visa_requests_status_idx on public.visa_requests (status, created_at desc);

create trigger visa_requests_set_updated_at before update on public.visa_requests
for each row execute function public.set_updated_at();

alter table public.booking_notes
  add constraint booking_notes_visa_fk foreign key (visa_request_id)
  references public.visa_requests (id) on delete cascade,
  add constraint booking_notes_target check (num_nonnulls(booking_id, visa_request_id) = 1);

create index booking_notes_visa_idx on public.booking_notes (visa_request_id, created_at);

-- ------------------------------------------------------------
-- Uploaded documents (files live in the private "documents" bucket)
-- ------------------------------------------------------------
create table public.booking_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  visa_request_id uuid references public.visa_requests (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  kind text not null default 'other' check (kind in ('passport', 'id_card', 'photo', 'bank_statement', 'invitation', 'ticket', 'other')),
  created_at timestamptz not null default now(),
  constraint booking_documents_target check (num_nonnulls(booking_id, visa_request_id) = 1),
  constraint booking_documents_path_owner check (split_part(storage_path, '/', 1) = user_id::text)
);

create index booking_documents_booking_idx on public.booking_documents (booking_id);
create index booking_documents_visa_idx on public.booking_documents (visa_request_id);

-- ------------------------------------------------------------
-- Payments
-- ------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  provider public.payment_provider not null,
  status public.payment_record_status not null default 'pending',
  amount numeric(12, 2) not null check (amount > 0),
  currency public.currency_code not null default 'TND',
  provider_payment_id text,
  payment_url text,
  provider_payload jsonb,
  note text check (note is null or length(note) <= 1000),
  created_by uuid references public.profiles (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_ref_unique unique (provider, provider_payment_id)
);

create index payments_booking_idx on public.payments (booking_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at desc);

create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- In-app notifications
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  -- Message keys are rendered with the customer's locale on the client.
  payload jsonb not null default '{}'::jsonb,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ============================================================
-- Booking business rules
-- ============================================================

create or replace function public.booking_transition_allowed(
  from_status public.booking_status,
  to_status public.booking_status
) returns boolean
language sql
immutable
as $$
  select from_status = to_status or case from_status
    when 'pending' then to_status in ('under_review', 'confirmed', 'rejected', 'cancelled')
    when 'under_review' then to_status in ('confirmed', 'rejected', 'cancelled')
    when 'confirmed' then to_status in ('cancelled')
    else false
  end;
$$;

create or replace function public.bookings_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- References are always generated server-side, never chosen by the client.
  new.reference := public.next_reference('SAVY', 'public.booking_reference_seq');
  if not public.is_admin() and not public.is_privileged_context() then
    -- Customers can only create fresh, unpriced requests for themselves.
    new.user_id := auth.uid();
    new.status := 'pending';
    new.payment_status := 'unpaid';
    new.quoted_amount := null;
    new.customer_message := null;
    new.confirmed_at := null;
    new.cancelled_at := null;
  end if;
  if new.departure_date is not null and new.departure_date < (now() at time zone 'Africa/Tunis')::date then
    raise exception 'Departure date cannot be in the past' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bookings_before_insert before insert on public.bookings
for each row execute function public.bookings_before_insert();

create or replace function public.bookings_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.reference := old.reference;
  new.user_id := old.user_id;

  if new.status is distinct from old.status then
    if not public.booking_transition_allowed(old.status, new.status) then
      raise exception 'Invalid booking status transition: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
    if new.status = 'confirmed' then new.confirmed_at := now(); end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  end if;

  -- payment_status is driven by the payments table (see trigger below);
  -- only privileged server code or the payment trigger may change it,
  -- except admins moving an unpaid confirmed booking to awaiting_payment.
  if new.payment_status is distinct from old.payment_status
     and not public.is_privileged_context()
     and coalesce(current_setting('savy.payment_sync', true), '') <> 'on' then
    if not (public.is_admin()
            and old.payment_status in ('unpaid', 'awaiting_payment')
            and new.payment_status in ('unpaid', 'awaiting_payment')) then
      raise exception 'payment_status is managed by verified payments' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_before_update before update on public.bookings
for each row execute function public.bookings_before_update();

create or replace function public.bookings_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, note)
    values (new.id, null, new.status, auth.uid(), 'created');
    insert into public.notifications (user_id, kind, payload, link)
    values (new.user_id, 'booking_received',
            jsonb_build_object('reference', new.reference),
            '/account/bookings/' || new.reference);
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), new.customer_message);
    insert into public.notifications (user_id, kind, payload, link)
    values (new.user_id, 'booking_status',
            jsonb_build_object('reference', new.reference, 'status', new.status),
            '/account/bookings/' || new.reference);
  end if;
  return new;
end;
$$;

create trigger bookings_after_insert after insert on public.bookings
for each row execute function public.bookings_after_change();
create trigger bookings_after_update after update on public.bookings
for each row execute function public.bookings_after_change();

-- Customers may cancel their own request while it has not been confirmed.
create or replace function public.cancel_my_booking(booking_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.bookings;
begin
  select * into target from public.bookings
  where reference = booking_reference and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if target.status not in ('pending', 'under_review') then
    raise exception 'This booking can no longer be cancelled online' using errcode = '23514';
  end if;
  update public.bookings set status = 'cancelled' where id = target.id;
end;
$$;

revoke all on function public.cancel_my_booking(text) from public, anon;
grant execute on function public.cancel_my_booking(text) to authenticated;

-- ============================================================
-- Visa request rules
-- ============================================================
create or replace function public.visa_requests_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.reference := public.next_reference('VISA', 'public.visa_reference_seq');
    if not public.is_admin() and not public.is_privileged_context() then
      new.user_id := auth.uid();
      new.status := 'pending';
      new.customer_message := null;
      new.service_fee := null;
    end if;
  else
    new.reference := old.reference;
    new.user_id := old.user_id;
    if old.status in ('completed', 'cancelled') and new.status is distinct from old.status then
      raise exception 'Visa request is closed' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger visa_requests_before_write before insert or update on public.visa_requests
for each row execute function public.visa_requests_before_write();

create or replace function public.visa_requests_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, payload, link)
    values (new.user_id, 'visa_received', jsonb_build_object('reference', new.reference), '/account/visa');
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, kind, payload, link)
    values (new.user_id, 'visa_status',
            jsonb_build_object('reference', new.reference, 'status', new.status), '/account/visa');
  end if;
  return new;
end;
$$;

create trigger visa_requests_after_insert after insert on public.visa_requests
for each row execute function public.visa_requests_after_change();
create trigger visa_requests_after_update after update on public.visa_requests
for each row execute function public.visa_requests_after_change();

create or replace function public.cancel_my_visa_request(request_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.visa_requests set status = 'cancelled'
  where reference = request_reference and user_id = auth.uid()
    and status in ('pending', 'under_review', 'documents_requested');
  if not found then
    raise exception 'This request can no longer be cancelled online' using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.cancel_my_visa_request(text) from public, anon;
grant execute on function public.cancel_my_visa_request(text) to authenticated;

-- ============================================================
-- Payment rules
-- ============================================================

-- Online payments (Konnect / Flouci) can only be marked completed by
-- privileged server code after verifying with the provider's API.
-- Staff may record manual payments (bank transfer / cash) they have received.
create or replace function public.payments_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged_context() then
    if new.status = 'completed' and new.verified_at is null then
      new.verified_at := now();
    end if;
    return new;
  end if;

  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if new.provider in ('konnect', 'flouci') then
    if tg_op = 'INSERT' and new.status <> 'pending' then
      raise exception 'Online payments start as pending' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' then
      if new.status is distinct from old.status and new.status not in ('cancelled') then
        raise exception 'Online payment status is set by provider verification only' using errcode = '42501';
      end if;
      new.amount := old.amount;
      new.provider_payment_id := old.provider_payment_id;
      new.provider_payload := old.provider_payload;
      new.verified_at := old.verified_at;
    end if;
  else
    if new.status = 'completed' and new.verified_at is null then
      new.verified_at := now();
      new.created_by := coalesce(new.created_by, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

create trigger payments_guard before insert or update on public.payments
for each row execute function public.payments_guard();

create or replace function public.sync_booking_payment_status(target_booking uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  paid numeric(12, 2);
  refunded numeric(12, 2);
  pending_count integer;
  next_state public.payment_state;
begin
  select * into b from public.bookings where id = target_booking;
  if not found then return; end if;

  select coalesce(sum(amount) filter (where status = 'completed' and currency = b.quoted_currency), 0),
         coalesce(sum(amount) filter (where status = 'refunded'), 0),
         count(*) filter (where status = 'pending')
    into paid, refunded, pending_count
  from public.payments where booking_id = target_booking;

  if refunded > 0 and paid = 0 then
    next_state := 'refunded';
  elsif paid > 0 and b.quoted_amount is not null and paid >= b.quoted_amount then
    next_state := 'paid';
  elsif paid > 0 then
    next_state := 'partially_paid';
  elsif pending_count > 0 then
    next_state := 'awaiting_payment';
  elsif b.payment_status = 'awaiting_payment' then
    next_state := 'awaiting_payment';
  else
    next_state := 'unpaid';
  end if;

  if next_state is distinct from b.payment_status then
    perform set_config('savy.payment_sync', 'on', true);
    update public.bookings set payment_status = next_state where id = target_booking;
    perform set_config('savy.payment_sync', 'off', true);
    if next_state = 'paid' then
      insert into public.notifications (user_id, kind, payload, link)
      values (b.user_id, 'payment_received',
              jsonb_build_object('reference', b.reference),
              '/account/bookings/' || b.reference);
    end if;
  end if;
end;
$$;

revoke all on function public.sync_booking_payment_status(uuid) from public, anon, authenticated;

create or replace function public.payments_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_booking_payment_status(new.booking_id);
  return new;
end;
$$;

create trigger payments_after_change after insert or update on public.payments
for each row execute function public.payments_after_change();

-- ===== 20261030000004_site.sql =====
-- SAVY TRAVEL SERVICES — 0004 Website content, contact, newsletter, currency

-- ------------------------------------------------------------
-- Website settings (CMS key/value store)
-- ------------------------------------------------------------
create table public.website_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function public.website_settings_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger website_settings_touch before insert or update on public.website_settings
for each row execute function public.website_settings_touch();

-- Agency facts below come from the agency's existing public website.
-- Everything is editable from Admin → Content & Settings.
insert into public.website_settings (key, value, is_public) values
('contact', jsonb_build_object(
  'email', 'contact@savytravelservices.tn',
  'phone', '+216 75 851 103',
  'fax', '+216 75 851 334',
  'whatsapp', '',
  'address', 'Avenue 18 Janvier, 3200 Tataouine, Tunisie',
  'map_query', 'Avenue 18 Janvier, 3200 Tataouine, Tunisia',
  'manager', 'Fatma Zahra Chaabeni',
  'hours', jsonb_build_object(
    'fr', 'Lun–Sam · 08:30 – 18:00 (heure de Tunis)',
    'en', 'Mon–Sat · 08:30 – 18:00 (Tunis time)',
    'ar', 'الإثنين–السبت · 08:30 – 18:00 (بتوقيت تونس)')
), true),
('social', jsonb_build_object('facebook', '', 'instagram', '', 'linkedin', '', 'tiktok', ''), true),
('hero', jsonb_build_object(
  'title', jsonb_build_object(
    'fr', 'Découvrez le monde, à votre façon.',
    'en', 'Discover the World, Your Way.',
    'ar', 'اكتشف العالم على طريقتك.'),
  'subtitle', jsonb_build_object(
    'fr', 'Vols, hôtels, circuits organisés et assistance visa — une agence tunisienne qui conçoit chaque voyage avec vous, du premier conseil au retour.',
    'en', 'Flights, hotels, curated tours and visa assistance — a Tunisian agency that designs every journey with you, from first advice to safe return.',
    'ar', 'رحلات جوية، فنادق، جولات منظمة ومساعدة في التأشيرات — وكالة تونسية تصمم كل رحلة معك، من أول استشارة حتى العودة.'),
  'image_url', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/A_beach_in_Hammamet_during_the_summer.jpg/1920px-A_beach_in_Hammamet_during_the_summer.jpg',
  'image_credit', 'Hammamet — Faresbenrayana · CC BY-SA 4.0'
), true),
('brand', jsonb_build_object('logo_url', '', 'og_image_url', ''), true),
('about', jsonb_build_object(
  'story', jsonb_build_object(
    'fr', 'Fondée en 2023 à Tataouine, SAVY Travel Services accompagne voyageurs tunisiens et visiteurs internationaux avec une conviction simple : un beau voyage commence par une écoute attentive. Nous combinons l’expertise d’une agence de terrain et des outils modernes pour organiser des séjours clairs, sûrs et personnalisés.',
    'en', 'Founded in 2023 in Tataouine, SAVY Travel Services supports Tunisian travellers and international visitors with one simple belief: a great journey starts with careful listening. We combine on-the-ground agency expertise with modern tools to organise clear, safe and personal trips.',
    'ar', 'تأسست سافي للخدمات السياحية سنة 2023 في تطاوين، وترافق المسافرين التونسيين والزوار الدوليين انطلاقًا من قناعة بسيطة: الرحلة الجميلة تبدأ بالإصغاء الجيد. نجمع بين خبرة الوكالة الميدانية والأدوات الحديثة لتنظيم رحلات واضحة وآمنة ومخصصة.'),
  'mission', jsonb_build_object(
    'fr', 'Rendre le voyage accessible, transparent et serein, avec un conseiller humain à chaque étape.',
    'en', 'Make travel accessible, transparent and stress-free, with a human advisor at every step.',
    'ar', 'جعل السفر متاحًا وشفافًا ومريحًا، مع مستشار حقيقي في كل مرحلة.'),
  'vision', jsonb_build_object(
    'fr', 'Devenir l’agence de référence du sud tunisien pour des voyages personnalisés, en Tunisie et dans le monde.',
    'en', 'Become southern Tunisia’s reference agency for personalised travel, at home and worldwide.',
    'ar', 'أن نصبح الوكالة المرجعية في الجنوب التونسي للرحلات المخصصة، داخل تونس وحول العالم.')
), true),
('payments', jsonb_build_object(
  'konnect_enabled', false,
  'flouci_enabled', false,
  'bank_transfer_enabled', true,
  'bank_transfer_details', jsonb_build_object('fr', '', 'en', '', 'ar', '')
), true),
('currency', jsonb_build_object('conversion_enabled', false), true);

-- ------------------------------------------------------------
-- Exchange rates (TND per 1 unit of currency)
-- ------------------------------------------------------------
create table public.exchange_rates (
  currency public.currency_code primary key check (currency <> 'TND'),
  tnd_per_unit numeric(14, 6) not null check (tnd_per_unit > 0),
  source text not null check (length(source) between 2 and 200),
  fetched_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- ------------------------------------------------------------
-- Contact messages
-- ------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  phone text check (phone is null or length(phone) <= 40),
  subject text check (subject is null or length(subject) <= 200),
  message text not null check (length(message) between 10 and 5000),
  locale public.app_locale not null default 'fr',
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create trigger contact_messages_set_updated_at before update on public.contact_messages
for each row execute function public.set_updated_at();

create or replace function public.contact_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and not public.is_privileged_context() then
    new.status := 'new';
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger contact_messages_guard before insert on public.contact_messages
for each row execute function public.contact_messages_guard();

-- ------------------------------------------------------------
-- Newsletter
-- ------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  locale public.app_locale not null default 'fr',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  source text not null default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));
create index newsletter_subscribers_status_idx on public.newsletter_subscribers (status);

-- Public entry points (no direct table access for anonymous visitors).
create or replace function public.subscribe_newsletter(subscriber_email text, subscriber_locale public.app_locale default 'fr')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if subscriber_email is null or subscriber_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(subscriber_email) > 254 then
    raise exception 'Invalid email' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers (email, locale)
  values (lower(trim(subscriber_email)), subscriber_locale)
  on conflict (lower(email)) do update
    set status = 'subscribed', unsubscribed_at = null, locale = excluded.locale;
end;
$$;

create or replace function public.unsubscribe_newsletter(token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.newsletter_subscribers
     set status = 'unsubscribed', unsubscribed_at = now()
   where unsubscribe_token = token and status = 'subscribed';
  return found;
end;
$$;

grant execute on function public.subscribe_newsletter(text, public.app_locale) to anon, authenticated;
grant execute on function public.unsubscribe_newsletter(uuid) to anon, authenticated;

-- The agency manager, as named by the agency. Editable in Admin → Team.
insert into public.team_members (full_name, position, sort_order) values
  ('Fatma Zahra Chaabeni', jsonb_build_object(
    'fr', 'Directrice de l’agence',
    'en', 'Agency Manager',
    'ar', 'مديرة الوكالة'), 0);

-- ===== 20261030000005_rls.sql =====
-- SAVY TRAVEL SERVICES — 0005 Row Level Security
-- Every table has RLS enabled. Admin checks use SECURITY DEFINER helpers.

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.travel_packages enable row level security;
alter table public.package_images enable row level security;
alter table public.hotels enable row level security;
alter table public.hotel_rooms enable row level security;
alter table public.visa_countries enable row level security;
alter table public.visa_types enable row level security;
alter table public.articles enable row level security;
alter table public.team_members enable row level security;
alter table public.testimonials enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_passengers enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.booking_notes enable row level security;
alter table public.visa_requests enable row level security;
alter table public.booking_documents enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.website_settings enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- ------------------------------------------------------------
-- Roles & profiles
-- ------------------------------------------------------------
create policy roles_read on public.roles for select using (true);

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Published catalog: public read, admin write
-- ------------------------------------------------------------
create policy destinations_read on public.destinations for select
  using (is_published or public.is_admin());
create policy destinations_admin on public.destinations for all
  using (public.is_admin()) with check (public.is_admin());

create policy travel_packages_read on public.travel_packages for select
  using (is_published or public.is_admin());
create policy travel_packages_admin on public.travel_packages for all
  using (public.is_admin()) with check (public.is_admin());

create policy package_images_read on public.package_images for select
  using (public.is_admin() or exists (
    select 1 from public.travel_packages p where p.id = package_id and p.is_published));
create policy package_images_admin on public.package_images for all
  using (public.is_admin()) with check (public.is_admin());

create policy hotels_read on public.hotels for select
  using (is_published or public.is_admin());
create policy hotels_admin on public.hotels for all
  using (public.is_admin()) with check (public.is_admin());

create policy hotel_rooms_read on public.hotel_rooms for select
  using (public.is_admin() or (is_published and exists (
    select 1 from public.hotels h where h.id = hotel_id and h.is_published)));
create policy hotel_rooms_admin on public.hotel_rooms for all
  using (public.is_admin()) with check (public.is_admin());

create policy visa_countries_read on public.visa_countries for select
  using (is_published or public.is_admin());
create policy visa_countries_admin on public.visa_countries for all
  using (public.is_admin()) with check (public.is_admin());

create policy visa_types_read on public.visa_types for select
  using (public.is_admin() or (is_published and exists (
    select 1 from public.visa_countries c where c.id = country_id and c.is_published)));
create policy visa_types_admin on public.visa_types for all
  using (public.is_admin()) with check (public.is_admin());

create policy articles_read on public.articles for select
  using (is_published or public.is_admin());
create policy articles_admin on public.articles for all
  using (public.is_admin()) with check (public.is_admin());

create policy team_members_read on public.team_members for select
  using (is_published or public.is_admin());
create policy team_members_admin on public.team_members for all
  using (public.is_admin()) with check (public.is_admin());

-- Testimonials: public sees published; authors see their own; customers submit.
create policy testimonials_read on public.testimonials for select
  using (is_published or user_id = auth.uid() or public.is_admin());
create policy testimonials_submit on public.testimonials for insert to authenticated
  with check (user_id = auth.uid() and not is_published);
create policy testimonials_admin_update on public.testimonials for update
  using (public.is_admin()) with check (public.is_admin());
create policy testimonials_admin_delete on public.testimonials for delete
  using (public.is_admin());
create policy testimonials_admin_insert on public.testimonials for insert
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Bookings
-- ------------------------------------------------------------
create policy bookings_select on public.bookings for select
  using (user_id = auth.uid() or public.is_admin());
create policy bookings_insert_own on public.bookings for insert to authenticated
  with check (user_id = auth.uid());
create policy bookings_insert_admin on public.bookings for insert
  with check (public.is_admin());
create policy bookings_update_admin on public.bookings for update
  using (public.is_admin()) with check (public.is_admin());
create policy bookings_delete_super on public.bookings for delete
  using (public.is_super_admin());

create policy booking_passengers_select on public.booking_passengers for select
  using (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy booking_passengers_insert on public.booking_passengers for insert
  with check (public.is_admin() or exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.user_id = auth.uid() and b.status = 'pending'));
create policy booking_passengers_modify_admin on public.booking_passengers for update
  using (public.is_admin()) with check (public.is_admin());
create policy booking_passengers_delete on public.booking_passengers for delete
  using (public.is_admin() or exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.user_id = auth.uid() and b.status = 'pending'));

create policy booking_status_history_select on public.booking_status_history for select
  using (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));

create policy booking_notes_admin on public.booking_notes for all
  using (public.is_admin()) with check (public.is_admin() and author_id = auth.uid());

-- ------------------------------------------------------------
-- Visa requests
-- ------------------------------------------------------------
create policy visa_requests_select on public.visa_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy visa_requests_insert_own on public.visa_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy visa_requests_update_admin on public.visa_requests for update
  using (public.is_admin()) with check (public.is_admin());
create policy visa_requests_delete_super on public.visa_requests for delete
  using (public.is_super_admin());

-- ------------------------------------------------------------
-- Documents
-- ------------------------------------------------------------
create policy booking_documents_select on public.booking_documents for select
  using (user_id = auth.uid() or public.is_admin());
create policy booking_documents_insert_own on public.booking_documents for insert to authenticated
  with check (
    user_id = auth.uid() and (
      (booking_id is not null and exists (
        select 1 from public.bookings b
        where b.id = booking_id and b.user_id = auth.uid()
          and b.status in ('pending', 'under_review', 'confirmed')))
      or
      (visa_request_id is not null and exists (
        select 1 from public.visa_requests v
        where v.id = visa_request_id and v.user_id = auth.uid()
          and v.status in ('pending', 'under_review', 'documents_requested')))
    )
  );
create policy booking_documents_delete on public.booking_documents for delete
  using (public.is_admin() or (user_id = auth.uid() and (
    exists (select 1 from public.bookings b where b.id = booking_id and b.status = 'pending')
    or exists (select 1 from public.visa_requests v where v.id = visa_request_id and v.status = 'pending')
  )));

-- ------------------------------------------------------------
-- Payments (customers read their own; staff manage; provider
-- confirmation happens with the service role after verification)
-- ------------------------------------------------------------
create policy payments_select on public.payments for select
  using (public.is_admin() or exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy payments_insert_admin on public.payments for insert
  with check (public.is_admin());
create policy payments_update_admin on public.payments for update
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Notifications
-- ------------------------------------------------------------
create policy notifications_select_own on public.notifications for select
  using (user_id = auth.uid());
create policy notifications_mark_read on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin_insert on public.notifications for insert
  with check (public.is_admin());

-- Customers may only toggle read_at.
create or replace function public.notifications_guard()
returns trigger
language plpgsql
as $$
begin
  new.user_id := old.user_id;
  new.kind := old.kind;
  new.payload := old.payload;
  new.link := old.link;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger notifications_guard before update on public.notifications
for each row execute function public.notifications_guard();

-- ------------------------------------------------------------
-- Website settings, currency
-- ------------------------------------------------------------
create policy website_settings_read on public.website_settings for select
  using (is_public or public.is_admin());
create policy website_settings_admin on public.website_settings for all
  using (public.is_admin()) with check (public.is_admin());

create policy exchange_rates_read on public.exchange_rates for select using (true);
create policy exchange_rates_admin on public.exchange_rates for all
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Contact & newsletter
-- ------------------------------------------------------------
create policy contact_messages_insert on public.contact_messages for insert
  to anon, authenticated with check (status = 'new');
create policy contact_messages_admin_read on public.contact_messages for select
  using (public.is_admin());
create policy contact_messages_admin_update on public.contact_messages for update
  using (public.is_admin()) with check (public.is_admin());
create policy contact_messages_admin_delete on public.contact_messages for delete
  using (public.is_admin());

create policy newsletter_admin_read on public.newsletter_subscribers for select
  using (public.is_admin());
create policy newsletter_admin_update on public.newsletter_subscribers for update
  using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin_delete on public.newsletter_subscribers for delete
  using (public.is_admin());

-- ------------------------------------------------------------
-- Admin dashboard statistics (single round trip, admin only)
-- ------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'customers', (select count(*) from public.profiles where role = 'customer'),
    'bookings_total', (select count(*) from public.bookings),
    'bookings_pending', (select count(*) from public.bookings where status in ('pending', 'under_review')),
    'bookings_confirmed', (select count(*) from public.bookings where status = 'confirmed'),
    'bookings_last_30', (select count(*) from public.bookings where created_at > now() - interval '30 days'),
    'visa_open', (select count(*) from public.visa_requests where status not in ('completed', 'cancelled')),
    'messages_new', (select count(*) from public.contact_messages where status = 'new'),
    'subscribers', (select count(*) from public.newsletter_subscribers where status = 'subscribed'),
    'revenue', coalesce((
      select jsonb_object_agg(currency, total) from (
        select currency, sum(amount) as total from public.payments
        where status = 'completed' group by currency) r), '{}'::jsonb),
    'revenue_30', coalesce((
      select jsonb_object_agg(currency, total) from (
        select currency, sum(amount) as total from public.payments
        where status = 'completed' and verified_at > now() - interval '30 days' group by currency) r), '{}'::jsonb),
    'by_service', coalesce((
      select jsonb_object_agg(service_type, n) from (
        select service_type, count(*) as n from public.bookings group by service_type) s), '{}'::jsonb),
    'monthly', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'bookings', n) order by m) from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*) as n
        from public.bookings
        where created_at > date_trunc('month', now()) - interval '5 months'
        group by 1) t), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ===== 20261030000006_storage.sql =====
-- SAVY TRAVEL SERVICES — 0006 Storage buckets & policies
--
-- media      public read, admin write   (destination/package/hotel imagery)
-- documents  private                    (passports, IDs, supporting documents)
--            path layout: {user_id}/{booking|visa}/{request_id}/{uuid}-{file}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

create policy documents_owner_read on storage.objects for select
  using (bucket_id = 'documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy documents_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_owner_delete on storage.objects for delete
  using (bucket_id = 'documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

commit;
