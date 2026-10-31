import { ArrowLeft, FileText, Mail, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm, VisaStatusForm } from "@/components/admin/booking-panels";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { withSignedUrls } from "@/lib/data/account";
import { formatDate, formatDateTime, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function AdminVisaRequestPage({ params }: PageProps<"/[locale]/admin/visa-requests/[id]">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const { data: r } = await supabase.from("visa_requests").select("*, type:visa_types(name)").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [documents, notes] = await Promise.all([
    supabase.from("booking_documents").select("*").eq("visa_request_id", id).order("created_at"),
    supabase.from("booking_notes").select("*, author:profiles(full_name)").eq("visa_request_id", id).order("created_at", { ascending: false }),
  ]);
  const docs = await withSignedUrls(documents.data ?? []);
  const type = r.type as { name: unknown } | null;

  const rows: [string, string | null][] = [
    [dict.visa.country, r.destination_country],
    [dict.visa.category, type ? tr(type.name, locale) : dict.visa.categories[r.category as keyof typeof dict.visa.categories]],
    [dict.visa.nationality, r.nationality],
    [dict.visa.travelDate, r.travel_date ? formatDate(r.travel_date, locale) : null],
    [dict.visa.travelers, String(r.travelers)],
    [dict.visa.message, r.message],
  ];

  return (
    <>
      <Link href={`/${locale}/admin/visa-requests`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {dict.admin.visaRequests}
      </Link>
      <AdminPageHeader title={r.reference} lead={formatDateTime(r.created_at, locale)} actions={<StatusBadge status={r.status} label={dict.status.visa[r.status]} />} />
      <p className="mb-6 flex gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {dict.visa.disclaimer}
      </p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Panel title={dict.admin.booking.contact}>
            <p className="font-semibold">{r.contact_name}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <a href={`mailto:${r.contact_email}`} className="inline-flex items-center gap-1.5 hover:underline">
                <Mail className="size-4 text-gold" aria-hidden /> {r.contact_email}
              </a>
              <a href={`tel:${r.contact_phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:underline" dir="ltr">
                <Phone className="size-4 text-gold" aria-hidden /> {r.contact_phone}
              </a>
            </div>
          </Panel>
          <Panel title={dict.account.details}>
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
        </div>
        <aside className="space-y-6">
          <Panel title={dict.admin.booking.manage}>
            <VisaStatusForm id={r.id} status={r.status} message={r.customer_message ?? ""} fee={r.service_fee !== null ? String(r.service_fee) : ""} />
          </Panel>
          <Panel title={dict.admin.booking.internalNotes}>
            <NoteForm target={{ visaRequestId: r.id }} />
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
        </aside>
      </div>
    </>
  );
}
