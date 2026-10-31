import type { Metadata, Viewport } from "next";
import { Amiri, Cormorant_Garamond, Manrope, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/data/settings";
import { I18nProvider } from "@/lib/i18n/client";
import { dir, locales } from "@/lib/i18n/config";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-tajawal", display: "swap" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0f1b2d",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl()),
    applicationName: dict.meta.siteName,
    keywords: dict.meta.keywords,
    formatDetection: { telephone: false },
    ...pageMetadata({ locale, dict, path: "", image: settings.brand.og_image_url || "/brand/savy-og.jpg" }),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const direction = dir(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${manrope.variable} ${cormorant.variable} ${tajawal.variable} ${amiri.variable}`}
    >
      <body className="min-h-dvh">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
        <Toaster
          position={direction === "rtl" ? "bottom-left" : "bottom-right"}
          dir={direction}
          toastOptions={{ classNames: { toast: "!font-sans !rounded-xl !border-line" } }}
        />
      </body>
    </html>
  );
}
