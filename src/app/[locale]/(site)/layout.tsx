import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { WhatsappButton } from "@/components/site/whatsapp-button";
import { getSiteSettings, whatsappLink } from "@/lib/data/settings";
import { resolveLocale } from "@/lib/i18n";

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const settings = await getSiteSettings();
  const wa = whatsappLink(settings.contact.whatsapp);
  return (
    <>
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer locale={locale} />
      {wa ? <WhatsappButton href={wa} /> : null}
    </>
  );
}
