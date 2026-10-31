import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { fmt } from "@/lib/utils";
import { PageHero } from "./page-hero";

export function LegalPage({
  title,
  doc,
  locale,
  dict,
}: {
  title: string;
  doc: { updated: string; sections: { title: string; body: string }[] };
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <>
      <PageHero title={title} lead={fmt(dict.legal.updated, { date: formatDate(doc.updated, locale) })} compact />
      <div className="container-page py-14">
        <div className="mx-auto max-w-3xl space-y-8">
          {doc.sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl">
                {i + 1}. {s.title}
              </h2>
              <p className="prose-savy mt-2">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
