"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-4 pt-24">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl">{dict.errors.generic}</h1>
        {error.digest ? <p className="mt-2 text-xs text-ink-muted">#{error.digest}</p> : null}
        <Button className="mt-6" onClick={reset}>
          {dict.common.retry}
        </Button>
      </div>
    </main>
  );
}
