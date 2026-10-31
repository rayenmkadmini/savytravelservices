"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "../auth";
import { parseResourceForm } from "../admin/parse";
import { getResource } from "../admin/resources";
import { createClient } from "../supabase/server";
import type { ActionState } from "../validation";

/** Create or update a catalog/content row. RLS re-checks admin rights in the database. */
export async function saveResource(resourceKey: string, id: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  await assertAdmin();
  const def = getResource(resourceKey);
  if (!def) return { status: "error", message: "errors.generic" };
  const parsed = parseResourceForm(def, form);
  if (!parsed.ok) return { status: "error", message: "errors.validation", fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  // The generic config guarantees column names; the table type is resolved at runtime.
  const table = supabase.from(def.table as "destinations");
  const row = parsed.row as never;
  const { data, error } = id
    ? await table.update(row).eq("id", id).select("id").single()
    : await table.insert(row).select("id").single();

  if (error) {
    console.error(`[admin] save ${def.table} failed`, error);
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate ? "errors.validation" : "errors.generic",
      fieldErrors: duplicate ? { slug: "validation" } : undefined,
    };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "admin.saved", data: { id: data.id } };
}

export async function deleteResource(resourceKey: string, id: string): Promise<ActionState> {
  await assertAdmin();
  const def = getResource(resourceKey);
  if (!def) return { status: "error", message: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from(def.table as "destinations").delete().eq("id", id);
  if (error) return { status: "error", message: "errors.generic" };
  revalidatePath("/", "layout");
  return { status: "success", message: "admin.deleted" };
}

/** Quick publish toggle from list views. */
export async function togglePublished(resourceKey: string, id: string, value: boolean): Promise<ActionState> {
  await assertAdmin();
  const def = getResource(resourceKey);
  if (!def || !def.fields.some((f) => f.name === "is_published")) return { status: "error", message: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase
    .from(def.table as "destinations")
    .update({ is_published: value } as never)
    .eq("id", id);
  if (error) return { status: "error", message: "errors.generic" };
  revalidatePath("/", "layout");
  return { status: "success", message: "admin.saved" };
}
