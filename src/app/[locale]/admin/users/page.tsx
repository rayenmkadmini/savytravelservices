import { redirect } from "next/navigation";
import { RoleSelect } from "@/components/admin/role-select";
import { AdminPageHeader, DataTable } from "@/components/admin/page-header";
import { Input } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { likePattern } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage({ params, searchParams }: PageProps<"/[locale]/admin/users">) {
  const locale = await resolveLocale(params);
  const profile = await requireAdmin(locale);
  if (profile.role !== "super_admin") redirect(`/${locale}/admin`);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, full_name, email, role, created_at");
  if (q) {
    const p = likePattern(q);
    query = query.or(`full_name.ilike.${p},email.ilike.${p}`);
  }
  const { data } = await query.order("role").order("created_at", { ascending: false }).limit(300);

  return (
    <>
      <AdminPageHeader title={dict.admin.users} lead={dict.admin.users_.onlySuper} />
      <form method="get" className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder={dict.admin.filters.search} aria-label={dict.admin.filters.search} />
      </form>
      <DataTable head={[dict.admin.fields.fullName, dict.admin.fields.email, dict.admin.users_.joined, dict.admin.users_.role]} empty={data?.length ? false : dict.admin.empty}>
        {(data ?? []).map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3 text-ink-muted">{formatDate(u.created_at, locale)}</td>
            <td className="px-4 py-3">
              <RoleSelect userId={u.id} role={u.role} disabled={u.id === profile.id} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
