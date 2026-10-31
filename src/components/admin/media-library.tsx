"use client";

import { Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { deleteMedia } from "@/lib/actions/admin-ops";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { ActionButton } from "./ui";

export function MediaLibrary({ files }: { files: { path: string; url: string; size: number }[] }) {
  const { dict } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const supabase = createClient();
    let okCount = 0;
    for (const file of Array.from(list)) {
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: ${dict.admin.media_.hint}`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) toast.error(`${file.name}: ${dict.errors.generic}`);
      else okCount++;
    }
    setBusy(false);
    if (okCount) toast.success(dict.admin.saved);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files)} />
        <Button type="button" variant="accent" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus aria-hidden />} {dict.admin.media_.upload}
        </Button>
      </div>
      {files.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((f) => (
            <li key={f.path} className="overflow-hidden rounded-xl border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center gap-1 p-2">
                <span className="min-w-0 flex-1 truncate text-xs text-ink-muted" title={f.path}>
                  {(f.size / 1024).toFixed(0)} Ko
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={dict.admin.media_.copy}
                  onClick={() => navigator.clipboard.writeText(f.url).then(() => toast.success(dict.admin.media_.copied))}
                >
                  <Copy />
                </Button>
                <ActionButton variant="ghost" action={() => deleteMedia(f.path)} confirm={dict.admin.confirmDelete}>
                  <Trash2 />
                  <span className="sr-only">{dict.common.delete}</span>
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ImagePlus} text={dict.admin.empty} />
      )}
    </div>
  );
}
