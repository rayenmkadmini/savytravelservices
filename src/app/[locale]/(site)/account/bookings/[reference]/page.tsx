import { ArrowLeft, CheckCircle2, CreditCard, FileText, Landmark, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelRequestButton, UploadMoreDocuments } from "@/components/account/account-actions";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getMyBooking } from "@/lib/data/account";
import { getSiteSettings } from "@/lib/data/settings";
import { formatDate, formatDateTime, formatMoney, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { fmt } from "@/lib/utils";

export default async function MyBookingPage({ params, searchParams }: PageProps<"/[locale]/account/bookings/[reference]">) {
  const locale = await resolveLocale(params);
  const { reference } = await params;
  const sp = await searchParams;
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account/bookings/${reference}`);
  const [data, settings] = await Promise.all([getMyBooking(profile.id, reference), getSiteSettings()]);
  if (!data) notFound();
  const { booking, passengers, documents, history, payments } = data;

  const canCancel = booking.status === "pending" || booking.status === "under_review";
  const canUpload = ["pending", "under_review", "confirmed"].includes(booking.status);
  const openPayment = payments.find((p) => p.status === "pending" && p.payment_url && (p.provider === "konnect" || p.provider === "flouci"));
  const bankDetails = settings.payments.bank_transfer_enabled ? tr(settings.payments.bank_transfer_details, locale) : "";
  const showPayment = booking.status === "confirmed" && booking.payment_status !== "paid" && booking.payment_status !== "refunded";
  const selection = booking.package
    ? tr(booking.package.title, locale)
    : booking.hotel
      ? `${booking.hotel.name}, ${booking.hotel.city}${booking.room ? ` — ${tr(booking.room.name, locale)}` : ""}`
      : booking.destination;

  const rows: [string, string | null][] = [
    [dict.booking.service, dict.booking.services[booking.service_type]],
    [dict.booking.selected, selection],
    [dict.booking.origin, booking.origin],
    [dict.booking.departureDate, booking.departure_date ? formatDate(booking.departure_date, locale) : null],
    [dict.booking.returnDate, booking.return_date ? formatDate(booking.return_date, locale) : null],
    [
      dict.common.travelers,
      [
        `${booking.adults} ${dict.common.adults.toLowerCase()}`,
        booking.children ? `${booking.children} ${dict.common.children.toLowerCase()}` : "",
        booking.infants ? `${booking.infants} ${dict.common.infants.toLowerCase()}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    ],
    [dict.common.rooms, booking.rooms ? String(booking.rooms) : null],
    [dict.booking.travelClass, booking.travel_class ? dict.search.classes[booking.travel_class] : null],
    [dict.booking.budget, booking.budget !== null ? formatMoney(Number(booking.budget), booking.budget_currency ?? "TND", locale) : null],
    [dict.booking.notes, booking.notes],
  ];

  return (
    <div className="space-y-8">
      <Link href={`/${locale}/account/bookings`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {dict.account.bookings}
      </Link>

      {sp.new ? (
        <div role="status" className="flex items-start gap-3 rounded-[var(--radius-card)] border border-success/20 bg-success-soft p-5 text-success">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{dict.booking.successTitle}</p>
            <p className="mt-1 text-sm">{fmt(dict.booking.successText, { reference: booking.reference })}</p>
            <p className="mt-1 text-sm">{dict.booking.noPaymentNote}</p>
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wider text-ink-muted" dir="ltr">
            {booking.reference}
          </p>
          <h1 className="mt-1 font-display text-4xl">{selection || dict.booking.services[booking.service_type]}</h1>
          <p className="mt-1 text-sm text-ink-muted">{fmt(dict.account.submittedOn, { date: formatDate(booking.created_at, locale) })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} label={dict.status.booking[booking.status]} />
          {booking.status === "confirmed" ? <StatusBadge status={booking.payment_status} label={dict.status.payment[booking.payment_status]} /> : null}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Quote & agency message */}
          <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">{dict.account.quote}</h2>
            {booking.quoted_amount !== null ? (
              <p className="mt-2 font-display text-4xl font-semibold">{formatMoney(Number(booking.quoted_amount), booking.quoted_currency, locale)}</p>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{dict.account.quoteWaiting}</p>
            )}
            {booking.customer_message ? (
              <div className="mt-5 rounded-xl bg-sand p-4">
                <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-ink-muted uppercase">
                  <MessageSquareQuote className="size-4 text-gold" aria-hidden /> {dict.account.agencyMessage}
                </p>
                <p className="mt-2 text-sm whitespace-pre-line">{booking.customer_message}</p>
              </div>
            ) : null}
          </section>

          {showPayment ? (
            <section className="rounded-[var(--radius-card)] border border-gold/30 bg-gold-soft/30 p-6">
              <h2 className="font-display text-2xl">{dict.account.payment}</h2>
              <div className="mt-4 space-y-4">
                {openPayment?.payment_url ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">{dict.account.paymentPending}</p>
                    <ButtonLink href={openPayment.payment_url} variant="accent" rel="noopener noreferrer">
                      <CreditCard aria-hidden />
                      {fmt(dict.account.payOnline, { provider: openPayment.provider === "konnect" ? "Konnect" : "Flouci" })}
                    </ButtonLink>
                  </div>
                ) : null}
                {bankDetails ? (
                  <div className="rounded-xl bg-paper p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Landmark className="size-4 text-gold" aria-hidden /> {dict.account.bankTransfer}
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-line text-ink-soft">{bankDetails}</p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {dict.common.reference}: <span dir="ltr">{booking.reference}</span>
                    </p>
                  </div>
                ) : null}
                <p className="text-xs text-ink-muted">{dict.account.payInAgency}</p>
              </div>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">{dict.account.details}</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[12rem_1fr]">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="whitespace-pre-line">{v}</dd>
                  </div>
                ))}
            </dl>
            {passengers.length ? (
              <>
                <h3 className="mt-6 font-display text-xl">{dict.account.passengers}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {passengers.map((p) => (
                    <li key={p.id}>
                      {p.full_name} · {dict.booking.passengerTypes[p.passenger_type]}
                      {p.nationality ? ` · ${p.nationality}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">{dict.account.documents}</h2>
            {documents.length ? (
              <ul className="mt-4 space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                    <FileText className="size-4 text-ink-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{d.file_name}</span>
                    <span className="text-xs text-ink-muted">{dict.booking.documentKinds[d.kind as keyof typeof dict.booking.documentKinds]}</span>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold-strong hover:underline">
                        {dict.account.download}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{dict.account.noDocuments}</p>
            )}
            {canUpload ? (
              <div className="mt-5">
                <UploadMoreDocuments userId={profile.id} target={{ bookingId: booking.id }} />
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
            <h2 className="font-display text-2xl">{dict.account.timeline}</h2>
            <ol className="mt-4 space-y-4 border-s border-line ps-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -start-[1.6rem] top-1 size-2.5 rounded-full bg-gold ring-4 ring-paper" aria-hidden />
                  <p className="text-sm font-semibold">{dict.status.booking[h.to_status]}</p>
                  <time className="text-xs text-ink-muted">{formatDateTime(h.created_at, locale)}</time>
                </li>
              ))}
            </ol>
          </section>

          {payments.length ? (
            <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
              <h2 className="font-display text-2xl">{dict.account.paymentsHistory}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span>
                      {formatMoney(Number(p.amount), p.currency, locale)}
                      <span className="block text-xs text-ink-muted capitalize">{p.provider.replace("_", " ")}</span>
                    </span>
                    <StatusBadge status={p.status === "completed" ? "paid" : p.status} label={dict.status.paymentRecord[p.status]} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canCancel ? <CancelRequestButton reference={booking.reference} kind="booking" /> : null}
        </aside>
      </div>
    </div>
  );
}
