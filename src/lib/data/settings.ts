import "server-only";
import { cache } from "react";
import type { I18nText } from "../format";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";

export type ContactSettings = {
  email: string;
  phone: string;
  fax: string;
  whatsapp: string;
  address: string;
  map_query: string;
  manager: string;
  hours: I18nText;
};

export type SiteSettings = {
  contact: ContactSettings;
  social: Record<"facebook" | "instagram" | "linkedin" | "tiktok", string>;
  hero: { title: I18nText; subtitle: I18nText; image_url: string; image_credit?: string };
  about: { story: I18nText; mission: I18nText; vision: I18nText };
  payments: {
    konnect_enabled: boolean;
    flouci_enabled: boolean;
    bank_transfer_enabled: boolean;
    bank_transfer_details: I18nText;
  };
  currency: { conversion_enabled: boolean };
  brand: { logo_url: string; og_image_url: string };
};

// Used only if the database is unreachable, so pages still render.
const fallback: SiteSettings = {
  contact: {
    email: "contact@savytravelservices.tn",
    phone: "",
    fax: "",
    whatsapp: "",
    address: "Tataouine, Tunisie",
    map_query: "",
    manager: "",
    hours: null,
  },
  social: { facebook: "", instagram: "", linkedin: "", tiktok: "" },
  hero: { title: null, subtitle: null, image_url: "" },
  about: { story: null, mission: null, vision: null },
  payments: { konnect_enabled: false, flouci_enabled: false, bank_transfer_enabled: true, bank_transfer_details: null },
  currency: { conversion_enabled: false },
  brand: { logo_url: "", og_image_url: "" },
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return fallback;
  const supabase = await createClient();
  const { data, error } = await supabase.from("website_settings").select("key, value");
  if (error || !data) return fallback;
  const merged: Record<string, unknown> = { ...fallback };
  for (const row of data) {
    const base = (fallback as Record<string, unknown>)[row.key];
    merged[row.key] =
      base && typeof base === "object" && row.value && typeof row.value === "object"
        ? { ...(base as object), ...(row.value as object) }
        : row.value;
  }
  return merged as SiteSettings;
});

export function whatsappLink(number: string, text?: string): string | null {
  const digits = number.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
