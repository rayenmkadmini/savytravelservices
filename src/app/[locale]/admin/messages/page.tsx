import { Archive, Check, CheckCheck, Mail, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionButton } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteMessage, setMessageStatus } from "@/lib/actions/admin-ops";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["new", "read", "replied", "archived"] as const;

export default async function AdminMessagesPage({ params, searchParams }: PageProps<"/[locale]/admin/messages">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const m = dict.admin.messages_;
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const supabase = await createClient();
  let query = supabase.from("contact_messages").select("*");
  query = status ? query.eq("status", status) : query.neq("status", "archived");
  const { data } = await query.order("created_at", { ascending: false }).limit(200);

  return (
    <>
      <AdminPageHeader title={dict.admin.messages} />
      <nav className="mb-6 flex flex-wrap gap-2">
        <Link href={`/${locale}/admin/messages`} className={`rounded-full border px-3 py-1.5 text-sm ${!status ? "border-ink bg-ink text-sand" : "border-line bg-paper"}`}>
          {dict.admin.filters.all}
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/${locale}/admin/messages?status=${s}`} className={`rounded-full border px-3 py-1.5 text-sm ${status === s ? "border-ink bg-ink text-sand" : "border-line bg-paper"}`}>
            {m.statuses[s]}
          </Link>
        ))}
      </nav>
      {data?.length ? (
        <ul className="space-y-4">
          {data.map((msg) => (
            <li key={msg.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {msg.full_name} <span className="font-normal text-ink-muted">· {msg.email}</span>
                    {msg.phone ? <span className="font-normal text-ink-muted" dir="ltr"> · {msg.phone}</span> : null}
                  </p>
                  {msg.subject ? <p className="text-sm font-medium">{msg.subject}</p> : null}
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(msg.created_at, locale)} · {msg.locale.toUpperCase()}
                  </p>
                </div>
                <StatusBadge status={msg.status} label={m.statuses[msg.status as keyof typeof m.statuses]} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{msg.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink
                  href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject ?? "SAVY Travel Services"}`)}`}
                  variant="outline"
                  size="sm"
                >
                  <Mail aria-hidden /> {m.reply}
                </ButtonLink>
                {msg.status === "new" ? (
                  <ActionButton action={setMessageStatus.bind(null, msg.id, "read")}>
                    <Check aria-hidden /> {m.markRead}
                  </ActionButton>
                ) : null}
                {msg.status !== "replied" ? (
                  <ActionButton action={setMessageStatus.bind(null, msg.id, "replied")}>
                    <CheckCheck aria-hidden /> {m.markReplied}
                  </ActionButton>
                ) : null}
                {msg.status !== "archived" ? (
                  <ActionButton action={setMessageStatus.bind(null, msg.id, "archived")}>
                    <Archive aria-hidden /> {m.archive}
                  </ActionButton>
                ) : null}
                <ActionButton variant="ghost" action={deleteMessage.bind(null, msg.id)} confirm={dict.admin.confirmDelete}>
                  <Trash2 aria-hidden /> {dict.common.delete}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Mail} text={dict.admin.empty} />
      )}
    </>
  );
}
