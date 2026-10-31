import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { locales } from "@/lib/i18n/config";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

const STATIC_PATHS = ["", "/flights", "/hotels", "/packages", "/destinations", "/visa", "/about", "/contact", "/inspiration", "/privacy", "/terms"];

function entry(path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] {
  return {
    url: siteUrl(`/fr${path}`),
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, siteUrl(`/${l}${path}`)])) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = STATIC_PATHS.map((p) => entry(p, undefined, p === "" ? 1 : 0.8));
  if (!isSupabaseConfigured()) return entries;
  const url = supabaseUrl;
  const key = supabaseAnonKey;

  // Anonymous client: only published content is visible through RLS.
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
  const [destinations, packages, hotels, visa, articles] = await Promise.all([
    supabase.from("destinations").select("slug, updated_at").eq("is_published", true),
    supabase.from("travel_packages").select("slug, updated_at").eq("is_published", true),
    supabase.from("hotels").select("slug, updated_at").eq("is_published", true),
    supabase.from("visa_countries").select("slug, updated_at").eq("is_published", true),
    supabase.from("articles").select("slug, updated_at").eq("is_published", true),
  ]);
  for (const [prefix, rows] of [
    ["/destinations", destinations.data],
    ["/packages", packages.data],
    ["/hotels", hotels.data],
    ["/visa", visa.data],
    ["/inspiration", articles.data],
  ] as const) {
    for (const row of rows ?? []) entries.push(entry(`${prefix}/${row.slug}`, row.updated_at, 0.7));
  }
  return entries;
}
