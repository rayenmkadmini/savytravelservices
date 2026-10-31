import Link from "next/link";
import { AdminPageHeader, DataTable } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { likePattern } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { VisaStatus } from "@/lib/supabase/types";

export default async function AdminVisaPage({ params, searchParams }: PageProps<"/[locale]/admin/visa-requests">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const statuses = Object.keys(dict.status.visa) as VisaStatus[];
  const status = statuses.find((s) => s === sp.status);
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const supabase = await createClient();
  let query = supabase.from("visa_requests").select("*");
  if (status) query = query.eq("status", status);
  if (q) {
    const p = likePattern(q);
    query = query.or(`reference.ilike.${p},contact_name.ilike.${p},contact_email.ilike.${p},destination_country.ilike.${p}`);
  }
  const { data } = await query.order("created_at", { ascending: false }).limit(200);

  return (
    <>
      <AdminPageHeader title={dict.admin.visaRequests} />
      <form method="get" className="mb-4 grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
        <Input name="q" defaultValue={q} placeholder={dict.admin.filters.search} aria-label={dict.admin.filters.search} />
        <Select name="status" defaultValue={status ?? ""} aria-label={dict.admin.filters.status}>
          <option value="">{dict.admin.filters.status}: {dict.admin.filters.all}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {dict.status.visa[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" className="h-11">
          {dict.common.search}
        </Button>
      </form>
      <DataTable head={[dict.common.reference, dict.admin.customer, dict.visa.country, dict.visa.travelDate, dict.common.status]} empty={data?.length ? false : dict.admin.empty}>
        {(data ?? []).map((r) => (
          <tr key={r.id} className="hover:bg-sand/40">
            <td className="px-4 py-3">
              <Link href={`/${locale}/admin/visa-requests/${r.id}`} className="font-semibold hover:underline" dir="ltr">
                {r.reference}
              </Link>
              <span className="block text-xs text-ink-muted">{formatDate(r.created_at, locale)}</span>
            </td>
            <td className="px-4 py-3">
              {r.contact_name}
              <span className="block text-xs text-ink-muted">{r.contact_email}</span>
            </td>
            <td className="px-4 py-3">
              {r.destination_country}
              <span className="block text-xs text-ink-muted">{dict.visa.categories[r.category as keyof typeof dict.visa.categories]}</span>
            </td>
            <td className="px-4 py-3">{r.travel_date ? formatDate(r.travel_date, locale) : "—"}</td>
            <td className="px-4 py-3">
              <StatusBadge status={r.status} label={dict.status.visa[r.status]} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
