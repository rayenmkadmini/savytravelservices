import "server-only";

/**
 * Tunisian payment providers. Both work in millimes (1 TND = 1000 millimes)
 * and both are verified server-side by querying the provider API — redirects
 * and webhook calls are treated only as hints to re-check.
 *
 * Konnect  https://docs.konnect.network        env: KONNECT_API_KEY, KONNECT_WALLET_ID, KONNECT_ENV
 * Flouci   https://docs.flouci.com             env: FLOUCI_APP_TOKEN, FLOUCI_APP_SECRET, FLOUCI_API_BASE
 *
 * Endpoint shapes follow the providers' published APIs; confirm them against
 * your merchant account documentation before going live (KONNECT_API_BASE /
 * FLOUCI_API_BASE can override the defaults).
 */

export type OnlineProvider = "konnect" | "flouci";

export type InitInput = {
  paymentId: string;
  amountTnd: number;
  description: string;
  customer: { name: string; email: string; phone: string };
  successUrl: string;
  failUrl: string;
  webhookUrl: string;
};

export type InitResult = { url: string; providerPaymentId: string; raw: unknown };

export type VerifyResult = {
  status: "completed" | "pending" | "failed";
  /** Amount confirmed by the provider, in millimes (when reported). */
  amountMillimes: number | null;
  orderId: string | null;
  raw: unknown;
};

export function toMillimes(amountTnd: number): number {
  return Math.round(amountTnd * 1000);
}

export function isProviderConfigured(provider: OnlineProvider): boolean {
  if (provider === "konnect") return Boolean(process.env.KONNECT_API_KEY && process.env.KONNECT_WALLET_ID);
  return Boolean(process.env.FLOUCI_APP_TOKEN && process.env.FLOUCI_APP_SECRET);
}

// ---------------------------------------------------------------- Konnect

function konnectBase(): string {
  if (process.env.KONNECT_API_BASE) return process.env.KONNECT_API_BASE.replace(/\/$/, "");
  return process.env.KONNECT_ENV === "production"
    ? "https://api.konnect.network/api/v2"
    : "https://api.preprod.konnect.network/api/v2";
}

async function konnectInit(input: InitInput): Promise<InitResult> {
  const [firstName, ...rest] = input.customer.name.trim().split(/\s+/);
  const res = await fetch(`${konnectBase()}/payments/init-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.KONNECT_API_KEY! },
    body: JSON.stringify({
      receiverWalletId: process.env.KONNECT_WALLET_ID,
      token: "TND",
      amount: toMillimes(input.amountTnd),
      type: "immediate",
      description: input.description.slice(0, 280),
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      lifespan: 60 * 24,
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      phoneNumber: input.customer.phone.replace(/[^\d+]/g, ""),
      email: input.customer.email,
      orderId: input.paymentId,
      webhook: input.webhookUrl,
      silentWebhook: true,
      successUrl: input.successUrl,
      failUrl: input.failUrl,
      theme: "light",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { payUrl?: string; paymentRef?: string };
  if (!res.ok || !json.payUrl || !json.paymentRef) {
    throw new Error(`Konnect init failed (${res.status})`);
  }
  return { url: json.payUrl, providerPaymentId: json.paymentRef, raw: json };
}

async function konnectVerify(providerPaymentId: string): Promise<VerifyResult> {
  const res = await fetch(`${konnectBase()}/payments/${encodeURIComponent(providerPaymentId)}`, {
    headers: { "x-api-key": process.env.KONNECT_API_KEY! },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Konnect verify failed (${res.status})`);
  const json = (await res.json()) as {
    payment?: { status?: string; amount?: number; token?: string; orderId?: string; failedTransactions?: number };
  };
  const p = json.payment ?? {};
  const status = p.status === "completed" ? "completed" : p.status === "pending" ? "pending" : "failed";
  if (p.token && p.token !== "TND") return { status: "failed", amountMillimes: null, orderId: p.orderId ?? null, raw: json };
  return { status, amountMillimes: typeof p.amount === "number" ? p.amount : null, orderId: p.orderId ?? null, raw: json };
}

// ---------------------------------------------------------------- Flouci

function flouciBase(): string {
  return (process.env.FLOUCI_API_BASE ?? "https://developers.flouci.com/api").replace(/\/$/, "");
}

async function flouciInit(input: InitInput): Promise<InitResult> {
  const res = await fetch(`${flouciBase()}/generate_payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_token: process.env.FLOUCI_APP_TOKEN,
      app_secret: process.env.FLOUCI_APP_SECRET,
      amount: String(toMillimes(input.amountTnd)),
      accept_card: "true",
      session_timeout_secs: 60 * 60,
      success_link: input.successUrl,
      fail_link: input.failUrl,
      developer_tracking_id: input.paymentId,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { result?: { success?: boolean; payment_id?: string; link?: string } };
  if (!res.ok || !json.result?.link || !json.result.payment_id) {
    throw new Error(`Flouci init failed (${res.status})`);
  }
  return { url: json.result.link, providerPaymentId: json.result.payment_id, raw: json };
}

async function flouciVerify(providerPaymentId: string): Promise<VerifyResult> {
  const res = await fetch(`${flouciBase()}/verify_payment/${encodeURIComponent(providerPaymentId)}`, {
    headers: {
      "Content-Type": "application/json",
      apppublic: process.env.FLOUCI_APP_TOKEN!,
      appsecret: process.env.FLOUCI_APP_SECRET!,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Flouci verify failed (${res.status})`);
  const json = (await res.json()) as {
    success?: boolean;
    result?: { status?: string; amount?: number | string; developer_tracking_id?: string };
  };
  const r = json.result ?? {};
  const status = r.status === "SUCCESS" ? "completed" : r.status === "PENDING" ? "pending" : "failed";
  const amount = r.amount !== undefined ? Number(r.amount) : null;
  return { status, amountMillimes: Number.isFinite(amount) ? amount : null, orderId: r.developer_tracking_id ?? null, raw: json };
}

export const providers = {
  konnect: { init: konnectInit, verify: konnectVerify },
  flouci: { init: flouciInit, verify: flouciVerify },
} satisfies Record<OnlineProvider, { init: (i: InitInput) => Promise<InitResult>; verify: (id: string) => Promise<VerifyResult> }>;

/**
 * Decide the final status of a payment from a provider verification.
 * A "completed" answer is accepted only if amount and order id match what we
 * asked for — otherwise it is treated as failed (possible tampering).
 */
export function reconcile(
  expected: { paymentId: string; amountTnd: number },
  result: VerifyResult,
): "completed" | "pending" | "failed" {
  if (result.status !== "completed") return result.status;
  if (result.orderId && result.orderId !== expected.paymentId) return "failed";
  if (result.amountMillimes === null || result.amountMillimes !== toMillimes(expected.amountTnd)) return "failed";
  return "completed";
}
