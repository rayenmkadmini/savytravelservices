import { getCurrentProfile, isAdminRole } from "@/lib/auth";
import { getCurrencyContext } from "@/lib/data/currency";
import { getSiteSettings } from "@/lib/data/settings";
import { HeaderBar } from "./header-bar";

export async function Header() {
  const [profile, settings, currency] = await Promise.all([getCurrentProfile(), getSiteSettings(), getCurrencyContext()]);
  return (
    <HeaderBar
      user={profile ? { name: profile.full_name || profile.email, isAdmin: isAdminRole(profile.role) } : null}
      currencyEnabled={currency.enabled}
      currency={currency.display}
      logoUrl={settings.brand.logo_url}
    />
  );
}
