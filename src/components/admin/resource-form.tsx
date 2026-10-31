"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { deleteResource, saveResource } from "@/lib/actions/admin-crud";
import { getResource, type FieldDef } from "@/lib/admin/resources";
import { fieldError, lookup, useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import { Button } from "../ui/button";
import { Checkbox, FieldError, Input, Label, Select, Textarea } from "../ui/field";
import { ActionButton, AdminForm } from "./ui";

type Row = Record<string, unknown>;
export type ReferenceOptions = Record<string, { id: string; label: string }[]>;

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
] as const;

export function ResourceForm({
  resourceKey,
  id,
  initial,
  references,
}: {
  resourceKey: string;
  id: string | null;
  initial: Row;
  references: ReferenceOptions;
}) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const def = getResource(resourceKey)!;
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const slugRef = useRef<HTMLInputElement>(null);

  return (
    <AdminForm
      action={saveResource.bind(null, resourceKey, id)}
      className="space-y-6"
      onSuccess={(state) => {
        if (!id && state.data?.id) router.replace(`/${locale}/admin/content/${resourceKey}/${state.data.id}`);
      }}
    >
      {(state, pending) => (
        <>
          <div className="grid gap-5 rounded-2xl border border-line bg-paper p-5 sm:p-6 lg:grid-cols-2">
            {def.fields.map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={initial[field.name]}
                errors={state.fieldErrors ?? {}}
                references={references}
                onTitleChange={(v) => {
                  if (!slugTouched && slugRef.current && (field.name === def.labelField || field.name === "name" || field.name === "title")) {
                    slugRef.current.value = slugify(v);
                  }
                }}
                slugRef={field.type === "slug" ? slugRef : undefined}
                onSlugEdit={() => setSlugTouched(true)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" variant="accent" pending={pending}>
              {dict.common.save}
            </Button>
            {id ? (
              <ActionButton
                variant="danger"
                confirm={dict.admin.confirmDelete}
                action={() => deleteResource(resourceKey, id)}
                onDone={(res) => res.status === "success" && router.push(`/${locale}/admin/content/${resourceKey}`)}
              >
                <Trash2 aria-hidden /> {dict.common.delete}
              </ActionButton>
            ) : null}
          </div>
          {state.status === "error" && state.message ? <p className="text-sm text-danger">{lookup(dict, state.message)}</p> : null}
        </>
      )}
    </AdminForm>
  );
}

function FieldInput({
  field,
  value,
  errors,
  references,
  onTitleChange,
  slugRef,
  onSlugEdit,
}: {
  field: FieldDef;
  value: unknown;
  errors: Record<string, string>;
  references: ReferenceOptions;
  onTitleChange: (v: string) => void;
  slugRef?: React.RefObject<HTMLInputElement | null>;
  onSlugEdit: () => void;
}) {
  const { dict } = useI18n();
  const f = dict.admin.fields;
  const label = f[field.label] as string;
  const err = (key = field.name) => fieldError(dict, errors[key]);
  const wide = ["i18nTextarea", "itinerary", "textarea", "lines", "image"].includes(field.type);

  switch (field.type) {
    case "i18n":
    case "i18nTextarea": {
      const v = (value ?? {}) as Record<string, string>;
      return (
        <fieldset className={cn(wide && "lg:col-span-2")}>
          <legend className="mb-1.5 text-[0.8rem] font-semibold text-ink-soft">
            {label}
            {"required" in field && field.required ? " *" : ""}
          </legend>
          <div className={cn("grid gap-2", field.type === "i18n" ? "sm:grid-cols-3" : "")}>
            {LOCALES.map((l) => (
              <div key={l.code} className="relative">
                <span className="pointer-events-none absolute end-2 top-2 rounded bg-sand px-1.5 text-[0.6rem] font-bold text-ink-muted">{l.label}</span>
                {field.type === "i18n" ? (
                  <Input
                    name={`${field.name}.${l.code}`}
                    defaultValue={v[l.code] ?? ""}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                    lang={l.code}
                    maxLength={field.max}
                    aria-label={`${label} ${l.label}`}
                    aria-invalid={errors[`${field.name}.${l.code}`] ? true : undefined}
                    onChange={l.code === "fr" ? (e) => onTitleChange(e.target.value) : undefined}
                  />
                ) : (
                  <Textarea
                    name={`${field.name}.${l.code}`}
                    defaultValue={v[l.code] ?? ""}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                    lang={l.code}
                    rows={field.max && field.max > 3000 ? 7 : 3}
                    maxLength={field.max}
                    aria-label={`${label} ${l.label}`}
                    aria-invalid={errors[`${field.name}.${l.code}`] ? true : undefined}
                  />
                )}
                <FieldError message={err(`${field.name}.${l.code}`)} />
              </div>
            ))}
          </div>
        </fieldset>
      );
    }
    case "text":
    case "date":
    case "slug":
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {"required" in field && field.required ? " *" : ""}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type === "date" ? "date" : "text"}
            defaultValue={(value as string) ?? ""}
            maxLength={"max" in field ? field.max : undefined}
            ref={slugRef}
            dir={field.type === "slug" ? "ltr" : undefined}
            aria-invalid={errors[field.name] ? true : undefined}
            onChange={(e) => {
              if (field.type === "slug") onSlugEdit();
              else if (field.name === "name" || field.name === "full_name" || field.name === "author_name") onTitleChange(e.target.value);
            }}
          />
          <FieldError message={err()} />
        </div>
      );
    case "textarea":
      return (
        <div className="lg:col-span-2">
          <Label htmlFor={field.name}>{label}</Label>
          <Textarea id={field.name} name={field.name} defaultValue={(value as string) ?? ""} maxLength={field.max} rows={4} />
          <FieldError message={err()} />
        </div>
      );
    case "number":
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {field.required ? " *" : ""}
          </Label>
          <Input
            id={field.name}
            name={field.name}
            type="number"
            inputMode="decimal"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            defaultValue={value === null || value === undefined ? "" : String(value)}
            aria-invalid={errors[field.name] ? true : undefined}
          />
          <FieldError message={err()} />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-end pb-2">
          <Checkbox name={field.name} defaultChecked={Boolean(value)} label={label} />
        </div>
      );
    case "select": {
      const labels = field.optionLabels ? (lookupObject(dict, field.optionLabels) as Record<string, string>) : null;
      return (
        <div>
          <Label htmlFor={field.name}>{label}</Label>
          <Select id={field.name} name={field.name} defaultValue={(value as string) ?? field.options[0]}>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {labels?.[o] ?? o}
              </option>
            ))}
          </Select>
          <FieldError message={err()} />
        </div>
      );
    }
    case "reference":
      return (
        <div>
          <Label htmlFor={field.name}>
            {label}
            {field.required ? " *" : ""}
          </Label>
          <Select id={field.name} name={field.name} defaultValue={(value as string) ?? ""} aria-invalid={errors[field.name] ? true : undefined}>
            <option value="">{f.none}</option>
            {(references[field.table] ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
          <FieldError message={err()} />
        </div>
      );
    case "lines":
    case "csv":
      return (
        <div className={field.type === "lines" ? "lg:col-span-2" : ""}>
          <Label htmlFor={field.name}>{label}</Label>
          <Textarea
            id={field.name}
            name={field.name}
            dir="ltr"
            rows={field.type === "lines" ? 4 : 2}
            defaultValue={Array.isArray(value) ? (value as string[]).join(field.type === "lines" ? "\n" : ", ") : ""}
          />
          <FieldError message={err()} />
        </div>
      );
    case "image":
      return <ImageField name={field.name} label={label} initial={(value as string) ?? ""} error={err()} />;
    case "itinerary":
      return <ItineraryField name={field.name} label={label} initial={value} />;
  }
}

function lookupObject(dict: object, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined), dict);
}

export function ImageField({ name, label, initial, error }: { name: string; label: string; initial: string; error?: string }) {
  const { dict } = useI18n();
  const [url, setUrl] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error(dict.admin.media_.hint);
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (upErr) {
      toast.error(dict.errors.generic);
      return;
    }
    setUrl(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="lg:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-line bg-sand sm:w-48">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="absolute inset-0 m-auto size-6 text-ink-muted" aria-hidden />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input id={name} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" dir="ltr" />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus aria-hidden />} {dict.admin.fields.uploadImage}
            </Button>
            {url ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
                {dict.common.delete}
              </Button>
            ) : null}
          </div>
          <FieldError message={error} />
        </div>
      </div>
    </div>
  );
}

type Day = { title: Record<string, string>; description: Record<string, string> };

function ItineraryField({ name, label, initial }: { name: string; label: string; initial: unknown }) {
  const { dict } = useI18n();
  const [days, setDays] = useState<Day[]>(() =>
    Array.isArray(initial)
      ? (initial as Partial<Day>[]).map((d) => ({ title: { ...(d.title ?? {}) }, description: { ...(d.description ?? {}) } }))
      : [],
  );
  const update = (i: number, key: keyof Day, l: string, v: string) =>
    setDays((list) => list.map((d, idx) => (idx === i ? { ...d, [key]: { ...d[key], [l]: v } } : d)));
  const move = (i: number, dir: -1 | 1) =>
    setDays((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <fieldset className="lg:col-span-2">
      <legend className="mb-2 text-[0.8rem] font-semibold text-ink-soft">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(days)} />
      <ol className="space-y-3">
        {days.map((d, i) => (
          <li key={i} className="rounded-xl border border-line bg-sand/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{dict.packages.day.replace("{n}", String(i + 1))}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded p-1 hover:bg-paper" aria-label="↑">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="rounded p-1 hover:bg-paper" aria-label="↓">
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" onClick={() => setDays((l) => l.filter((_, idx) => idx !== i))} className="rounded p-1 text-danger hover:bg-danger-soft" aria-label={dict.common.delete}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {LOCALES.map((l) => (
                <div key={l.code} className="space-y-1.5">
                  <Input
                    placeholder={`${dict.admin.fields.title} ${l.label}`}
                    value={d.title[l.code] ?? ""}
                    onChange={(e) => update(i, "title", l.code, e.target.value)}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                    aria-label={`${dict.admin.fields.title} ${l.label}`}
                  />
                  <Textarea
                    placeholder={`${dict.admin.fields.description} ${l.label}`}
                    value={d.description[l.code] ?? ""}
                    onChange={(e) => update(i, "description", l.code, e.target.value)}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                    rows={2}
                    className="min-h-16"
                    aria-label={`${dict.admin.fields.description} ${l.label}`}
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setDays((l) => [...l, { title: {}, description: {} }])}>
        <Plus aria-hidden /> {dict.admin.fields.addDay}
      </Button>
    </fieldset>
  );
}
