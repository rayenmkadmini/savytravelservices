import { ChevronRight, Luggage } from "lucide-react";
import Link from "next/link";
import type { BookingSummary } from "@/lib/data/account";
import { formatDate, formatMoney, tr } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { fmt } from "@/lib/utils";
import { StatusBadge } from "../ui/badge";
import { ButtonLink } from "../ui/button";
import { EmptyState } from "../ui/empty-state";

export function BookingList({ bookings, locale, dict }: { bookings: BookingSummary[]; locale: Locale; dict: Dictionary }) {
  if (!bookings.length) {
    return (
      <EmptyState
        icon={Luggage}
        text={dict.account.noBookings}
        action={
          <ButtonLink href={`/${locale}/booking`} variant="accent">
            {dict.account.newRequest}
          </ButtonLink>
        }
      />
    );
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link href={`/${locale}/account/bookings/${b.reference}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-sand/60">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wider text-ink-muted" dir="ltr">
                {b.reference}
              </p>
              <p className="mt-0.5 truncate font-medium">
                {dict.booking.services[b.service_type]}
                {(() => {
                  const label = b.package ? tr(b.package.title, locale) : b.hotel ? `${b.hotel.name}, ${b.hotel.city}` : b.destination;
                  return label ? ` · ${label}` : "";
                })()}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {b.departure_date ? formatDate(b.departure_date, locale) : fmt(dict.account.submittedOn, { date: formatDate(b.created_at, locale) })}
              </p>
            </div>
            {b.quoted_amount !== null ? <span className="text-sm font-semibold">{formatMoney(Number(b.quoted_amount), b.quoted_currency, locale)}</span> : null}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={b.status} label={dict.status.booking[b.status]} />
              {b.status === "confirmed" ? <StatusBadge status={b.payment_status} label={dict.status.payment[b.payment_status]} /> : null}
            </div>
            <ChevronRight className="size-4 text-ink-muted rtl:-scale-x-100" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
