import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { ratesAreFresh, type CurrencyContext, type RateTable } from "../currency";
import { CURRENCY_COOKIE, isCurrency } from "../i18n/config";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { getSiteSettings } from "./settings";

export const getCurrencyContext = cache(async (): Promise<CurrencyContext> => {
  const cookieStore = await cookies();
  const chosen = cookieStore.get(CURRENCY_COOKIE)?.value;
  const display = isCurrency(chosen) ? chosen : "TND";
  const base: CurrencyContext = { display: "TND", enabled: false, rates: {}, ratesDate: null };
  if (!isSupabaseConfigured()) return base;

  const settings = await getSiteSettings();
  if (!settings.currency.conversion_enabled) return base;

  const supabase = await createClient();
  const { data } = await supabase.from("exchange_rates").select("currency, tnd_per_unit, fetched_at");
  const rates: RateTable = { TND: 1 };
  let oldest: string | null = null;
  for (const row of data ?? []) {
    rates[row.currency] = Number(row.tnd_per_unit);
    if (!oldest || row.fetched_at < oldest) oldest = row.fetched_at;
  }
  if (!oldest || !ratesAreFresh(oldest)) return base;
  return { display, enabled: true, rates, ratesDate: oldest };
});
