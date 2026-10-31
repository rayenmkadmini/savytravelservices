import { ArrowUpRight, ShieldAlert, Stamp } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listVisaCountries } from "@/lib/data/catalog";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/visa">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/visa", title: dict.visa.title, description: dict.visa.lead });
}

function flag(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export default async function VisaPage({ params }: PageProps<"/[locale]/visa">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const countries = await listVisaCountries();

  return (
    <>
      <PageHero eyebrow={dict.nav.visa} title={dict.visa.title} lead={dict.visa.lead}>
        <ButtonLink href={`/${locale}/visa/request`} variant="accent" size="lg" className="mt-8">
          {dict.visa.requestHelp}
        </ButtonLink>
      </PageHero>

      <div className="container-page space-y-16 py-14">
        <div role="note" className="flex gap-3 rounded-[var(--radius-card)] border border-warning/25 bg-warning-soft p-5 text-sm text-warning">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>{dict.visa.disclaimer}</p>
        </div>

        <ol className="grid gap-5 md:grid-cols-3">
          {dict.visa.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.06} className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
              <span className="font-display text-5xl text-gold">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-3 font-display text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>

        <section>
          <SectionHeading title={dict.visa.countriesTitle} lead={dict.visa.infoNote} />
          {countries.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c) => (
                <Link
                  key={c.id}
                  href={`/${locale}/visa/${c.slug}`}
                  className="group flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-sand-deep">
                    {c.image_url ? (
                      <Image src={c.image_url} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-4xl" aria-hidden>
                        {flag(c.iso_code)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl">
                      <span aria-hidden>{flag(c.iso_code)} </span>
                      {tr(c.name, locale)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{tr(c.overview, locale)}</p>
                  </div>
                  <ArrowUpRight className="size-5 text-ink-muted transition-colors group-hover:text-gold rtl:-scale-x-100" aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Stamp} text={dict.visa.noCountries} />
          )}
        </section>
      </div>
    </>
  );
}
