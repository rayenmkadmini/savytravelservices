import { Eye, EyeOff, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, AdminPageHeader } from "@/components/admin/page-header";
import { ActionButton } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { togglePublished } from "@/lib/actions/admin-crud";
import { loadReferences } from "@/lib/admin/references";
import { getResource } from "@/lib/admin/resources";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatMoney, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function ResourceListPage({ params, searchParams }: PageProps<"/[locale]/admin/content/[resource]">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  const supabase = await createClient();
  const { data } = await supabase
    .from(def.table as "destinations")
    .select("*")
    .order(def.orderBy.column, { ascending: def.orderBy.ascending })
    .limit(500);
  const references = await loadReferences(def, locale);
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).filter((row) => {
    if (!q) return true;
    const label = row[def.labelField];
    const text = typeof label === "string" ? label : Object.values((label as Record<string, string>) ?? {}).join(" ");
    return `${text} ${row.slug ?? ""}`.toLowerCase().includes(q);
  });
  const labelOf = (row: Record<string, unknown>) => {
    const v = row[def.labelField];
    return typeof v === "string" ? v : tr(v, locale);
  };
  const fieldLabel = (name: string) => {
    const f = def.fields.find((x) => x.name === name);
    return f ? (dict.admin.fields[f.label] as string) : name === "published_at" ? dict.admin.updated : name;
  };
  const cell = (row: Record<string, unknown>, col: string) => {
    const v = row[col];
    if (col === "is_published") return v ? <Badge tone="success">{dict.admin.published}</Badge> : <Badge>{dict.admin.draft}</Badge>;
    if (col === "is_featured") return v ? <Badge tone="gold">{dict.admin.featured}</Badge> : null;
    if (col === "price_from") return v === null ? "—" : formatMoney(Number(v), (row.currency as string) ?? "TND", locale);
    if (col === "published_at") return v ? formatDate(v as string, locale) : "—";
    if (col === "region") return dict.admin.fields.regions[v as "tunisia"] ?? String(v);
    if (col === "category") return (dict.packages.categories as Record<string, string>)[v as string] ?? (dict.visa.categories as Record<string, string>)[v as string] ?? String(v);
    if (col === "board") return (dict.hotels.boards as Record<string, string>)[v as string] ?? String(v);
    if (col === "rating") return "★".repeat(Number(v));
    if (col === "hotel_id") return references.hotels?.find((h) => h.id === v)?.label ?? "—";
    if (col === "country_id") return references.visa_countries?.find((h) => h.id === v)?.label ?? "—";
    return v === null || v === undefined ? "—" : String(v);
  };
  const title = dict.admin[def.title] as string;
  const canPublish = def.fields.some((f) => f.name === "is_published");

  return (
    <>
      <AdminPageHeader
        title={title}
        actions={
          <ButtonLink href={`/${locale}/admin/content/${def.key}/new`} variant="accent" size="sm">
            <Plus aria-hidden /> {dict.admin.newItem}
          </ButtonLink>
        }
      />
      <form method="get" className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder={dict.admin.filters.search} aria-label={dict.admin.filters.search} />
      </form>
      <DataTable head={[dict.admin.fields.name, ...def.columns.map(fieldLabel), ""]} empty={rows.length ? false : dict.admin.empty}>
        {rows.map((row) => (
          <tr key={row.id as string} className="hover:bg-sand/40">
            <td className="px-4 py-3 font-medium">
              <Link href={`/${locale}/admin/content/${def.key}/${row.id}`} className="hover:text-gold-strong hover:underline">
                {labelOf(row) || "—"}
              </Link>
              {row.slug ? (
                <span className="block text-xs text-ink-muted" dir="ltr">
                  /{row.slug as string}
                </span>
              ) : null}
            </td>
            {def.columns.map((c) => (
              <td key={c} className="px-4 py-3">
                {cell(row, c)}
              </td>
            ))}
            <td className="px-4 py-3 text-end whitespace-nowrap">
              {canPublish ? (
                <ActionButton variant="ghost" action={togglePublished.bind(null, def.key, row.id as string, !row.is_published)}>
                  {row.is_published ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                  <span className="sr-only">{row.is_published ? dict.admin.draft : dict.admin.published}</span>
                </ActionButton>
              ) : null}
              <ButtonLink href={`/${locale}/admin/content/${def.key}/${row.id}`} variant="ghost" size="sm">
                {dict.common.edit}
              </ButtonLink>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
