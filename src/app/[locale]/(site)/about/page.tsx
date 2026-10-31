import { Eye, HeartHandshake, Scale, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, SectionHeading } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button";
import { listTeam } from "@/lib/data/catalog";
import { getSiteSettings } from "@/lib/data/settings";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

const IMAGE = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=75";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/about", title: dict.about.title, description: dict.about.lead, image: IMAGE });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [settings, team] = await Promise.all([getSiteSettings(), listTeam()]);
  const valueIcons = [Scale, HeartHandshake, Sparkles, ShieldCheck];

  return (
    <>
      <PageHero eyebrow={dict.about.licensed} title={dict.about.title} lead={dict.about.lead} image={IMAGE} />

      <section className="container-page grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <Reveal>
          <p className="eyebrow">{dict.about.story}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{dict.home.whyTitle}</h2>
        </Reveal>
        <Reveal delay={0.1} className="prose-savy text-lg">
          {tr(settings.about.story, locale)
            .split(/\n{2,}/)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </Reveal>
      </section>

      <section className="border-y border-line bg-paper py-20">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {[
            { Icon: Target, title: dict.about.mission, text: tr(settings.about.mission, locale) },
            { Icon: Eye, title: dict.about.vision, text: tr(settings.about.vision, locale) },
          ]
            .filter((b) => b.text)
            .map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08} className="rounded-[var(--radius-card)] bg-ink p-8 text-white sm:p-10">
                <Icon className="size-7 text-gold" aria-hidden />
                <h3 className="mt-5 font-display text-3xl">{title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-white/75">{text}</p>
              </Reveal>
            ))}
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading title={dict.about.valuesTitle} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dict.about.values.map((v, i) => {
            const Icon = valueIcons[i] ?? Sparkles;
            return (
              <Reveal key={v.title} delay={i * 0.06} className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
                <Icon className="size-6 text-gold" aria-hidden />
                <h3 className="mt-4 font-display text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{v.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {team.length ? (
        <section className="bg-sand-deep/50 py-20">
          <div className="container-page">
            <SectionHeading title={dict.about.team} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m) => (
                <Reveal key={m.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-sand-deep to-gold-soft">
                    {m.photo_url ? (
                      <Image src={m.photo_url} alt={m.full_name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-display text-6xl text-ink/30" aria-hidden>
                        {m.full_name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-2xl">{m.full_name}</h3>
                    <p className="text-sm font-medium text-gold-strong">{tr(m.position, locale)}</p>
                    {tr(m.bio, locale) ? <p className="mt-2 text-sm text-ink-muted">{tr(m.bio, locale)}</p> : null}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-page py-20">
        <SectionHeading title={dict.about.whyTitle} />
        <div className="grid gap-5 md:grid-cols-2">
          {dict.home.why.map((w) => (
            <div key={w.title} className="flex gap-4 rounded-2xl border border-line bg-paper p-5">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-gold" aria-hidden />
              <div>
                <h3 className="font-display text-xl">{w.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{w.text}</p>
              </div>
            </div>
          ))}
        </div>
        <ButtonLink href={`/${locale}/contact`} variant="accent" size="lg" className="mt-10">
          {dict.nav.contact}
        </ButtonLink>
      </section>
    </>
  );
}
