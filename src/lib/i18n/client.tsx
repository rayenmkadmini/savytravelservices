"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries/fr";
import type { Locale } from "./config";

type I18nContextValue = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: I18nContextValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Resolve a dotted dictionary path ("auth.invalidCredentials"); unknown paths are returned as-is. */
export function lookup(dict: Dictionary, path: string | undefined): string {
  if (!path) return "";
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return path;
  }
  return typeof node === "string" ? node : path;
}

const fieldErrorAliases: Record<string, string> = {
  returnBeforeDeparture: "booking.errorDates",
  pastDate: "booking.errorPast",
  sameAirport: "flights.sameAirport",
};

/** Translate a field error key produced by server-side validation. */
export function fieldError(dict: Dictionary, key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (fieldErrorAliases[key]) return lookup(dict, fieldErrorAliases[key]);
  const text = (dict.errors as Record<string, string>)[key];
  return text ?? dict.errors.validation;
}
