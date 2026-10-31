import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";
import { countUnread } from "@/lib/data/account";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account`);
  const unread = await countUnread(profile.id);
  return (
    <div className="container-page pt-28 pb-20">
      <p className="eyebrow">{dict.account.title}</p>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <AccountNav unread={unread} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
