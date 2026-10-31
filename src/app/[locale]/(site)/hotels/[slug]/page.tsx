import { BedDouble, Check, MapPin, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Price } from "@/components/site/price";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getHotel } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { fmt, siteUrl } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/hotels/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const hotel = await getHotel(slug);
  if (!hotel) return pageMetadata({ locale, dict, path: `/hotels/${slug}`, title: dict.errors.notFoundTitle, noIndex: true });
  return pageMetadata({
    locale,
    dict,
    path: `/hotels/${slug}`,
    title: `${hotel.name} — ${hotel.city}`,
    description: tr(hotel.description, locale),
    image: hotel.cover_image_url,
  });
}

export default async function HotelPage({ params, searchParams }: PageProps<"/[locale]/hotels/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const sp = await searchParams;
  const dict = getDictionary(locale);
  const [hotel, currency] = await Promise.all([getHotel(slug), getCurrencyContext()]);
  if (!hotel) notFound();

  const stay = new URLSearchParams({ service: "hotel", hotel: hotel.slug });
  for (const [from, to] of [
    ["checkin", "departure"],
    ["checkout", "return"],
    ["guests", "adults"],
    ["rooms", "rooms"],
  ] as const) {
    const v = sp[from];
    if (typeof v === "string" && v) stay.set(to, v.slice(0, 20));
  }
  const bookHref = (roomId?: string) => `/${locale}/booking?${stay}${roomId ? `&room=${roomId}` : ""}`;
  const gallery = [hotel.cover_image_url, ...hotel.gallery].filter((u): u is string => Boolean(u));
  const description = tr(hotel.description, locale);

  const structured = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: description || undefined,
    image: gallery.length ? gallery : undefined,
    url: siteUrl(`/${locale}/hotels/${hotel.slug}`),
    starRating: hotel.stars ? { "@type": "Rating", ratingValue: hotel.stars } : undefined,
    address: { "@type": "PostalAddress", streetAddress: hotel.address || undefined, addressLocality: hotel.city },
    amenityFeature: hotel.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <PageHero eyebrow={hotel.city} title={hotel.name} image={hotel.cover_image_url} compact>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/85">
          {hotel.stars ? (
            <span className="inline-flex items-center gap-0.5 text-gold" aria-label={fmt(dict.hotels.stars, { n: hotel.stars })}>
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" aria-hidden />
              ))}
            </span>
          ) : null}
          {hotel.address ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-gold" aria-hidden /> {hotel.address}
            </span>
          ) : null}
        </div>
      </PageHero>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-12">
          {gallery.length > 1 ? (
            <section aria-label={dict.hotels.gallery} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {gallery.slice(0, 7).map((url, i) => (
                <div key={url} className={`relative overflow-hidden rounded-2xl bg-sand-deep ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                  <Image src={url} alt={`${hotel.name} ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
              ))}
            </section>
          ) : null}

          {description ? (
            <section>
              <h2 className="font-display text-3xl">{dict.hotels.about}</h2>
              <div className="prose-savy mt-4">
                {description.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          {hotel.amenities.length ? (
            <section>
              <h2 className="font-display text-3xl">{dict.hotels.amenities}</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {hotel.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-success" aria-hidden /> {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="font-display text-3xl">{dict.hotels.roomsTitle}</h2>
            {hotel.rooms.length ? (
              <ul className="mt-5 grid gap-4">
                {hotel.rooms.map((room) => (
                  <li key={room.id} className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <h3 className="font-display text-2xl">{tr(room.name, locale)}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge tone="sea">{dict.hotels.boards[room.board as keyof typeof dict.hotels.boards]}</Badge>
                        <Badge>
                          <Users className="size-3" aria-hidden />
                          {fmt(dict.hotels.maxGuests, { a: room.max_adults, c: room.max_children })}
                        </Badge>
                      </div>
                      {tr(room.description, locale) ? <p className="mt-2 text-sm text-ink-muted">{tr(room.description, locale)}</p> : null}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <Price
                        amount={room.price_from}
                        currency={hotel.currency}
                        ctx={currency}
                        locale={locale}
                        dict={dict}
                        label={room.price_from !== null ? dict.common.from : undefined}
                        size="sm"
                      />
                      <ButtonLink href={bookHref(room.id)} variant="outline" size="sm">
                        {dict.hotels.selectRoom}
                      </ButtonLink>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                <BedDouble className="size-4" aria-hidden /> {dict.hotels.noRooms}
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-lift">
            <Price
              amount={hotel.price_from}
              currency={hotel.currency}
              ctx={currency}
              locale={locale}
              dict={dict}
              label={hotel.price_from !== null ? dict.common.from : undefined}
              size="lg"
            />
            <ButtonLink href={bookHref()} variant="accent" size="lg" className="mt-6 w-full">
              {dict.hotels.requestStay}
            </ButtonLink>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">{dict.hotels.availabilityNote}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
