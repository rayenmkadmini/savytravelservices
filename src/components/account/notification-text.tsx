import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { fmt } from "@/lib/utils";

/** Render a notification row (kind + payload) in the viewer's language. */
export function notificationText(dict: Dictionary, kind: string, payload: unknown): string {
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, string>;
  const templates = dict.account.notificationText as Record<string, string>;
  const template = templates[kind];
  if (!template) return kind;
  let status = p.status ?? "";
  if (kind === "booking_status" && status in dict.status.booking) {
    status = dict.status.booking[status as keyof Dictionary["status"]["booking"]];
  } else if (kind === "visa_status" && status in dict.status.visa) {
    status = dict.status.visa[status as keyof Dictionary["status"]["visa"]];
  }
  return fmt(template, { reference: p.reference ?? "", status });
}
