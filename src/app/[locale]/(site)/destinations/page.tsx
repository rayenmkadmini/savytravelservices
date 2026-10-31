import { MapPinned } from "lucide-react";
import type { Metadata } from "next";
import { DestinationCard } from "@/components/site/cards";
import { PageHero, SectionHeading } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { listDestinations } from "@/lib/data/catalog";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/destinations">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/destinations", title: dict.destinations.title, description: dict.destinations.lead });
}

export default async function DestinationsPage({ params }: PageProps<"/[locale]/destinations">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const destinations = await listDestinations();
  const groups = [
    { key: "tunisia", title: dict.destinations.tunisia, items: destinations.filter((d) => d.region === "tunisia") },
    { key: "international", title: dict.destinations.international, items: destinations.filter((d) => d.region !== "tunisia") },
  ].filter((g) => g.items.length);

  return (
    <>
      <PageHero eyebrow={dict.home.destinationsEyebrow} title={dict.destinations.title} lead={dict.destinations.lead} />
      <div className="container-page space-y-20 py-16">
        {groups.length ? (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <SectionHeading title={group.title} className="mb-8" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((d, i) => (
                  <Reveal key={d.id} delay={(i % 4) * 0.05}>
                    <DestinationCard destination={d} locale={locale} dict={dict} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))
        ) : (
          <EmptyState icon={MapPinned} text={dict.destinations.empty} />
        )}
      </div>
    </>
  );
}
