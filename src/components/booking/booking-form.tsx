"use client";

import { Plus, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createBooking } from "@/lib/actions/booking";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { uploadDocuments, type PendingDocument } from "@/lib/uploads";
import type { FieldErrors } from "@/lib/validation";
import { Button } from "../ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "../ui/field";
import { DocumentPicker } from "./document-picker";

export type BookingFormInitial = {
  service_type: "flight" | "hotel" | "package" | "tour" | "business" | "custom";
  package_id?: string | null;
  hotel_id?: string | null;
  room_id?: string | null;
  destination_id?: string | null;
  selectedLabel?: string | null;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  travel_class?: string;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
};

type Passenger = {
  key: string;
  passenger_type: "adult" | "child" | "infant";
  full_name: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  passport_expiry: string;
};

const services = ["flight", "hotel", "package", "tour", "business", "custom"] as const;
const classes = ["economy", "premium_economy", "business", "first"] as const;

export function BookingForm({ initial, userId, today }: { initial: BookingFormInitial; userId: string; today: string }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const b = dict.booking;
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [service, setService] = useState(initial.service_type);
  const [departure, setDeparture] = useState(initial.departure_date ?? "");
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const lockedSelection = Boolean(initial.package_id || initial.hotel_id);

  const err = (name: string) => fieldError(dict, errors[name]);
  const aria = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

  function addPassenger() {
    setPassengers((list) => [
      ...list,
      { key: crypto.randomUUID(), passenger_type: "adult", full_name: "", date_of_birth: "", nationality: "", passport_number: "", passport_expiry: "" },
    ]);
  }
  function updatePassenger(key: string, patch: Partial<Passenger>) {
    setPassengers((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    if (!form.get("consent")) {
      setErrors({ consent: "required" });
      toast.error(dict.errors.validation);
      return;
    }
    const payload = {
      service_type: service,
      package_id: initial.package_id ?? null,
      hotel_id: initial.hotel_id ?? null,
      room_id: initial.room_id ?? null,
      destination_id: initial.destination_id ?? null,
      origin: get("origin"),
      destination: get("destination"),
      departure_date: get("departure_date"),
      return_date: get("return_date"),
      adults: get("adults") || "1",
      children: get("children") || "0",
      infants: get("infants") || "0",
      rooms: service === "hotel" ? get("rooms") || "1" : null,
      travel_class: service === "flight" ? get("travel_class") || "economy" : null,
      budget: get("budget") ? get("budget") : null,
      notes: get("notes"),
      contact_name: get("contact_name"),
      contact_email: get("contact_email"),
      contact_phone: get("contact_phone"),
      passengers: passengers
        .filter((p) => p.full_name.trim())
        .map((p) => ({
          passenger_type: p.passenger_type,
          full_name: p.full_name,
          date_of_birth: p.date_of_birth,
          nationality: p.nationality,
          passport_number: p.passport_number,
          passport_expiry: p.passport_expiry,
        })),
    };

    startTransition(async () => {
      setPhase("saving");
      setErrors({});
      const result = await createBooking(payload, locale);
      if (result.status !== "success" || !result.data) {
        setPhase("idle");
        setErrors(result.fieldErrors ?? {});
        toast.error(lookup(dict, result.message ?? "errors.generic"));
        const first = Object.keys(result.fieldErrors ?? {})[0];
        if (first) document.getElementsByName(first)[0]?.focus();
        return;
      }
      if (docs.length) {
        setPhase("uploading");
        const { failed } = await uploadDocuments(userId, { bookingId: result.data.id }, docs);
        if (failed) toast.warning(b.uploadFailed);
      }
      toast.success(b.successTitle);
      router.push(`/${locale}/account/bookings/${result.data.reference}?new=1`);
    });
  }

  const busy = pending || phase !== "idle";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {/* Service */}
      <fieldset className="space-y-4">
        <legend className="font-display text-2xl">{b.service}</legend>
        {lockedSelection && initial.selectedLabel ? (
          <p className="rounded-xl border border-gold/30 bg-gold-soft/50 px-4 py-3 text-sm">
            <span className="font-semibold">{b.selected} · </span>
            {initial.selectedLabel}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={b.service}>
            {services.map((s) => (
              <label
                key={s}
                className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-sand"
              >
                <input type="radio" name="service_type" value={s} checked={service === s} onChange={() => setService(s)} className="sr-only" />
                {b.services[s]}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {/* Trip */}
      <fieldset className="space-y-5">
        <legend className="font-display text-2xl">{b.trip}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {service === "flight" ? (
            <Field label={b.origin} name="origin" error={err("origin")}>
              <Input id="origin" name="origin" defaultValue={initial.origin} maxLength={120} required {...aria("origin")} />
            </Field>
          ) : null}
          {!lockedSelection ? (
            <Field label={b.destination} name="destination" error={err("destination")} className={service === "flight" ? "" : "sm:col-span-2"}>
              <Input id="destination" name="destination" defaultValue={initial.destination} maxLength={120} required {...aria("destination")} />
            </Field>
          ) : null}
          <Field label={service === "hotel" ? dict.search.checkIn : b.departureDate} name="departure_date" error={err("departure_date")}>
            <Input
              id="departure_date"
              type="date"
              name="departure_date"
              min={today}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              {...aria("departure_date")}
            />
          </Field>
          <Field label={service === "hotel" ? dict.search.checkOut : b.returnDate} name="return_date" error={err("return_date")} optional={dict.common.optional}>
            <Input id="return_date" type="date" name="return_date" min={departure || today} defaultValue={initial.return_date} {...aria("return_date")} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          <Field label={dict.common.adults} name="adults" error={err("adults")}>
            <Input id="adults" type="number" name="adults" min={1} max={20} defaultValue={initial.adults ?? 2} />
          </Field>
          <Field label={dict.common.children} name="children" error={err("children")}>
            <Input id="children" type="number" name="children" min={0} max={20} defaultValue={initial.children ?? 0} />
          </Field>
          <Field label={dict.common.infants} name="infants" error={err("infants")}>
            <Input id="infants" type="number" name="infants" min={0} max={10} defaultValue={initial.infants ?? 0} />
          </Field>
          {service === "hotel" ? (
            <Field label={dict.common.rooms} name="rooms" error={err("rooms")}>
              <Input id="rooms" type="number" name="rooms" min={1} max={20} defaultValue={initial.rooms ?? 1} />
            </Field>
          ) : null}
          {service === "flight" ? (
            <Field label={b.travelClass} name="travel_class" className="col-span-3 sm:col-span-1">
              <Select id="travel_class" name="travel_class" defaultValue={initial.travel_class ?? "economy"}>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {dict.search.classes[c]}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
          <Field label={`${b.budget} (TND)`} name="budget" error={err("budget")} optional={dict.common.optional}>
            <Input id="budget" type="number" name="budget" min={0} step="1" inputMode="numeric" />
          </Field>
          <Field label={b.notes} name="notes" error={err("notes")} optional={dict.common.optional}>
            <Textarea id="notes" name="notes" rows={3} maxLength={4000} defaultValue={initial.notes} placeholder={b.notesPlaceholder} />
          </Field>
        </div>
      </fieldset>

      {/* Passengers */}
      <fieldset className="space-y-4">
        <legend className="font-display text-2xl">{b.passengers}</legend>
        <p className="text-sm text-ink-muted">{b.passengersHint}</p>
        {passengers.map((p, i) => (
          <div key={p.key} className="rounded-2xl border border-line bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">
                {b.passengers} {i + 1}
              </p>
              <button
                type="button"
                onClick={() => setPassengers((list) => list.filter((x) => x.key !== p.key))}
                className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
              >
                <Trash2 className="size-3.5" aria-hidden /> {b.removePassenger}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={b.fullName} name={`passengers.${i}.full_name`} error={err(`passengers.${i}.full_name`)} className="sm:col-span-2">
                <Input id={`passengers.${i}.full_name`} value={p.full_name} onChange={(e) => updatePassenger(p.key, { full_name: e.target.value })} maxLength={120} />
              </Field>
              <Field label={`${b.passengerTypes.adult} / ${b.passengerTypes.child} / ${b.passengerTypes.infant}`} name={`pt-${p.key}`}>
                <Select
                  id={`pt-${p.key}`}
                  value={p.passenger_type}
                  onChange={(e) => updatePassenger(p.key, { passenger_type: e.target.value as Passenger["passenger_type"] })}
                >
                  {(["adult", "child", "infant"] as const).map((t) => (
                    <option key={t} value={t}>
                      {b.passengerTypes[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={b.dateOfBirth} name={`dob-${p.key}`} optional={dict.common.optional}>
                <Input id={`dob-${p.key}`} type="date" max={today} value={p.date_of_birth} onChange={(e) => updatePassenger(p.key, { date_of_birth: e.target.value })} />
              </Field>
              <Field label={b.nationality} name={`nat-${p.key}`} optional={dict.common.optional}>
                <Input id={`nat-${p.key}`} value={p.nationality} maxLength={80} onChange={(e) => updatePassenger(p.key, { nationality: e.target.value })} />
              </Field>
              <Field label={b.passportNumber} name={`pp-${p.key}`} optional={dict.common.optional}>
                <Input id={`pp-${p.key}`} value={p.passport_number} maxLength={30} onChange={(e) => updatePassenger(p.key, { passport_number: e.target.value })} />
              </Field>
              <Field label={b.passportExpiry} name={`ppx-${p.key}`} optional={dict.common.optional}>
                <Input id={`ppx-${p.key}`} type="date" min={today} value={p.passport_expiry} onChange={(e) => updatePassenger(p.key, { passport_expiry: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPassenger} disabled={passengers.length >= 30}>
          <Plus aria-hidden /> {b.addPassenger}
        </Button>
      </fieldset>

      {/* Documents */}
      <fieldset className="space-y-4">
        <legend className="font-display text-2xl">{b.documents}</legend>
        <DocumentPicker value={docs} onChange={setDocs} />
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-5">
        <legend className="font-display text-2xl">{b.contact}</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={b.contactName} name="contact_name" error={err("contact_name")}>
            <Input id="contact_name" name="contact_name" autoComplete="name" defaultValue={initial.contact_name} required maxLength={120} {...aria("contact_name")} />
          </Field>
          <Field label={b.contactEmail} name="contact_email" error={err("contact_email")}>
            <Input id="contact_email" type="email" name="contact_email" autoComplete="email" defaultValue={initial.contact_email} required {...aria("contact_email")} />
          </Field>
          <Field label={b.contactPhone} name="contact_phone" error={err("contact_phone")}>
            <Input id="contact_phone" type="tel" name="contact_phone" autoComplete="tel" dir="ltr" defaultValue={initial.contact_phone} required {...aria("contact_phone")} />
          </Field>
        </div>
        <div>
          <Checkbox name="consent" label={b.consent} aria-invalid={errors.consent ? true : undefined} />
          {errors.consent ? <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{err("consent")}</p> : null}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{b.noPaymentNote}</p>
        <Button type="submit" variant="accent" size="lg" pending={busy}>
          {!busy ? <Send className="rtl:-scale-x-100" aria-hidden /> : null}
          {phase === "uploading" ? b.uploading : busy ? b.submitting : b.submit}
        </Button>
      </div>
    </form>
  );
}
