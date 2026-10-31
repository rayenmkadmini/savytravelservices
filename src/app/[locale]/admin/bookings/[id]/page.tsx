import { ArrowLeft, FileText, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatusForm, ManualPaymentForm, NoteForm, PaymentLinkForm, PaymentRowActions } from "@/components/admin/booking-panels";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { WhatsappIcon } from "@/components/site/social-icons";
import { StatusBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { withSignedUrls } from "@/lib/data/account";
import { whatsappLink } from "@/lib/data/settings";
import { formatDate, formatDateTime, formatMoney, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { isProviderConfigured } from "@/lib/payments/providers";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBookingPage({ params }: PageProps<"/[locale]/admin/bookings/[id]">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, package:travel_packages(slug, title), hotel:hotels(slug, name, city), room:hotel_rooms(name), customer:profiles(id, full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!booking) notFound();
  const [passengers, documents, history, payments, notes] = await Promise.all([
    supabase.from("booking_passengers").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("booking_documents").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("booking_status_history").select("*, actor:profiles(full_name)").eq("booking_id", id).order("created_at"),
    supabase.from("payments").select("*").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("booking_notes").select("*, author:profiles(full_name)").eq("booking_id", id).order("created_at", { ascending: false }),
  ]);
  const docs = await withSignedUrls(documents.data ?? []);
  const pkg = booking.package as { slug: string; title: unknown } | null;
  const hotel = booking.hotel as { slug: string; name: string; city: string } | null;
  const room = booking.room as { name: unknown } | null;
  const selection = pkg ? tr(pkg.title, locale) : hotel ? `${hotel.name}, ${hotel.city}${room ? ` — ${tr(room.name, locale)}` : ""}` : null;
  const wa = whatsappLink(booking.contact_phone, `${booking.reference}`);
  const paidTotal = (payments.data ?? []).filter((p) => p.status === "completed" && p.currency === booking.quoted_currency).reduce((s, p) => s + Number(p.amount), 0);
  const remaining = booking.quoted_amount !== null ? Math.max(0, Number(booking.quoted_amount) - paidTotal) : 0;

  const rows: [string, string | null][] = [
    [dict.booking.service, dict.booking.services[booking.service_type]],
    [dict.booking.selected, selection],
    [dict.booking.origin, booking.origin],
    [dict.booking.destination, booking.destination],
    [dict.booking.departureDate, booking.departure_date ? formatDate(booking.departure_date, locale) : null],
    [dict.booking.returnDate, booking.return_date ? formatDate(booking.return_date, locale) : null],
    [dict.common.travelers, `${booking.adults} / ${booking.children} / ${booking.infants}`],
    [dict.common.rooms, booking.rooms ? String(booking.rooms) : null],
    [dict.booking.travelClass, booking.travel_class ? dict.search.classes[booking.travel_class] : null],
    [dict.booking.budget, booking.budget !== null ? formatMoney(Number(booking.budget), booking.budget_currency ?? "TND", locale) : null],
    [dict.booking.notes, booking.notes],
    [dict.admin.fields.locale, booking.locale.toUpperCase()],
  ];

  return (
    <>
      <Link href={`/${locale}/admin/bookings`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {dict.admin.bookings}
      </Link>
      <AdminPageHeader
        title={booking.reference}
        lead={`${dict.admin.created} ${formatDateTime(booking.created_at, locale)}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={booking.status} label={dict.status.booking[booking.status]} />
            <StatusBadge status={booking.payment_status} label={dict.status.payment[booking.payment_status]} />
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Panel title={dict.admin.booking.contact}>
            <p className="font-semibold">{booking.contact_name}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <a href={`mailto:${booking.contact_email}`} className="inline-flex items-center gap-1.5 hover:underline">
                <Mail className="size-4 text-gold" aria-hidden /> {booking.contact_email}
              </a>
              <a href={`tel:${booking.contact_phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:underline" dir="ltr">
                <Phone className="size-4 text-gold" aria-hidden /> {booking.contact_phone}
              </a>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#1f9d55] hover:underline">
                  <WhatsappIcon className="size-4" /> WhatsApp
                </a>
              ) : null}
            </div>
          </Panel>

          <Panel title={dict.admin.booking.trip}>
            <dl className="divide-y divide-line text-sm">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-2 sm:grid-cols-[11rem_1fr]">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="whitespace-pre-line">{v}</dd>
                  </div>
                ))}
            </dl>
            {passengers.data?.length ? (
              <div className="mt-5">
                <h3 className="font-semibold">{dict.account.passengers}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {passengers.data.map((p) => (
                    <li key={p.id}>
                      {p.full_name} · {dict.booking.passengerTypes[p.passenger_type]}
                      {p.date_of_birth ? ` · ${formatDate(p.date_of_birth, locale)}` : ""}
                      {p.nationality ? ` · ${p.nationality}` : ""}
                      {p.passport_number ? ` · ${p.passport_number}` : ""}
                      {p.passport_expiry ? ` (${formatDate(p.passport_expiry, locale)})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          <Panel title={dict.account.documents}>
            {docs.length ? (
              <ul className="space-y-2">
                {docs.map((d) => (
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
              <p className="text-sm text-ink-muted">{dict.account.noDocuments}</p>
            )}
          </Panel>

          <Panel title={dict.admin.booking.payments}>
            {payments.data?.length ? (
              <ul className="mb-5 divide-y divide-line text-sm">
                {payments.data.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="font-semibold">{formatMoney(Number(p.amount), p.currency, locale)}</span>
                    <span className="text-ink-muted capitalize">{p.provider.replace("_", " ")}</span>
                    <StatusBadge status={p.status === "completed" ? "paid" : p.status} label={dict.status.paymentRecord[p.status]} />
                    <span className="text-xs text-ink-muted">{formatDateTime(p.verified_at ?? p.created_at, locale)}</span>
                    {p.note ? <span className="w-full text-xs text-ink-muted">{p.note}</span> : null}
                    <span className="ms-auto">
                      <PaymentRowActions id={p.id} url={p.payment_url} online={p.provider === "konnect" || p.provider === "flouci"} pending={p.status === "pending"} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {booking.status === "confirmed" && booking.payment_status !== "paid" ? (
              <div className="space-y-5">
                {booking.quoted_currency === "TND" ? (
                  <PaymentLinkForm
                    bookingId={booking.id}
                    amount={remaining ? remaining.toFixed(3) : ""}
                    providers={{ konnect: isProviderConfigured("konnect"), flouci: isProviderConfigured("flouci") }}
                  />
                ) : null}
                <div className="border-t border-line pt-4">
                  <ManualPaymentForm bookingId={booking.id} amount={remaining ? remaining.toFixed(3) : ""} currency={booking.quoted_currency} />
                </div>
              </div>
            ) : booking.status !== "confirmed" ? (
              <p className="text-sm text-ink-muted">{dict.admin.booking.needsQuote}</p>
            ) : null}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title={dict.admin.booking.manage}>
            <BookingStatusForm
              bookingId={booking.id}
              status={booking.status}
              quotedAmount={booking.quoted_amount !== null ? String(booking.quoted_amount) : ""}
              quotedCurrency={booking.quoted_currency}
              message={booking.customer_message ?? ""}
            />
          </Panel>
          <Panel title={dict.admin.booking.internalNotes}>
            <NoteForm target={{ bookingId: booking.id }} />
            <ul className="mt-4 space-y-3">
              {(notes.data ?? []).map((n) => (
                <li key={n.id} className="rounded-xl bg-sand p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {(n.author as { full_name: string } | null)?.full_name} · {formatDateTime(n.created_at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={dict.account.timeline}>
            <ol className="space-y-3 border-s border-line ps-4 text-sm">
              {(history.data ?? []).map((h) => (
                <li key={h.id}>
                  <p className="font-semibold">{dict.status.booking[h.to_status]}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(h.created_at, locale)}
                    {(h.actor as { full_name: string } | null)?.full_name ? ` · ${(h.actor as { full_name: string }).full_name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </>
  );
}
