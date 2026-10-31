import { Compass, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PackageCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { listDestinations, listPackages } from "@/lib/data/catalog";
import { getCurrencyContext } from "@/lib/data/currency";
import { tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/packages">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/packages", title: dict.packages.title, description: dict.packages.lead });
}

export default async function PackagesPage({ params, searchParams }: PageProps<"/[locale]/packages">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const destinationSlug = typeof sp.destination === "string" ? sp.destination : "";
  const category = typeof sp.category === "string" && sp.category in dict.packages.categories ? sp.category : "";

  const [destinations, currency] = await Promise.all([listDestinations(), getCurrencyContext()]);
  const destination = destinations.find((d) => d.slug === destinationSlug);
  const packages = await listPackages({ q, category: category || undefined, destinationId: destination?.id });
  const filtered = Boolean(q || destination || category);

  const categoryHref = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (destinationSlug) p.set("destination", destinationSlug);
    if (key) p.set("category", key);
    const s = p.toString();
    return `/${locale}/packages${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHero eyebrow={dict.home.packagesEyebrow} title={dict.packages.title} lead={dict.packages.lead} />
      <section className="container-page py-12">
        <form method="get" className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft md:grid-cols-[1.5fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="q">{dict.common.search}</Label>
            <Input id="q" name="q" defaultValue={q} placeholder={dict.search.destinationPlaceholder} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="destination">{dict.search.destination}</Label>
            <Select id="destination" name="destination" defaultValue={destinationSlug}>
              <option value="">{dict.search.anyDestination}</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.slug}>
                  {tr(d.name, locale)}
                </option>
              ))}
            </Select>
          </div>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <Button type="submit" className="h-11">
            <Search aria-hidden /> {dict.common.search}
          </Button>
        </form>

        <nav aria-label={dict.search.category} className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
          {[["", dict.common.all] as const, ...Object.entries(dict.packages.categories)].map(([key, label]) => (
            <Link
              key={key || "all"}
              href={categoryHref(key)}
              aria-current={category === key ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                category === key ? "border-ink bg-ink text-sand" : "border-line bg-paper hover:border-ink/30",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-10">
          {packages.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} locale={locale} dict={dict} currency={currency} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              text={filtered ? dict.packages.noResults : dict.home.emptyPackages}
              action={
                <ButtonLink href={`/${locale}/booking?service=custom${destination ? `&destination=${encodeURIComponent(tr(destination.name, locale))}` : ""}`} variant="accent">
                  {dict.home.ctaButton}
                </ButtonLink>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
