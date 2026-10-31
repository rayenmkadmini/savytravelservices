"use client";

import { Bell, LayoutDashboard, Luggage, Stamp, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function AccountNav({ unread }: { unread: number }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const base = `/${locale}/account`;
  const items = [
    { href: base, label: dict.account.overview, Icon: LayoutDashboard, exact: true },
    { href: `${base}/bookings`, label: dict.account.bookings, Icon: Luggage },
    { href: `${base}/visa`, label: dict.account.visa, Icon: Stamp },
    { href: `${base}/notifications`, label: dict.account.notifications, Icon: Bell, badge: unread },
    { href: `${base}/profile`, label: dict.account.profile, Icon: UserRound },
  ];
  return (
    <nav aria-label={dict.account.title} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {items.map(({ href, label, Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-ink text-sand" : "text-ink-soft hover:bg-paper",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {badge ? <span className="ms-auto rounded-full bg-gold px-2 py-0.5 text-[0.7rem] font-bold text-white">{badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
