import { Bell } from "lucide-react";
import Link from "next/link";
import { notificationText } from "@/components/account/notification-text";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markAllNotificationsRead } from "@/lib/actions/account";
import { requireUser } from "@/lib/auth";
import { listMyNotifications } from "@/lib/data/account";
import { formatDateTime } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function NotificationsPage({ params }: PageProps<"/[locale]/account/notifications">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account/notifications`);
  const notifications = await listMyNotifications(profile.id, 100);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">{dict.account.notifications}</h1>
        {hasUnread ? (
          <form action={markAllNotificationsRead}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              {dict.account.markAllRead}
            </Button>
          </form>
        ) : null}
      </header>
      {notifications.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
          {notifications.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 px-5 py-4 text-sm ${n.read_at ? "" : "bg-gold-soft/25"}`}>
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-line" : "bg-gold"}`} aria-hidden />
              <div className="flex-1">
                {n.link ? (
                  <Link href={`/${locale}${n.link}`} className="font-medium hover:underline">
                    {notificationText(dict, n.kind, n.payload)}
                  </Link>
                ) : (
                  notificationText(dict, n.kind, n.payload)
                )}
              </div>
              <time className="shrink-0 text-xs text-ink-muted">{formatDateTime(n.created_at, locale)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Bell} text={dict.account.noNotifications} />
      )}
    </div>
  );
}
