import Image from "next/image";

const IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=75";

/** Two-column frame for authentication pages. */
export function AuthShell({ title, lead, children, footer }: { title: string; lead: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center px-4 pt-28 pb-16 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-ink-muted">{lead}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8 text-sm text-ink-muted">{footer}</div> : null}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image src={IMAGE} alt="" fill preload sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
      </div>
    </div>
  );
}
