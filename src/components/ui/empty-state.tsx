import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon;
  title?: string;
  text: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-paper/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-gold-soft text-gold-strong">
        <Icon className="size-5" aria-hidden />
      </span>
      {title ? <h3 className="font-display text-2xl">{title}</h3> : null}
      <p className="mt-1 max-w-md text-sm text-ink-muted">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
