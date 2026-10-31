import { FileText, Plus, Stamp } from "lucide-react";
import { CancelRequestButton, UploadMoreDocuments } from "@/components/account/account-actions";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { listMyVisaRequests } from "@/lib/data/account";
import { formatDate, formatMoney } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { fmt } from "@/lib/utils";

export default async function MyVisaPage({ params }: PageProps<"/[locale]/account/visa">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account/visa`);
  const requests = await listMyVisaRequests(profile.id);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">{dict.account.visa}</h1>
        <ButtonLink href={`/${locale}/visa/request`} variant="accent" size="sm">
          <Plus aria-hidden /> {dict.visa.requestHelp}
        </ButtonLink>
      </header>
      <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">{dict.visa.disclaimer}</p>
      {requests.length ? (
        <ul className="space-y-4">
          {requests.map((r) => {
            const open = ["pending", "under_review", "documents_requested"].includes(r.status);
            return (
              <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-paper p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-ink-muted" dir="ltr">
                      {r.reference}
                    </p>
                    <h2 className="mt-1 font-display text-2xl">
                      {r.destination_country} · {dict.visa.categories[r.category as keyof typeof dict.visa.categories]}
                    </h2>
                    <p className="text-sm text-ink-muted">
                      {fmt(dict.account.submittedOn, { date: formatDate(r.created_at, locale) })}
                      {r.travel_date ? ` · ${dict.visa.travelDate}: ${formatDate(r.travel_date, locale)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={r.status} label={dict.status.visa[r.status]} />
                </div>
                {r.customer_message ? (
                  <div className="mt-4 rounded-xl bg-sand p-4 text-sm">
                    <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">{dict.account.agencyMessage}</p>
                    <p className="mt-1 whitespace-pre-line">{r.customer_message}</p>
                  </div>
                ) : null}
                {r.service_fee !== null ? (
                  <p className="mt-3 text-sm">
                    {dict.visa.fees}: <strong>{formatMoney(Number(r.service_fee), "TND", locale)}</strong>
                  </p>
                ) : null}
                <div className="mt-5">
                  <h3 className="text-sm font-semibold">{dict.account.documents}</h3>
                  {r.documents.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {r.documents.map((d) => (
                        <li key={d.id} className="flex items-center gap-2 text-sm">
                          <FileText className="size-4 text-ink-muted" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">{d.file_name}</span>
                          {d.url ? (
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold-strong hover:underline">
                              {dict.account.download}
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-ink-muted">{dict.account.noDocuments}</p>
                  )}
                  {open ? (
                    <div className="mt-4">
                      <UploadMoreDocuments userId={profile.id} target={{ visaRequestId: r.id }} />
                    </div>
                  ) : null}
                </div>
                {open ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <CancelRequestButton reference={r.reference} kind="visa" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Stamp}
          text={dict.account.noVisa}
          action={
            <ButtonLink href={`/${locale}/visa/request`} variant="accent">
              {dict.visa.requestHelp}
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
