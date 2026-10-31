import { Clock, Mail, MapPin, Phone, Printer, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero } from "@/components/site/page-hero";
import { WhatsappIcon } from "@/components/site/social-icons";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteSettings, whatsappLink } from "@/lib/data/settings";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { jsonLd, pageMetadata, travelAgencyJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/contact", title: dict.contact.title, description: dict.contact.lead });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [settings, profile] = await Promise.all([getSiteSettings(), getCurrentProfile()]);
  const c = settings.contact;
  const wa = whatsappLink(c.whatsapp);
  const mapSrc = c.map_query ? `https://www.google.com/maps?q=${encodeURIComponent(c.map_query)}&output=embed` : null;

  const items = [
    { Icon: MapPin, label: dict.contact.address, value: c.address },
    { Icon: Phone, label: dict.contact.phoneLabel, value: c.phone, href: c.phone ? `tel:${c.phone.replace(/\s/g, "")}` : undefined, ltr: true },
    { Icon: Printer, label: dict.contact.fax, value: c.fax, ltr: true },
    { Icon: Mail, label: dict.contact.emailLabel, value: c.email, href: c.email ? `mailto:${c.email}` : undefined },
    { Icon: Clock, label: dict.contact.hours, value: tr(c.hours, locale) },
    { Icon: UserRound, label: dict.contact.manager, value: c.manager },
  ].filter((i) => i.value);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(travelAgencyJsonLd(settings, dict, locale)) }} />
      <PageHero eyebrow={dict.nav.contact} title={dict.contact.title} lead={dict.contact.lead} />
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr]">
        <aside className="space-y-6">
          <ul className="space-y-3">
            {items.map(({ Icon, label, value, href, ltr }) => (
              <li key={label} className="flex gap-4 rounded-2xl border border-line bg-paper p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-strong">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
                  {href ? (
                    <a href={href} className="mt-0.5 block font-medium break-words hover:text-gold-strong" dir={ltr ? "ltr" : undefined}>
                      {value}
                    </a>
                  ) : (
                    <p className="mt-0.5 font-medium" dir={ltr ? "ltr" : undefined}>
                      {value}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {wa ? (
            <ButtonLink href={wa} target="_blank" rel="noopener noreferrer" className="w-full bg-[#1f9d55] hover:bg-[#1a8549]" size="lg">
              <WhatsappIcon className="size-5" /> {dict.common.sendWhatsApp}
            </ButtonLink>
          ) : null}
          {mapSrc ? (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
              <iframe
                title={dict.contact.mapTitle}
                src={mapSrc}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </aside>
        <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-soft sm:p-10">
          <h2 className="font-display text-3xl">{dict.contact.formTitle}</h2>
          <div className="mt-6">
            <ContactForm defaults={profile ? { full_name: profile.full_name, email: profile.email, phone: profile.phone ?? "" } : undefined} />
          </div>
        </section>
      </div>
    </>
  );
}
