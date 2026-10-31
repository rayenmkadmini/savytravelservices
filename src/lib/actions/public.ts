"use server";

import { getCurrentProfile } from "../auth";
import { isLocale } from "../i18n/config";
import { notifyAgency } from "../email";
import { rateLimit } from "../rate-limit";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import { contactSchema, formValues, newsletterSchema, toFieldErrors, type ActionState } from "../validation";

function honeypotTripped(formData: FormData) {
  return typeof formData.get("website") === "string" && (formData.get("website") as string).length > 0;
}

export async function subscribeNewsletter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (honeypotTripped(formData)) return { status: "success", message: "newsletter.success" };
  if (!isSupabaseConfigured()) return { status: "error", message: "errors.generic" };
  if (!(await rateLimit("newsletter", 5, 60_000))) return { status: "error", message: "errors.rateLimited" };
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", fieldErrors: { email: "invalidEmail" }, values: formValues(formData) };
  const locale = formData.get("locale");
  const supabase = await createClient();
  const { error } = await supabase.rpc("subscribe_newsletter", {
    subscriber_email: parsed.data.email,
    subscriber_locale: isLocale(locale) ? locale : "fr",
  });
  if (error) return { status: "error", message: "errors.generic", values: formValues(formData) };
  return { status: "success", message: "newsletter.success" };
}

export async function sendContactMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (honeypotTripped(formData)) return { status: "success", message: "contact.sent" };
  if (!isSupabaseConfigured()) return { status: "error", message: "errors.generic" };
  if (!(await rateLimit("contact", 4, 10 * 60_000))) return { status: "error", message: "errors.rateLimited" };
  const parsed = contactSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values: formValues(formData) };
  }
  const locale = formData.get("locale");
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { error } = await supabase.from("contact_messages").insert({
    ...parsed.data,
    locale: isLocale(locale) ? locale : "fr",
    user_id: profile?.id ?? null,
  });
  if (error) return { status: "error", message: "errors.generic", values: formValues(formData) };
  await notifyAgency(
    `Nouveau message de contact — ${parsed.data.full_name}`,
    `${parsed.data.full_name} <${parsed.data.email}>${parsed.data.phone ? ` · ${parsed.data.phone}` : ""}\n` +
      `${parsed.data.subject ?? ""}\n\n${parsed.data.message}`,
  );
  return { status: "success", message: "contact.sent" };
}
