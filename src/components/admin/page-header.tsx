export function AdminPageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl">{title}</h1>
        {lead ? <p className="mt-1 text-sm text-ink-muted">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-paper p-5 sm:p-6 ${className}`}>
      {title ? <h2 className="mb-4 font-display text-2xl">{title}</h2> : null}
      {children}
    </section>
  );
}

export function DataTable({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: string | false }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-sand/60 text-start text-xs font-semibold tracking-wide text-ink-muted uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty ? <p className="px-4 py-10 text-center text-sm text-ink-muted">{empty}</p> : null}
    </div>
  );
}
