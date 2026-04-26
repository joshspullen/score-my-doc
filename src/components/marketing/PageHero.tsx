import { ReactNode } from "react";

export function PageHero({
  eyebrow, title, description, children,
}: { eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-subtle)" }} />
      <div className="container py-20 md:py-28 max-w-4xl">
        {eyebrow && <p className="text-xs uppercase tracking-[0.25em] text-primary mb-5">{eyebrow}</p>}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">{title}</h1>
        {description && <p className="text-lg text-muted-foreground mt-6 max-w-2xl">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function FeatureGrid({ items }: { items: { icon?: React.ComponentType<{ className?: string }>; title: string; desc: string }[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.title} className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          {it.icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <it.icon className="h-5 w-5" />
            </div>
          )}
          <h3 className="font-semibold mb-1.5">{it.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function CtaBand({ title, sub, primary }: { title: string; sub?: string; primary?: ReactNode }) {
  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="container py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h3>
          {sub && <p className="text-muted-foreground mt-2">{sub}</p>}
        </div>
        {primary}
      </div>
    </section>
  );
}