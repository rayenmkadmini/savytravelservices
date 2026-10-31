"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/public";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { idleState } from "@/lib/validation";
import { Button } from "../ui/button";
import { Field, Input, Textarea } from "../ui/field";

export function ContactForm({ defaults }: { defaults?: Partial<Record<"full_name" | "email" | "phone" | "subject" | "message", string>> }) {
  const { locale, dict } = useI18n();
  const c = dict.contact;
  const [state, action, pending] = useActionState(sendContactMessage, idleState);
  const err = (k: string) => fieldError(dict, state.fieldErrors?.[k]);
  const v: Partial<Record<string, string>> = { ...defaults, ...state.values };

  if (state.status === "success") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl bg-success-soft p-6 text-success">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>{lookup(dict, state.message)}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.message ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {lookup(dict, state.message)}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={c.name} name="full_name" error={err("full_name")}>
          <Input id="full_name" name="full_name" autoComplete="name" required maxLength={120} defaultValue={v.full_name} />
        </Field>
        <Field label={c.email} name="email" error={err("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} />
        </Field>
        <Field label={c.phone} name="phone" error={err("phone")} optional={dict.common.optional}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" defaultValue={v.phone} />
        </Field>
        <Field label={c.subject} name="subject" error={err("subject")} optional={dict.common.optional}>
          <Input id="subject" name="subject" maxLength={200} defaultValue={v.subject} />
        </Field>
      </div>
      <Field label={c.message} name="message" error={err("message")}>
        <Textarea id="message" name="message" rows={6} required minLength={10} maxLength={5000} placeholder={c.messagePlaceholder} defaultValue={v.message} />
      </Field>
      <p className="text-xs text-ink-muted">{c.consent}</p>
      <Button type="submit" variant="accent" size="lg" pending={pending}>
        {!pending ? <Send className="rtl:-scale-x-100" aria-hidden /> : null}
        {pending ? dict.common.sending : c.send}
      </Button>
    </form>
  );
}
