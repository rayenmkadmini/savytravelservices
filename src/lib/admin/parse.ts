import type { FieldDef, ResourceDef } from "./resources";

export type ParsedRow = Record<string, unknown>;
export type ParseResult = { ok: true; row: ParsedRow } | { ok: false; fieldErrors: Record<string, string> };

const LOCALES = ["fr", "en", "ar"] as const;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function str(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function isSafeUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Validate and convert an admin form submission into a database row. */
export function parseResourceForm(def: ResourceDef, form: FormData): ParseResult {
  const row: ParsedRow = {};
  const errors: Record<string, string> = {};

  for (const field of def.fields) {
    const result = parseField(field, form);
    if ("error" in result) errors[result.errorKey ?? field.name] = result.error;
    else row[field.name] = result.value;
  }

  return Object.keys(errors).length ? { ok: false, fieldErrors: errors } : { ok: true, row };
}

type FieldResult = { value: unknown } | { error: string; errorKey?: string };

function parseField(field: FieldDef, form: FormData): FieldResult {
  switch (field.type) {
    case "text":
    case "textarea":
    case "date": {
      const v = str(form, field.name);
      if (!v) return field.required ? { error: "required" } : { value: null };
      if (field.max && v.length > field.max) return { error: "tooLong" };
      if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return { error: "invalidDate" };
      if (field.name === "iso_code") return /^[A-Za-z]{2}$/.test(v) ? { value: v.toUpperCase() } : { error: "validation" };
      return { value: v };
    }
    case "slug": {
      const v = str(form, field.name).toLowerCase();
      if (!v) return { error: "required" };
      return SLUG.test(v) && v.length <= 80 ? { value: v } : { error: "validation" };
    }
    case "image": {
      const v = str(form, field.name);
      if (!v) return { value: null };
      return isSafeUrl(v) && v.length <= 1000 ? { value: v } : { error: "validation" };
    }
    case "i18n":
    case "i18nTextarea": {
      const value: Record<string, string> = {};
      for (const l of LOCALES) {
        const v = str(form, `${field.name}.${l}`);
        if (field.max && v.length > field.max) return { error: "tooLong", errorKey: `${field.name}.${l}` };
        if (v) value[l] = v;
      }
      if (!value.fr) {
        if (field.required || Object.keys(value).length) return { error: "required", errorKey: `${field.name}.fr` };
        return { value: null };
      }
      return { value };
    }
    case "number": {
      const raw = str(form, field.name).replace(",", ".");
      if (!raw) {
        if (field.default !== undefined) return { value: field.default };
        return field.required ? { error: "required" } : { value: null };
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) return { error: "validation" };
      if (field.min !== undefined && n < field.min) return { error: "validation" };
      if (field.max !== undefined && n > field.max) return { error: "validation" };
      return { value: field.step && field.step < 1 ? n : Math.round(n) };
    }
    case "boolean":
      return { value: form.get(field.name) === "on" || form.get(field.name) === "true" };
    case "select": {
      const v = str(form, field.name);
      if (!v) return field.required ? { error: "required" } : { value: field.options[0] };
      return field.options.includes(v) ? { value: v } : { error: "validation" };
    }
    case "reference": {
      const v = str(form, field.name);
      if (!v) return field.required ? { error: "required" } : { value: null };
      return /^[0-9a-f-]{36}$/i.test(v) ? { value: v } : { error: "validation" };
    }
    case "lines": {
      const items = str(form, field.name)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.some((u) => !isSafeUrl(u))) return { error: "validation" };
      return { value: items.slice(0, 30) };
    }
    case "csv":
      return {
        value: str(form, field.name)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 40),
      };
    case "itinerary": {
      const raw = str(form, field.name) || "[]";
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return { error: "validation" };
        const days = parsed
          .map((d) => {
            const day = d as { title?: Record<string, string>; description?: Record<string, string> };
            const title = pickLocales(day.title, 200);
            const description = pickLocales(day.description, 3000);
            return title.fr ? { title, ...(description.fr ? { description } : {}) } : null;
          })
          .filter((d): d is NonNullable<typeof d> => d !== null)
          .slice(0, 90)
          // Number days after dropping empty entries so there are no gaps.
          .map((d, i) => ({ day: i + 1, ...d }));
        return { value: days };
      } catch {
        return { error: "validation" };
      }
    }
  }
}

function pickLocales(value: unknown, max: number): Record<string, string> {
  const out: Record<string, string> = {};
  if (!value || typeof value !== "object") return out;
  for (const l of LOCALES) {
    const v = (value as Record<string, unknown>)[l];
    if (typeof v === "string" && v.trim()) out[l] = v.trim().slice(0, max);
  }
  return out;
}
