import { describe, expect, it } from "vitest";
import { parseResourceForm } from "@/lib/admin/parse";
import { getResource, resources } from "@/lib/admin/resources";
import { convert, ratesAreFresh, ratesFromTndBase } from "@/lib/currency";
import { parseOffers } from "@/lib/flights/amadeus";
import { tr } from "@/lib/format";
import ar from "@/lib/i18n/dictionaries/ar";
import en from "@/lib/i18n/dictionaries/en";
import fr from "@/lib/i18n/dictionaries/fr";
import { fmt, lines, slugify } from "@/lib/utils";
import { bookingSchema, contactSchema, registerSchema, toFieldErrors } from "@/lib/validation";

// server-only modules are aliased to a no-op in vitest.config.ts
import { reconcile, toMillimes } from "@/lib/payments/providers";

function keys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("have identical keys in FR, EN and AR", () => {
    const reference = keys(fr).sort();
    expect(keys(en).sort()).toEqual(reference);
    expect(keys(ar).sort()).toEqual(reference);
  });

  it("never promise visa approval", () => {
    expect(fr.visa.disclaimer).toMatch(/aucune agence ne peut garantir/);
    expect(en.visa.disclaimer).toMatch(/cannot guarantee|no agency can guarantee/);
  });

  it("keep placeholders consistent across languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    const walk = (a: unknown, b: unknown, path: string) => {
      if (typeof a === "string" && typeof b === "string") {
        expect(placeholders(b), path).toBe(placeholders(a));
      } else if (a && typeof a === "object" && b && typeof b === "object") {
        for (const k of Object.keys(a)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`);
      }
    };
    walk(fr, en, "en");
    walk(fr, ar, "ar");
  });
});

describe("formatting helpers", () => {
  it("picks the requested translation with French fallback", () => {
    expect(tr({ fr: "Bonjour", en: "Hello" }, "en")).toBe("Hello");
    expect(tr({ fr: "Bonjour" }, "ar")).toBe("Bonjour");
    expect(tr(null, "fr")).toBe("");
    expect(tr("not-an-object", "fr")).toBe("");
  });

  it("formats templates, slugs and line lists", () => {
    expect(fmt("Jour {n}", { n: 3 })).toBe("Jour 3");
    expect(fmt("{a} {missing}", { a: 1 })).toBe("1 {missing}");
    expect(slugify("Sidi Bou Saïd — Été 2026")).toBe("sidi-bou-said-ete-2026");
    expect(lines("- Vol\n\n• Hôtel \n Transfert")).toEqual(["Vol", "Hôtel", "Transfert"]);
  });
});

describe("currency conversion", () => {
  const rates = { TND: 1, EUR: 3.4, USD: 3.1 };

  it("converts through TND", () => {
    expect(convert(340, "TND", "EUR", rates)).toBe(100);
    expect(convert(100, "EUR", "TND", rates)).toBe(340);
    expect(convert(100, "TND", "TND", rates)).toBe(100);
  });

  it("refuses to convert without a rate", () => {
    expect(convert(100, "TND", "EUR", { TND: 1 })).toBeNull();
  });

  it("inverts provider rates expressed per TND", () => {
    expect(ratesFromTndBase({ EUR: 0.29, USD: 0.32, GBP: 0.25 })).toEqual({ EUR: 3.448276, USD: 3.125 });
  });

  it("treats rates older than 7 days as stale", () => {
    const now = new Date("2026-10-31T12:00:00Z");
    expect(ratesAreFresh("2026-10-30T12:00:00Z", now)).toBe(true);
    expect(ratesAreFresh("2026-10-20T12:00:00Z", now)).toBe(false);
    expect(ratesAreFresh(null, now)).toBe(false);
  });
});

describe("payment reconciliation", () => {
  const expected = { paymentId: "11111111-1111-1111-1111-111111111111", amountTnd: 1250.5 };

  it("converts dinars to millimes exactly", () => {
    expect(toMillimes(1250.5)).toBe(1250500);
    expect(toMillimes(0.1 + 0.2)).toBe(300);
  });

  it("accepts a completed payment only when amount and order match", () => {
    expect(reconcile(expected, { status: "completed", amountMillimes: 1250500, orderId: expected.paymentId, raw: {} })).toBe("completed");
    expect(reconcile(expected, { status: "completed", amountMillimes: 1000, orderId: expected.paymentId, raw: {} })).toBe("failed");
    expect(reconcile(expected, { status: "completed", amountMillimes: 1250500, orderId: "other", raw: {} })).toBe("failed");
    expect(reconcile(expected, { status: "completed", amountMillimes: null, orderId: null, raw: {} })).toBe("failed");
  });

  it("passes through pending and failed answers", () => {
    expect(reconcile(expected, { status: "pending", amountMillimes: null, orderId: null, raw: {} })).toBe("pending");
    expect(reconcile(expected, { status: "failed", amountMillimes: 1250500, orderId: null, raw: {} })).toBe("failed");
  });
});

describe("validation", () => {
  const validBooking = {
    service_type: "flight",
    origin: "TUN",
    destination: "IST",
    adults: "2",
    children: "0",
    infants: "0",
    contact_name: "Amira Ben Salem",
    contact_email: "Amira@Example.com",
    contact_phone: "+216 20 123 456",
  };

  it("accepts a well-formed flight request and normalises email", () => {
    const parsed = bookingSchema.safeParse(validBooking);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.contact_email).toBe("amira@example.com");
      expect(parsed.data.adults).toBe(2);
    }
  });

  it("requires origin and destination for flights", () => {
    const parsed = bookingSchema.safeParse({ ...validBooking, origin: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(toFieldErrors(parsed.error).origin).toBe("required");
  });

  it("rejects a return date before departure", () => {
    const parsed = bookingSchema.safeParse({ ...validBooking, departure_date: "2027-05-10", return_date: "2027-05-01" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(toFieldErrors(parsed.error).return_date).toBe("returnBeforeDeparture");
  });

  it("rejects invalid phones and too many travellers", () => {
    expect(bookingSchema.safeParse({ ...validBooking, contact_phone: "abc" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, adults: "50" }).success).toBe(false);
  });

  it("enforces password strength and terms on registration", () => {
    const base = { full_name: "Test User", email: "t@example.com", phone: "", password: "abcdefgh1", terms: "on" };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "abcdefgh" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, terms: undefined }).success).toBe(false);
  });

  it("validates contact messages", () => {
    expect(contactSchema.safeParse({ full_name: "Sami", email: "s@example.com", phone: "", subject: "", message: "Bonjour, un devis svp" }).success).toBe(true);
    expect(contactSchema.safeParse({ full_name: "Sami", email: "s@example.com", phone: "", subject: "", message: "court" }).success).toBe(false);
  });
});

describe("admin resource parsing", () => {
  it("has a unique key and an i18n or text label for every resource", () => {
    expect(new Set(resources.map((r) => r.key)).size).toBe(resources.length);
    for (const r of resources) expect(r.fields.some((f) => f.name === r.labelField)).toBe(true);
  });

  it("builds a valid package row from form data", () => {
    const form = new FormData();
    form.set("title.fr", "Istanbul");
    form.set("title.en", "Istanbul");
    form.set("slug", "istanbul-5-jours");
    form.set("category", "culture");
    form.set("duration_days", "5");
    form.set("duration_nights", "4");
    form.set("price_from", "1299,5");
    form.set("currency", "TND");
    form.set("included.fr", "Vol\nHôtel");
    form.set("itinerary", JSON.stringify([{ title: { fr: "Arrivée" } }, { title: { fr: "" } }, { title: { fr: "Visite", ar: "زيارة" } }]));
    form.set("is_published", "on");
    const result = parseResourceForm(getResource("packages")!, form);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.title).toEqual({ fr: "Istanbul", en: "Istanbul" });
      expect(result.row.price_from).toBe(1299.5);
      expect(result.row.is_published).toBe(true);
      expect(result.row.is_featured).toBe(false);
      expect(result.row.destination_id).toBeNull();
      expect(result.row.itinerary).toEqual([
        { day: 1, title: { fr: "Arrivée" } },
        { day: 2, title: { fr: "Visite", ar: "زيارة" } },
      ]);
    }
  });

  it("rejects bad slugs, missing French text, unsafe URLs and out-of-range numbers", () => {
    const form = new FormData();
    form.set("title.en", "Only English");
    form.set("slug", "Not A Slug!");
    form.set("duration_days", "500");
    form.set("duration_nights", "2");
    form.set("cover_image_url", "javascript:alert(1)");
    const result = parseResourceForm(getResource("packages")!, form);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors["title.fr"]).toBe("required");
      expect(result.fieldErrors.slug).toBe("validation");
      expect(result.fieldErrors.duration_days).toBe("validation");
      expect(result.fieldErrors.cover_image_url).toBe("validation");
    }
  });
});

describe("Amadeus offer parsing", () => {
  it("maps segments, carriers and prices", () => {
    const offers = parseOffers({
      data: [
        {
          id: "1",
          numberOfBookableSeats: 4,
          price: { grandTotal: "812.40", currency: "TND" },
          itineraries: [
            {
              duration: "PT2H35M",
              segments: [
                { departure: { iataCode: "TUN", at: "2027-03-01T10:15:00" }, arrival: { iataCode: "IST", at: "2027-03-01T14:50:00" }, carrierCode: "TK", number: "662" },
              ],
            },
          ],
        },
      ],
      dictionaries: { carriers: { TK: "TURKISH AIRLINES" } },
    });
    expect(offers).toHaveLength(1);
    expect(offers[0].price).toBe(812.4);
    expect(offers[0].seats).toBe(4);
    expect(offers[0].itineraries[0].segments[0].flightNumber).toBe("TK662");
    expect(offers[0].carriers).toEqual(["TURKISH AIRLINES"]);
  });
});
