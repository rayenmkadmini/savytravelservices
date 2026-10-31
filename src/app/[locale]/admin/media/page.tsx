import { CloudDownload } from "lucide-react";
import { MediaLibrary } from "@/components/admin/media-library";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionButton } from "@/components/admin/ui";
import { importExternalImages } from "@/lib/actions/admin-ops";
import { requireAdmin } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMediaPage({ params }: PageProps<"/[locale]/admin/media">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const files: { path: string; url: string; size: number; created: string }[] = [];
  for (const folder of ["uploads", "imported"]) {
    const { data: top } = await supabase.storage.from("media").list(folder, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    for (const entry of top ?? []) {
      if (entry.id) {
        const path = `${folder}/${entry.name}`;
        files.push({ path, url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl, size: entry.metadata?.size ?? 0, created: entry.created_at ?? "" });
      } else {
        // month sub-folder (uploads/YYYY-MM)
        const { data: inner } = await supabase.storage.from("media").list(`${folder}/${entry.name}`, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
        for (const f of inner ?? []) {
          if (!f.id) continue;
          const path = `${folder}/${entry.name}/${f.name}`;
          files.push({ path, url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl, size: f.metadata?.size ?? 0, created: f.created_at ?? "" });
        }
      }
    }
  }
  files.sort((a, b) => b.created.localeCompare(a.created));

  return (
    <>
      <AdminPageHeader
        title={dict.admin.media}
        lead={dict.admin.media_.hint}
        actions={
          <ActionButton action={importExternalImages} confirm={dict.admin.media_.importHint}>
            <CloudDownload aria-hidden /> {dict.admin.media_.importExternal}
          </ActionButton>
        }
      />
      <MediaLibrary files={files} />
    </>
  );
}
