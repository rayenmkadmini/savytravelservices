import Link from "next/link";
import { AdminPageHeader, DataTable } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { likePattern } from "@/lib/data/catalog";
import { formatDate, formatMoney } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, ServiceType } from "@/lib/supabase/types";
import { serviceTypes } from "@/lib/validation";

const STATUSES: BookingStatus[] = ["pending", "under_review", "confirmed", "rejected", "cancelled"];
const PAGE = 25;

export default async function AdminBookingsPage({ params, searchParams }: PageProps<"/[locale]/admin/bookings">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const service = serviceTypes.find((s) => s === sp.service) as ServiceType | undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("id, reference, service_type, status, payment_status, contact_name, contact_email, destination, departure_date, quoted_amount, quoted_currency, created_at", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_type", service);
  if (q) {
    const p = likePattern(q);
    query = query.or(`reference.ilike.${p},contact_name.ilike.${p},contact_email.ilike.${p},destination.ilike.${p}`);
  }
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (service) u.set("service", service);
    if (q) u.set("q", q);
    u.set("page", String(p));
    return `/${locale}/admin/bookings?${u}`;
  };

  return (
    <>
      <AdminPageHeader title={dict.admin.bookings} lead={`${count ?? 0}`} />
      <form method="get" className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem_auto]">
        <Input name="q" defaultValue={q} placeholder={dict.admin.filters.search} aria-label={dict.admin.filters.search} />
        <Select name="status" defaultValue={status ?? ""} aria-label={dict.admin.filters.status}>
          <option value="">{dict.admin.filters.status}: {dict.admin.filters.all}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {dict.status.booking[s]}
            </option>
          ))}
        </Select>
        <Select name="service" defaultValue={service ?? ""} aria-label={dict.admin.filters.service}>
          <option value="">{dict.admin.filters.service}: {dict.admin.filters.all}</option>
          {serviceTypes.map((s) => (
            <option key={s} value={s}>
              {dict.booking.services[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" className="h-11">
          {dict.common.search}
        </Button>
      </form>
      <DataTable
        head={[dict.common.reference, dict.admin.customer, dict.booking.service, dict.booking.departureDate, dict.account.quote, dict.common.status]}
        empty={data?.length ? false : dict.admin.empty}
      >
        {(data ?? []).map((b) => (
          <tr key={b.id} className="hover:bg-sand/40">
            <td className="px-4 py-3">
              <Link href={`/${locale}/admin/bookings/${b.id}`} className="font-semibold hover:underline" dir="ltr">
                {b.reference}
              </Link>
              <span className="block text-xs text-ink-muted">{formatDate(b.created_at, locale)}</span>
            </td>
            <td className="px-4 py-3">
              {b.contact_name}
              <span className="block text-xs text-ink-muted">{b.contact_email}</span>
            </td>
            <td className="px-4 py-3">
              {dict.booking.services[b.service_type]}
              {b.destination ? <span className="block text-xs text-ink-muted">{b.destination}</span> : null}
            </td>
            <td className="px-4 py-3">{b.departure_date ? formatDate(b.departure_date, locale) : "—"}</td>
            <td className="px-4 py-3">{b.quoted_amount !== null ? formatMoney(Number(b.quoted_amount), b.quoted_currency, locale) : "—"}</td>
            <td className="space-y-1 px-4 py-3">
              <StatusBadge status={b.status} label={dict.status.booking[b.status]} />
              {b.status === "confirmed" ? (
                <div>
                  <StatusBadge status={b.payment_status} label={dict.status.payment[b.payment_status]} />
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </DataTable>
      {pages > 1 ? (
        <nav className="mt-4 flex justify-center gap-1" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} aria-current={p === page ? "page" : undefined} className={`rounded-lg px-3 py-1.5 text-sm ${p === page ? "bg-ink text-sand" : "hover:bg-paper"}`}>
              {p}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
