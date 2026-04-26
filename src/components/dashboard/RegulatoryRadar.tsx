import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Radar, RefreshCw, AlertTriangle, ExternalLink, Sparkles, X, ArrowRight, ShieldCheck, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRoles } from "@/hooks/useRoles";

type RadarItem = {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  published_at: string | null;
  fetched_at: string;
  payload: any;
  connector_id: string;
  connectors?: { name: string; slug: string } | null;
};

type Process = { id: string; name: string; category: string | null };

const SEV_TONE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

export function RegulatoryRadar() {
  const { isAdmin } = useRoles();
  const [records, setRecords] = useState<RadarItem[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [decisionCount, setDecisionCount] = useState(0);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [open, setOpen] = useState<RadarItem | null>(null);

  const load = async () => {
    const [{ data: recs }, { data: procs }, { data: traces }, { count: srcCount }] = await Promise.all([
      supabase
        .from("connector_records")
        .select("*, connectors(name, slug)")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(40),
      supabase.from("business_processes").select("id, name, category").limit(200),
      supabase.from("decision_traces").select("id, category"),
      supabase.from("connectors").select("*", { count: "exact", head: true }).eq("enabled", true),
    ]);
    setRecords((recs ?? []) as RadarItem[]);
    setProcesses((procs ?? []) as Process[]);
    setDecisionCount((traces ?? []).length);
    setSourcesCount(srcCount ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const newThisWeek = records.filter((r) => {
      const t = r.published_at ? new Date(r.published_at).getTime() : new Date(r.fetched_at).getTime();
      return t >= weekAgo;
    }).length;
    const impactedPolicyIds = new Set<string>();
    const impactedDecisionCats = new Set<string>();
    records.forEach((r) => {
      const imp = r.payload?.impact;
      (imp?.policy_ids ?? []).forEach((id: string) => impactedPolicyIds.add(id));
      (imp?.decision_categories ?? []).forEach((c: string) => impactedDecisionCats.add(c));
    });
    return { newThisWeek, impactedPolicies: impactedPolicyIds.size, impactedDecisions: impactedDecisionCats.size };
  }, [records]);

  const sync = async () => {
    setSyncing(true);
    const { data: ebaConn } = await supabase.from("connectors").select("id").eq("slug", "eba").maybeSingle();
    if (!ebaConn) { toast.error("EBA connector not found"); setSyncing(false); return; }
    const { error } = await supabase.functions.invoke("connector-sync", { body: { connector_id: ebaConn.id } });
    if (error) toast.error(error.message);
    else toast.success("Live regulator feed synced");
    await load();
    setSyncing(false);
  };

  const analyze = async (rec: RadarItem) => {
    setAnalyzing(rec.id);
    const { data, error } = await supabase.functions.invoke("radar-impact", { body: { record_id: rec.id } });
    if (error) toast.error(error.message);
    else {
      toast.success("Impact analyzed");
      const newPayload = { ...(rec.payload ?? {}), impact: (data as any).impact };
      setRecords((prev) => prev.map((r) => r.id === rec.id ? { ...r, payload: newPayload } : r));
      if (open?.id === rec.id) setOpen({ ...rec, payload: newPayload });
    }
    setAnalyzing(null);
  };

  const policyById = useMemo(() => {
    const m = new Map<string, Process>();
    processes.forEach((p) => m.set(p.id, p));
    return m;
  }, [processes]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" /> Regulatory Radar
          </h2>
          <p className="text-sm text-muted-foreground">Live feeds from regulators, mapped to your policies and decisions.</p>
        </div>
        {isAdmin && (
          <Button onClick={sync} disabled={syncing} size="sm" variant="outline" className="gap-2">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync now
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="New this week" value={kpis.newThisWeek} tone="primary" />
        <KpiCard label="Impacted policies" value={kpis.impactedPolicies} tone="amber" />
        <KpiCard label="Decision categories affected" value={kpis.impactedDecisions} tone="destructive" />
        <KpiCard label="Sources monitored" value={sourcesCount} tone="muted" />
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border" style={{ boxShadow: "var(--shadow-card)" }}>
        {records.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No regulatory items yet. {isAdmin && "Click Sync now to pull from the EBA feed."}
          </div>
        ) : (
          records.slice(0, 10).map((r) => {
            const imp = r.payload?.impact;
            const sev = imp?.severity ?? r.payload?.severity ?? "medium";
            const pCount = imp?.policy_ids?.length ?? 0;
            const dCount = imp?.decision_categories?.length ?? 0;
            return (
              <button key={r.id} onClick={() => setOpen(r)}
                className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{r.connectors?.name ?? "Source"}</Badge>
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${SEV_TONE[sev] ?? ""}`}>{sev}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {r.published_at ? formatDistanceToNow(new Date(r.published_at), { addSuffix: true }) : formatDistanceToNow(new Date(r.fetched_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-medium text-sm mt-1 line-clamp-2">{r.title}</p>
                  {r.summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.summary}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    {pCount > 0 && <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {pCount} policy{pCount > 1 ? "ies" : ""} impacted</span>}
                    {dCount > 0 && <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {dCount} decision area{dCount > 1 ? "s" : ""}</span>}
                    {pCount === 0 && dCount === 0 && <span className="italic">Click to analyze impact</span>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </button>
            );
          })
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{open.connectors?.name ?? "Source"}</Badge>
                  <Badge variant="outline" className={SEV_TONE[open.payload?.impact?.severity ?? "medium"] ?? ""}>
                    {open.payload?.impact?.severity ?? "medium"}
                  </Badge>
                </div>
                <SheetTitle className="text-left text-lg leading-snug">{open.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-5 text-sm">
                {open.summary && <p className="text-muted-foreground leading-relaxed">{open.summary}</p>}
                {open.url && (
                  <a href={open.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary text-xs hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open at source
                  </a>
                )}

                <div className="rounded-lg border border-border p-3 bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI impact mapping</h4>
                    <Button size="sm" variant="ghost" className="h-7 gap-1.5" onClick={() => analyze(open)} disabled={analyzing === open.id}>
                      {analyzing === open.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {open.payload?.impact ? "Re-analyze" : "Analyze"}
                    </Button>
                  </div>
                  {open.payload?.impact ? (
                    <p className="text-xs text-muted-foreground italic">{open.payload.impact.rationale || "—"}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No impact mapping yet. Click Analyze.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Impacted policies</h4>
                  <div className="space-y-1.5">
                    {(open.payload?.impact?.policy_ids ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">None mapped yet.</p>
                    ) : (
                      (open.payload?.impact?.policy_ids as string[]).map((id) => {
                        const p = policyById.get(id);
                        if (!p) return null;
                        return (
                          <Link key={id} to="/knowledge/processes"
                            className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:border-primary/40 hover:bg-secondary/40 transition-colors">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              {p.category && <div className="text-[11px] text-muted-foreground">{p.category}</div>}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Affected decision areas</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(open.payload?.impact?.decision_categories ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">None mapped yet.</p>
                    ) : (
                      (open.payload?.impact?.decision_categories as string[]).map((c) => (
                        <Link key={c} to="/telemetry/traces" className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/40 hover:bg-secondary/40">
                          {c}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success("Owners notified (demo)")}>
                    Notify owner
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "amber" | "destructive" | "muted" }) {
  const tones: Record<string, string> = {
    primary: "text-primary",
    amber: "text-amber-600 dark:text-amber-400",
    destructive: "text-destructive",
    muted: "text-foreground",
  };
  return (
    <div className="rounded-xl bg-card border border-border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
