import Image from "next/image";
import { cn } from "@/lib/utils";

/** Inner-page header. With an image it becomes a cinematic banner. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  credit,
  children,
  compact,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  image?: string | null;
  credit?: string | null;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  if (image) {
    return (
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={image} alt="" fill preload sizes="100vw" className="-z-10 object-cover opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-ink/30" />
        <div className={cn("container-page pt-36 pb-14", compact ? "sm:pt-40" : "sm:pt-48 sm:pb-20")}>
          {eyebrow ? <p className="eyebrow !text-gold-soft">{eyebrow}</p> : null}
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
          {lead ? <p className="mt-5 max-w-2xl text-base text-white/80 sm:text-lg">{lead}</p> : null}
          {children}
        </div>
        {credit ? <p className="absolute end-3 bottom-2 text-[0.65rem] text-white/50">{credit}</p> : null}
      </section>
    );
  }
  return (
    <section className="grain border-b border-line bg-sand-deep/40">
      <div className={cn("container-page pt-32 pb-12", compact ? "sm:pt-36" : "sm:pt-40 sm:pb-16")}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
        {lead ? <p className="mt-5 max-w-2xl text-base text-ink-muted sm:text-lg">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  action,
  className,
  light,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className={cn("eyebrow", light && "!text-gold-soft")}>{eyebrow}</p> : null}
        <h2 className={cn("mt-3 font-display text-4xl leading-[1.08] sm:text-5xl", light && "text-white")}>{title}</h2>
        {lead ? <p className={cn("mt-4 text-base", light ? "text-white/70" : "text-ink-muted")}>{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0 self-start md:self-auto">{action}</div> : null}
    </div>
  );
}
