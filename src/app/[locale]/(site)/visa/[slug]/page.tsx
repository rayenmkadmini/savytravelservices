import { Clock, FileCheck2, ShieldAlert, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getVisaCountry } from "@/lib/data/catalog";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { lines } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/visa/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const country = await getVisaCountry(slug);
  if (!country) return pageMetadata({ locale, dict, path: `/visa/${slug}`, title: dict.errors.notFoundTitle, noIndex: true });
  return pageMetadata({
    locale,
    dict,
    path: `/visa/${slug}`,
    title: `${dict.visa.title} — ${tr(country.name, locale)}`,
    description: tr(country.overview, locale),
  });
}

export default async function VisaCountryPage({ params }: PageProps<"/[locale]/visa/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const country = await getVisaCountry(slug);
  if (!country) notFound();
  const name = tr(country.name, locale);

  return (
    <>
      <PageHero eyebrow={dict.visa.title} title={name} lead={tr(country.overview, locale)} image={country.image_url} compact>
        <ButtonLink href={`/${locale}/visa/request?country=${country.slug}`} variant="accent" size="lg" className="mt-8">
          {dict.visa.requestHelp}
        </ButtonLink>
      </PageHero>
      <div className="container-page space-y-8 py-14">
        <div role="note" className="flex gap-3 rounded-[var(--radius-card)] border border-warning/25 bg-warning-soft p-5 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p>{dict.visa.disclaimer}</p>
            <p className="mt-1">{dict.visa.infoNote}</p>
          </div>
        </div>

        {country.types.map((type) => {
          const docs = lines(tr(type.required_documents, locale));
          return (
            <section key={type.id} className="rounded-[var(--radius-card)] border border-line bg-paper p-6 sm:p-8">
              <p className="eyebrow">{dict.visa.categories[type.category as keyof typeof dict.visa.categories]}</p>
              <h2 className="mt-2 font-display text-3xl">{tr(type.name, locale)}</h2>
              {tr(type.description, locale) ? <p className="mt-3 text-ink-muted">{tr(type.description, locale)}</p> : null}
              <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                {docs.length ? (
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <FileCheck2 className="size-4 text-gold" aria-hidden /> {dict.visa.requiredDocuments}
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {docs.map((d) => (
                        <li key={d} className="flex gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <dl className="space-y-4 text-sm">
                  {tr(type.processing_time, locale) ? (
                    <div className="rounded-xl bg-sand p-4">
                      <dt className="flex items-center gap-2 font-semibold">
                        <Clock className="size-4 text-gold" aria-hidden /> {dict.visa.processingTime}
                      </dt>
                      <dd className="mt-1 text-ink-soft">{tr(type.processing_time, locale)}</dd>
                    </div>
                  ) : null}
                  {tr(type.fee_info, locale) ? (
                    <div className="rounded-xl bg-sand p-4">
                      <dt className="flex items-center gap-2 font-semibold">
                        <Wallet className="size-4 text-gold" aria-hidden /> {dict.visa.fees}
                      </dt>
                      <dd className="mt-1 text-ink-soft">{tr(type.fee_info, locale)}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <ButtonLink href={`/${locale}/visa/request?country=${country.slug}&type=${type.id}`} variant="outline" className="mt-6">
                {dict.visa.requestHelp}
              </ButtonLink>
            </section>
          );
        })}
      </div>
    </>
  );
}
