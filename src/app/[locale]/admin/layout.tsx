import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { localeNames, locales } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administration | SAVY Travel Services", robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireAdmin(locale);
  const supabase = await createClient();
  const [bookings, visa, messages] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("visa_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div className="min-h-dvh bg-sand">
      <AdminNav
        isSuper={profile.role === "super_admin"}
        counts={{ bookings: bookings.count ?? 0, visa: visa.count ?? 0, messages: messages.count ?? 0 }}
      />
      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-sand/90 px-4 backdrop-blur sm:px-8">
          <p className="truncate text-sm text-ink-muted">
            {profile.full_name || profile.email} · <span className="font-semibold text-ink">{dict.admin.users_.roles[profile.role]}</span>
          </p>
          <div className="ms-auto me-12 flex items-center gap-1 lg:me-0">
            {locales.map((l) => (
              <Link key={l} href={`/${l}/admin`} lang={l} className={`rounded-full px-2.5 py-1 text-xs font-bold ${l === locale ? "bg-ink text-sand" : "text-ink-muted hover:bg-paper"}`} title={localeNames[l]}>
                {l.toUpperCase()}
              </Link>
            ))}
            <form action={signOut} className="ms-2">
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="rounded-full px-3 py-1.5 text-sm text-ink-muted hover:bg-paper hover:text-ink">
                {dict.nav.logout}
              </button>
            </form>
          </div>
        </header>
        <main id="main" className="px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
