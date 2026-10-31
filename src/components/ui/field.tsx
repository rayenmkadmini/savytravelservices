import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-xl border border-line bg-paper px-3.5 text-[0.95rem] text-ink shadow-[inset_0_1px_0_rgb(15_27_45/0.03)] placeholder:text-ink-muted/70 transition-colors focus:border-gold focus:outline-none focus:ring-3 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10";

export function Label({ className, children, optional, ...props }: React.ComponentProps<"label"> & { optional?: string }) {
  return (
    <label className={cn("mb-1.5 block text-[0.8rem] font-semibold text-ink-soft", className)} {...props}>
      {children}
      {optional ? <span className="ms-1 font-normal text-ink-muted">({optional})</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        control,
        "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235b6577%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[position:right_0.9rem_center] bg-no-repeat pe-9 rtl:bg-[position:left_0.9rem_center]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string | null;
  hint?: string;
  optional?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

export function Checkbox({ className, label, ...props }: React.ComponentProps<"input"> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line accent-[var(--color-gold)]"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
