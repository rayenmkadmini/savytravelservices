import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireUser } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/reset-password", title: dict.auth.resetTitle, noIndex: true });
}

export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  // The recovery link signs the user in through /auth/callback first.
  await requireUser(locale, `/${locale}/reset-password`);
  return (
    <AuthShell title={dict.auth.resetTitle} lead={dict.auth.passwordHint}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
