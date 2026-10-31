import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "sea" | "success" | "warning" | "danger" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-sand-deep text-ink-soft",
  gold: "bg-gold-soft text-gold-strong",
  sea: "bg-sea-soft text-sea",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  ink: "bg-ink text-sand",
};

export function Badge({ tone = "neutral", className, ...props }: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusTone: Record<string, Tone> = {
  pending: "warning",
  under_review: "sea",
  documents_requested: "warning",
  submitted: "sea",
  confirmed: "success",
  completed: "success",
  rejected: "danger",
  cancelled: "neutral",
  unpaid: "neutral",
  awaiting_payment: "warning",
  partially_paid: "gold",
  paid: "success",
  refunded: "neutral",
  failed: "danger",
  new: "gold",
  read: "neutral",
  replied: "success",
  archived: "neutral",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </Badge>
  );
}
