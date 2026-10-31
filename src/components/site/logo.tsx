import Image from "next/image";
import { cn } from "@/lib/utils";

export const DEFAULT_LOGO = "/brand/savy-logo.png";

/**
 * Official SAVY Travel Services logo. A logo uploaded in Admin → Settings →
 * Branding replaces the bundled file. On dark backgrounds it sits on a white
 * plate so the blue lettering stays legible.
 */
export function Logo({ logoUrl, tone = "ink", className }: { logoUrl?: string; tone?: "ink" | "light"; className?: string }) {
  const src = logoUrl || DEFAULT_LOGO;
  const image =
    src === DEFAULT_LOGO ? (
      <Image src={DEFAULT_LOGO} alt="SAVY Travel Services" width={398} height={282} preload className="h-full w-auto" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="SAVY Travel Services" className="h-full w-auto" />
    );
  return (
    <span
      className={cn(
        "inline-flex h-14 items-center",
        tone === "light" && "rounded-xl bg-white/95 px-2 py-1 shadow-soft",
        className,
      )}
      dir="ltr"
    >
      {image}
    </span>
  );
}
