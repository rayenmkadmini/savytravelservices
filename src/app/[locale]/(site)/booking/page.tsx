import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { BookingForm, type BookingFormInitial } from "@/components/booking/booking-form";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { getHotel, getPackage } from "@/lib/data/catalog";
import { todayInTunis, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { serviceTypes } from "@/lib/validation";

export async function generateMetadata({ params }: PageProps<"/[locale]/booking">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/booking", title: dict.booking.title, description: dict.booking.lead });
}

const s = (v: string | string[] | undefined, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const d = (v: string | string[] | undefined) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const n = (v: string | string[] | undefined, min: number, max: number) => {
  const x = Number.parseInt(s(v), 10);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : undefined;
};
const uuid = (v: string) => (/^[0-9a-f-]{36}$/i.test(v) ? v : null);

export default async function BookingPage({ params, searchParams }: PageProps<"/[locale]/booking">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const profile = await getCurrentProfile();

  const requested = s(sp.service);
  let service: BookingFormInitial["service_type"] = (serviceTypes as readonly string[]).includes(requested)
    ? (requested as BookingFormInitial["service_type"])
    : "custom";

  let selectedLabel: string | null = null;
  let packageId: string | null = null;
  let hotelId: string | null = null;
  let roomId: string | null = null;

  if (s(sp.package)) {
    const pkg = await getPackage(s(sp.package));
    if (pkg) {
      service = "package";
      packageId = pkg.id;
      selectedLabel = tr(pkg.title, locale);
    }
  }
  if (s(sp.hotel)) {
    const hotel = await getHotel(s(sp.hotel));
    if (hotel) {
      service = "hotel";
      hotelId = hotel.id;
      const room = hotel.rooms.find((r) => r.id === s(sp.room));
      roomId = room?.id ?? null;
      selectedLabel = `${hotel.name}, ${hotel.city}${room ? ` — ${tr(room.name, locale)}` : ""}`;
    }
  }

  const offer = s(sp.offer, 400);
  const initial: BookingFormInitial = {
    service_type: service,
    package_id: packageId,
    hotel_id: hotelId,
    room_id: roomId,
    destination_id: uuid(s(sp.destination_id)),
    selectedLabel,
    origin: s(sp.origin),
    destination: s(sp.destination),
    departure_date: d(sp.departure),
    return_date: d(sp.return),
    adults: n(sp.adults, 1, 20),
    children: n(sp.children, 0, 20),
    infants: n(sp.infants, 0, 10),
    rooms: n(sp.rooms, 1, 20),
    travel_class: s(sp.class),
    notes: offer ? `Offre sélectionnée / Selected offer: ${offer}` : "",
    contact_name: profile?.full_name ?? "",
    contact_email: profile?.email ?? "",
    contact_phone: profile?.phone ?? "",
  };

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") query.set(k, v);
  const next = `/${locale}/booking${query.size ? `?${query}` : ""}`;

  return (
    <>
      <PageHero eyebrow={dict.nav.bookTrip} title={dict.booking.title} lead={dict.booking.lead} compact />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-soft sm:p-10">
          {profile ? (
            <BookingForm initial={initial} userId={profile.id} today={todayInTunis()} />
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-gold-soft text-gold-strong">
                <LockKeyhole className="size-6" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-3xl">{dict.booking.loginTitle}</h2>
              <p className="mt-3 max-w-md text-ink-muted">{dict.booking.loginText}</p>
              {selectedLabel ? <p className="mt-4 rounded-full bg-sand px-4 py-2 text-sm font-medium">{selectedLabel}</p> : null}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href={`/${locale}/login?next=${encodeURIComponent(next)}`} variant="primary" size="lg">
                  {dict.nav.login}
                </ButtonLink>
                <ButtonLink href={`/${locale}/register?next=${encodeURIComponent(next)}`} variant="outline" size="lg">
                  {dict.nav.register}
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {dict.home.why.slice(0, 3).map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-paper p-5">
              <ShieldCheck className="size-5 text-gold" aria-hidden />
              <h3 className="mt-3 font-display text-xl">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{item.text}</p>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
