"use client";

import {
  BedDouble,
  Building2,
  Compass,
  ExternalLink,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Luggage,
  MapPinned,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Settings,
  Shield,
  Stamp,
  UserRound,
  Users,
  Mail,
  Globe2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Logo } from "../site/logo";

export function AdminNav({ isSuper, counts }: { isSuper: boolean; counts: { bookings: number; visa: number; messages: number } }) {
  const { locale, dict } = useI18n();
  const a = dict.admin;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/${locale}/admin`;

  const groups = [
    {
      title: a.groups.operations,
      items: [
        { href: base, label: a.dashboard, Icon: LayoutDashboard, exact: true },
        { href: `${base}/bookings`, label: a.bookings, Icon: Luggage, badge: counts.bookings },
        { href: `${base}/visa-requests`, label: a.visaRequests, Icon: Stamp, badge: counts.visa },
        { href: `${base}/customers`, label: a.customers, Icon: Users },
        { href: `${base}/messages`, label: a.messages, Icon: Inbox, badge: counts.messages },
        { href: `${base}/newsletter`, label: a.newsletter, Icon: Mail },
      ],
    },
    {
      title: a.groups.catalog,
      items: [
        { href: `${base}/content/destinations`, label: a.destinations, Icon: MapPinned },
        { href: `${base}/content/packages`, label: a.packages, Icon: Compass },
        { href: `${base}/content/hotels`, label: a.hotels, Icon: Building2 },
        { href: `${base}/content/rooms`, label: a.rooms, Icon: BedDouble },
        { href: `${base}/content/visa-countries`, label: a.visaCountries, Icon: Globe2 },
        { href: `${base}/content/visa-types`, label: a.visaTypes, Icon: Stamp },
      ],
    },
    {
      title: a.groups.content,
      items: [
        { href: `${base}/content/testimonials`, label: a.testimonials, Icon: MessageSquareQuote },
        { href: `${base}/content/articles`, label: a.articles, Icon: Newspaper },
        { href: `${base}/content/team`, label: a.team, Icon: UserRound },
        { href: `${base}/media`, label: a.media, Icon: ImageIcon },
      ],
    },
    {
      title: a.groups.system,
      items: [
        { href: `${base}/settings`, label: a.settings, Icon: Settings },
        ...(isSuper ? [{ href: `${base}/users`, label: a.users, Icon: Shield }] : []),
      ],
    },
  ];

  const nav = (
    <nav aria-label={a.title} className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-[0.65rem] font-bold tracking-[0.18em] text-sand/40 uppercase rtl:tracking-normal">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map(({ href, label, Icon, exact, badge }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-white/10 font-semibold text-white" : "text-sand/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1">{label}</span>
                    {badge ? <span className="rounded-full bg-gold px-1.5 py-0.5 text-[0.65rem] font-bold text-white">{badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link href={`/${locale}`} className="flex items-center gap-3 px-3 py-2 text-sm text-sand/60 hover:text-white">
        <ExternalLink className="size-4" aria-hidden /> {a.viewSite}
      </Link>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? dict.nav.close : dict.nav.menu}
        className="fixed end-4 top-3 z-50 grid size-10 place-items-center rounded-full bg-ink text-white lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 w-64 overflow-y-auto bg-ink px-3 py-6 text-sand transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
      >
        <Link href={base} className="mb-8 block px-3">
          <Logo tone="light" className="h-12" />
          <span className="mt-2 block text-xs text-gold">{a.title}</span>
        </Link>
        {nav}
      </aside>
    </>
  );
}
