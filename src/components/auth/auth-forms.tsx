"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { idleState, type ActionState } from "@/lib/validation";
import { Button } from "../ui/button";
import { Checkbox, Field, Input } from "../ui/field";

function FormMessage({ state }: { state: ActionState }) {
  const { dict } = useI18n();
  if (!state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
      {lookup(dict, state.message)}
    </p>
  );
}

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(signIn, idleState);
  const err = (k: string) => fieldError(dict, state.fieldErrors?.[k]);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {linkError && state.status === "idle" ? <FormMessage state={{ status: "error", message: "errors.generic" }} /> : null}
      <FormMessage state={state} />
      <Field label={dict.auth.email} name="email" error={err("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      </Field>
      <Field label={dict.auth.password} name="password" error={err("password")}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href={`/${locale}/forgot-password`} className="text-sm font-medium text-gold-strong hover:underline">
          {dict.auth.forgot}
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        {dict.nav.login}
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(signUp, idleState);
  const err = (k: string) => fieldError(dict, state.fieldErrors?.[k]);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage state={state} />
      <Field label={dict.auth.fullName} name="full_name" error={err("full_name")}>
        <Input id="full_name" name="full_name" autoComplete="name" required maxLength={120} defaultValue={state.values?.full_name} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.auth.email} name="email" error={err("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
        </Field>
        <Field label={dict.auth.phone} name="phone" error={err("phone")} optional={dict.common.optional}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" defaultValue={state.values?.phone} />
        </Field>
      </div>
      <Field label={dict.auth.password} name="password" error={err("password")} hint={dict.auth.passwordHint}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <div>
        <Checkbox
          name="terms"
          label={
            <>
              {dict.auth.acceptTerms}{" "}
              <Link href={`/${locale}/terms`} className="underline" target="_blank">
                {dict.footer.terms}
              </Link>{" "}
              ·{" "}
              <Link href={`/${locale}/privacy`} className="underline" target="_blank">
                {dict.footer.privacy}
              </Link>
            </>
          }
        />
        {err("terms") ? <p className="mt-1.5 text-xs font-medium text-danger">{err("terms")}</p> : null}
      </div>
      <Button type="submit" size="lg" variant="accent" className="w-full" pending={pending}>
        {dict.nav.register}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, idleState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      <Field label={dict.auth.email} name="email" error={fieldError(dict, state.fieldErrors?.email)}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        {dict.auth.sendLink}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(updatePassword, idleState);
  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage state={state} />
        <Link href={`/${locale}/account`} className="text-sm font-semibold text-gold-strong hover:underline">
          {dict.nav.account}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label={dict.auth.password} name="password" error={fieldError(dict, state.fieldErrors?.password)} hint={dict.auth.passwordHint}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" size="lg" className="w-full" pending={pending}>
        {dict.auth.updatePassword}
      </Button>
    </form>
  );
}
