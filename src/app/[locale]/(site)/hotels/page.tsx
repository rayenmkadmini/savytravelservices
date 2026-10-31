import { BedDouble, Search } from "lucide-react";
import type { Metadata } from "next";
import { HotelCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { listHotels } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { todayInTunis } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { fmt } from "@/lib/utils";

const IMAGE = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=75";

export async function generateMetadata({ params }: PageProps<"/[locale]/hotels">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/hotels", title: dict.hotels.title, description: dict.hotels.lead, image: IMAGE });
}

const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export default async function HotelsPage({ params, searchParams }: PageProps<"/[locale]/hotels">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const today = todayInTunis();
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const stars = Number(sp.stars) >= 1 && Number(sp.stars) <= 5 ? Number(sp.stars) : 0;
  const checkin = date(sp.checkin);
  const checkout = date(sp.checkout) > checkin ? date(sp.checkout) : "";
  const guests = Math.min(12, Math.max(1, Number(sp.guests) || 2));
  const rooms = Math.min(6, Math.max(1, Number(sp.rooms) || 1));

  const [hotels, currency] = await Promise.all([listHotels({ q, stars: stars || undefined }), getCurrencyContext()]);

  const stay = new URLSearchParams();
  if (checkin) stay.set("checkin", checkin);
  if (checkout) stay.set("checkout", checkout);
  stay.set("guests", String(guests));
  stay.set("rooms", String(rooms));

  const requestHref = `/${locale}/booking?service=hotel${q ? `&destination=${encodeURIComponent(q)}` : ""}${
    checkin ? `&departure=${checkin}` : ""
  }${checkout ? `&return=${checkout}` : ""}&adults=${guests}&rooms=${rooms}`;

  return (
    <>
      <PageHero eyebrow={dict.nav.hotels} title={dict.hotels.title} lead={dict.hotels.lead} image={IMAGE} compact />
      <section className="container-page relative z-10 -mt-8">
        <form method="get" className="grid gap-4 rounded-[1.75rem] border border-line bg-paper p-5 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_0.9fr_0.6fr_0.6fr_0.9fr_auto] lg:items-end">
          <div>
            <Label htmlFor="q">{dict.search.destination}</Label>
            <Input id="q" name="q" defaultValue={q} placeholder={dict.search.destinationPlaceholder} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="checkin">{dict.search.checkIn}</Label>
            <Input id="checkin" type="date" name="checkin" min={today} defaultValue={checkin} />
          </div>
          <div>
            <Label htmlFor="checkout">{dict.search.checkOut}</Label>
            <Input id="checkout" type="date" name="checkout" min={checkin || today} defaultValue={checkout} />
          </div>
          <div>
            <Label htmlFor="guests">{dict.search.guests}</Label>
            <Input id="guests" type="number" name="guests" min={1} max={12} defaultValue={guests} />
          </div>
          <div>
            <Label htmlFor="rooms">{dict.search.rooms}</Label>
            <Input id="rooms" type="number" name="rooms" min={1} max={6} defaultValue={rooms} />
          </div>
          <div>
            <Label htmlFor="stars">{fmt(dict.hotels.stars, { n: "★" })}</Label>
            <Select id="stars" name="stars" defaultValue={stars ? String(stars) : ""}>
              <option value="">{dict.hotels.anyStars}</option>
              {[5, 4, 3].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)}+
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="accent" className="h-11">
            <Search aria-hidden /> {dict.common.search}
          </Button>
        </form>
      </section>

      <section className="container-page py-14">
        {hotels.length ? (
          <>
            <p className="mb-6 text-sm text-ink-muted">{fmt(dict.hotels.results, { n: hotels.length })} · {dict.hotels.availabilityNote}</p>
            <div className="grid gap-6 lg:grid-cols-2">
              {hotels.map((h) => (
                <HotelCard key={h.id} hotel={h} locale={locale} dict={dict} currency={currency} query={stay.toString()} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={BedDouble}
            text={dict.hotels.noResults}
            action={
              <ButtonLink href={requestHref} variant="accent">
                {dict.hotels.requestQuote}
              </ButtonLink>
            }
          />
        )}
      </section>
    </>
  );
}
