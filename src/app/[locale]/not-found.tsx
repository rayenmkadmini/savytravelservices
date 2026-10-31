"use client";

import { Compass } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const { locale, dict } = useI18n();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-sand px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold-soft text-gold-strong">
          <Compass className="size-7" aria-hidden />
        </span>
        <p className="mt-6 font-display text-7xl text-gold">404</p>
        <h1 className="mt-2 font-display text-4xl">{dict.errors.notFoundTitle}</h1>
        <p className="mt-3 text-ink-muted">{dict.errors.notFoundText}</p>
        <Link href={`/${locale}`} className={buttonVariants({ variant: "primary", size: "lg", className: "mt-8" })}>
          {dict.errors.backHome}
        </Link>
      </div>
    </main>
  );
}
