import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-55 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-sand hover:bg-ink-soft shadow-soft",
        accent: "bg-gold text-white hover:bg-gold-strong shadow-soft",
        outline: "border border-ink/15 bg-paper text-ink hover:border-ink/35 hover:bg-white",
        ghost: "text-ink hover:bg-ink/5",
        light: "bg-white/95 text-ink hover:bg-white shadow-soft",
        glass: "border border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
        danger: "bg-danger text-white hover:bg-danger/90",
        link: "rounded-none px-0 text-gold-strong underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-[0.95rem]",
        icon: "size-10",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  pending,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & Variants & { pending?: boolean }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
