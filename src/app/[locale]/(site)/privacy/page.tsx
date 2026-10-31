import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { privacy } from "@/lib/i18n/legal";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/privacy", title: dict.legal.privacyTitle });
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return <LegalPage title={dict.legal.privacyTitle} doc={privacy[locale]} locale={locale} dict={dict} />;
}
