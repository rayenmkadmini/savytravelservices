import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { listArticles } from "@/lib/data/catalog";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/inspiration">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/inspiration", title: dict.inspiration.title, description: dict.inspiration.lead });
}

export default async function InspirationPage({ params }: PageProps<"/[locale]/inspiration">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const articles = await listArticles(60);
  return (
    <>
      <PageHero eyebrow={dict.home.inspirationEyebrow} title={dict.inspiration.title} lead={dict.inspiration.lead} />
      <section className="container-page py-14">
        {articles.length ? (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} locale={locale} dict={dict} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Newspaper} text={dict.inspiration.empty} />
        )}
      </section>
    </>
  );
}
