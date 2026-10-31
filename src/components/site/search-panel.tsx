"use client";

import { BedDouble, Compass, Plane, Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type Tab = "flights" | "hotels" | "packages";

export type SearchDestination = { slug: string; name: string };

/**
 * Hero search. Each tab submits a plain GET form to the matching results
 * page, so searches are shareable, bookmarkable and work without JS.
 */
export function SearchPanel({
  destinations,
  today,
  initialTab = "flights",
}: {
  destinations: SearchDestination[];
  today: string;
  initialTab?: Tab;
}) {
  const { locale, dict } = useI18n();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [departure, setDeparture] = useState("");
  const s = dict.search;

  const tabs: { key: Tab; label: string; Icon: typeof Plane }[] = [
    { key: "flights", label: s.tabs.flights, Icon: Plane },
    { key: "hotels", label: s.tabs.hotels, Icon: BedDouble },
    { key: "packages", label: s.tabs.packages, Icon: Compass },
  ];

  const field = "flex min-w-0 flex-col gap-1 rounded-2xl px-4 py-2.5 transition-colors focus-within:bg-sand hover:bg-sand/70";
  const label = "text-[0.68rem] font-bold tracking-[0.14em] text-ink-muted uppercase rtl:tracking-normal";
  const input = "w-full min-w-0 bg-transparent text-[0.95rem] font-medium text-ink placeholder:text-ink-muted/60 focus:outline-none";

  return (
    <div className="w-full rounded-[1.75rem] bg-paper/95 p-2 text-ink shadow-lift ring-1 ring-black/5 backdrop-blur-xl">
      <div role="tablist" aria-label={dict.common.search} className="flex gap-1 p-1">
        {tabs.map(({ key, label: text, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-ink text-sand" : "text-ink-soft hover:bg-sand",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {text}
          </button>
        ))}
      </div>

      {tab === "flights" ? (
        <form id="panel-flights" role="tabpanel" aria-labelledby="tab-flights" action={`/${locale}/flights`} method="get"
          className="grid gap-1 p-1 md:grid-cols-[1fr_1fr_0.9fr_0.9fr_0.7fr_auto] md:items-center"
        >
          <label className={field}>
            <span className={label}>{s.from}</span>
            <input name="origin" required maxLength={60} placeholder={s.fromPlaceholder} className={input} autoComplete="off" />
          </label>
          <label className={field}>
            <span className={label}>{s.to}</span>
            <input name="destination" required maxLength={60} placeholder={s.toPlaceholder} className={input} autoComplete="off" />
          </label>
          <label className={field}>
            <span className={label}>{s.departure}</span>
            <input type="date" name="departure" required min={today} value={departure} onChange={(e) => setDeparture(e.target.value)} className={input} />
          </label>
          <label className={field}>
            <span className={label}>{s.return}</span>
            <input type="date" name="return" min={departure || today} className={input} />
          </label>
          <label className={field}>
            <span className={label}>{s.passengers}</span>
            <input type="number" name="adults" min={1} max={9} defaultValue={1} className={input} />
          </label>
          <Button type="submit" variant="accent" size="lg" className="m-1 h-14 md:aspect-square md:px-0" aria-label={dict.common.search}>
            <Search className="!size-5" aria-hidden />
            <span className="md:sr-only">{dict.common.search}</span>
          </Button>
        </form>
      ) : null}

      {tab === "hotels" ? (
        <form id="panel-hotels" role="tabpanel" aria-labelledby="tab-hotels" action={`/${locale}/hotels`} method="get"
          className="grid gap-1 p-1 md:grid-cols-[1.4fr_0.9fr_0.9fr_0.7fr_auto] md:items-center"
        >
          <label className={field}>
            <span className={label}>{s.destination}</span>
            <input name="q" maxLength={80} placeholder={s.destinationPlaceholder} className={input} />
          </label>
          <label className={field}>
            <span className={label}>{s.checkIn}</span>
            <input type="date" name="checkin" min={today} value={departure} onChange={(e) => setDeparture(e.target.value)} className={input} />
          </label>
          <label className={field}>
            <span className={label}>{s.checkOut}</span>
            <input type="date" name="checkout" min={departure || today} className={input} />
          </label>
          <label className={field}>
            <span className={label}>{s.guests}</span>
            <input type="number" name="guests" min={1} max={12} defaultValue={2} className={input} />
          </label>
          <Button type="submit" variant="accent" size="lg" className="m-1 h-14 md:aspect-square md:px-0" aria-label={dict.common.search}>
            <Search className="!size-5" aria-hidden />
            <span className="md:sr-only">{dict.common.search}</span>
          </Button>
        </form>
      ) : null}

      {tab === "packages" ? (
        <form id="panel-packages" role="tabpanel" aria-labelledby="tab-packages" action={`/${locale}/packages`} method="get"
          className="grid gap-1 p-1 md:grid-cols-[1.4fr_1fr_auto] md:items-center"
        >
          <label className={field}>
            <span className={label}>{s.destination}</span>
            <select name="destination" className={cn(input, "appearance-none")} defaultValue="">
              <option value="">{s.anyDestination}</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            <span className={label}>{s.category}</span>
            <select name="category" className={cn(input, "appearance-none")} defaultValue="">
              <option value="">{s.anyCategory}</option>
              {Object.entries(dict.packages.categories).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="accent" size="lg" className="m-1 h-14 md:aspect-square md:px-0" aria-label={dict.common.search}>
            <Search className="!size-5" aria-hidden />
            <span className="md:sr-only">{dict.common.search}</span>
          </Button>
        </form>
      ) : null}
    </div>
  );
}
