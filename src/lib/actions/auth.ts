"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeNext } from "../auth";
import { isLocale, type Locale } from "../i18n/config";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { siteUrl } from "../utils";
import {
  email as emailSchema,
  formValues,
  loginSchema,
  password as passwordSchema,
  registerSchema,
  toFieldErrors,
  type ActionState,
} from "../validation";

function localeOf(formData: FormData): Locale {
  const l = formData.get("locale");
  return isLocale(l) ? l : "fr";
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { status: "error", message: "auth.notConfigured" };
  const locale = localeOf(formData);
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values: formValues(formData) };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message = /rate limit/i.test(error.message) ? "errors.rateLimited" : "auth.invalidCredentials";
    return { status: "error", message, values: formValues(formData) };
  }
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next"), `/${locale}/account`));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { status: "error", message: "auth.notConfigured" };
  const locale = localeOf(formData);
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values: formValues(formData) };
  }
  const next = safeNext(formData.get("next"), `/${locale}/account`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone || null, preferred_locale: locale },
    },
  });
  if (error) {
    const message = /already|registered|exists/i.test(error.message)
      ? "auth.emailTaken"
      : /rate limit/i.test(error.message)
        ? "errors.rateLimited"
        : "errors.generic";
    return { status: "error", message, values: formValues(formData) };
  }
  // Supabase returns a user with no identities when the email is already taken
  // (to avoid account enumeration when confirmations are on).
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", message: "auth.emailTaken", values: formValues(formData) };
  }
  if (!data.session) {
    return { status: "success", message: "auth.checkEmail" };
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { status: "error", message: "auth.notConfigured" };
  const locale = localeOf(formData);
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", fieldErrors: { email: "invalidEmail" } };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(`/${locale}/reset-password`)}`),
  });
  // Same answer whether or not the account exists.
  return { status: "success", message: "auth.linkSent" };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { status: "error", message: "auth.notConfigured" };
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { status: "error", fieldErrors: { password: "weakPassword" } };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "auth.sessionExpired" };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { status: "error", message: "errors.generic" };
  return { status: "success", message: "auth.passwordUpdated" };
}

export async function signOut(formData: FormData) {
  const locale = localeOf(formData);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect(`/${locale}`);
}
