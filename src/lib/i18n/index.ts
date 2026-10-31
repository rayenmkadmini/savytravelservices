import "server-only";
import { notFound } from "next/navigation";
import ar from "./dictionaries/ar";
import en from "./dictionaries/en";
import fr, { type Dictionary } from "./dictionaries/fr";
import { isLocale, type Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { fr, en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Resolve the `[locale]` route param, 404-ing on unsupported values. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export type { Dictionary };
