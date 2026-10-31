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
