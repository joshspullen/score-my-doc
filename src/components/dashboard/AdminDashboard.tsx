import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plug, Bot, ScrollText, Users, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type Stat = { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; to: string };

export function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, a, r, p, recent] = await Promise.all([
        supabase.from("connectors").select("id", { count: "exact", head: true }),
        supabase.from("agents").select("id", { count: "exact", head: true }),
        supabase.from("compliance_requirements").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("agent_runs").select("id, status, started_at, records_collected, agent_id").order("started_at", { ascending: false }).limit(6),
      ]);
      setStats([
        { label: "Connectors", value: c.count ?? 0, icon: Plug, to: "/connectors" },
        { label: "Agents", value: a.count ?? 0, icon: Bot, to: "/agents" },
        { label: "Regulations", value: r.count ?? 0, icon: ScrollText, to: "/knowledge/regulations" },
        { label: "Users", value: p.count ?? 0, icon: Users, to: "/admin" },
      ]);
      setRuns(recent.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-muted-foreground mt-1">Platform health, agent activity and team operations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><s.icon className="h-4 w-4" /></div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{loading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Recent agent runs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">What your autonomous agents collected lately.</p>
          </div>
          <Link to="/agents"><Button size="sm" variant="outline" className="gap-1.5">All agents <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No runs yet. Create an agent to start watching regulators automatically.</p>
        ) : (
          <ul className="divide-y divide-border">
            {runs.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                {r.status === "success" ? <CheckCircle2 className="h-4 w-4 text-success" /> : r.status === "failed" ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <span className="text-sm flex-1 truncate">Agent run · {r.records_collected ?? 0} records</span>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}