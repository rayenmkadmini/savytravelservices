import "server-only";
import type { Json } from "../supabase/database.types";
import { createAdminClient } from "../supabase/admin";
import { isProviderConfigured, providers, reconcile, type OnlineProvider } from "./providers";

export type VerificationOutcome = {
  status: "completed" | "pending" | "failed" | "unknown";
  bookingReference?: string;
};

/**
 * Re-check an online payment with its provider and persist the verified
 * status using the service role (the only context allowed to mark online
 * payments as completed — see payments_guard in the database).
 */
export async function verifyOnlinePayment(
  provider: OnlineProvider,
  lookup: { providerPaymentId?: string | null; paymentId?: string | null },
): Promise<VerificationOutcome> {
  if (!isProviderConfigured(provider)) return { status: "unknown" };
  const admin = createAdminClient();

  let query = admin
    .from("payments")
    .select("id, status, amount, currency, provider_payment_id, booking:bookings(reference)")
    .eq("provider", provider);
  if (lookup.paymentId) query = query.eq("id", lookup.paymentId);
  else if (lookup.providerPaymentId) query = query.eq("provider_payment_id", lookup.providerPaymentId);
  else return { status: "unknown" };

  const { data: payment } = await query.maybeSingle();
  if (!payment || !payment.provider_payment_id) return { status: "unknown" };
  const bookingReference = (payment.booking as { reference: string } | null)?.reference;

  if (payment.status === "completed") return { status: "completed", bookingReference };
  if (payment.status !== "pending") return { status: "failed", bookingReference };
  if (payment.currency !== "TND") return { status: "failed", bookingReference };

  try {
    const result = await providers[provider].verify(payment.provider_payment_id);
    const status = reconcile({ paymentId: payment.id, amountTnd: Number(payment.amount) }, result);
    if (status !== "pending") {
      await admin
        .from("payments")
        .update({ status, provider_payload: result.raw as Json })
        .eq("id", payment.id)
        .eq("status", "pending");
    }
    return { status, bookingReference };
  } catch (err) {
    console.error(`[payments] ${provider} verification error`, err);
    return { status: "pending", bookingReference };
  }
}
