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
