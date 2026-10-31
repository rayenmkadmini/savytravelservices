export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

/** BCP-47 tags used for Intl formatting (Tunisian conventions). */
export const intlLocales: Record<Locale, string> = {
  fr: "fr-TN",
  en: "en-GB",
  ar: "ar-TN",
};

export const openGraphLocales: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_GB",
  ar: "ar_TN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export const LOCALE_COOKIE = "savy_locale";
export const CURRENCY_COOKIE = "savy_currency";

export const currencies = ["TND", "EUR", "USD"] as const;
export type Currency = (typeof currencies)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (currencies as readonly string[]).includes(value);
}
