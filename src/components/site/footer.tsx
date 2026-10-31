import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data/settings";
import { tr } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "./social-icons";

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  const c = settings.contact;
  const year = new Date().getFullYear();
  const social = [
    { href: settings.social.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: settings.social.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: settings.social.linkedin, Icon: LinkedinIcon, label: "LinkedIn" },
  ].filter((s) => s.href?.startsWith("http"));

  const columns = [
    {
      title: dict.footer.explore,
      links: [
        ["flights", dict.nav.flights],
        ["hotels", dict.nav.hotels],
        ["packages", dict.nav.packages],
        ["destinations", dict.nav.destinations],
        ["visa", dict.nav.visa],
      ],
    },
    {
      title: dict.footer.company,
      links: [
        ["about", dict.nav.about],
        ["inspiration", dict.nav.inspiration],
        ["contact", dict.nav.contact],
      ],
    },
    {
      title: dict.footer.support,
      links: [
        ["account", dict.nav.account],
        ["booking", dict.nav.bookTrip],
        ["privacy", dict.footer.privacy],
        ["terms", dict.footer.terms],
      ],
    },
  ];

  return (
    <footer className="bg-ink text-sand/80">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl text-white sm:text-4xl">{dict.newsletter.title}</h2>
            <p className="mt-2 max-w-lg text-sm text-sand/70">{dict.newsletter.text}</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo logoUrl={settings.brand.logo_url} tone="light" />
          <p className="mt-5 text-sm leading-relaxed text-sand/65">{dict.footer.tagline}</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {c.address ? (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <span>{c.address}</span>
              </li>
            ) : null}
            {c.phone ? (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-white" dir="ltr">
                  {c.phone}
                </a>
              </li>
            ) : null}
            {c.email ? (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <a href={`mailto:${c.email}`} className="hover:text-white">
                  {c.email}
                </a>
              </li>
            ) : null}
          </ul>
          {tr(c.hours, locale) ? <p className="mt-4 text-xs text-sand/50">{tr(c.hours, locale)}</p> : null}
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="eyebrow !text-gold">{col.title}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map(([slug, label]) => (
                <li key={slug}>
                  <Link href={`/${locale}/${slug}`} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-sand/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} SAVY Travel Services. {dict.footer.rights}
          </p>
          <p>{dict.footer.paymentNote}</p>
          {social.length ? (
            <div className="flex items-center gap-2" aria-label={dict.footer.follow}>
              {social.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-white/15 hover:border-gold hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
