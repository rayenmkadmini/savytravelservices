import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/forgot-password", title: dict.auth.forgotTitle, noIndex: true });
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <AuthShell title={dict.auth.forgotTitle} lead={dict.auth.forgotLead}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
