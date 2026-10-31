"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/actions/public";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { idleState } from "@/lib/validation";
import { Button } from "../ui/button";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(subscribeNewsletter, idleState);

  if (state.status === "success") {
    return (
      <p role="status" className={cn("flex items-center gap-2 text-sm font-medium", tone === "dark" ? "text-gold-soft" : "text-success")}>
        <CheckCircle2 className="size-5" aria-hidden /> {lookup(dict, state.message)}
      </p>
    );
  }

  const error = fieldError(dict, state.fieldErrors?.email) ?? (state.message ? lookup(dict, state.message) : undefined);
  return (
    <form action={action} className="w-full" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          {dict.newsletter.placeholder}
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
          placeholder={dict.newsletter.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={cn(
            "h-12 flex-1 rounded-full border px-5 text-[0.95rem] focus:outline-none focus:ring-3",
            tone === "dark"
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/55 focus:border-gold focus:ring-gold/25"
              : "border-line bg-paper text-ink placeholder:text-ink-muted focus:border-gold focus:ring-gold/15",
          )}
        />
        <Button type="submit" variant="accent" size="lg" pending={pending} className="h-12">
          {dict.newsletter.button}
        </Button>
      </div>
      {error ? (
        <p id="newsletter-error" role="alert" className={cn("mt-2 text-xs", tone === "dark" ? "text-red-200" : "text-danger")}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
