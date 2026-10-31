import { ProfileForm } from "@/components/account/account-actions";
import { requireUser } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function ProfilePage({ params }: PageProps<"/[locale]/account/profile">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account/profile`);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">{dict.account.profile}</h1>
        <p className="mt-2 text-ink-muted">{dict.account.profileLead}</p>
      </header>
      <div className="rounded-[var(--radius-card)] border border-line bg-paper p-6 sm:p-8">
        <ProfileForm
          initial={{
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone ?? "",
            nationality: profile.nationality ?? "",
            date_of_birth: profile.date_of_birth ?? "",
            preferred_locale: profile.preferred_locale,
          }}
        />
      </div>
    </div>
  );
}
