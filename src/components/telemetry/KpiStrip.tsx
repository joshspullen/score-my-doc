import { LucideIcon } from "lucide-react";

export type Kpi = { label: string; value: string; sub?: string; icon: LucideIcon; tone?: "default" | "warn" | "good" | "bad" };

const toneClass: Record<NonNullable<Kpi["tone"]>, string> = {
  default: "text-foreground",
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-orange-600 dark:text-orange-400",
  bad: "text-destructive",
};

export const KpiStrip = ({ items }: { items: Kpi[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {items.map((k) => (
      <div key={k.label} className="rounded-xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><k.icon className="h-3.5 w-3.5" /> {k.label}</div>
        <div className={`text-2xl font-bold mt-2 ${toneClass[k.tone ?? "default"]}`}>{k.value}</div>
        {k.sub && <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>}
      </div>
    ))}
  </div>
);
