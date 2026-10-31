"use client";

import { RefreshCw } from "lucide-react";
import { refreshExchangeRates, saveSetting, setManualRate } from "@/lib/actions/admin-ops";
import type { SiteSettings } from "@/lib/data/settings";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/utils";
import { Button } from "../ui/button";
import { Checkbox, Input, Label, Select, Textarea } from "../ui/field";
import { ImageField } from "./resource-form";
import { Panel } from "./page-header";
import { ActionButton, AdminForm } from "./ui";

const LOCALES = ["fr", "en", "ar"] as const;

function I18nInputs({ name, label, value, multiline }: { name: string; label: string; value: unknown; multiline?: boolean }) {
  const v = (value ?? {}) as Record<string, string>;
  return (
    <fieldset>
      <legend className="mb-1.5 text-[0.8rem] font-semibold text-ink-soft">{label}</legend>
      <div className={multiline ? "space-y-2" : "grid gap-2 sm:grid-cols-3"}>
        {LOCALES.map((l) =>
          multiline ? (
            <Textarea key={l} name={`${name}.${l}`} defaultValue={v[l] ?? ""} dir={l === "ar" ? "rtl" : "ltr"} rows={3} aria-label={`${label} ${l.toUpperCase()}`} placeholder={l.toUpperCase()} />
          ) : (
            <Input key={l} name={`${name}.${l}`} defaultValue={v[l] ?? ""} dir={l === "ar" ? "rtl" : "ltr"} aria-label={`${label} ${l.toUpperCase()}`} placeholder={l.toUpperCase()} />
          ),
        )}
      </div>
    </fieldset>
  );
}

function TextInput({ name, label, value, ltr }: { name: string; label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={value} dir={ltr ? "ltr" : undefined} />
    </div>
  );
}

function SettingForm({ settingKey, title, booleans = [], children }: { settingKey: string; title: string; booleans?: string[]; children: React.ReactNode }) {
  const { dict } = useI18n();
  return (
    <Panel title={title}>
      <AdminForm action={saveSetting.bind(null, settingKey)} className="space-y-4">
        {(_s, pending) => (
          <>
            <input type="hidden" name="__booleans" value={booleans.join(",")} />
            {children}
            <Button type="submit" variant="accent" size="sm" pending={pending}>
              {dict.common.save}
            </Button>
          </>
        )}
      </AdminForm>
    </Panel>
  );
}

export function SettingsForms({
  settings,
  rates,
  integrations,
}: {
  settings: SiteSettings;
  rates: { currency: string; tnd_per_unit: number; source: string; fetched_at: string }[];
  integrations: { label: string; ok: boolean }[];
}) {
  const { dict } = useI18n();
  const s = dict.admin.settings_;
  const f = dict.admin.fields;
  const c = settings.contact;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SettingForm settingKey="contact" title={s.contact}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="email" label={f.email} value={c.email} ltr />
          <TextInput name="phone" label={f.phone} value={c.phone} ltr />
          <TextInput name="fax" label={dict.contact.fax} value={c.fax} ltr />
          <TextInput name="whatsapp" label="WhatsApp (+216…)" value={c.whatsapp} ltr />
          <TextInput name="manager" label={dict.contact.manager} value={c.manager} />
          <TextInput name="map_query" label={dict.contact.mapTitle} value={c.map_query} />
        </div>
        <TextInput name="address" label={f.address} value={c.address} />
        <I18nInputs name="hours" label={dict.contact.hours} value={c.hours} />
      </SettingForm>

      <SettingForm settingKey="hero" title={s.hero}>
        <I18nInputs name="title" label={f.title} value={settings.hero.title} />
        <I18nInputs name="subtitle" label={f.summary} value={settings.hero.subtitle} multiline />
        <ImageField name="image_url" label={f.image} initial={settings.hero.image_url} />
        <TextInput name="image_credit" label={f.imageCredit} value={settings.hero.image_credit ?? ""} />
      </SettingForm>

      <SettingForm settingKey="about" title={s.about}>
        <I18nInputs name="story" label={dict.about.story} value={settings.about.story} multiline />
        <I18nInputs name="mission" label={dict.about.mission} value={settings.about.mission} multiline />
        <I18nInputs name="vision" label={dict.about.vision} value={settings.about.vision} multiline />
      </SettingForm>

      <div className="space-y-6">
        <SettingForm settingKey="social" title={s.social}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["facebook", "instagram", "linkedin", "tiktok"] as const).map((k) => (
              <TextInput key={k} name={k} label={k} value={settings.social[k] ?? ""} ltr />
            ))}
          </div>
        </SettingForm>
        <SettingForm settingKey="brand" title={s.brand}>
          <ImageField name="logo_url" label="Logo" initial={settings.brand.logo_url} />
          <ImageField name="og_image_url" label="Open Graph (1200×630)" initial={settings.brand.og_image_url} />
        </SettingForm>
      </div>

      <SettingForm settingKey="payments" title={s.payments} booleans={["konnect_enabled", "flouci_enabled", "bank_transfer_enabled"]}>
        <p className="text-xs text-ink-muted">{s.secretsNote}</p>
        <ul className="flex flex-wrap gap-2 text-xs">
          {integrations.map((i) => (
            <li key={i.label} className={`rounded-full px-3 py-1 font-semibold ${i.ok ? "bg-success-soft text-success" : "bg-sand-deep text-ink-muted"}`}>
              {i.label}: {i.ok ? s.configured : s.notConfigured}
            </li>
          ))}
        </ul>
        <Checkbox name="konnect_enabled" defaultChecked={settings.payments.konnect_enabled} label="Konnect" />
        <Checkbox name="flouci_enabled" defaultChecked={settings.payments.flouci_enabled} label="Flouci" />
        <Checkbox name="bank_transfer_enabled" defaultChecked={settings.payments.bank_transfer_enabled} label={dict.account.bankTransfer} />
        <I18nInputs name="bank_transfer_details" label={`${dict.account.bankTransfer} (RIB / IBAN)`} value={settings.payments.bank_transfer_details} multiline />
      </SettingForm>

      <Panel title={s.currency}>
        <AdminForm action={saveSetting.bind(null, "currency")} className="space-y-3">
          {(_s, pending) => (
            <>
              <input type="hidden" name="__booleans" value="conversion_enabled" />
              <Checkbox name="conversion_enabled" defaultChecked={settings.currency.conversion_enabled} label={s.conversionEnabled} />
              <Button type="submit" size="sm" variant="accent" pending={pending}>
                {dict.common.save}
              </Button>
            </>
          )}
        </AdminForm>
        <div className="mt-6 border-t border-line pt-5">
          {rates.length ? (
            <ul className="space-y-1 text-sm">
              {rates.map((r) => (
                <li key={r.currency}>
                  <strong>1 {r.currency}</strong> = {Number(r.tnd_per_unit).toFixed(4)} TND
                  <span className="ms-2 text-xs text-ink-muted">{fmt(s.ratesSource, { source: r.source, date: r.fetched_at.slice(0, 16).replace("T", " ") })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">{s.noRates}</p>
          )}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <ActionButton action={refreshExchangeRates}>
              <RefreshCw aria-hidden /> {s.refreshRates}
            </ActionButton>
          </div>
          <AdminForm action={setManualRate} className="mt-4 grid grid-cols-[6rem_1fr_auto] items-end gap-2">
            {(_st, pending) => (
              <>
                <div>
                  <Label htmlFor="rate-currency">{f.currency}</Label>
                  <Select id="rate-currency" name="currency">
                    <option>EUR</option>
                    <option>USD</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rate">{fmt(s.rate, { currency: "EUR/USD" })}</Label>
                  <Input id="rate" name="rate" type="number" step="0.0001" min="0.0001" />
                </div>
                <Button type="submit" size="sm" variant="outline" pending={pending} className="h-11">
                  {dict.common.save}
                </Button>
              </>
            )}
          </AdminForm>
        </div>
      </Panel>
    </div>
  );
}
