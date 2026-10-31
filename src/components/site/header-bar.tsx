"use client";

import { ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/client";
import { CURRENCY_COOKIE, currencies, localeNames, locales, type Currency, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { Logo } from "./logo";

type Props = {
  user: { name: string; isAdmin: boolean } | null;
  currencyEnabled: boolean;
  currency: Currency;
  logoUrl: string;
};

const NAV = ["flights", "hotels", "packages", "destinations", "visa", "about", "contact"] as const;

function writeCurrencyCookie(code: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
}

function swapLocale(pathname: string, next: Locale) {
  const parts = pathname.split("/");
  parts[1] = next;
  return parts.join("/") || `/${next}`;
}

export function HeaderBar({ user, currencyEnabled, currency, logoUrl }: Props) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = isHome && !scrolled && !open;

  function setCurrency(code: Currency) {
    writeCurrencyCookie(code);
    router.refresh();
  }

  const href = (key: (typeof NAV)[number]) => `/${locale}/${key}`;
  const isActive = (key: (typeof NAV)[number]) => pathname.startsWith(href(key));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300",
        overlay ? "bg-gradient-to-b from-ink/55 to-transparent text-white" : "bg-sand/90 text-ink shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        {dict.nav.skip}
      </a>
      <div className="container-page flex h-[4.5rem] items-center gap-6">
        <Link href={`/${locale}`} aria-label={dict.nav.home} className="shrink-0" onClick={() => setOpen(false)}>
          <Logo logoUrl={logoUrl} tone={overlay ? "light" : "ink"} />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {NAV.map((key) => (
            <Link
              key={key}
              href={href(key)}
              aria-current={isActive(key) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-3 py-2 text-[0.88rem] font-medium transition-colors",
                overlay ? "text-white/85 hover:text-white" : "text-ink-soft hover:text-ink",
                isActive(key) && (overlay ? "text-white" : "text-ink"),
                isActive(key) && "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:bg-gold",
              )}
            >
              {dict.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 xl:ms-0">
          <MenuSelect
            label={dict.nav.language}
            value={locale.toUpperCase()}
            overlay={overlay}
            className="hidden sm:block"
            items={locales.map((l) => ({ key: l, label: localeNames[l], href: swapLocale(pathname, l), active: l === locale, lang: l }))}
          />
          {currencyEnabled ? (
            <MenuSelect
              label={dict.nav.currency}
              value={currency}
              overlay={overlay}
              className="hidden sm:block"
              items={currencies.map((c) => ({ key: c, label: c, onSelect: () => setCurrency(c), active: c === currency }))}
            />
          ) : null}

          {user ? (
            <UserMenu user={user} overlay={overlay} />
          ) : (
            <Link
              href={`/${locale}/login`}
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium md:inline-flex",
                overlay ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5",
              )}
            >
              <User className="size-4" aria-hidden />
              {dict.nav.login}
            </Link>
          )}

          <Link
            href={`/${locale}/booking`}
            className={cn(buttonVariants({ variant: overlay ? "light" : "accent", size: "sm" }), "hidden md:inline-flex")}
          >
            {dict.nav.bookTrip}
          </Link>

          <button
            type="button"
            className={cn("grid size-10 place-items-center rounded-full xl:hidden", overlay ? "hover:bg-white/10" : "hover:bg-ink/5")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.close : dict.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto bg-sand text-ink xl:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-6">
            {NAV.map((key) => (
              <Link
                key={key}
                href={href(key)}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-display text-2xl"
                aria-current={isActive(key) ? "page" : undefined}
              >
                {dict.nav[key]}
              </Link>
            ))}
            <Link href={`/${locale}/inspiration`} onClick={() => setOpen(false)} className="border-b border-line py-4 font-display text-2xl">
              {dict.nav.inspiration}
            </Link>
            <div className="mt-6 flex flex-wrap gap-2">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={swapLocale(pathname, l)}
                  lang={l}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    l === locale ? "border-ink bg-ink text-sand" : "border-line bg-paper",
                  )}
                >
                  {localeNames[l]}
                </Link>
              ))}
            </div>
            {currencyEnabled ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {currencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={cn("rounded-full border px-4 py-2 text-sm", c === currency ? "border-gold bg-gold-soft" : "border-line bg-paper")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-8 grid gap-3">
              <Link href={`/${locale}/booking`} onClick={() => setOpen(false)} className={buttonVariants({ variant: "accent", size: "lg" })}>
                {dict.nav.bookTrip}
              </Link>
              {user ? (
                <>
                  <Link href={`/${locale}/account`} onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                    {dict.nav.account}
                  </Link>
                  {user.isAdmin ? (
                    <Link href={`/${locale}/admin`} onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                      {dict.nav.admin}
                    </Link>
                  ) : null}
                  <form action={signOut}>
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full")}>
                      {dict.nav.logout}
                    </button>
                  </form>
                </>
              ) : (
                <Link href={`/${locale}/login`} onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                  {dict.nav.login}
                </Link>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

type MenuItem = { key: string; label: string; href?: string; onSelect?: () => void; active?: boolean; lang?: string };

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function MenuSelect({
  label,
  value,
  items,
  overlay,
  className,
}: {
  label: string;
  value: string;
  items: MenuItem[];
  overlay: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold tracking-wider",
          overlay ? "text-white/90 hover:bg-white/10" : "text-ink-soft hover:bg-ink/5",
        )}
      >
        {value}
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <div role="menu" className="absolute end-0 mt-2 min-w-40 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 text-ink shadow-lift">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                role="menuitem"
                lang={item.lang}
                onClick={() => setOpen(false)}
                className={cn("block rounded-xl px-3 py-2 text-sm hover:bg-sand", item.active && "bg-sand font-semibold")}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect?.();
                  setOpen(false);
                }}
                className={cn("block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-sand", item.active && "bg-sand font-semibold")}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ user, overlay }: { user: { name: string; isAdmin: boolean }; overlay: boolean }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex items-center gap-2 rounded-full py-1 ps-1 pe-3 text-sm font-medium", overlay ? "hover:bg-white/10" : "hover:bg-ink/5")}
      >
        <span className="grid size-8 place-items-center rounded-full bg-gold text-xs font-bold text-white">{initials || "?"}</span>
        <span className="max-w-28 truncate">{user.name}</span>
      </button>
      {open ? (
        <div role="menu" className="absolute end-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 text-ink shadow-lift">
          <Link role="menuitem" href={`/${locale}/account`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sand">
            <LayoutDashboard className="size-4 text-ink-muted" /> {dict.nav.account}
          </Link>
          {user.isAdmin ? (
            <Link role="menuitem" href={`/${locale}/admin`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sand">
              <ShieldCheck className="size-4 text-ink-muted" /> {dict.nav.admin}
            </Link>
          ) : null}
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sand">
              <LogOut className="size-4 text-ink-muted" /> {dict.nav.logout}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
