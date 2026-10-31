import { convert, type CurrencyContext } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { Currency, Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { cn, fmt } from "@/lib/utils";

/**
 * Agency price (always shown in its own currency) plus an approximate
 * conversion when the agency enabled it and fresh rates exist.
 */
export function Price({
  amount,
  currency,
  ctx,
  locale,
  dict,
  label,
  className,
  size = "md",
}: {
  amount: number | string | null;
  currency: Currency;
  ctx: CurrencyContext;
  locale: Locale;
  dict: Dictionary;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (amount === null || amount === "") {
    return <span className={cn("text-sm font-medium text-ink-muted", className)}>{dict.common.priceOnRequest}</span>;
  }
  const value = Number(amount);
  const converted =
    ctx.enabled && ctx.display !== currency ? convert(value, currency, ctx.display, ctx.rates) : null;
  return (
    <span className={cn("inline-flex flex-col", className)}>
      {label ? <span className="text-[0.7rem] font-semibold tracking-wide text-ink-muted uppercase">{label}</span> : null}
      <span className={cn("font-display font-semibold text-ink", size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl")}>
        {formatMoney(value, currency, locale)}
      </span>
      {converted !== null ? (
        <span className="text-xs text-ink-muted" title={fmt(dict.common.currencyNote, { date: ctx.ratesDate?.slice(0, 10) ?? "" })}>
          {fmt(dict.common.approx, { amount: formatMoney(converted, ctx.display, locale) })}
        </span>
      ) : null}
    </span>
  );
}
