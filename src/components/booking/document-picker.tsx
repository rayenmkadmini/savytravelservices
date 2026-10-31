"use client";

import { FileText, Paperclip, X } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/client";
import { documentKinds, validateDocument, type DocumentKind, type PendingDocument } from "@/lib/uploads";
import { fmt } from "@/lib/utils";

export function DocumentPicker({
  value,
  onChange,
  defaultKind = "passport",
}: {
  value: PendingDocument[];
  onChange: (docs: PendingDocument[]) => void;
  defaultKind?: DocumentKind;
}) {
  const { dict } = useI18n();
  const inputId = useId();

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: PendingDocument[] = [];
    for (const file of Array.from(files)) {
      const problem = validateDocument(file);
      if (problem === "size") toast.error(fmt(dict.booking.fileTooLarge, { name: file.name }));
      else if (problem === "type") toast.error(fmt(dict.booking.fileType, { name: file.name }));
      else next.push({ id: crypto.randomUUID(), file, kind: defaultKind });
    }
    onChange([...value, ...next].slice(0, 15));
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-sand/50 px-6 py-8 text-center transition-colors hover:border-gold hover:bg-gold-soft/30"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <Paperclip className="size-6 text-gold" aria-hidden />
        <span className="text-sm font-semibold">{dict.booking.addFiles}</span>
        <span className="max-w-md text-xs text-ink-muted">{dict.booking.documentsHint}</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {value.length ? (
        <ul className="mt-4 space-y-2">
          {value.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
              <FileText className="size-4 shrink-0 text-ink-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{doc.file.name}</span>
              <span className="text-xs text-ink-muted">{(doc.file.size / 1024 / 1024).toFixed(1)} MB</span>
              <select
                aria-label={dict.booking.documents}
                value={doc.kind}
                onChange={(e) => onChange(value.map((d) => (d.id === doc.id ? { ...d, kind: e.target.value as DocumentKind } : d)))}
                className="rounded-lg border border-line bg-sand px-2 py-1 text-xs"
              >
                {documentKinds.map((k) => (
                  <option key={k} value={k}>
                    {dict.booking.documentKinds[k]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange(value.filter((d) => d.id !== doc.id))}
                className="grid size-7 place-items-center rounded-full text-ink-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`${dict.booking.removePassenger} ${doc.file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
