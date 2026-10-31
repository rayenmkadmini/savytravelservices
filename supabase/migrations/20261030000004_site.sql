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
