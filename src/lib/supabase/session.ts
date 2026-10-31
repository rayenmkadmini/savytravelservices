import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Refresh the Supabase auth session from the proxy so Server Components
 * always see a valid token. Returns the user id (or null).
 */
export async function refreshSession(request: NextRequest, response: NextResponse): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
