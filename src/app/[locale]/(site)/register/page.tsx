import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentProfile, safeNext } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/register", title: dict.auth.registerTitle, noIndex: true });
}

export default async function RegisterPage({ params, searchParams }: PageProps<"/[locale]/register">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const next = safeNext(sp.next, `/${locale}/account`);
  if (await getCurrentProfile()) redirect(next);
  return (
    <AuthShell
      title={dict.auth.registerTitle}
      lead={dict.auth.registerLead}
      footer={
        <>
          {dict.auth.haveAccount}{" "}
          <Link href={`/${locale}/login?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-strong hover:underline">
            {dict.nav.login}
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
