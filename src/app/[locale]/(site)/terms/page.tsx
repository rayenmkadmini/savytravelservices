import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { terms } from "@/lib/i18n/legal";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/terms", title: dict.legal.termsTitle });
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return <LegalPage title={dict.legal.termsTitle} doc={terms[locale]} locale={locale} dict={dict} />;
}
