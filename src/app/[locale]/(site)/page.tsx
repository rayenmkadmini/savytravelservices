import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Briefcase,
  Compass,
  Headset,
  MessagesSquare,
  Plane,
  ShieldCheck,
  Sparkles,
  Stamp,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArticleCard, DestinationCard, PackageCard, TestimonialCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { SearchPanel } from "@/components/site/search-panel";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listArticles, listDestinations, listPackages, listTestimonials } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { getSiteSettings } from "@/lib/data/settings";
import { todayInTunis, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { jsonLd, pageMetadata, travelAgencyJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const settings = await getSiteSettings();
  return pageMetadata({ locale, dict: getDictionary(locale), path: "", image: settings.brand.og_image_url || "/brand/savy-og.jpg" });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [settings, currency, destinations, featuredPackages, testimonials, articles] = await Promise.all([
    getSiteSettings(),
    getCurrencyContext(),
    listDestinations(),
    listPackages({ limit: 6 }),
    listTestimonials(3),
    listArticles(3),
  ]);

  const featuredDestinations = (destinations.filter((d) => d.is_featured).length >= 4
    ? destinations.filter((d) => d.is_featured)
    : destinations
  ).slice(0, 7);
  const heroTitle = tr(settings.hero.title, locale) || dict.meta.title;
  const heroSubtitle = tr(settings.hero.subtitle, locale) || dict.meta.description;

  const services = [
    { key: "flights", Icon: Plane, href: "flights" },
    { key: "hotels", Icon: BedDouble, href: "hotels" },
    { key: "packages", Icon: Compass, href: "packages" },
    { key: "visa", Icon: Stamp, href: "visa" },
    { key: "tours", Icon: Sparkles, href: "booking?service=tour" },
    { key: "business", Icon: Briefcase, href: "booking?service=business" },
    { key: "custom", Icon: BadgeCheck, href: "booking?service=custom" },
    { key: "consultation", Icon: MessagesSquare, href: "contact" },
  ] as const;
  const whyIcons = [Headset, ShieldCheck, Wallet, MessagesSquare];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(travelAgencyJsonLd(settings, dict, locale)) }} />

      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
        {settings.hero.image_url ? (
          <Image
            src={settings.hero.image_url}
            alt=""
            fill
            preload
            sizes="100vw"
            className="-z-20 animate-[fade-up_1.6s_ease-out_both] object-cover"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(15_27_45/0.55)_0%,rgb(15_27_45/0.15)_35%,rgb(15_27_45/0.35)_65%,rgb(15_27_45/0.92)_100%)]" />
        <div className="container-page flex flex-1 flex-col justify-end pt-32 pb-10 sm:pb-14">
          <div className="max-w-4xl animate-fade-up">
            <p className="eyebrow !text-gold-soft">{dict.home.eyebrow}</p>
            <h1 className="mt-5 font-display text-[2.9rem] leading-[0.98] font-semibold sm:text-7xl lg:text-[5.6rem]">{heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/${locale}/booking`} variant="accent" size="lg">
                {dict.home.primaryCta}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden />
              </ButtonLink>
              <ButtonLink href={`/${locale}/packages`} variant="glass" size="lg">
                {dict.home.secondaryCta}
              </ButtonLink>
            </div>
          </div>
          <div className="mt-12 animate-fade-up [animation-delay:200ms]">
            <SearchPanel destinations={destinations.map((d) => ({ slug: d.slug, name: tr(d.name, locale) }))} today={todayInTunis()} />
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              {[dict.home.trust1, dict.home.trust2, dict.home.trust3].map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <BadgeCheck className="size-4 text-gold" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {settings.hero.image_credit ? (
          <p className="absolute end-3 bottom-2 text-[0.62rem] text-white/45">{settings.hero.image_credit}</p>
        ) : null}
      </section>

      {/* Destinations */}
      {featuredDestinations.length ? (
        <section className="py-20 sm:py-28">
          <div className="container-page">
            <Reveal>
              <SectionHeading
                eyebrow={dict.home.destinationsEyebrow}
                title={dict.home.destinationsTitle}
                lead={dict.home.destinationsLead}
                action={
                  <ButtonLink href={`/${locale}/destinations`} variant="outline">
                    {dict.common.viewAll}
                  </ButtonLink>
                }
              />
            </Reveal>
            <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
              {featuredDestinations.map((d, i) => (
                <Reveal
                  key={d.id}
                  delay={i * 0.05}
                  className={i === 0 ? "w-[78%] shrink-0 snap-start sm:w-[45%] lg:col-span-2 lg:row-span-2 lg:w-auto" : "w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-auto"}
                >
                  <DestinationCard destination={d} locale={locale} dict={dict} className={i === 0 ? "lg:aspect-auto lg:h-full" : ""} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Services */}
      <section className="border-y border-line bg-paper py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow={dict.home.servicesEyebrow} title={dict.home.servicesTitle} />
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ key, Icon, href }, i) => (
              <Reveal key={key} delay={(i % 4) * 0.05} className="bg-paper">
                <Link href={`/${locale}/${href}`} className="group flex h-full flex-col p-7 transition-colors hover:bg-sand/60">
                  <span className="grid size-12 place-items-center rounded-full bg-sand text-gold-strong transition-colors group-hover:bg-gold group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-2xl">{dict.home.services[key].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{dict.home.services[key].text}</p>
                  <ArrowRight className="mt-5 size-4 text-gold opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow={dict.home.packagesEyebrow}
              title={dict.home.packagesTitle}
              lead={dict.home.packagesLead}
              action={
                featuredPackages.length ? (
                  <ButtonLink href={`/${locale}/packages`} variant="outline">
                    {dict.common.viewAll}
                  </ButtonLink>
                ) : undefined
              }
            />
          </Reveal>
          {featuredPackages.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredPackages.map((pkg, i) => (
                <Reveal key={pkg.id} delay={(i % 3) * 0.06}>
                  <PackageCard pkg={pkg} locale={locale} dict={dict} currency={currency} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              text={dict.home.emptyPackages}
              action={
                <ButtonLink href={`/${locale}/booking?service=custom`} variant="accent">
                  {dict.home.ctaButton}
                </ButtonLink>
              }
            />
          )}
        </div>
      </section>

      {/* Why SAVY */}
      <section className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28">
        <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(circle_at_20%_20%,var(--color-gold)_0,transparent_45%),radial-gradient(circle_at_80%_70%,var(--color-sea)_0,transparent_40%)]" />
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <Reveal>
            <p className="eyebrow !text-gold-soft">{dict.home.whyEyebrow}</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.08] sm:text-6xl">{dict.home.whyTitle}</h2>
            <ButtonLink href={`/${locale}/about`} variant="glass" className="mt-8">
              {dict.nav.about}
            </ButtonLink>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {dict.home.why.map((item, i) => {
              const Icon = whyIcons[i] ?? BadgeCheck;
              return (
                <Reveal key={item.title} delay={i * 0.07} className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                  <Icon className="size-6 text-gold" aria-hidden />
                  <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{item.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials (published, moderated reviews only) */}
      {testimonials.length ? (
        <section className="bg-ink-soft py-20 text-white sm:py-24">
          <div className="container-page">
            <SectionHeading light eyebrow={dict.home.testimonialsEyebrow} title={dict.home.testimonialsTitle} />
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 0.06}>
                  <TestimonialCard testimonial={t} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Inspiration */}
      {articles.length ? (
        <section className="py-20 sm:py-28">
          <div className="container-page">
            <SectionHeading
              eyebrow={dict.home.inspirationEyebrow}
              title={dict.home.inspirationTitle}
              action={
                <ButtonLink href={`/${locale}/inspiration`} variant="outline">
                  {dict.common.viewAll}
                </ButtonLink>
              }
            />
            <div className="grid gap-8 md:grid-cols-3">
              {articles.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.06}>
                  <ArticleCard article={a} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Call to action */}
      <section className="pb-20 sm:pb-28">
        <div className="container-page">
          <Reveal className="relative isolate overflow-hidden rounded-[2rem] bg-gold px-6 py-14 text-white sm:px-14 sm:py-20">
            <div className="absolute -end-20 -top-20 -z-10 size-80 rounded-full border-[40px] border-white/10" aria-hidden />
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">{dict.home.ctaTitle}</h2>
              <p className="mt-4 text-white/85">{dict.home.ctaText}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/${locale}/booking?service=custom`} variant="primary" size="lg">
                  {dict.home.ctaButton}
                </ButtonLink>
                <ButtonLink href={`/${locale}/contact`} variant="glass" size="lg">
                  {dict.nav.contact}
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
