import { AlertCircle, ArrowRight, Headset, Plane, PlaneLanding, PlaneTakeoff } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { searchFlights, IATA, type FlightOffer } from "@/lib/flights/amadeus";
import { formatDate, formatDuration, formatMoney, todayInTunis } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { fmt } from "@/lib/utils";

const IMAGE = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=75";

export async function generateMetadata({ params }: PageProps<"/[locale]/flights">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/flights", title: dict.flights.title, description: dict.flights.lead, image: IMAGE });
}

type Params = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");
const int = (v: string | string[] | undefined, min: number, max: number, dflt: number) => {
  const n = Number.parseInt(str(v), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const classes = ["economy", "premium_economy", "business", "first"] as const;

export default async function FlightsPage({ params, searchParams }: PageProps<"/[locale]/flights">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = (await searchParams) as Params;
  const today = todayInTunis();

  const origin = str(sp.origin).toUpperCase().slice(0, 60);
  const destination = str(sp.destination).toUpperCase().slice(0, 60);
  const departure = /^\d{4}-\d{2}-\d{2}$/.test(str(sp.departure)) ? str(sp.departure) : "";
  const ret = /^\d{4}-\d{2}-\d{2}$/.test(str(sp.return)) && str(sp.return) >= departure ? str(sp.return) : "";
  const adults = int(sp.adults, 1, 9, 1);
  const children = int(sp.children, 0, 8, 0);
  const infants = int(sp.infants, 0, adults, 0);
  const travelClass = classes.find((c) => c === str(sp.class)) ?? "economy";
  const submitted = Boolean(origin && destination && departure);
  const sameAirport = submitted && origin === destination;
  const canSearchLive = submitted && !sameAirport && IATA.test(origin) && IATA.test(destination) && departure >= today;

  const result = canSearchLive
    ? await searchFlights({ origin, destination, departureDate: departure, returnDate: ret || null, adults, children, infants, travelClass })
    : null;

  const bookingParams = new URLSearchParams({ service: "flight" });
  if (origin) bookingParams.set("origin", origin);
  if (destination) bookingParams.set("destination", destination);
  if (departure) bookingParams.set("departure", departure);
  if (ret) bookingParams.set("return", ret);
  bookingParams.set("adults", String(adults));
  if (children) bookingParams.set("children", String(children));
  if (infants) bookingParams.set("infants", String(infants));
  bookingParams.set("class", travelClass);
  const requestHref = `/${locale}/booking?${bookingParams}`;

  return (
    <>
      <PageHero eyebrow={dict.nav.flights} title={dict.flights.title} lead={dict.flights.lead} image={IMAGE} compact />

      <section className="container-page -mt-8 relative z-10">
        <form method="get" className="grid gap-4 rounded-[1.75rem] border border-line bg-paper p-5 shadow-lift sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr_0.55fr_0.55fr_0.55fr_0.9fr_auto] lg:items-end">
          <div>
            <Label htmlFor="origin">{dict.search.from}</Label>
            <Input id="origin" name="origin" required defaultValue={origin} placeholder="TUN" maxLength={60} autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="destination">{dict.search.to}</Label>
            <Input id="destination" name="destination" required defaultValue={destination} placeholder="IST" maxLength={60} autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="departure">{dict.search.departure}</Label>
            <Input id="departure" type="date" name="departure" required min={today} defaultValue={departure} />
          </div>
          <div>
            <Label htmlFor="return" optional={dict.common.optional}>{dict.search.return}</Label>
            <Input id="return" type="date" name="return" min={departure || today} defaultValue={ret} />
          </div>
          <div>
            <Label htmlFor="adults">{dict.common.adults}</Label>
            <Input id="adults" type="number" name="adults" min={1} max={9} defaultValue={adults} />
          </div>
          <div>
            <Label htmlFor="children">{dict.common.children}</Label>
            <Input id="children" type="number" name="children" min={0} max={8} defaultValue={children} />
          </div>
          <div>
            <Label htmlFor="infants">{dict.common.infants}</Label>
            <Input id="infants" type="number" name="infants" min={0} max={9} defaultValue={infants} />
          </div>
          <div>
            <Label htmlFor="class">{dict.search.travelClass}</Label>
            <Select id="class" name="class" defaultValue={travelClass}>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {dict.search.classes[c]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="accent" className="h-11">
            <Plane aria-hidden /> {dict.common.search}
          </Button>
          <p className="text-xs text-ink-muted sm:col-span-2 lg:col-span-full">{dict.flights.iataHint}</p>
        </form>
      </section>

      <section className="container-page py-14">
        {sameAirport ? (
          <Notice tone="warning" text={dict.flights.sameAirport} />
        ) : !submitted ? (
          <ManualPanel dict={dict} href={requestHref} showTips />
        ) : !canSearchLive || result?.status === "not_configured" ? (
          <ManualPanel dict={dict} href={requestHref} />
        ) : result?.status === "error" ? (
          <>
            <Notice tone="warning" text={dict.flights.error} />
            <ManualPanel dict={dict} href={requestHref} />
          </>
        ) : result?.status === "ok" && result.offers.length === 0 ? (
          <>
            <Notice tone="info" text={dict.flights.noResults} />
            <ManualPanel dict={dict} href={requestHref} />
          </>
        ) : result?.status === "ok" ? (
          <div>
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-3xl">{dict.flights.resultsTitle}</h2>
              <p className="text-sm text-ink-muted">{fmt(dict.flights.resultsCount, { n: result.offers.length })}</p>
            </div>
            <p className="mb-6 rounded-xl bg-sea-soft px-4 py-3 text-sm text-sea">{dict.flights.liveNote}</p>
            <ul className="grid gap-4">
              {result.offers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} locale={locale} dict={dict} requestHref={requestHref} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}

function Notice({ tone, text }: { tone: "info" | "warning"; text: string }) {
  return (
    <p className={`mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${tone === "warning" ? "bg-warning-soft text-warning" : "bg-sea-soft text-sea"}`} role="status">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

function ManualPanel({ dict, href, showTips }: { dict: Dictionary; href: string; showTips?: boolean }) {
  return (
    <div className="grid gap-8 rounded-[var(--radius-card)] border border-line bg-paper p-8 shadow-soft lg:grid-cols-[1.3fr_1fr] lg:items-center">
      <div>
        <span className="grid size-12 place-items-center rounded-full bg-gold-soft text-gold-strong">
          <Headset className="size-5" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-3xl">{dict.flights.manualTitle}</h2>
        <p className="mt-3 max-w-xl text-ink-muted">{dict.flights.manualText}</p>
        <ButtonLink href={href} variant="accent" size="lg" className="mt-6">
          {dict.flights.requestCustom}
          <ArrowRight className="rtl:-scale-x-100" aria-hidden />
        </ButtonLink>
      </div>
      {showTips ? (
        <ul className="space-y-3 text-sm text-ink-soft">
          {dict.flights.tips.map((tip) => (
            <li key={tip} className="flex gap-3 rounded-xl bg-sand px-4 py-3">
              <Plane className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function OfferCard({ offer, locale, dict, requestHref }: { offer: FlightOffer; locale: Locale; dict: Dictionary; requestHref: string }) {
  const time = (iso: string) => formatDate(iso, locale, { hour: "2-digit", minute: "2-digit" });
  const day = (iso: string) => formatDate(iso, locale, { day: "numeric", month: "short" });
  const summary = offer.itineraries
    .map((it) => {
      const first = it.segments[0];
      const last = it.segments[it.segments.length - 1];
      return `${first.flightNumber} ${first.from} ${first.departAt.slice(0, 16).replace("T", " ")} → ${last.to} ${last.arriveAt.slice(0, 16).replace("T", " ")}`;
    })
    .join(" / ");
  const href = `${requestHref}&offer=${encodeURIComponent(`${summary} · ${offer.price} ${offer.currency}`)}`;

  return (
    <article className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-paper p-5 shadow-soft md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-4">
        {offer.itineraries.map((it, idx) => {
          const first = it.segments[0];
          const last = it.segments[it.segments.length - 1];
          const stops = it.segments.length - 1;
          return (
            <div key={idx} className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="text-start">
                <p className="text-xs text-ink-muted">{idx === 0 ? dict.flights.outbound : dict.flights.inbound} · {day(first.departAt)}</p>
                <p className="font-display text-2xl font-semibold" dir="ltr">{time(first.departAt)}</p>
                <p className="text-xs font-bold tracking-wider">{first.from}</p>
              </div>
              <div className="flex flex-col items-center text-xs text-ink-muted">
                <span>{formatDuration(it.duration, locale)}</span>
                <span className="relative my-1.5 flex w-full items-center">
                  <PlaneTakeoff className="size-3.5 text-gold" aria-hidden />
                  <span className="mx-1 h-px flex-1 bg-line" />
                  <PlaneLanding className="size-3.5 text-gold" aria-hidden />
                </span>
                <span className={stops ? "text-warning" : "text-success"}>{stops ? fmt(dict.flights.stops, { n: stops }) : dict.flights.direct}</span>
              </div>
              <div className="text-end">
                <p className="text-xs text-ink-muted">{it.segments.map((s) => s.flightNumber).join(" · ")}</p>
                <p className="font-display text-2xl font-semibold" dir="ltr">{time(last.arriveAt)}</p>
                <p className="text-xs font-bold tracking-wider">{last.to}</p>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-ink-muted">
          {offer.carriers.join(", ")}
          {offer.seats ? ` · ${fmt(dict.flights.seats, { n: offer.seats })}` : ""}
        </p>
      </div>
      <div className="flex flex-row items-center justify-between gap-4 border-t border-line pt-4 md:flex-col md:items-end md:border-t-0 md:border-s md:ps-6 md:pt-0">
        <p className="font-display text-3xl font-semibold">{formatMoney(offer.price, offer.currency, locale)}</p>
        <ButtonLink href={href} variant="accent">
          {dict.flights.requestQuote}
        </ButtonLink>
      </div>
    </article>
  );
}
