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
