import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "../supabase/env";
import { createClient } from "../supabase/server";
import type { Row } from "../supabase/types";

export type Destination = Row<"destinations">;
type DestinationRef = Pick<Destination, "slug" | "name"> | null;
export type TravelPackage = Row<"travel_packages"> & { destination?: DestinationRef };
export type Hotel = Row<"hotels"> & { destination?: DestinationRef };
export type HotelRoom = Row<"hotel_rooms">;
export type VisaCountry = Row<"visa_countries">;
export type VisaType = Row<"visa_types">;
export type Testimonial = Row<"testimonials">;
export type Article = Row<"articles">;
export type TeamMember = Row<"team_members">;

export type ItineraryDay = {
  day: number;
  title: Record<string, string>;
  description?: Record<string, string>;
};

async function db() {
  if (!isSupabaseConfigured()) return null;
  return createClient();
}

/** Neutralise characters that have meaning inside PostgREST filter strings. */
export function likePattern(q: string): string {
  return `%${q.replace(/[%_\\,()*]/g, " ").trim()}%`;
}

export const listDestinations = cache(async (featured = false, region?: string) => {
  const supabase = await db();
  if (!supabase) return [] as Destination[];
  let query = supabase.from("destinations").select("*").eq("is_published", true);
  if (featured) query = query.eq("is_featured", true);
  if (region) query = query.eq("region", region);
  const { data } = await query.order("sort_order").order("created_at");
  return data ?? [];
});

export const getDestination = cache(async (slug: string) => {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
});

export async function listPackages(
  opts: {
    featured?: boolean;
    destinationId?: string;
    category?: string;
    q?: string;
    limit?: number;
    excludeId?: string;
  } = {},
): Promise<TravelPackage[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase
    .from("travel_packages")
    .select("*, destination:destinations(slug, name)")
    .eq("is_published", true);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.destinationId) query = query.eq("destination_id", opts.destinationId);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.excludeId) query = query.neq("id", opts.excludeId);
  if (opts.q) {
    const p = likePattern(opts.q);
    query = query.or(`title->>fr.ilike.${p},title->>en.ilike.${p},title->>ar.ilike.${p},slug.ilike.${p}`);
  }
  const { data } = await query
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .limit(opts.limit ?? 60);
  return (data ?? []) as TravelPackage[];
}

export const getPackage = cache(async (slug: string) => {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("travel_packages")
    .select("*, destination:destinations(slug, name), images:package_images(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const { images = [], ...rest } = data as TravelPackage & { images?: Row<"package_images">[] };
  return { ...rest, images: [...images].sort((a, b) => a.sort_order - b.sort_order) };
});

export async function listHotels(
  opts: { q?: string; stars?: number; destinationId?: string; featured?: boolean; limit?: number } = {},
): Promise<Hotel[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase
    .from("hotels")
    .select("*, destination:destinations(slug, name)")
    .eq("is_published", true);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.stars) query = query.gte("stars", opts.stars);
  if (opts.destinationId) query = query.eq("destination_id", opts.destinationId);
  if (opts.q) {
    const p = likePattern(opts.q);
    query = query.or(`name.ilike.${p},city.ilike.${p},address.ilike.${p}`);
  }
  const { data } = await query
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .limit(opts.limit ?? 60);
  return (data ?? []) as Hotel[];
}

export const getHotel = cache(async (slug: string) => {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("hotels")
    .select("*, destination:destinations(slug, name), rooms:hotel_rooms(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const { rooms = [], ...rest } = data as Hotel & { rooms?: HotelRoom[] };
  return {
    ...rest,
    rooms: rooms.filter((r) => r.is_published).sort((a, b) => a.sort_order - b.sort_order),
  };
});

export const listVisaCountries = cache(async () => {
  const supabase = await db();
  if (!supabase) return [] as VisaCountry[];
  const { data } = await supabase
    .from("visa_countries")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
});

export const getVisaCountry = cache(async (slug: string) => {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("visa_countries")
    .select("*, types:visa_types(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const { types = [], ...rest } = data as VisaCountry & { types?: VisaType[] };
  return {
    ...rest,
    types: types.filter((t) => t.is_published).sort((a, b) => a.sort_order - b.sort_order),
  };
});

export const listTestimonials = cache(async (limit = 6) => {
  const supabase = await db();
  if (!supabase) return [] as Testimonial[];
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
});

export const listArticles = cache(async (limit = 24) => {
  const supabase = await db();
  if (!supabase) return [] as Article[];
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
});

export const getArticle = cache(async (slug: string) => {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
});

export const listTeam = cache(async () => {
  const supabase = await db();
  if (!supabase) return [] as TeamMember[];
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return data ?? [];
});

export function parseItinerary(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((d): d is ItineraryDay => !!d && typeof d === "object" && "title" in d)
    .map((d, i) => ({ ...d, day: Number(d.day) || i + 1 }))
    .sort((a, b) => a.day - b.day);
}
