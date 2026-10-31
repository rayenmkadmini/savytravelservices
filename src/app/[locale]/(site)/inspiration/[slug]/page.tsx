import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getArticle } from "@/lib/data/catalog";
import { formatDate, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { fmt, siteUrl } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/inspiration/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const article = await getArticle(slug);
  if (!article) return pageMetadata({ locale, dict, path: `/inspiration/${slug}`, title: dict.errors.notFoundTitle, noIndex: true });
  return pageMetadata({
    locale,
    dict,
    path: `/inspiration/${slug}`,
    title: tr(article.title, locale),
    description: tr(article.excerpt, locale),
    image: article.cover_image_url,
    type: "article",
  });
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/inspiration/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const dict = getDictionary(locale);
  const article = await getArticle(slug);
  if (!article) notFound();
  const title = tr(article.title, locale);
  const body = tr(article.body, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description: tr(article.excerpt, locale) || undefined,
            image: article.cover_image_url || undefined,
            datePublished: article.published_at,
            dateModified: article.updated_at,
            inLanguage: locale,
            mainEntityOfPage: siteUrl(`/${locale}/inspiration/${article.slug}`),
            publisher: { "@id": siteUrl("/#agency") },
          }),
        }}
      />
      <PageHero
        eyebrow={fmt(dict.inspiration.publishedOn, { date: formatDate(article.published_at, locale) })}
        title={title}
        lead={tr(article.excerpt, locale)}
        image={article.cover_image_url}
        credit={article.image_credit ? fmt(dict.common.photoCredit, { credit: article.image_credit }) : null}
      />
      <article className="container-page py-14">
        <div className="prose-savy mx-auto max-w-2xl text-lg">
          {body.split(/\n{2,}/).map((block, i) =>
            block.startsWith("## ") ? (
              <h2 key={i} className="mt-10 mb-3 font-display text-3xl text-ink">
                {block.slice(3)}
              </h2>
            ) : (
              <p key={i}>{block}</p>
            ),
          )}
        </div>
        <div className="mx-auto mt-12 max-w-2xl border-t border-line pt-8">
          <ButtonLink href={`/${locale}/booking?service=custom`} variant="accent">
            {dict.home.ctaButton}
          </ButtonLink>
        </div>
      </article>
    </>
  );
}
