import { Download, Trash2 } from "lucide-react";
import { AdminPageHeader, DataTable } from "@/components/admin/page-header";
import { ActionButton } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { deleteSubscriber } from "@/lib/actions/admin-ops";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNewsletterPage({ params }: PageProps<"/[locale]/admin/newsletter">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const { data } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }).limit(1000);
  const active = (data ?? []).filter((s) => s.status === "subscribed").length;

  return (
    <>
      <AdminPageHeader
        title={dict.admin.newsletter}
        lead={`${active} ${dict.admin.newsletter_.subscribed.toLowerCase()}`}
        actions={
          <ButtonLink href="/api/admin/newsletter.csv" variant="outline" size="sm" prefetch={false}>
            <Download aria-hidden /> {dict.admin.newsletter_.export}
          </ButtonLink>
        }
      />
      <DataTable head={[dict.admin.fields.email, dict.admin.fields.locale, dict.common.status, dict.common.date, ""]} empty={data?.length ? false : dict.admin.empty}>
        {(data ?? []).map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3">{s.email}</td>
            <td className="px-4 py-3">{s.locale.toUpperCase()}</td>
            <td className="px-4 py-3">
              {s.status === "subscribed" ? <Badge tone="success">{dict.admin.newsletter_.subscribed}</Badge> : <Badge>{dict.admin.newsletter_.unsubscribed}</Badge>}
            </td>
            <td className="px-4 py-3 text-ink-muted">{formatDate(s.subscribed_at, locale)}</td>
            <td className="px-4 py-3 text-end">
              <ActionButton variant="ghost" action={deleteSubscriber.bind(null, s.id)} confirm={dict.admin.confirmDelete}>
                <Trash2 aria-hidden />
                <span className="sr-only">{dict.common.delete}</span>
              </ActionButton>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
