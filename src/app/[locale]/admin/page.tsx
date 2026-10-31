import { CalendarCheck2, Hourglass, Inbox, Luggage, Mail, Stamp, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, DataTable, Panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

type Stats = {
  customers: number;
  bookings_total: number;
  bookings_pending: number;
  bookings_confirmed: number;
  bookings_last_30: number;
  visa_open: number;
  messages_new: number;
  subscribers: number;
  revenue: Record<string, number>;
  revenue_30: Record<string, number>;
  by_service: Record<string, number>;
  monthly: { month: string; bookings: number }[];
};

export default async function AdminDashboard({ params }: PageProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const a = dict.admin;
  const supabase = await createClient();
  const [{ data: statsData }, { data: latest }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase
      .from("bookings")
      .select("id, reference, service_type, status, contact_name, destination, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const s = (statsData ?? {}) as Partial<Stats>;
  const money = (r?: Record<string, number>) =>
    r && Object.keys(r).length ? Object.entries(r).map(([c, v]) => formatMoney(Number(v), c, locale)).join(" · ") : formatMoney(0, "TND", locale);

  const cards = [
    { label: a.stats.customers, value: s.customers ?? 0, Icon: Users, href: "customers" },
    { label: a.stats.bookings, value: s.bookings_total ?? 0, Icon: Luggage, href: "bookings" },
    { label: a.stats.pending, value: s.bookings_pending ?? 0, Icon: Hourglass, href: "bookings?status=pending", tone: "text-warning" },
    { label: a.stats.confirmed, value: s.bookings_confirmed ?? 0, Icon: CalendarCheck2, href: "bookings?status=confirmed", tone: "text-success" },
    { label: a.stats.visaOpen, value: s.visa_open ?? 0, Icon: Stamp, href: "visa-requests" },
    { label: a.stats.messagesNew, value: s.messages_new ?? 0, Icon: Inbox, href: "messages" },
    { label: a.stats.subscribers, value: s.subscribers ?? 0, Icon: Mail, href: "newsletter" },
    { label: a.stats.last30, value: s.bookings_last_30 ?? 0, Icon: Luggage, href: "bookings" },
  ];
  const monthly = s.monthly ?? [];
  const maxMonth = Math.max(1, ...monthly.map((m) => m.bookings));
  const services = Object.entries(s.by_service ?? {}).sort((x, y) => y[1] - x[1]);
  const maxService = Math.max(1, ...services.map(([, n]) => n));

  return (
    <>
      <AdminPageHeader title={a.dashboard} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, Icon, href, tone }) => (
          <Link key={label} href={`/${locale}/admin/${href}`} className="rounded-2xl border border-line bg-paper p-5 transition-shadow hover:shadow-soft">
            <Icon className={`size-5 ${tone ?? "text-gold"}`} aria-hidden />
            <p className="mt-3 font-display text-4xl">{value}</p>
            <p className="text-sm text-ink-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title={a.stats.revenue}>
          <Wallet className="size-5 text-gold" aria-hidden />
          <p className="mt-3 font-display text-3xl">{money(s.revenue)}</p>
          <p className="mt-4 text-sm text-ink-muted">{a.stats.revenue30}</p>
          <p className="font-semibold">{money(s.revenue_30)}</p>
        </Panel>
        <Panel title={a.stats.monthly}>
          <div className="flex h-40 items-end gap-3" role="img" aria-label={monthly.map((m) => `${m.month}: ${m.bookings}`).join(", ")}>
            {monthly.length ? (
              monthly.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold">{m.bookings}</span>
                  <div className="w-full rounded-t-md bg-gold" style={{ height: `${(m.bookings / maxMonth) * 100}%`, minHeight: 4 }} />
                  <span className="text-[0.65rem] text-ink-muted">{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted">{a.empty}</p>
            )}
          </div>
        </Panel>
        <Panel title={a.stats.byService}>
          <ul className="space-y-3">
            {services.length ? (
              services.map(([service, n]) => (
                <li key={service}>
                  <div className="flex justify-between text-sm">
                    <span>{(dict.booking.services as Record<string, string>)[service] ?? service}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-sand">
                    <div className="h-2 rounded-full bg-sea" style={{ width: `${(n / maxService) * 100}%` }} />
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-ink-muted">{a.empty}</p>
            )}
          </ul>
        </Panel>
      </div>

      <h2 className="mt-10 mb-4 font-display text-2xl">{a.stats.latest}</h2>
      <DataTable head={[dict.common.reference, a.customer, dict.booking.service, dict.common.status, dict.common.date]} empty={latest?.length ? false : a.empty}>
        {(latest ?? []).map((b) => (
          <tr key={b.id} className="hover:bg-sand/40">
            <td className="px-4 py-3 font-medium" dir="ltr">
              <Link href={`/${locale}/admin/bookings/${b.id}`} className="hover:underline">
                {b.reference}
              </Link>
            </td>
            <td className="px-4 py-3">{b.contact_name}</td>
            <td className="px-4 py-3">
              {dict.booking.services[b.service_type]}
              {b.destination ? <span className="block text-xs text-ink-muted">{b.destination}</span> : null}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={b.status} label={dict.status.booking[b.status]} />
            </td>
            <td className="px-4 py-3 text-ink-muted">{formatDate(b.created_at, locale)}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
