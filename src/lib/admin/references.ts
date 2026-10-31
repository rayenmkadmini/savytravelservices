import "server-only";
import { tr } from "../format";
import type { Locale } from "../i18n/config";
import { createClient } from "../supabase/server";
import type { ResourceDef, ReferenceTable } from "./resources";

/** Options for foreign-key selects used by a resource (admin sees drafts too). */
export async function loadReferences(def: ResourceDef, locale: Locale) {
  const tables = new Set(def.fields.flatMap((f) => (f.type === "reference" ? [f.table] : [])));
  return loadReferenceTables([...tables], locale);
}

export async function loadReferenceTables(tables: ReferenceTable[], locale: Locale) {
  const supabase = await createClient();
  const out: Record<string, { id: string; label: string }[]> = {};
  for (const table of tables) {
    if (table === "hotels") {
      const { data } = await supabase.from("hotels").select("id, name, city").order("name");
      out.hotels = (data ?? []).map((h) => ({ id: h.id, label: `${h.name} — ${h.city}` }));
    } else {
      const { data } = await supabase.from(table).select("id, name").order("sort_order");
      out[table] = (data ?? []).map((r) => ({ id: r.id, label: tr(r.name, locale) }));
    }
  }
  return out;
}
