import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { verifyOnlinePayment } from "@/lib/payments/verify";
import { pageMetadata } from "@/lib/seo";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

export async function generateMetadata({ params }: PageProps<"/[locale]/payment/return">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/payment/return", title: dict.payment.returnTitle, noIndex: true });
}

/**
 * Landing page after the provider's checkout. Whatever the URL says, the
 * status shown here comes from a fresh server-side verification.
 */
export default async function PaymentReturnPage({ params, searchParams }: PageProps<"/[locale]/payment/return">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const provider = sp.provider === "konnect" || sp.provider === "flouci" ? sp.provider : null;
  const paymentId = typeof sp.pid === "string" && /^[0-9a-f-]{36}$/i.test(sp.pid) ? sp.pid : null;

  const outcome =
    provider && paymentId && isServiceRoleConfigured()
      ? await verifyOnlinePayment(provider, { paymentId })
      : { status: "unknown" as const, bookingReference: undefined };

  const view =
    outcome.status === "completed"
      ? { Icon: CheckCircle2, tone: "bg-success-soft text-success", text: dict.payment.success }
      : outcome.status === "pending" || outcome.status === "unknown"
        ? { Icon: Clock, tone: "bg-warning-soft text-warning", text: dict.payment.pending }
        : { Icon: XCircle, tone: "bg-danger-soft text-danger", text: dict.payment.failed };

  return (
    <>
      <PageHero title={dict.payment.returnTitle} compact />
      <div className="container-page py-14">
        <div className={`mx-auto flex max-w-xl items-start gap-3 rounded-[var(--radius-card)] p-6 ${view.tone}`} role="status">
          <view.Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
          <p className="text-base">{view.text}</p>
        </div>
        <div className="mt-8 text-center">
          <ButtonLink
            href={outcome.bookingReference ? `/${locale}/account/bookings/${outcome.bookingReference}` : `/${locale}/account/bookings`}
            variant="primary"
          >
            {dict.payment.backToBooking}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
