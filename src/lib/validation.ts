import { z } from "zod";

/**
 * Shared server-side validation. Error messages are dictionary keys under
 * `errors.*` so the UI can render them in the visitor's language.
 */

export type FieldErrors = Record<string, string>;

export type ActionState = {
  status: "idle" | "success" | "error";
  /** Dictionary path (e.g. "errors.generic") or already-localised text. */
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  data?: Record<string, unknown>;
};

export const idleState: ActionState = { status: "idle" };

const trimmed = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: min <= 1 ? "required" : "tooShort" })
    .max(max, { message: "tooLong" });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: "tooLong" })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const email = z.string().trim().toLowerCase().max(254, { message: "tooLong" }).email({ message: "invalidEmail" });

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ().-]{6,30}$/, { message: "invalidPhone" });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalidDate" });
const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .refine((v) => v == null || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "invalidDate" });

const count = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

export const password = z
  .string()
  .min(8, { message: "weakPassword" })
  .max(72, { message: "tooLong" })
  .regex(/[A-Za-z]/, { message: "weakPassword" })
  .regex(/\d/, { message: "weakPassword" });

export const loginSchema = z.object({ email, password: z.string().min(1, { message: "required" }) });

export const registerSchema = z.object({
  full_name: trimmed(2, 120),
  email,
  phone: phone.optional().or(z.literal("")),
  password,
  terms: z.unknown().refine((v) => v === "on", { message: "required" }),
});

export const contactSchema = z.object({
  full_name: trimmed(2, 120),
  email,
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v == null || /^\+?[0-9 ().-]{6,30}$/.test(v), { message: "invalidPhone" }),
  subject: optionalText(200),
  message: trimmed(10, 5000),
});

export const newsletterSchema = z.object({ email });

export const serviceTypes = ["flight", "hotel", "package", "tour", "business", "custom"] as const;
export const travelClasses = ["economy", "premium_economy", "business", "first"] as const;

export const passengerSchema = z.object({
  passenger_type: z.enum(["adult", "child", "infant"]),
  full_name: trimmed(2, 120),
  date_of_birth: optionalDate,
  nationality: optionalText(80),
  passport_number: optionalText(30),
  passport_expiry: optionalDate,
});

export const bookingSchema = z
  .object({
    service_type: z.enum(serviceTypes),
    package_id: z.string().uuid().nullable().optional(),
    hotel_id: z.string().uuid().nullable().optional(),
    room_id: z.string().uuid().nullable().optional(),
    destination_id: z.string().uuid().nullable().optional(),
    origin: optionalText(120),
    destination: optionalText(120),
    departure_date: optionalDate,
    return_date: optionalDate,
    adults: count(1, 20),
    children: count(0, 20),
    infants: count(0, 10),
    rooms: count(1, 20).nullable().optional(),
    travel_class: z.enum(travelClasses).nullable().optional(),
    budget: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
    notes: optionalText(4000),
    contact_name: trimmed(2, 120),
    contact_email: email,
    contact_phone: phone,
    passengers: z.array(passengerSchema).max(30).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.departure_date && v.return_date && v.return_date < v.departure_date) {
      ctx.addIssue({ code: "custom", path: ["return_date"], message: "returnBeforeDeparture" });
    }
    if (v.service_type === "flight" && (!v.origin || !v.destination)) {
      ctx.addIssue({ code: "custom", path: [v.origin ? "destination" : "origin"], message: "required" });
    }
    if (!v.package_id && !v.hotel_id && !v.destination && !v.destination_id) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "required" });
    }
  });

export type BookingInput = z.input<typeof bookingSchema>;

export const visaRequestSchema = z.object({
  country_id: z.string().uuid().nullable().optional(),
  visa_type_id: z.string().uuid().nullable().optional(),
  destination_country: trimmed(2, 120),
  category: z.enum(["tourist", "business", "student", "family", "transit", "work", "medical", "other"]),
  nationality: trimmed(2, 80),
  travel_date: optionalDate,
  travelers: count(1, 20),
  message: optionalText(4000),
  contact_name: trimmed(2, 120),
  contact_email: email,
  contact_phone: phone,
});

export const profileSchema = z.object({
  full_name: trimmed(2, 120),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v == null || /^\+?[0-9 ().-]{6,30}$/.test(v), { message: "invalidPhone" }),
  nationality: optionalText(80),
  date_of_birth: optionalDate,
  preferred_locale: z.enum(["fr", "en", "ar"]),
});

export const testimonialSchema = z.object({
  author_name: trimmed(2, 120),
  author_location: optionalText(120),
  content: trimmed(10, 1500),
  rating: count(1, 5),
});

/** Flatten zod issues into { field: errorKey }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message.includes(" ") ? "validation" : issue.message;
  }
  return out;
}

/** Plain-object view of submitted text fields, to re-populate forms after errors. */
export function formValues(formData: FormData, exclude: string[] = ["password"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION") && !exclude.includes(key)) out[key] = value;
  }
  return out;
}

export { isoDate };
