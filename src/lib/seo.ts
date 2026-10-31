import type { Metadata } from "next";
import type { SiteSettings } from "./data/settings";
import { locales, openGraphLocales, type Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries/fr";
import { siteUrl } from "./utils";

type PageMeta = {
  locale: Locale;
  dict: Dictionary;
  /** Path after the locale prefix, e.g. "/packages/istanbul". Use "" for home. */
  path: string;
  title?: string;
  description?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
};

export function pageMetadata({ locale, dict, path, title, description, image, noIndex, type = "website" }: PageMeta): Metadata {
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, siteUrl(`/${l}${path}`)]));
  languages["x-default"] = siteUrl(`/fr${path}`);
  const fullTitle = title ? `${title} | ${dict.meta.siteName}` : dict.meta.title;
  const desc = description?.slice(0, 300) || dict.meta.description;
  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: siteUrl(`/${locale}${path}`), languages },
    openGraph: {
      type,
      siteName: dict.meta.siteName,
      title: fullTitle,
      description: desc,
      url: siteUrl(`/${locale}${path}`),
      locale: openGraphLocales[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => openGraphLocales[l]),
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: fullTitle, description: desc },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

/** schema.org TravelAgency, built from the admin-managed contact settings. */
export function travelAgencyJsonLd(settings: SiteSettings, dict: Dictionary, locale: Locale) {
  const c = settings.contact;
  const sameAs = Object.values(settings.social).filter((v) => typeof v === "string" && v.startsWith("http"));
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": siteUrl("/#agency"),
    name: "SAVY Travel Services",
    alternateName: dict.meta.siteName,
    url: siteUrl(`/${locale}`),
    description: dict.meta.description,
    email: c.email || undefined,
    telephone: c.phone || undefined,
    faxNumber: c.fax || undefined,
    logo: settings.brand.logo_url || siteUrl("/brand/savy-logo.png"),
    image: settings.brand.og_image_url || siteUrl("/brand/savy-og.jpg"),
    address: c.address
      ? { "@type": "PostalAddress", streetAddress: c.address, addressLocality: "Tataouine", postalCode: "3200", addressCountry: "TN" }
      : undefined,
    areaServed: ["TN", "Worldwide"],
    availableLanguage: ["fr", "ar", "en"],
    currenciesAccepted: "TND",
    paymentAccepted: "Cash, Bank transfer, Konnect, Flouci",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:30",
        closes: "18:00",
      },
    ],
    founder: c.manager ? { "@type": "Person", name: c.manager } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
