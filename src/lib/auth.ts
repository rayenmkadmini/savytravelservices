import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Locale } from "./i18n/config";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type { Row } from "./supabase/types";

export type Profile = Row<"profiles">;

/** The verified signed-in user's profile for this request, or null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  // getUser() validates the token with the Auth server.
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  return profile;
});

export function isAdminRole(role: Profile["role"] | undefined | null): boolean {
  return role === "admin" || role === "super_admin";
}

export async function requireUser(locale: Locale, next: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  return profile;
}

export async function requireAdmin(locale: Locale): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin`)}`);
  if (!isAdminRole(profile.role)) redirect(`/${locale}/account`);
  return profile;
}

/** Guard for server actions: throws instead of redirecting. */
export async function assertAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !isAdminRole(profile.role)) throw new Error("Unauthorized");
  return profile;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
