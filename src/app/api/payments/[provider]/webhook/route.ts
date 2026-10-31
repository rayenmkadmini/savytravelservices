import { NextResponse, type NextRequest } from "next/server";
import { verifyOnlinePayment } from "@/lib/payments/verify";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * Provider notification endpoint. The request body/query is NOT trusted:
 * it only tells us which payment to re-verify against the provider API.
 *   Konnect: GET  /api/payments/konnect/webhook?payment_ref=...
 *   Flouci:  GET  /api/payments/flouci/webhook?payment_id=...
 */
async function handle(request: NextRequest, provider: string) {
  if (provider !== "konnect" && provider !== "flouci") {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const params = request.nextUrl.searchParams;
  let ref = params.get("payment_ref") ?? params.get("payment_id") ?? params.get("id");
  if (!ref && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const candidate = body.payment_ref ?? body.paymentRef ?? body.payment_id;
    ref = typeof candidate === "string" ? candidate : null;
  }
  if (!ref || ref.length > 120) return NextResponse.json({ error: "missing reference" }, { status: 400 });
  const outcome = await verifyOnlinePayment(provider, { providerPaymentId: ref });
  return NextResponse.json({ status: outcome.status });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/payments/[provider]/webhook">) {
  return handle(request, (await ctx.params).provider);
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/payments/[provider]/webhook">) {
  return handle(request, (await ctx.params).provider);
}
