import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HotelCard, PackageCard } from "@/components/site/cards";
import { PageHero, SectionHeading } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getDestination, listHotels, listPackages } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { fmt } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/destinations/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const d = await getDestination(slug);
  if (!d) return pageMetadata({ locale, dict, path: `/destinations/${slug}`, title: dict.errors.notFoundTitle, noIndex: true });
  return pageMetadata({
    locale,
    dict,
    path: `/destinations/${slug}`,
    title: `${tr(d.name, locale)} — ${tr(d.country, locale)}`,
    description: tr(d.tagline, locale) || tr(d.description, locale),
    image: d.image_url,
  });
}

export default async function DestinationPage({ params }: PageProps<"/[locale]/destinations/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const destination = await getDestination(slug);
  if (!destination) notFound();
  const [packages, hotels, currency] = await Promise.all([
    listPackages({ destinationId: destination.id }),
    listHotels({ destinationId: destination.id }),
    getCurrencyContext(),
  ]);
  const name = tr(destination.name, locale);
  const description = tr(destination.description, locale);

  return (
    <>
      <PageHero
        eyebrow={tr(destination.country, locale)}
        title={name}
        lead={tr(destination.tagline, locale)}
        image={destination.image_url}
        credit={destination.image_credit ? fmt(dict.common.photoCredit, { credit: destination.image_credit }) : null}
      >
        <ButtonLink
          href={`/${locale}/booking?service=custom&destination=${encodeURIComponent(name)}&destination_id=${destination.id}`}
          variant="accent"
          size="lg"
          className="mt-8"
        >
          {fmt(dict.destinations.planHere, { name })}
          <ArrowRight className="rtl:-scale-x-100" aria-hidden />
        </ButtonLink>
      </PageHero>

      <div className="container-page space-y-16 py-14">
        {description ? (
          <section className="prose-savy max-w-3xl text-lg">
            {description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ) : null}

        {packages.length ? (
          <section>
            <SectionHeading title={fmt(dict.destinations.packagesHere, { name })} />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} locale={locale} dict={dict} currency={currency} />
              ))}
            </div>
          </section>
        ) : null}

        {hotels.length ? (
          <section>
            <SectionHeading title={fmt(dict.destinations.hotelsHere, { name })} />
            <div className="grid gap-6 lg:grid-cols-2">
              {hotels.map((h) => (
                <HotelCard key={h.id} hotel={h} locale={locale} dict={dict} currency={currency} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
