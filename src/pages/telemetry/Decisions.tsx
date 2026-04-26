import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Clock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KpiStrip, type Kpi } from "@/components/telemetry/KpiStrip";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Trace = {
  id: string;
  title: string;
  category: string | null;
  outcome: "pending" | "correct" | "incorrect" | "divergent" | "n_a";
  deviation: boolean;
  duration_ms: number | null;
  decided_at: string;
  user_id: string;
};

const outcomeBadge: Record<Trace["outcome"], string> = {
  pending: "bg-muted text-muted-foreground",
  correct: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  incorrect: "bg-destructive/10 text-destructive",
  divergent: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  n_a: "bg-muted text-muted-foreground",
};

const Decisions = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Decision Intelligence — MERIDIAN"; }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("decision_traces")
        .select("id,title,category,outcome,deviation,duration_ms,decided_at,user_id")
        .order("decided_at", { ascending: false })
        .limit(50);
      setTraces((data ?? []) as Trace[]);
      setLoading(false);
    })();
  }, []);

  const kpis: Kpi[] = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todays = traces.filter((t) => new Date(t.decided_at) >= today);
    const deviations = traces.filter((t) => t.deviation).length;
    const compliant = traces.filter((t) => t.outcome === "correct").length;
    const avgMs = traces.length ? traces.reduce((s, t) => s + (t.duration_ms ?? 0), 0) / traces.length : 0;
    const devRate = traces.length ? Math.round((deviations / traces.length) * 100) : 0;
    const compRate = traces.length ? Math.round((compliant / traces.length) * 100) : 0;
    return [
      { label: "Decisions today", value: String(todays.length), icon: Activity },
      { label: "Deviation rate", value: `${devRate}%`, icon: AlertTriangle, tone: devRate > 20 ? "warn" : "default" },
      { label: "Avg decision time", value: `${(avgMs / 1000).toFixed(1)}s`, icon: Clock },
      { label: "Policy compliance", value: `${compRate}%`, icon: ShieldCheck, tone: compRate >= 80 ? "good" : "warn" },
    ];
  }, [traces]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    traces.forEach((t) => m.set(t.category ?? "Other", (m.get(t.category ?? "Other") ?? 0) + 1));
    return Array.from(m, ([category, count]) => ({ category, count }));
  }, [traces]);

  return (
    <div className="container py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Activity className="h-7 w-7" /> Decision Intelligence</h1>
          <p className="text-muted-foreground mt-1">See every decision your teams make — what was chosen, why, and what happened next.</p>
        </div>
        <Link to="/telemetry/traces" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline">
          Open decision log <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <KpiStrip items={kpis} />

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="text-sm font-semibold mb-3">Decisions by category</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold">Live feed</div>
            <Link to="/telemetry/traces" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : traces.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No decisions recorded yet.</div>
          ) : (
            <div className="divide-y divide-border max-h-[420px] overflow-auto">
              {traces.slice(0, 20).map((t) => (
                <Link key={t.id} to={`/telemetry/traces?id=${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.category ?? "Other"} · {formatDistanceToNow(new Date(t.decided_at), { addSuffix: true })}
                      {t.deviation && <span className="ml-2 text-orange-600 dark:text-orange-400">deviation</span>}
                    </div>
                  </div>
                  <Badge className={outcomeBadge[t.outcome]} variant="secondary">{t.outcome}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Decisions;
