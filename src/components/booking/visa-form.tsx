"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createVisaRequest } from "@/lib/actions/booking";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { uploadDocuments, type PendingDocument } from "@/lib/uploads";
import type { FieldErrors } from "@/lib/validation";
import { Button } from "../ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "../ui/field";
import { DocumentPicker } from "./document-picker";

export type VisaOption = { id: string; slug: string; name: string; types: { id: string; name: string; category: string }[] };

const categories = ["tourist", "business", "student", "family", "transit", "work", "medical", "other"] as const;

export function VisaForm({
  countries,
  initialCountry,
  initialType,
  userId,
  today,
  contact,
}: {
  countries: VisaOption[];
  initialCountry?: string;
  initialType?: string;
  userId: string;
  today: string;
  contact: { name: string; email: string; phone: string; nationality: string };
}) {
  const { locale, dict } = useI18n();
  const v = dict.visa;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [countryId, setCountryId] = useState(countries.find((c) => c.slug === initialCountry)?.id ?? "");
  const [typeId, setTypeId] = useState(initialType ?? "");
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const country = countries.find((c) => c.id === countryId);
  const selectedType = useMemo(() => country?.types.find((t) => t.id === typeId), [country, typeId]);
  const err = (k: string) => fieldError(dict, errors[k]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    if (!f.get("consent")) {
      setErrors({ consent: "required" });
      return;
    }
    const payload = {
      country_id: country?.id ?? null,
      visa_type_id: selectedType?.id ?? null,
      destination_country: country ? country.name : get("destination_country"),
      category: selectedType?.category ?? get("category"),
      nationality: get("nationality"),
      travel_date: get("travel_date"),
      travelers: get("travelers") || "1",
      message: get("message"),
      contact_name: get("contact_name"),
      contact_email: get("contact_email"),
      contact_phone: get("contact_phone"),
    };
    start(async () => {
      setErrors({});
      const res = await createVisaRequest(payload, locale);
      if (res.status !== "success" || !res.data) {
        setErrors(res.fieldErrors ?? {});
        toast.error(lookup(dict, res.message ?? "errors.generic"));
        return;
      }
      if (docs.length) {
        const { failed } = await uploadDocuments(userId, { visaRequestId: res.data.id }, docs);
        if (failed) toast.warning(dict.booking.uploadFailed);
      }
      toast.success(fmtSuccess(dict.booking.successText, res.data.reference));
      router.push(`/${locale}/account/visa`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={v.country} name="country_id">
          <Select id="country_id" value={countryId} onChange={(e) => { setCountryId(e.target.value); setTypeId(""); }}>
            <option value="">{v.otherCountry}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {country ? (
          country.types.length ? (
            <Field label={v.category} name="visa_type_id">
              <Select id="visa_type_id" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">—</option>
                {country.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null
        ) : (
          <Field label={v.country} name="destination_country" error={err("destination_country")}>
            <Input id="destination_country" name="destination_country" maxLength={120} required />
          </Field>
        )}
        {!selectedType ? (
          <Field label={v.category} name="category" error={err("category")}>
            <Select id="category" name="category" defaultValue="tourist">
              {categories.map((c) => (
                <option key={c} value={c}>
                  {v.categories[c]}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label={v.nationality} name="nationality" error={err("nationality")}>
          <Input id="nationality" name="nationality" defaultValue={contact.nationality} maxLength={80} required />
        </Field>
        <Field label={v.travelDate} name="travel_date" error={err("travel_date")} optional={dict.common.optional}>
          <Input id="travel_date" name="travel_date" type="date" min={today} />
        </Field>
        <Field label={v.travelers} name="travelers" error={err("travelers")}>
          <Input id="travelers" name="travelers" type="number" min={1} max={20} defaultValue={1} />
        </Field>
      </div>
      <Field label={v.message} name="message" error={err("message")} optional={dict.common.optional}>
        <Textarea id="message" name="message" rows={4} maxLength={4000} placeholder={v.messagePlaceholder} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="font-display text-2xl">{dict.booking.documents}</legend>
        <DocumentPicker value={docs} onChange={setDocs} />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-2xl">{dict.booking.contact}</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={dict.booking.contactName} name="contact_name" error={err("contact_name")}>
            <Input id="contact_name" name="contact_name" defaultValue={contact.name} autoComplete="name" required />
          </Field>
          <Field label={dict.booking.contactEmail} name="contact_email" error={err("contact_email")}>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={contact.email} autoComplete="email" required />
          </Field>
          <Field label={dict.booking.contactPhone} name="contact_phone" error={err("contact_phone")}>
            <Input id="contact_phone" name="contact_phone" type="tel" dir="ltr" defaultValue={contact.phone} autoComplete="tel" required />
          </Field>
        </div>
        <div>
          <Checkbox name="consent" label={dict.booking.consent} />
          {errors.consent ? <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{err("consent")}</p> : null}
        </div>
      </fieldset>

      <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">{v.disclaimer}</p>
      <Button type="submit" variant="accent" size="lg" pending={pending}>
        {!pending ? <Send className="rtl:-scale-x-100" aria-hidden /> : null}
        {pending ? dict.booking.submitting : v.submit}
      </Button>
    </form>
  );
}

function fmtSuccess(template: string, reference: string) {
  return template.replace("{reference}", reference);
}
