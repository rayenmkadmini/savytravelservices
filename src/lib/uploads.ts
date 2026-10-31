"use client";

import { createClient } from "./supabase/client";

export const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const documentKinds = ["passport", "id_card", "photo", "bank_statement", "invitation", "ticket", "other"] as const;
export type DocumentKind = (typeof documentKinds)[number];

export type PendingDocument = { id: string; file: File; kind: DocumentKind };

export function validateDocument(file: File): "type" | "size" | null {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > MAX_DOCUMENT_BYTES) return "size";
  return null;
}

function safeName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-80) || "document";
}

/**
 * Upload files to the private "documents" bucket and register them.
 * Storage + table RLS ensure users can only write inside their own folder
 * and only attach files to their own requests.
 */
export async function uploadDocuments(
  userId: string,
  target: { bookingId: string } | { visaRequestId: string },
  docs: PendingDocument[],
): Promise<{ uploaded: number; failed: number }> {
  const supabase = createClient();
  let uploaded = 0;
  let failed = 0;
  const folder = "bookingId" in target ? `booking/${target.bookingId}` : `visa/${target.visaRequestId}`;

  for (const doc of docs) {
    if (validateDocument(doc.file)) {
      failed++;
      continue;
    }
    const path = `${userId}/${folder}/${crypto.randomUUID()}-${safeName(doc.file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, doc.file, { contentType: doc.file.type, upsert: false });
    if (uploadError) {
      failed++;
      continue;
    }
    const { error } = await supabase.from("booking_documents").insert({
      user_id: userId,
      booking_id: "bookingId" in target ? target.bookingId : null,
      visa_request_id: "visaRequestId" in target ? target.visaRequestId : null,
      storage_path: path,
      file_name: doc.file.name.slice(0, 255),
      mime_type: doc.file.type,
      size_bytes: doc.file.size,
      kind: doc.kind,
    });
    if (error) {
      await supabase.storage.from("documents").remove([path]);
      failed++;
    } else {
      uploaded++;
    }
  }
  return { uploaded, failed };
}
