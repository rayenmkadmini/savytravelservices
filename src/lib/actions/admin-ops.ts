"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, getCurrentProfile } from "../auth";
import { ratesFromTndBase } from "../currency";
import { sendEmail } from "../email";
import { getDictionary } from "../i18n";
import { isLocale } from "../i18n/config";
import { isProviderConfigured, providers, type OnlineProvider } from "../payments/providers";
import { verifyOnlinePayment } from "../payments/verify";
import type { Json } from "../supabase/database.types";
import { createClient } from "../supabase/server";
import { fmt, siteUrl } from "../utils";
import type { ActionState } from "../validation";

const ok = (message = "admin.saved", data?: Record<string, unknown>): ActionState => ({ status: "success", message, data });
const fail = (message = "errors.generic"): ActionState => ({ status: "error", message });

function dbError(error: { message: string; code?: string } | null): ActionState | null {
  if (!error) return null;
  console.error("[admin]", error);
  if (/transition/i.test(error.message)) return fail("admin.booking.transitionError");
  if (/needs_quote/i.test(error.message)) return fail("admin.booking.needsQuote");
  if (/super admin|own role|at least one/i.test(error.message)) return fail("admin.users_.onlySuper");
  return fail();
}

// ------------------------------------------------------------------ bookings

const bookingUpdate = z.object({
  status: z.enum(["pending", "under_review", "confirmed", "rejected", "cancelled"]),
  quoted_amount: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 1e9)),
  quoted_currency: z.enum(["TND", "EUR", "USD"]),
  customer_message: z
    .string()
    .trim()
    .max(4000)
    .transform((v) => (v === "" ? null : v)),
});

export async function updateBooking(bookingId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = bookingUpdate.safeParse({
    status: form.get("status"),
    quoted_amount: form.get("quoted_amount") ?? "",
    quoted_currency: form.get("quoted_currency") ?? "TND",
    customer_message: form.get("customer_message") ?? "",
  });
  if (!parsed.success) return fail("errors.validation");
  if (parsed.data.status === "confirmed" && parsed.data.quoted_amount === null) return fail("admin.booking.needsQuote");

  const supabase = await createClient();
  const { data: before } = await supabase.from("bookings").select("status, reference, contact_email, locale").eq("id", bookingId).single();
  const { error } = await supabase.from("bookings").update(parsed.data).eq("id", bookingId);
  const err = dbError(error);
  if (err) return err;

  if (before && before.status !== parsed.data.status) {
    const dict = getDictionary(before.locale);
    const statusLabel = dict.status.booking[parsed.data.status];
    await sendEmail({
      to: before.contact_email,
      subject: `${before.reference} — ${statusLabel}`,
      text: `${fmt(dict.account.notificationText.booking_status, { reference: before.reference, status: statusLabel })}\n\n${
        parsed.data.customer_message ?? ""
      }\n\n${siteUrl(`/${before.locale}/account/bookings/${before.reference}`)}`,
    });
  }
  revalidatePath("/", "layout");
  return ok();
}

export async function addNote(target: { bookingId?: string; visaRequestId?: string }, _prev: ActionState, form: FormData): Promise<ActionState> {
  const profile = await assertAdmin();
  const body = String(form.get("body") ?? "").trim();
  if (!body || body.length > 4000) return fail("errors.validation");
  const supabase = await createClient();
  const { error } = await supabase.from("booking_notes").insert({
    booking_id: target.bookingId ?? null,
    visa_request_id: target.visaRequestId ?? null,
    author_id: profile.id,
    body,
  });
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok();
}

// ------------------------------------------------------------------ payments

const amountSchema = z.coerce.number().positive().max(1e8);

export async function createPaymentLink(bookingId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const profile = await assertAdmin();
  const provider = form.get("provider");
  if (provider !== "konnect" && provider !== "flouci") return fail("errors.validation");
  if (!isProviderConfigured(provider)) return fail("errors.generic");
  const amount = amountSchema.safeParse(String(form.get("amount") ?? "").replace(",", "."));
  if (!amount.success) return fail("errors.validation");

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, status, quoted_currency, contact_name, contact_email, contact_phone, locale")
    .eq("id", bookingId)
    .single();
  if (!booking || booking.status !== "confirmed" || booking.quoted_currency !== "TND") return fail("admin.booking.needsQuote");

  // The id is generated first so it can travel to the provider as the order id.
  const paymentId = randomUUID();
  const returnBase = `/${booking.locale}/payment/return?provider=${provider}&pid=${paymentId}`;
  try {
    const init = await providers[provider as OnlineProvider].init({
      paymentId,
      amountTnd: amount.data,
      description: `SAVY Travel Services — ${booking.reference}`,
      customer: { name: booking.contact_name, email: booking.contact_email, phone: booking.contact_phone },
      successUrl: siteUrl(`${returnBase}&result=success`),
      failUrl: siteUrl(`${returnBase}&result=fail`),
      webhookUrl: siteUrl(`/api/payments/${provider}/webhook`),
    });
    const { error } = await supabase.from("payments").insert({
      id: paymentId,
      booking_id: booking.id,
      provider,
      status: "pending",
      amount: amount.data,
      currency: "TND",
      provider_payment_id: init.providerPaymentId,
      payment_url: init.url,
      provider_payload: init.raw as Json,
      created_by: profile.id,
    });
    if (error) return dbError(error) ?? fail();

    const dict = getDictionary(booking.locale);
    await sendEmail({
      to: booking.contact_email,
      subject: `${booking.reference} — ${dict.account.payment}`,
      text: `${fmt(dict.account.payOnline, { provider: provider === "konnect" ? "Konnect" : "Flouci" })}\n${init.url}`,
    });
    revalidatePath("/", "layout");
    return ok("admin.booking.linkCreated", { url: init.url });
  } catch (err) {
    console.error("[payments] init failed", err);
    return fail();
  }
}

export async function recordManualPayment(bookingId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const profile = await assertAdmin();
  const provider = form.get("provider");
  if (provider !== "bank_transfer" && provider !== "cash") return fail("errors.validation");
  const amount = amountSchema.safeParse(String(form.get("amount") ?? "").replace(",", "."));
  const currency = z.enum(["TND", "EUR", "USD"]).safeParse(form.get("currency") ?? "TND");
  if (!amount.success || !currency.success) return fail("errors.validation");
  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    booking_id: bookingId,
    provider,
    status: "completed",
    amount: amount.data,
    currency: currency.data,
    note,
    created_by: profile.id,
  });
  if (error) return dbError(error) ?? fail();
  revalidatePath("/", "layout");
  return ok();
}

export async function verifyPayment(paymentId: string): Promise<ActionState> {
  await assertAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("payments").select("provider").eq("id", paymentId).single();
  if (!data || (data.provider !== "konnect" && data.provider !== "flouci")) return fail();
  const outcome = await verifyOnlinePayment(data.provider, { paymentId });
  revalidatePath("/", "layout");
  return outcome.status === "unknown" ? fail() : ok("admin.booking.verified", { status: outcome.status });
}

export async function cancelPayment(paymentId: string): Promise<ActionState> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ status: "cancelled" }).eq("id", paymentId).eq("status", "pending");
  if (error) return dbError(error) ?? fail();
  revalidatePath("/", "layout");
  return ok();
}

// ------------------------------------------------------------------ visa

const visaUpdate = z.object({
  status: z.enum(["pending", "under_review", "documents_requested", "submitted", "completed", "cancelled"]),
  customer_message: z
    .string()
    .trim()
    .max(4000)
    .transform((v) => (v === "" ? null : v)),
  service_fee: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 1e8)),
});

export async function updateVisaRequest(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = visaUpdate.safeParse({
    status: form.get("status"),
    customer_message: form.get("customer_message") ?? "",
    service_fee: form.get("service_fee") ?? "",
  });
  if (!parsed.success) return fail("errors.validation");
  const supabase = await createClient();
  const { data: before } = await supabase.from("visa_requests").select("status, reference, contact_email, locale").eq("id", id).single();
  const { error } = await supabase.from("visa_requests").update(parsed.data).eq("id", id);
  if (error) return dbError(error) ?? fail();
  if (before && before.status !== parsed.data.status) {
    const dict = getDictionary(before.locale);
    const label = dict.status.visa[parsed.data.status];
    await sendEmail({
      to: before.contact_email,
      subject: `${before.reference} — ${label}`,
      text: `${fmt(dict.account.notificationText.visa_status, { reference: before.reference, status: label })}\n\n${
        parsed.data.customer_message ?? ""
      }\n\n${siteUrl(`/${before.locale}/account/visa`)}`,
    });
  }
  revalidatePath("/", "layout");
  return ok();
}

// ------------------------------------------------------------------ users

export async function setUserRole(userId: string, role: string): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") return fail("admin.users_.onlySuper");
  const parsed = z.enum(["super_admin", "admin", "customer"]).safeParse(role);
  if (!parsed.success) return fail("errors.validation");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: parsed.data }).eq("id", userId);
  if (error) return dbError(error) ?? fail();
  revalidatePath("/", "layout");
  return ok();
}

// ------------------------------------------------------------------ messages & newsletter

export async function setMessageStatus(id: string, status: string): Promise<ActionState> {
  await assertAdmin();
  const parsed = z.enum(["new", "read", "replied", "archived"]).safeParse(status);
  if (!parsed.success) return fail("errors.validation");
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ status: parsed.data }).eq("id", id);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok();
}

export async function deleteMessage(id: string): Promise<ActionState> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok("admin.deleted");
}

export async function deleteSubscriber(id: string): Promise<ActionState> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok("admin.deleted");
}

// ------------------------------------------------------------------ settings

const SETTING_KEYS = ["contact", "hero", "about", "social", "payments", "currency", "brand"] as const;

/** Settings forms post flat fields; "a.b" names become nested objects, "on" becomes true. */
export async function saveSetting(key: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  await assertAdmin();
  if (!(SETTING_KEYS as readonly string[]).includes(key)) return fail();
  const supabase = await createClient();
  const { data: current } = await supabase.from("website_settings").select("value").eq("key", key).maybeSingle();
  const value: Record<string, unknown> = { ...((current?.value as Record<string, unknown>) ?? {}) };
  const booleans = String(form.get("__booleans") ?? "")
    .split(",")
    .filter(Boolean);
  for (const name of booleans) value[name] = false;

  for (const [name, raw] of form.entries()) {
    if (name.startsWith("$") || name.startsWith("__") || typeof raw !== "string") continue;
    const v = raw.trim().slice(0, 8000);
    if (booleans.includes(name)) {
      value[name] = v === "on" || v === "true";
      continue;
    }
    const [head, locale] = name.split(".");
    if (locale) {
      if (!isLocale(locale)) continue;
      const obj = (typeof value[head] === "object" && value[head] !== null ? value[head] : {}) as Record<string, string>;
      obj[locale] = v;
      value[head] = obj;
    } else {
      if (/url$/.test(name) && v && !/^https?:\/\//.test(v)) return fail("errors.validation");
      value[name] = v;
    }
  }
  const { error } = await supabase.from("website_settings").upsert({ key, value: value as NonNullable<Json>, is_public: true });
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok();
}

export async function refreshExchangeRates(): Promise<ActionState> {
  const profile = await assertAdmin();
  const source = process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest/TND";
  try {
    const res = await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return fail("admin.settings_.ratesError");
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const table = ratesFromTndBase(json.rates ?? {});
    const rows = Object.entries(table).map(([currency, tnd_per_unit]) => ({
      currency: currency as "EUR" | "USD",
      tnd_per_unit,
      source: new URL(source).hostname,
      fetched_at: new Date().toISOString(),
      updated_by: profile.id,
    }));
    if (!rows.length) return fail("admin.settings_.ratesError");
    const supabase = await createClient();
    const { error } = await supabase.from("exchange_rates").upsert(rows);
    if (error) return fail();
    revalidatePath("/", "layout");
    return ok("admin.settings_.ratesRefreshed");
  } catch {
    return fail("admin.settings_.ratesError");
  }
}

export async function setManualRate(_prev: ActionState, form: FormData): Promise<ActionState> {
  const profile = await assertAdmin();
  const currency = z.enum(["EUR", "USD"]).safeParse(form.get("currency"));
  const rate = z.coerce.number().positive().max(1000).safeParse(String(form.get("rate") ?? "").replace(",", "."));
  if (!currency.success || !rate.success) return fail("errors.validation");
  const supabase = await createClient();
  const { error } = await supabase.from("exchange_rates").upsert({
    currency: currency.data,
    tnd_per_unit: rate.data,
    source: "manual",
    fetched_at: new Date().toISOString(),
    updated_by: profile.id,
  });
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok();
}

// ------------------------------------------------------------------ media

export async function deleteMedia(path: string): Promise<ActionState> {
  await assertAdmin();
  if (!path || path.includes("..")) return fail();
  const supabase = await createClient();
  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok("admin.deleted");
}

const IMAGE_COLUMNS: { table: "destinations" | "travel_packages" | "hotels" | "articles" | "visa_countries" | "team_members"; column: string }[] = [
  { table: "destinations", column: "image_url" },
  { table: "travel_packages", column: "cover_image_url" },
  { table: "hotels", column: "cover_image_url" },
  { table: "articles", column: "cover_image_url" },
  { table: "visa_countries", column: "image_url" },
  { table: "team_members", column: "photo_url" },
];

/**
 * Copy images hosted on third-party sites into the media bucket and point
 * content at the copies. Unsplash is skipped (its guidelines require hotlinking).
 */
export async function importExternalImages(): Promise<ActionState> {
  await assertAdmin();
  const supabase = await createClient();
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost").host;
  const isExternal = (u: unknown): u is string =>
    typeof u === "string" && /^https?:\/\//.test(u) && !u.includes("images.unsplash.com") && new URL(u).host !== supabaseHost;

  const cache = new Map<string, string>();
  async function copy(url: string): Promise<string | null> {
    if (cache.has(url)) return cache.get(url)!;
    const res = await fetch(url, {
      headers: { "User-Agent": "SavyTravelServices/1.0 (+https://savytravelservices.tn; contact@savytravelservices.tn)" },
      signal: AbortSignal.timeout(20_000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp|avif)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 8 * 1024 * 1024) return null;
    const ext = type.split("/")[1].replace("jpeg", "jpg");
    const path = `imported/${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, buf, { contentType: type, upsert: true });
    if (error) return null;
    const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    cache.set(url, publicUrl);
    await new Promise((r) => setTimeout(r, 400));
    return publicUrl;
  }

  let imported = 0;
  for (const { table, column } of IMAGE_COLUMNS) {
    const { data } = await supabase.from(table).select(`id, ${column}`);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const url = row[column];
      if (!isExternal(url)) continue;
      const copied = await copy(url).catch(() => null);
      if (!copied) continue;
      await supabase.from(table).update({ [column]: copied } as never).eq("id", row.id as string);
      imported++;
    }
  }
  const { data: hero } = await supabase.from("website_settings").select("value").eq("key", "hero").maybeSingle();
  const heroValue = (hero?.value ?? {}) as Record<string, unknown>;
  if (isExternal(heroValue.image_url)) {
    const copied = await copy(heroValue.image_url).catch(() => null);
    if (copied) {
      await supabase.from("website_settings").update({ value: { ...heroValue, image_url: copied } as NonNullable<Json> }).eq("key", "hero");
      imported++;
    }
  }
  revalidatePath("/", "layout");
  return ok("admin.media_.imported", { n: imported });
}
