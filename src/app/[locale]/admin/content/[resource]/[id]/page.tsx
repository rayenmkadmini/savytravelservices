import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceForm } from "@/components/admin/resource-form";
import { ButtonLink } from "@/components/ui/button";
import { loadReferences } from "@/lib/admin/references";
import { getResource } from "@/lib/admin/resources";
import { requireAdmin } from "@/lib/auth";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const PUBLIC_PATHS: Record<string, string> = {
  destinations: "destinations",
  packages: "packages",
  hotels: "hotels",
  "visa-countries": "visa",
  articles: "inspiration",
};

export default async function ResourceEditPage({ params }: PageProps<"/[locale]/admin/content/[resource]/[id]">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) notFound();
  const dict = getDictionary(locale);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let row: Record<string, unknown> = { is_published: true, currency: "TND", max_adults: 2, max_children: 0 };
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from(def.table as "destinations").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data as unknown as Record<string, unknown>;
  }
  const references = await loadReferences(def, locale);
  const label = row[def.labelField];
  const name = typeof label === "string" ? label : tr(label, locale);
  const publicPath = PUBLIC_PATHS[def.key];

  return (
    <>
      <Link href={`/${locale}/admin/content/${def.key}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {dict.admin[def.title] as string}
      </Link>
      <AdminPageHeader
        title={isNew ? `${dict.admin.newItem} — ${dict.admin[def.title] as string}` : name || dict.admin.editItem}
        actions={
          !isNew && publicPath && row.slug && row.is_published ? (
            <ButtonLink href={`/${locale}/${publicPath}/${row.slug}`} target="_blank" variant="outline" size="sm">
              <ExternalLink aria-hidden /> {dict.admin.viewSite}
            </ButtonLink>
          ) : undefined
        }
      />
      <ResourceForm key={id} resourceKey={def.key} id={isNew ? null : id} initial={row} references={references} />
    </>
  );
}
