"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "../auth";
import { notifyAgency, sendEmail } from "../email";
import { todayInTunis } from "../format";
import { isLocale } from "../i18n/config";
import { getDictionary } from "../i18n";
import { rateLimit } from "../rate-limit";
import { createClient } from "../supabase/server";
import { fmt, siteUrl } from "../utils";
import { bookingSchema, toFieldErrors, visaRequestSchema, type ActionState } from "../validation";

type CreateResult = ActionState & { data?: { id: string; reference: string } };

export async function createBooking(payload: unknown, localeInput: string): Promise<CreateResult> {
  const locale = isLocale(localeInput) ? localeInput : "fr";
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "auth.sessionExpired" };
  if (!(await rateLimit(`booking:${profile.id}`, 10, 60 * 60_000))) return { status: "error", message: "errors.rateLimited" };

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
  const input = parsed.data;
  if (input.departure_date && input.departure_date < todayInTunis()) {
    return { status: "error", message: "errors.validation", fieldErrors: { departure_date: "pastDate" } };
  }

  const supabase = await createClient();

  // Never trust client-supplied references: resolve them against published catalog rows.
  let packageId: string | null = null;
  let hotelId: string | null = null;
  let roomId: string | null = null;
  let destinationId: string | null = input.destination_id ?? null;
  let destinationLabel = input.destination ?? null;

  if (input.package_id) {
    const { data } = await supabase
      .from("travel_packages")
      .select("id, title, destination_id")
      .eq("id", input.package_id)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return { status: "error", message: "errors.validation" };
    packageId = data.id;
    destinationId = data.destination_id ?? destinationId;
    destinationLabel ??= (data.title as Record<string, string>).fr ?? null;
  }
  if (input.hotel_id) {
    const { data } = await supabase
      .from("hotels")
      .select("id, name, city, destination_id")
      .eq("id", input.hotel_id)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return { status: "error", message: "errors.validation" };
    hotelId = data.id;
    destinationId = data.destination_id ?? destinationId;
    destinationLabel ??= `${data.name}, ${data.city}`;
    if (input.room_id) {
      const { data: room } = await supabase
        .from("hotel_rooms")
        .select("id")
        .eq("id", input.room_id)
        .eq("hotel_id", data.id)
        .maybeSingle();
      roomId = room?.id ?? null;
    }
  }
  if (destinationId && !packageId && !hotelId) {
    const { data } = await supabase.from("destinations").select("id").eq("id", destinationId).maybeSingle();
    destinationId = data?.id ?? null;
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: profile.id,
      service_type: input.service_type,
      package_id: packageId,
      hotel_id: hotelId,
      room_id: roomId,
      destination_id: destinationId,
      origin: input.origin ?? null,
      destination: destinationLabel?.slice(0, 120) ?? null,
      departure_date: input.departure_date ?? null,
      return_date: input.return_date ?? null,
      adults: input.adults,
      children: input.children,
      infants: input.infants,
      rooms: input.service_type === "hotel" ? (input.rooms ?? 1) : null,
      travel_class: input.service_type === "flight" ? (input.travel_class ?? "economy") : null,
      budget: input.budget ?? null,
      budget_currency: input.budget ? "TND" : null,
      notes: input.notes ?? null,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      locale,
    })
    .select("id, reference")
    .single();

  if (error || !booking) {
    console.error("[booking] insert failed", error);
    return { status: "error", message: "errors.generic" };
  }

  if (input.passengers.length) {
    const { error: paxError } = await supabase
      .from("booking_passengers")
      .insert(input.passengers.map((p) => ({ ...p, booking_id: booking.id })));
    if (paxError) console.error("[booking] passengers insert failed", paxError);
  }

  // Keep the customer's profile phone up to date for future requests.
  if (!profile.phone) await supabase.from("profiles").update({ phone: input.contact_phone }).eq("id", profile.id);

  const dict = getDictionary(locale);
  await Promise.all([
    sendEmail({
      to: input.contact_email,
      subject: `${dict.booking.successTitle} — ${booking.reference}`,
      text: `${fmt(dict.booking.successText, { reference: booking.reference })}\n\n${dict.booking.noPaymentNote}\n\n${siteUrl(
        `/${locale}/account/bookings/${booking.reference}`,
      )}`,
    }),
    notifyAgency(
      `Nouvelle demande ${booking.reference} (${input.service_type})`,
      `${input.contact_name} · ${input.contact_email} · ${input.contact_phone}\n${destinationLabel ?? ""} ${input.departure_date ?? ""}\n${siteUrl(
        `/fr/admin/bookings/${booking.id}`,
      )}`,
    ),
  ]);

  revalidatePath(`/${locale}/account`, "layout");
  return { status: "success", data: { id: booking.id, reference: booking.reference } };
}

export async function cancelBooking(reference: string, locale: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_booking", { booking_reference: reference });
  if (error) return { status: "error", message: "errors.generic" };
  revalidatePath(`/${isLocale(locale) ? locale : "fr"}/account`, "layout");
  return { status: "success", message: "account.cancelled" };
}

export async function createVisaRequest(payload: unknown, localeInput: string): Promise<CreateResult> {
  const locale = isLocale(localeInput) ? localeInput : "fr";
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "auth.sessionExpired" };
  if (!(await rateLimit(`visa:${profile.id}`, 10, 60 * 60_000))) return { status: "error", message: "errors.rateLimited" };

  const parsed = visaRequestSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
  const input = parsed.data;
  if (input.travel_date && input.travel_date < todayInTunis()) {
    return { status: "error", message: "errors.validation", fieldErrors: { travel_date: "pastDate" } };
  }

  const supabase = await createClient();
  let countryId: string | null = null;
  let typeId: string | null = null;
  if (input.country_id) {
    const { data } = await supabase.from("visa_countries").select("id").eq("id", input.country_id).maybeSingle();
    countryId = data?.id ?? null;
  }
  if (input.visa_type_id && countryId) {
    const { data } = await supabase
      .from("visa_types")
      .select("id")
      .eq("id", input.visa_type_id)
      .eq("country_id", countryId)
      .maybeSingle();
    typeId = data?.id ?? null;
  }

  const { data, error } = await supabase
    .from("visa_requests")
    .insert({
      user_id: profile.id,
      country_id: countryId,
      visa_type_id: typeId,
      destination_country: input.destination_country,
      category: input.category,
      nationality: input.nationality,
      travel_date: input.travel_date ?? null,
      travelers: input.travelers,
      message: input.message ?? null,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      locale,
    })
    .select("id, reference")
    .single();
  if (error || !data) {
    console.error("[visa] insert failed", error);
    return { status: "error", message: "errors.generic" };
  }

  await notifyAgency(
    `Nouvelle demande de visa ${data.reference}`,
    `${input.contact_name} · ${input.contact_email} · ${input.contact_phone}\n${input.destination_country} (${input.category})\n${siteUrl(
      `/fr/admin/visa-requests/${data.id}`,
    )}`,
  );
  revalidatePath(`/${locale}/account`, "layout");
  return { status: "success", data: { id: data.id, reference: data.reference } };
}
