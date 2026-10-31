"use client";

import { Copy, Link2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { addNote, cancelPayment, createPaymentLink, recordManualPayment, updateBooking, updateVisaRequest, verifyPayment } from "@/lib/actions/admin-ops";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input, Label, Select, Textarea } from "../ui/field";
import { ActionButton, AdminForm } from "./ui";

const BOOKING_STATUSES = ["pending", "under_review", "confirmed", "rejected", "cancelled"] as const;
const ALLOWED: Record<string, string[]> = {
  pending: ["pending", "under_review", "confirmed", "rejected", "cancelled"],
  under_review: ["under_review", "confirmed", "rejected", "cancelled"],
  confirmed: ["confirmed", "cancelled"],
  rejected: ["rejected"],
  cancelled: ["cancelled"],
};

export function BookingStatusForm({
  bookingId,
  status,
  quotedAmount,
  quotedCurrency,
  message,
}: {
  bookingId: string;
  status: string;
  quotedAmount: string;
  quotedCurrency: string;
  message: string;
}) {
  const { dict } = useI18n();
  const b = dict.admin.booking;
  const options = ALLOWED[status] ?? [status];
  return (
    <AdminForm action={updateBooking.bind(null, bookingId)} className="space-y-4">
      {(_s, pending) => (
        <>
          <div>
            <Label htmlFor="status">{b.setStatus}</Label>
            <Select id="status" name="status" defaultValue={status} disabled={options.length === 1}>
              {BOOKING_STATUSES.filter((s) => options.includes(s)).map((s) => (
                <option key={s} value={s}>
                  {dict.status.booking[s]}
                </option>
              ))}
            </Select>
            {options.length === 1 ? <input type="hidden" name="status" value={status} /> : null}
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <div>
              <Label htmlFor="quoted_amount">{b.quoteAmount}</Label>
              <Input id="quoted_amount" name="quoted_amount" type="number" min={0} step="0.001" defaultValue={quotedAmount} inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="quoted_currency">{b.quoteCurrency}</Label>
              <Select id="quoted_currency" name="quoted_currency" defaultValue={quotedCurrency}>
                {["TND", "EUR", "USD"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="customer_message">{b.messageToCustomer}</Label>
            <Textarea id="customer_message" name="customer_message" rows={4} maxLength={4000} defaultValue={message} />
          </div>
          <Button type="submit" variant="accent" pending={pending} className="w-full">
            {b.update}
          </Button>
        </>
      )}
    </AdminForm>
  );
}

export function VisaStatusForm({ id, status, message, fee }: { id: string; status: string; message: string; fee: string }) {
  const { dict } = useI18n();
  const closed = status === "completed" || status === "cancelled";
  return (
    <AdminForm action={updateVisaRequest.bind(null, id)} className="space-y-4">
      {(_s, pending) => (
        <>
          <div>
            <Label htmlFor="status">{dict.admin.booking.setStatus}</Label>
            <Select id="status" name="status" defaultValue={status} disabled={closed}>
              {(Object.keys(dict.status.visa) as (keyof typeof dict.status.visa)[]).map((s) => (
                <option key={s} value={s}>
                  {dict.status.visa[s]}
                </option>
              ))}
            </Select>
            {closed ? <input type="hidden" name="status" value={status} /> : null}
          </div>
          <div>
            <Label htmlFor="service_fee">{dict.visa.fees} (TND)</Label>
            <Input id="service_fee" name="service_fee" type="number" min={0} step="0.001" defaultValue={fee} />
          </div>
          <div>
            <Label htmlFor="customer_message">{dict.admin.booking.messageToCustomer}</Label>
            <Textarea id="customer_message" name="customer_message" rows={4} maxLength={4000} defaultValue={message} />
          </div>
          <Button type="submit" variant="accent" pending={pending} className="w-full">
            {dict.admin.booking.update}
          </Button>
        </>
      )}
    </AdminForm>
  );
}

export function NoteForm({ target }: { target: { bookingId?: string; visaRequestId?: string } }) {
  const { dict } = useI18n();
  return (
    <AdminForm action={addNote.bind(null, target)} className="space-y-2" resetOnSuccess>
      {(_s, pending) => (
        <>
          <Textarea name="body" rows={3} maxLength={4000} placeholder={dict.admin.booking.notePlaceholder} aria-label={dict.admin.booking.addNote} required />
          <Button type="submit" size="sm" pending={pending}>
            {dict.admin.booking.addNote}
          </Button>
        </>
      )}
    </AdminForm>
  );
}

export function PaymentLinkForm({
  bookingId,
  amount,
  providers,
}: {
  bookingId: string;
  amount: string;
  providers: { konnect: boolean; flouci: boolean };
}) {
  const { dict } = useI18n();
  const b = dict.admin.booking;
  const available = (["konnect", "flouci"] as const).filter((p) => providers[p]);
  if (!available.length) {
    return <p className="text-sm text-ink-muted">{fmt(b.providerNotConfigured, { provider: "Konnect / Flouci" })}</p>;
  }
  return (
    <AdminForm
      action={createPaymentLink.bind(null, bookingId)}
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSuccess={(s) => {
        if (typeof s.data?.url === "string") navigator.clipboard?.writeText(s.data.url).catch(() => undefined);
      }}
    >
      {(_s, pending) => (
        <>
          <div>
            <Label htmlFor="provider">{b.provider}</Label>
            <Select id="provider" name="provider">
              {available.map((p) => (
                <option key={p} value={p}>
                  {p === "konnect" ? "Konnect" : "Flouci"}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="link-amount">{b.amount} (TND)</Label>
            <Input id="link-amount" name="amount" type="number" min={0.001} step="0.001" defaultValue={amount} required />
          </div>
          <Button type="submit" variant="primary" pending={pending} className="h-11">
            <Link2 aria-hidden /> {b.createLink}
          </Button>
        </>
      )}
    </AdminForm>
  );
}

export function ManualPaymentForm({ bookingId, amount, currency }: { bookingId: string; amount: string; currency: string }) {
  const { dict } = useI18n();
  const b = dict.admin.booking;
  return (
    <AdminForm action={recordManualPayment.bind(null, bookingId)} className="space-y-2" resetOnSuccess>
      {(_s, pending) => (
        <>
          <p className="text-xs text-ink-muted">{b.manualNote}</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
            <Select name="provider" aria-label={b.provider}>
              <option value="bank_transfer">Bank transfer / Virement</option>
              <option value="cash">Cash / Espèces</option>
            </Select>
            <Input name="amount" type="number" min={0.001} step="0.001" defaultValue={amount} aria-label={b.amount} required />
            <Select name="currency" defaultValue={currency} aria-label={b.quoteCurrency}>
              {["TND", "EUR", "USD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <Input name="note" maxLength={1000} placeholder="Note" aria-label="Note" />
          <Button type="submit" size="sm" variant="outline" pending={pending}>
            {b.recordManual}
          </Button>
        </>
      )}
    </AdminForm>
  );
}

export function PaymentRowActions({ id, url, online, pending }: { id: string; url: string | null; online: boolean; pending: boolean }) {
  const { dict } = useI18n();
  const b = dict.admin.booking;
  if (!online || !pending) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {url ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(url).then(() => toast.success(dict.admin.media_.copied));
          }}
        >
          <Copy aria-hidden /> {b.copyLink}
        </Button>
      ) : null}
      <ActionButton variant="ghost" action={() => verifyPayment(id)}>
        <RefreshCw aria-hidden /> {b.verify}
      </ActionButton>
      <ActionButton variant="ghost" action={() => cancelPayment(id)} confirm={b.cancelPayment + " ?"}>
        <X aria-hidden /> {b.cancelPayment}
      </ActionButton>
    </div>
  );
}
