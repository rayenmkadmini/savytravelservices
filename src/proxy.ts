import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { refreshSession } from "@/lib/supabase/session";

function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((r) => isLocale(r.lang));
  return match ? (match.lang as Locale) : defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segment = pathname.split("/")[1];

  if (!isLocale(segment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  if (request.cookies.get(LOCALE_COOKIE)?.value !== segment) {
    response.cookies.set(LOCALE_COOKIE, segment, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  const userId = await refreshSession(request, response);

  // Optimistic gate only — pages and RLS perform the real authorization.
  const rest = pathname.slice(segment.length + 1);
  if (!userId && (rest.startsWith("/account") || rest.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segment}/login`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, auth callback and static files.
    "/((?!api|auth|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};

