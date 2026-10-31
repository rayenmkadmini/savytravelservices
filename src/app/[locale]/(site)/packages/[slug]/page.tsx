import { CalendarDays, Check, MapPin, Users, X } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { Price } from "@/components/site/price";
import { ButtonLink } from "@/components/ui/button";
import { getPackage, listPackages, parseItinerary } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { fmt, lines, siteUrl } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/packages/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const pkg = await getPackage(slug);
  if (!pkg) return pageMetadata({ locale, dict, path: `/packages/${slug}`, title: dict.errors.notFoundTitle, noIndex: true });
  return pageMetadata({
    locale,
    dict,
    path: `/packages/${slug}`,
    title: tr(pkg.title, locale),
    description: tr(pkg.summary, locale),
    image: pkg.cover_image_url,
  });
}

export default async function PackagePage({ params }: PageProps<"/[locale]/packages/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const [pkg, currency] = await Promise.all([getPackage(slug), getCurrencyContext()]);
  if (!pkg) notFound();

  const title = tr(pkg.title, locale);
  const itinerary = parseItinerary(pkg.itinerary);
  const included = lines(tr(pkg.included, locale));
  const excluded = lines(tr(pkg.excluded, locale));
  const related = (await listPackages({ destinationId: pkg.destination_id ?? undefined, excludeId: pkg.id, limit: 3 })).slice(0, 3);
  const bookHref = `/${locale}/booking?service=package&package=${pkg.slug}`;

  const structured = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: title,
    description: tr(pkg.summary, locale) || undefined,
    image: pkg.cover_image_url || undefined,
    url: siteUrl(`/${locale}/packages/${pkg.slug}`),
    touristType: dict.packages.categories[pkg.category as keyof typeof dict.packages.categories],
    itinerary: itinerary.length
      ? { "@type": "ItemList", itemListElement: itinerary.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: tr(d.title, locale) })) }
      : undefined,
    offers:
      pkg.price_from !== null
        ? { "@type": "Offer", price: Number(pkg.price_from), priceCurrency: pkg.currency, availability: "https://schema.org/InStock", url: siteUrl(bookHref) }
        : undefined,
    provider: { "@id": siteUrl("/#agency") },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <PageHero
        eyebrow={dict.packages.categories[pkg.category as keyof typeof dict.packages.categories]}
        title={title}
        lead={tr(pkg.summary, locale)}
        image={pkg.cover_image_url}
        credit={pkg.image_credit ? fmt(dict.common.photoCredit, { credit: pkg.image_credit }) : null}
      >
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
          {pkg.destination ? (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-gold" aria-hidden />
              <Link href={`/${locale}/destinations/${pkg.destination.slug}`} className="hover:underline">
                {tr(pkg.destination.name, locale)}
              </Link>
            </li>
          ) : null}
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-gold" aria-hidden />
            {fmt(dict.common.daysNights, { d: pkg.duration_days, n: pkg.duration_nights })}
          </li>
          {pkg.max_travelers ? (
            <li className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-gold" aria-hidden />
              {fmt(dict.packages.maxTravelers, { n: pkg.max_travelers })}
            </li>
          ) : null}
        </ul>
      </PageHero>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-14">
          {tr(pkg.description, locale) ? (
            <section>
              <h2 className="font-display text-3xl">{dict.packages.overview}</h2>
              <div className="prose-savy mt-4">
                {tr(pkg.description, locale).split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          {pkg.images.length ? (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pkg.images.map((img, i) => (
                <div key={img.id} className={`relative overflow-hidden rounded-2xl bg-sand-deep ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}`}>
                  <Image src={img.url} alt={tr(img.alt, locale) || title} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </section>
          ) : null}

          {itinerary.length ? (
            <section>
              <h2 className="font-display text-3xl">{dict.packages.itinerary}</h2>
              <ol className="relative mt-6 space-y-6 border-s border-line ps-8">
                {itinerary.map((day) => (
                  <li key={day.day} className="relative">
                    <span className="absolute -start-[2.65rem] top-0 grid size-8 place-items-center rounded-full border border-gold bg-paper text-xs font-bold text-gold-strong">
                      {day.day}
                    </span>
                    <p className="eyebrow">{fmt(dict.packages.day, { n: day.day })}</p>
                    <h3 className="mt-1 font-display text-2xl">{tr(day.title, locale)}</h3>
                    {tr(day.description, locale) ? <p className="mt-2 text-ink-muted">{tr(day.description, locale)}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {included.length || excluded.length ? (
            <section className="grid gap-6 sm:grid-cols-2">
              {included.length ? (
                <div className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
                  <h2 className="font-display text-2xl">{dict.packages.included}</h2>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {included.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {excluded.length ? (
                <div className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
                  <h2 className="font-display text-2xl">{dict.packages.excluded}</h2>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {excluded.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-lift">
            <Price
              amount={pkg.price_from}
              currency={pkg.currency}
              ctx={currency}
              locale={locale}
              dict={dict}
              label={pkg.price_from !== null ? `${dict.common.from} · ${dict.common.perPerson}` : undefined}
              size="lg"
            />
            <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.packages.duration}</dt>
                <dd className="font-medium">{fmt(dict.common.daysNights, { d: pkg.duration_days, n: pkg.duration_nights })}</dd>
              </div>
              {pkg.destination ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{dict.search.destination}</dt>
                  <dd className="font-medium">{tr(pkg.destination.name, locale)}</dd>
                </div>
              ) : null}
            </dl>
            <ButtonLink href={bookHref} variant="accent" size="lg" className="mt-6 w-full">
              {dict.packages.book}
            </ButtonLink>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">{dict.packages.priceNote}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">{dict.booking.noPaymentNote}</p>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="border-t border-line bg-paper py-16">
          <div className="container-page">
            <h2 className="mb-8 font-display text-3xl">{dict.packages.related}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <PackageCard key={p.id} pkg={p} locale={locale} dict={dict} currency={currency} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
