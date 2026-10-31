import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentProfile, safeNext } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/login", title: dict.auth.loginTitle, noIndex: true });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const next = safeNext(sp.next, `/${locale}/account`);
  if (await getCurrentProfile()) redirect(next);
  return (
    <AuthShell
      title={dict.auth.loginTitle}
      lead={dict.auth.loginLead}
      footer={
        <>
          {dict.auth.noAccount}{" "}
          <Link href={`/${locale}/register?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-strong hover:underline">
            {dict.nav.register}
          </Link>
        </>
      }
    >
      <LoginForm next={next} linkError={sp.error === "link"} />
    </AuthShell>
  );
}
