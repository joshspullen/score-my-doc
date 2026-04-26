import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Network, Loader2, Filter, User as UserIcon, FileText, ScrollText, Plug, Activity, ArrowRight } from "lucide-react";
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

type Profile = { id: string; display_name: string | null; headline: string | null; avatar_url: string | null };
type Policy = { id: string; name: string; doc_level: string | null; code: string | null; owner: string | null };
type Reg = { id: string; title: string; reference_code: string | null; regulator: string | null; category: string | null };
type Conn = { id: string; name: string; category: string };

const TraceExplorer = () => {
  const [params, setParams] = useSearchParams();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [spans, setSpans] = useState<Span[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [regs, setRegs] = useState<Reg[]>([]);
  const [conns, setConns] = useState<Conn[]>([]);
  const selectedId = params.get("id");

  useEffect(() => { document.title = "Decision Log — MERIDIAN"; }, []);

  useEffect(() => {
    (async () => {
      const [tr, pr, po, rg, cn] = await Promise.all([
        supabase.from("decision_traces").select("*").order("decided_at", { ascending: false }),
        supabase.from("profiles").select("id, display_name, headline, avatar_url"),
        supabase.from("business_processes").select("id, name, doc_level, code, owner"),
        supabase.from("compliance_requirements").select("id, title, reference_code, regulator, category"),
        supabase.from("connectors").select("id, name, category"),
      ]);
      const list = (tr.data ?? []) as Trace[];
      setTraces(list);
      setProfiles(Object.fromEntries(((pr.data ?? []) as Profile[]).map((p) => [p.id, p])));
      setPolicies(Object.fromEntries(((po.data ?? []) as Policy[]).map((p) => [p.id, p])));
      setRegs((rg.data ?? []) as Reg[]);
      setConns((cn.data ?? []) as Conn[]);
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

  // Related entities for the selected trace
  const related = useMemo(() => {
    if (!selected) return null;
    const person = profiles[selected.user_id] ?? null;
    const policy = selected.policy_id ? policies[selected.policy_id] ?? null : null;
    const cat = (selected.category ?? "").toLowerCase();
    const matchCat = (s: string | null) => s ? s.toLowerCase().includes(cat) || cat.includes(s.toLowerCase()) : false;
    const relatedRegs = cat ? regs.filter((r) => matchCat(r.category) || matchCat(r.regulator) || matchCat(r.title)).slice(0, 4) : [];
    const relatedConns = cat ? conns.filter((c) => matchCat(c.category) || matchCat(c.name)).slice(0, 4) : [];
    const otherDecisions = selected.policy_id
      ? traces.filter((t) => t.policy_id === selected.policy_id && t.id !== selected.id).slice(0, 4)
      : [];
    return { person, policy, relatedRegs, relatedConns, otherDecisions };
  }, [selected, profiles, policies, regs, conns, traces]);

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
                      <button
                        onClick={() => {
                          const pack = {
                            generated_at: new Date().toISOString(),
                            decision: selected,
                            spans,
                            related: { policy: related?.policy ?? null, regulations: related?.relatedRegs ?? [], connections: related?.relatedConns ?? [] },
                          };
                          const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `audit-pack-${selected.id}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-[11px] px-2 py-1 rounded-md border border-border hover:border-primary/40 hover:bg-secondary/40"
                      >
                        Export audit pack
                      </button>
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

                {related && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <RelatedCard icon={UserIcon} title="Decision maker">
                      {related.person ? (
                        <Link to="/people" className="block hover:bg-muted/40 rounded-md px-2 py-1.5 -mx-2 transition-colors">
                          <div className="text-sm font-medium">{related.person.display_name ?? "Unnamed"}</div>
                          {related.person.headline && <div className="text-xs text-muted-foreground">{related.person.headline}</div>}
                        </Link>
                      ) : <Empty>Not linked to a profile yet.</Empty>}
                    </RelatedCard>

                    <RelatedCard icon={FileText} title="Policy / documentation">
                      {related.policy ? (
                        <Link to="/knowledge/processes" className="block hover:bg-muted/40 rounded-md px-2 py-1.5 -mx-2 transition-colors">
                          <div className="text-sm font-medium">{related.policy.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[related.policy.code, related.policy.doc_level, related.policy.owner].filter(Boolean).join(" · ")}
                          </div>
                        </Link>
                      ) : <Empty>No policy referenced.</Empty>}
                    </RelatedCard>

                    <RelatedCard icon={ScrollText} title="Related regulations">
                      {related.relatedRegs.length === 0 ? <Empty>No matches for this category.</Empty> : (
                        <ul className="space-y-1">
                          {related.relatedRegs.map((r) => (
                            <li key={r.id}>
                              <Link to="/knowledge/regulations" className="block hover:bg-muted/40 rounded-md px-2 py-1.5 -mx-2 text-sm">
                                <span className="font-medium">{r.reference_code ?? r.title}</span>
                                {r.regulator && <span className="text-xs text-muted-foreground"> · {r.regulator}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </RelatedCard>

                    <RelatedCard icon={Plug} title="Related connections">
                      {related.relatedConns.length === 0 ? <Empty>No connector matches.</Empty> : (
                        <ul className="space-y-1">
                          {related.relatedConns.map((c) => (
                            <li key={c.id}>
                              <Link to="/connectors" className="block hover:bg-muted/40 rounded-md px-2 py-1.5 -mx-2 text-sm">
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-muted-foreground"> · {c.category}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </RelatedCard>

                    {related.otherDecisions.length > 0 && (
                      <RelatedCard icon={Activity} title="Other decisions on this policy" className="sm:col-span-2">
                        <ul className="space-y-1">
                          {related.otherDecisions.map((d) => (
                            <li key={d.id}>
                              <button onClick={() => setParams({ id: d.id })} className="w-full text-left hover:bg-muted/40 rounded-md px-2 py-1.5 -mx-2 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{d.title}</div>
                                  <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(d.decided_at), { addSuffix: true })}</div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge variant="secondary" className="text-[10px]">{d.outcome}</Badge>
                                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </RelatedCard>
                    )}
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

function RelatedCard({ icon: Icon, title, children, className = "" }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-muted/20 p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground italic">{children}</div>;
}

export default TraceExplorer;
