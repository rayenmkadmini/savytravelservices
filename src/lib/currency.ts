import type { Currency } from "./i18n/config";

/** TND value of one unit of each currency (TND itself is 1). */
export type RateTable = Partial<Record<Currency, number>>;

export type CurrencyContext = {
  /** Currency the visitor chose for display. */
  display: Currency;
  /** Conversion is shown only when enabled by the agency AND fresh rates exist. */
  enabled: boolean;
  rates: RateTable;
  ratesDate: string | null;
};

/** Rates older than this are considered stale and conversion is hidden. */
export const MAX_RATE_AGE_DAYS = 7;

export function convert(amount: number, from: Currency, to: Currency, rates: RateTable): number | null {
  if (from === to) return amount;
  const fromTnd = from === "TND" ? 1 : rates[from];
  const toTnd = to === "TND" ? 1 : rates[to];
  if (!fromTnd || !toTnd) return null;
  const value = (amount * fromTnd) / toTnd;
  return Math.round(value * 100) / 100;
}

export function ratesAreFresh(fetchedAt: string | null, now = new Date()): boolean {
  if (!fetchedAt) return false;
  const age = now.getTime() - new Date(fetchedAt).getTime();
  return age >= 0 && age <= MAX_RATE_AGE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Parse a provider response where rates are expressed as "units of X per 1 TND"
 * (e.g. open.er-api.com/v6/latest/TND) into our TND-per-unit table.
 */
export function ratesFromTndBase(rates: Record<string, number>): RateTable {
  const table: RateTable = {};
  for (const code of ["EUR", "USD"] as const) {
    const perTnd = rates[code];
    if (typeof perTnd === "number" && perTnd > 0) {
      table[code] = Math.round((1 / perTnd) * 1_000_000) / 1_000_000;
    }
  }
  return table;
}
