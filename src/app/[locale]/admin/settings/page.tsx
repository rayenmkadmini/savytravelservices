import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForms } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/settings";
import { isEmailConfigured } from "@/lib/email";
import { isAmadeusConfigured } from "@/lib/flights/amadeus";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { isProviderConfigured } from "@/lib/payments/providers";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage({ params }: PageProps<"/[locale]/admin/settings">) {
  const locale = await resolveLocale(params);
  await requireAdmin(locale);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const [settings, { data: rates }] = await Promise.all([getSiteSettings(), supabase.from("exchange_rates").select("*").order("currency")]);
  const integrations = [
    { label: "Konnect", ok: isProviderConfigured("konnect") },
    { label: "Flouci", ok: isProviderConfigured("flouci") },
    { label: "Amadeus", ok: isAmadeusConfigured() },
    { label: "E-mail (Resend)", ok: isEmailConfigured() },
    { label: "Service role", ok: isServiceRoleConfigured() },
  ];
  return (
    <>
      <AdminPageHeader title={dict.admin.settings} />
      <SettingsForms
        settings={settings}
        rates={(rates ?? []).map((r) => ({ ...r, tnd_per_unit: Number(r.tnd_per_unit) }))}
        integrations={integrations}
      />
    </>
  );
}
