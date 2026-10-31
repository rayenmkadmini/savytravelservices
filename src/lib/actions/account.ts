"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "../auth";
import { isLocale } from "../i18n/config";
import { createClient } from "../supabase/server";
import { formValues, profileSchema, testimonialSchema, toFieldErrors, type ActionState } from "../validation";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "auth.sessionExpired" };
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
    nationality: formData.get("nationality") ?? "",
    date_of_birth: formData.get("date_of_birth") ?? "",
    preferred_locale: formData.get("preferred_locale"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values: formValues(formData) };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", profile.id);
  if (error) return { status: "error", message: "errors.generic", values: formValues(formData) };
  revalidatePath("/", "layout");
  return { status: "success", message: "account.profileSaved", values: formValues(formData) };
}

export async function markAllNotificationsRead(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  const locale = formData.get("locale");
  revalidatePath(`/${isLocale(locale) ? locale : "fr"}/account`, "layout");
}

export async function submitTestimonial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "auth.sessionExpired" };
  const parsed = testimonialSchema.safeParse({
    author_name: formData.get("author_name"),
    author_location: formData.get("author_location") ?? "",
    content: formData.get("content"),
    rating: formData.get("rating"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: toFieldErrors(parsed.error), values: formValues(formData) };
  const locale = formData.get("locale");
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert({
    ...parsed.data,
    user_id: profile.id,
    locale: isLocale(locale) ? locale : "fr",
    is_published: false,
  });
  if (error) return { status: "error", message: "errors.generic", values: formValues(formData) };
  return { status: "success", message: "account.testimonialThanks" };
}

export async function cancelVisaRequest(reference: string, locale: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_visa_request", { request_reference: reference });
  if (error) return { status: "error", message: "errors.generic" };
  revalidatePath(`/${isLocale(locale) ? locale : "fr"}/account`, "layout");
  return { status: "success", message: "account.cancelled" };
}
