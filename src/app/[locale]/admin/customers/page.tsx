import Link from "next/link";
import { AdminPageHeader, DataTable } from "@/components/admin/page-header";
import { Input } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { likePattern } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCustomersPage({ params, searchParams }: PageProps<"/[locale]/admin/customers">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, full_name, email, phone, nationality, preferred_locale, created_at, bookings(count)").eq("role", "customer");
  if (q) {
    const p = likePattern(q);
    query = query.or(`full_name.ilike.${p},email.ilike.${p},phone.ilike.${p}`);
  }
  const { data } = await query.order("created_at", { ascending: false }).limit(300);

  return (
    <>
      <AdminPageHeader title={dict.admin.customers} lead={`${data?.length ?? 0}`} />
      <form method="get" className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder={dict.admin.filters.search} aria-label={dict.admin.filters.search} />
      </form>
      <DataTable
        head={[dict.admin.fields.fullName, dict.admin.fields.email, dict.admin.fields.phone, dict.admin.users_.bookingsCount, dict.admin.users_.joined]}
        empty={data?.length ? false : dict.admin.empty}
      >
        {(data ?? []).map((c) => {
          const count = (c.bookings as unknown as { count: number }[])?.[0]?.count ?? 0;
          return (
            <tr key={c.id} className="hover:bg-sand/40">
              <td className="px-4 py-3 font-medium">
                {c.full_name || "—"}
                <span className="block text-xs text-ink-muted">{c.nationality ?? ""} · {c.preferred_locale.toUpperCase()}</span>
              </td>
              <td className="px-4 py-3">
                <a href={`mailto:${c.email}`} className="hover:underline">
                  {c.email}
                </a>
              </td>
              <td className="px-4 py-3" dir="ltr">
                {c.phone ?? "—"}
              </td>
              <td className="px-4 py-3">
                {count ? (
                  <Link href={`/${locale}/admin/bookings?q=${encodeURIComponent(c.email)}`} className="font-semibold text-gold-strong hover:underline">
                    {count}
                  </Link>
                ) : (
                  0
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(c.created_at, locale)}</td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
