# SAVY TRAVEL SERVICES — savytravelservices.tn

Travel agency platform for SAVY Travel Services (Tataouine, Tunisia): public website in
**French (default), English and Arabic (RTL)**, customer accounts, booking & visa request
workflow with secure document upload, server-verified payments (Konnect / Flouci / manual),
and a complete administration dashboard. Supabase is the single source of truth.

| Layer | Technology |
|---|---|
| App | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| UI | Tailwind CSS 4, Lucide icons, Framer Motion, Sonner toasts |
| Data | Supabase PostgreSQL + Row Level Security, Auth, Storage |
| Validation | Zod (server-side), database constraints and triggers |
| Tests | Vitest — unit tests + security integration tests against a live Supabase stack |

---

## 1. Features

**Public website** (`/fr`, `/en`, `/ar`)
- Home: cinematic hero ("Découvrez le monde, à votre façon."), flight / hotel / package search,
  destinations, services, packages, why-SAVY, published testimonials, inspiration, CTA, newsletter.
- Flights: search form; live offers via **Amadeus** when configured, otherwise an advisor-handled
  request (never fabricated results).
- Hotels: search over the agency's curated catalog, detail page with gallery, amenities, **room selection**.
- Packages: filters, detail with itinerary, included/excluded, JSON-LD, booking.
- Destinations (Tunisia / international), Visa assistance (country guides, request form, explicit
  *no-guarantee* disclaimer), About (story, mission, vision, values, team), Contact (form, phone,
  fax, WhatsApp, Google Map, hours), Inspiration articles, Privacy, Terms.
- Language switcher with full RTL, localized dates/currency (TND; optional EUR/USD conversion
  from a real exchange-rate source, hidden when rates are stale).
- SEO: per-page metadata, Open Graph, hreflang + x-default, canonical, `sitemap.xml` (includes
  DB content), `robots.txt`, JSON-LD (TravelAgency, TouristTrip, Hotel, Article).

**Customer account** (`/[locale]/account`)
- Registration / login / password reset (Supabase Auth), profile management.
- Booking requests: service, destination, dates, travellers, passengers, **private document upload**.
- Booking history & detail: status timeline, confirmed quote, agency message, payment options
  (online link, bank transfer details), payment history, extra uploads, cancellation while unconfirmed.
- Visa requests with documents, in-app notifications (rendered in the user's language),
  testimonial submission (published only after moderation).

**Booking statuses**: Pending → Under review → Confirmed / Rejected / Cancelled (transitions
enforced in the database). Payment state: Unpaid → Awaiting payment → Partially paid → Paid / Refunded.

**Admin dashboard** (`/[locale]/admin`, roles `admin` and `super_admin`)
- Statistics: customers, bookings, pending, confirmed, open visa files, new messages, subscribers,
  verified revenue (all-time and 30 days), requests per month and per service.
- Bookings: filters, search, pagination; detail with status change + quote + customer message,
  internal notes, documents (signed URLs), payment links (Konnect/Flouci), manual payments
  (transfer/cash), provider re-verification.
- Visa requests, customers, contact messages, newsletter (CSV export), media library
  (upload, copy URL, delete, **import external images into Storage**).
- Content management without code: destinations, packages (itinerary editor), hotels, rooms,
  visa countries & types, testimonials (moderation), articles, team — all multilingual.
- Website settings: contact details, hero, About texts, social links, branding (logo / OG image),
  payment options & bank details, currency conversion & exchange rates.
- Users & roles (super admin only).

---

## 2. Database

Migrations live in `supabase/migrations/` (apply in order):

| File | Content |
|---|---|
| `…0001_foundation.sql` | `roles`, `profiles` (auto-created on sign-up), role helpers (`is_admin`, `is_super_admin`), role-escalation guard, `grant_role()` |
| `…0002_catalog.sql` | `destinations`, `travel_packages`, `package_images`, `hotels`, `hotel_rooms`, `visa_countries`, `visa_types`, `articles`, `team_members`, `testimonials` |
| `…0003_bookings.sql` | `bookings`, `booking_passengers`, `booking_status_history`, `booking_notes`, `visa_requests`, `booking_documents`, `payments`, `notifications` + business-rule triggers |
| `…0004_site.sql` | `website_settings` (seeded with the agency's real contact details), `exchange_rates`, `contact_messages`, `newsletter_subscribers` + RPCs |
| `…0005_rls.sql` | Row Level Security on **every** table, `admin_dashboard_stats()` |
| `…0006_storage.sql` | Buckets `media` (public read, admin write) and `documents` (private, per-user folders) |

Multilingual content is stored as `jsonb` `{"fr": …, "en": …, "ar": …}` (French required).

Security rules enforced **in the database** (verified by `tests/integration/security.test.ts`, 35 tests):
- Customers cannot change roles, statuses, prices or payment state; new requests are forced to
  `pending / unpaid` with a server-generated reference (`SAVY-YYMM-00001`, `VISA-YYMM-00001`).
- Only a super admin can change roles; nobody can change their own role; the last super admin is protected.
- Status transitions are validated; confirming requires a quoted amount.
- Online payments (Konnect/Flouci) can only be marked completed by the **service role after
  verifying with the provider API** (amount, currency and order id must match). Staff can record
  manual payments they received. Booking payment state is derived from the payments ledger.
- Documents: users can only write into their own storage folder and attach files to their own
  requests; files are readable only by the owner and admins (short-lived signed URLs).
- Contact and newsletter: anonymous submissions allowed, never readable by the public.

`supabase/seed.sql` contains **demo** data for local development (destinations with credited
photos, packages *without* prices, two visa guides, one article). Do not load it in production
as-is.

---

## 3. Environment variables

See `.env.example` for the full list with comments.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://savytravelservices.tn` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `…_ANON_KEY`) | yes | Public key, safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | for payments | **Server only.** Used for payment verification only |
| `RESEND_API_KEY`, `EMAIL_FROM`, `AGENCY_NOTIFICATION_EMAIL` | optional | E-mail confirmations & staff alerts |
| `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_ENV` | optional | Live flight offers |
| `KONNECT_API_KEY`, `KONNECT_WALLET_ID`, `KONNECT_ENV` | optional | Konnect payment links |
| `FLOUCI_APP_TOKEN`, `FLOUCI_APP_SECRET` | optional | Flouci payment links |
| `EXCHANGE_RATE_API_URL` | optional | Defaults to open.er-api.com (TND base) |

The admin **Settings** page shows which integrations are configured. Secrets are never stored
in the database or exposed to the browser.

---

## 4. Integrations

- **Amadeus Flight Offers Search v2** (`src/lib/flights/amadeus.ts`): OAuth client-credentials,
  token caching, offer parsing. Results are indicative; the agency confirms and issues tickets.
- **Konnect / Flouci** (`src/lib/payments/`): admin creates a payment link for a confirmed TND
  quote → customer pays on the provider page → provider webhook
  (`/api/payments/{provider}/webhook`) and the return page both trigger a **server-side
  verification** with the provider API. Endpoint shapes follow the providers' published APIs —
  validate them with your merchant account in sandbox before going live (`*_API_BASE` overrides).
- **Hotels**: curated catalog managed in the admin (no third-party hotel API is wired; the
  provider abstraction can be extended the same way as flights).
- **Exchange rates**: fetched on demand from the admin (or entered manually), shown only when
  enabled and less than 7 days old. Payment is always in TND.
- **E-mail**: Resend (optional). Without it, customers still get on-screen + in-app notifications.
- **Google Maps**: embedded from the address in Settings (no API key needed).

---

## 5. Local development

Prerequisites: Node 20+, Docker, Supabase CLI.

```bash
npm install
supabase start -x vector,logflare,edge-runtime,imgproxy,studio   # local Postgres/Auth/Storage
cp .env.example .env.local    # then paste the local URL/keys printed by `supabase status`
npm run admin:create -- admin@example.test "A-Long-Passw0rd!" "Admin"
npm run dev                   # http://localhost:3000 → redirects to /fr
```

Useful commands:

| Command | Purpose |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (i18n parity, validation, currency, payment reconciliation, admin parser, Amadeus parser) |
| `npm run test:integration` | Security tests against the stack in `.env.local` (**local/staging only** — creates and deletes test users) |
| `supabase db reset` | Re-apply migrations + demo seed locally |
| `npm run db:types` | Regenerate `database.types.ts` from the local schema |

---

## 6. Admin access

1. Create the account and grant **super admin** (server-side, never from the browser):
   ```bash
   node --env-file=.env.production.local scripts/create-super-admin.mjs owner@savytravelservices.tn "<strong password>" "Fatma Zahra Chaabeni"
   ```
   or, for an existing account, in the Supabase SQL editor:
   `select public.grant_role('owner@savytravelservices.tn', 'super_admin');`
2. Sign in at `/fr/login` → **Administration** appears in the user menu (`/fr/admin`).
3. The super admin can promote staff to `admin` in **Users & roles**.

---

## 7. Deployment (Vercel + Supabase)

1. **Supabase project**: link and push migrations
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push            # applies supabase/migrations (not the demo seed)
   ```
   Auth → URL configuration: Site URL `https://savytravelservices.tn`, redirect URL
   `https://savytravelservices.tn/auth/callback`. Enable e-mail confirmation and configure SMTP.
2. **Vercel**: import the repository (framework: Next.js), add the environment variables
   (production values; service-role key as a server-only secret), deploy.
3. Point `savytravelservices.tn` DNS to Vercel; set `NEXT_PUBLIC_SITE_URL` accordingly.
4. Create the super admin (section 6), then fill content in the admin: settings (WhatsApp,
   bank details, social links), destinations, packages with real prices, hotels, visa guides.
5. If you load demo content, run **Admin → Media → Import external images** so third-party
   photos are served from your own Storage.
6. Payments: configure Konnect/Flouci keys, set the webhook URL
   `https://savytravelservices.tn/api/payments/konnect/webhook` (and `/flouci/webhook`), run a
   sandbox payment end-to-end, then switch `KONNECT_ENV=production`.

---

## 8. Project structure

```
src/proxy.ts                 locale routing (FR default), session refresh, protected-area gate
src/app/[locale]/(site)/     public pages, auth pages, customer account
src/app/[locale]/admin/      administration
src/app/api/                 payment webhooks, newsletter CSV export
src/lib/i18n/                dictionaries (fr = reference, en/ar type-checked), legal texts
src/lib/actions/             server actions (auth, public forms, booking, account, admin)
src/lib/admin/               declarative CRUD resources + form parser
src/lib/data/                server data access (catalog, settings, currency, account)
src/lib/payments/, flights/  provider adapters
supabase/migrations/         schema, RLS, storage
tests/integration/           database security tests
```
