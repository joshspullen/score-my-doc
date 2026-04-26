import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Network, Loader2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TraceSpanCard } from "@/components/telemetry/TraceSpanCard";
import { formatDistanceToNow } from "date-fns";

type Trace = {
  id: string; title: string; category: string | null;
  outcome: "pending" | "correct" | "incorrect" | "divergent" | "n_a";
  deviation: boolean; decided_at: string; user_id: string;
  policy_id: string | null; trigger_context: any; options_presented: any;
  decision_made: any; ai_recommendation: any; outcome_notes: string | null; duration_ms: number | null;
};
type Span = { id: string; step_order: number; step_type: string; label: string; payload: any; duration_ms: number | null };

const TraceExplorer = () => {
  const [params, setParams] = useSearchParams();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [spans, setSpans] = useState<Span[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const selectedId = params.get("id");

  useEffect(() => { document.title = "Decision Log — MERIDIAN"; }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("decision_traces").select("*").order("decided_at", { ascending: false });
      const list = (data ?? []) as Trace[];
      setTraces(list);
      if (!selectedId && list[0]) setParams({ id: list[0].id }, { replace: true });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) { setSpans([]); return; }
    (async () => {
      const { data } = await supabase.from("decision_spans").select("*").eq("trace_id", selectedId).order("step_order");
      setSpans((data ?? []) as Span[]);
    })();
  }, [selectedId]);

  const categories = useMemo(() => Array.from(new Set(traces.map((t) => t.category ?? "Other"))), [traces]);
  const filtered = traces.filter((t) =>
    (outcomeFilter === "all" || t.outcome === outcomeFilter) &&
    (categoryFilter === "all" || (t.category ?? "Other") === categoryFilter),
  );
  const selected = traces.find((t) => t.id === selectedId);

  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Network className="h-7 w-7" /> Decision Log</h1>
        <p className="text-muted-foreground mt-1">Step-by-step replay of each decision: what triggered it, the options on the table, who chose what, which policy applied, and the result.</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="correct">Correct</SelectItem>
            <SelectItem value="incorrect">Incorrect</SelectItem>
            <SelectItem value="divergent">Divergent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden max-h-[70vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card)" }}>
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No traces match.</div>
            ) : filtered.map((t) => (
              <button key={t.id} onClick={() => setParams({ id: t.id })}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 ${selectedId === t.id ? "bg-muted/60" : ""}`}>
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t.category ?? "Other"} · {formatDistanceToNow(new Date(t.decided_at), { addSuffix: true })}
                </div>
                <div className="flex gap-1 mt-1.5">
                  <Badge variant="secondary" className="text-[10px]">{t.outcome}</Badge>
                  {t.deviation && <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400">deviation</Badge>}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
            {!selected ? (
              <div className="text-sm text-muted-foreground">Select a trace.</div>
            ) : (
              <>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{selected.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selected.category ?? "Other"} · {new Date(selected.decided_at).toLocaleString()}
                        {selected.duration_ms !== null && ` · ${(selected.duration_ms / 1000).toFixed(1)}s`}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary">{selected.outcome}</Badge>
                      {selected.deviation && <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">deviation</Badge>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Steps</div>
                  {spans.map((s) => <TraceSpanCard key={s.id} span={s} />)}
                </div>

                {selected.ai_recommendation && (
                  <div className="rounded-md bg-muted/40 border border-border p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">AI recommendation</div>
                    <pre className="text-xs overflow-auto">{JSON.stringify(selected.ai_recommendation, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TraceExplorer;
