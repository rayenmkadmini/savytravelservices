import { ArrowUpRight, CalendarDays, MapPin, Quote, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CurrencyContext } from "@/lib/currency";
import type { Article, Destination, Hotel, Testimonial, TravelPackage } from "@/lib/data/catalog";
import { formatDate, tr } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn, fmt } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Price } from "./price";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grain absolute inset-0 grid place-items-center bg-gradient-to-br from-sand-deep to-gold-soft">
      <span className="px-4 text-center font-display text-3xl text-ink/40">{label}</span>
    </div>
  );
}

export function DestinationCard({
  destination,
  locale,
  dict,
  className,
  priority,
}: {
  destination: Destination;
  locale: Locale;
  dict: Dictionary;
  className?: string;
  priority?: boolean;
}) {
  const name = tr(destination.name, locale);
  return (
    <Link
      href={`/${locale}/destinations/${destination.slug}`}
      className={cn("group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-ink shadow-soft", className)}
    >
      {destination.image_url ? (
        <Image
          src={destination.image_url}
          alt={name}
          fill
          preload={priority}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <Placeholder label={name} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-soft uppercase rtl:tracking-normal">
          {tr(destination.tagline, locale) || tr(destination.country, locale)}
        </p>
        <h3 className="mt-1 font-display text-3xl leading-tight">{name}</h3>
        <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/80 transition-colors group-hover:text-white">
          {dict.destinations.explore}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function PackageCard({
  pkg,
  locale,
  dict,
  currency,
}: {
  pkg: TravelPackage;
  locale: Locale;
  dict: Dictionary;
  currency: CurrencyContext;
}) {
  const title = tr(pkg.title, locale);
  const category = dict.packages.categories[pkg.category as keyof Dictionary["packages"]["categories"]];
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-soft transition-shadow hover:shadow-lift">
      <Link href={`/${locale}/packages/${pkg.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sand-deep">
        {pkg.cover_image_url ? (
          <Image
            src={pkg.cover_image_url}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <Placeholder label={title} />
        )}
        <div className="absolute start-4 top-4 flex gap-2">
          {category ? <Badge tone="ink" className="bg-ink/80 backdrop-blur">{category}</Badge> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs font-medium text-ink-muted">
          {pkg.destination ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-gold" aria-hidden />
              {tr(pkg.destination.name, locale)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5 text-gold" aria-hidden />
            {fmt(dict.common.daysNights, { d: pkg.duration_days, n: pkg.duration_nights })}
          </span>
        </div>
        <h3 className="mt-2 font-display text-2xl leading-snug">
          <Link href={`/${locale}/packages/${pkg.slug}`} className="hover:text-gold-strong">
            {title}
          </Link>
        </h3>
        {tr(pkg.summary, locale) ? <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{tr(pkg.summary, locale)}</p> : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <Price
            amount={pkg.price_from}
            currency={pkg.currency}
            ctx={currency}
            locale={locale}
            dict={dict}
            label={pkg.price_from !== null ? dict.common.from : undefined}
            size="sm"
          />
          <Link
            href={`/${locale}/packages/${pkg.slug}`}
            aria-label={`${dict.common.viewDetails} — ${title}`}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-white"
          >
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HotelCard({
  hotel,
  locale,
  dict,
  currency,
  query,
}: {
  hotel: Hotel;
  locale: Locale;
  dict: Dictionary;
  currency: CurrencyContext;
  query?: string;
}) {
  const href = `/${locale}/hotels/${hotel.slug}${query ? `?${query}` : ""}`;
  return (
    <article className="group grid overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-soft transition-shadow hover:shadow-lift sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-sand-deep sm:aspect-auto sm:min-h-56">
        {hotel.cover_image_url ? (
          <Image
            src={hotel.cover_image_url}
            alt={hotel.name}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
          />
        ) : (
          <Placeholder label={hotel.name} />
        )}
      </Link>
      <div className="flex flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <MapPin className="size-3.5 text-gold" aria-hidden />
          {hotel.city}
          {hotel.stars ? (
            <span className="ms-2 inline-flex items-center gap-0.5 text-gold" aria-label={fmt(dict.hotels.stars, { n: hotel.stars })}>
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="size-3 fill-current" aria-hidden />
              ))}
            </span>
          ) : null}
        </div>
        <h3 className="mt-1.5 font-display text-2xl">
          <Link href={href} className="hover:text-gold-strong">
            {hotel.name}
          </Link>
        </h3>
        {tr(hotel.description, locale) ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{tr(hotel.description, locale)}</p>
        ) : null}
        {hotel.amenities.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 4).map((a) => (
              <li key={a}>
                <Badge>{a}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <Price
            amount={hotel.price_from}
            currency={hotel.currency}
            ctx={currency}
            locale={locale}
            dict={dict}
            label={hotel.price_from !== null ? dict.common.from : undefined}
            size="sm"
          />
          <Link href={href} className="text-sm font-semibold text-gold-strong hover:underline">
            {dict.common.viewDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ArticleCard({ article, locale, dict }: { article: Article; locale: Locale; dict: Dictionary }) {
  const title = tr(article.title, locale);
  return (
    <article className="group">
      <Link href={`/${locale}/inspiration/${article.slug}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] bg-sand-deep">
          {article.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
            />
          ) : (
            <Placeholder label={title} />
          )}
        </div>
        <p className="mt-4 text-xs font-medium text-ink-muted">
          {fmt(dict.inspiration.publishedOn, { date: formatDate(article.published_at, locale) })}
        </p>
        <h3 className="mt-1 font-display text-2xl leading-snug group-hover:text-gold-strong">{title}</h3>
        {tr(article.excerpt, locale) ? <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{tr(article.excerpt, locale)}</p> : null}
      </Link>
    </article>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-7">
      <Quote className="size-7 text-gold" aria-hidden />
      <div className="mt-4 flex gap-0.5 text-gold" aria-label={`${testimonial.rating}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("size-4", i < testimonial.rating ? "fill-current" : "opacity-30")} aria-hidden />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 font-display text-xl leading-relaxed text-white/90" lang={testimonial.locale}>
        “{testimonial.content}”
      </blockquote>
      <figcaption className="mt-6 text-sm text-white/60">
        <span className="font-semibold text-white">{testimonial.author_name}</span>
        {testimonial.author_location ? ` · ${testimonial.author_location}` : ""}
      </figcaption>
    </figure>
  );
}
