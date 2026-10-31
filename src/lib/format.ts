import { intlLocales, type Currency, type Locale } from "./i18n/config";

/** Multilingual JSON value stored in the database: {"fr": "...", "en": "...", "ar": "..."} */
export type I18nText = Partial<Record<Locale, string>> | null | undefined;

/** Pick the best translation, falling back to French then any available value. */
export function tr(value: unknown, locale: Locale): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const v = value as Record<string, unknown>;
  for (const key of [locale, "fr", "en", "ar"]) {
    const text = v[key];
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "";
}

export function formatMoney(amount: number, currency: Currency | string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(intlLocales[locale], {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "TND" ? 3 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value.length === 10 ? `${value}T12:00:00` : value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocales[locale], { timeZone: "Africa/Tunis", hourCycle: "h23", ...options }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale): string {
  return formatDate(value, locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Today's date in Tunis as YYYY-MM-DD (for date input `min`). */
export function todayInTunis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());
}

export function formatDuration(isoDuration: string, locale: Locale): string {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(isoDuration);
  if (!m) return isoDuration;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const hl = locale === "ar" ? "س" : "h";
  return `${h}${hl}${min ? String(min).padStart(2, "0") : ""}`;
}
