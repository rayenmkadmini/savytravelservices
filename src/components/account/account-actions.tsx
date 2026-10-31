"use client";

import { CheckCircle2, Star, Upload, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitTestimonial, updateProfile, cancelVisaRequest } from "@/lib/actions/account";
import { cancelBooking } from "@/lib/actions/booking";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { localeNames, locales } from "@/lib/i18n/config";
import { uploadDocuments, type PendingDocument } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { idleState } from "@/lib/validation";
import { DocumentPicker } from "../booking/document-picker";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/field";

export function CancelRequestButton({ reference, kind }: { reference: string; kind: "booking" | "visa" }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      pending={pending}
      className="border-danger/30 text-danger hover:bg-danger-soft"
      onClick={() => {
        if (!window.confirm(dict.account.cancelConfirm)) return;
        start(async () => {
          const res = kind === "booking" ? await cancelBooking(reference, locale) : await cancelVisaRequest(reference, locale);
          if (res.status === "success") {
            toast.success(lookup(dict, res.message));
            router.refresh();
          } else toast.error(lookup(dict, res.message));
        });
      }}
    >
      <XCircle aria-hidden /> {dict.account.cancel}
    </Button>
  );
}

export function UploadMoreDocuments({
  userId,
  target,
}: {
  userId: string;
  target: { bookingId: string } | { visaRequestId: string };
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <DocumentPicker value={docs} onChange={setDocs} />
      {docs.length ? (
        <Button
          type="button"
          variant="accent"
          size="sm"
          pending={pending}
          onClick={() =>
            start(async () => {
              const { uploaded, failed } = await uploadDocuments(userId, target, docs);
              if (failed) toast.error(dict.booking.uploadFailed);
              if (uploaded) toast.success(dict.account.uploaded);
              setDocs([]);
              router.refresh();
            })
          }
        >
          <Upload aria-hidden /> {dict.account.uploadMore}
        </Button>
      ) : null}
    </div>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { full_name: string; phone: string; nationality: string; date_of_birth: string; preferred_locale: Locale; email: string };
}) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(updateProfile, idleState);
  const v = { ...initial, ...state.values };
  const err = (k: string) => fieldError(dict, state.fieldErrors?.[k]);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? (
        <p role={state.status === "success" ? "status" : "alert"} className={cn("rounded-xl px-4 py-3 text-sm", state.status === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {lookup(dict, state.message)}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.auth.fullName} name="full_name" error={err("full_name")}>
          <Input id="full_name" name="full_name" defaultValue={v.full_name} required maxLength={120} />
        </Field>
        <Field label={dict.auth.email} name="email">
          <Input id="email" value={initial.email} disabled readOnly />
        </Field>
        <Field label={dict.auth.phone} name="phone" error={err("phone")} optional={dict.common.optional}>
          <Input id="phone" name="phone" type="tel" dir="ltr" defaultValue={v.phone} />
        </Field>
        <Field label={dict.booking.nationality} name="nationality" error={err("nationality")} optional={dict.common.optional}>
          <Input id="nationality" name="nationality" defaultValue={v.nationality} maxLength={80} />
        </Field>
        <Field label={dict.booking.dateOfBirth} name="date_of_birth" error={err("date_of_birth")} optional={dict.common.optional}>
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={v.date_of_birth} />
        </Field>
        <Field label={dict.account.preferredLanguage} name="preferred_locale">
          <Select id="preferred_locale" name="preferred_locale" defaultValue={v.preferred_locale}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button type="submit" pending={pending}>
        {dict.common.save}
      </Button>
    </form>
  );
}

export function TestimonialForm({ defaultName }: { defaultName: string }) {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState(submitTestimonial, idleState);
  const [rating, setRating] = useState(5);
  const err = (k: string) => fieldError(dict, state.fieldErrors?.[k]);
  if (state.status === "success") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
        <CheckCircle2 className="size-4" aria-hidden /> {lookup(dict, state.message)}
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1.5 text-[0.8rem] font-semibold text-ink-soft">{dict.account.rating}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`} aria-pressed={rating === n} className="text-gold">
              <Star className={cn("size-6", n <= rating ? "fill-current" : "opacity-30")} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.auth.fullName} name="author_name" error={err("author_name")}>
          <Input id="author_name" name="author_name" defaultValue={state.values?.author_name ?? defaultName} maxLength={120} />
        </Field>
        <Field label={dict.account.location} name="author_location" optional={dict.common.optional}>
          <Input id="author_location" name="author_location" defaultValue={state.values?.author_location} maxLength={120} />
        </Field>
      </div>
      <Field label={dict.account.yourReview} name="content" error={err("content")}>
        <Textarea id="content" name="content" rows={4} maxLength={1500} defaultValue={state.values?.content} />
      </Field>
      {state.message && state.status === "error" ? <p className="text-sm text-danger">{lookup(dict, state.message)}</p> : null}
      <Button type="submit" variant="accent" pending={pending}>
        {dict.common.submit}
      </Button>
    </form>
  );
}
