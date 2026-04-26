import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Trace = {
  id: string; title: string; category: string | null;
  outcome: "pending" | "correct" | "incorrect" | "divergent" | "n_a";
  deviation: boolean; decided_at: string;
  decision_made: any; ai_recommendation: any;
};

const tone: Record<Trace["outcome"], string> = {
  pending: "bg-muted text-muted-foreground",
  correct: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  incorrect: "bg-destructive/10 text-destructive",
  divergent: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  n_a: "bg-muted text-muted-foreground",
};

const Outcomes = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { document.title = "Outcomes & Evals — MERIDIAN"; }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("decision_traces")
        .select("id,title,category,outcome,deviation,decided_at,decision_made,ai_recommendation")
        .order("decided_at", { ascending: false });
      setTraces((data ?? []) as Trace[]);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => {
    if (filter === "divergent") return traces.filter((t) => t.deviation || t.outcome === "divergent");
    if (filter === "incorrect") return traces.filter((t) => t.outcome === "incorrect");
    if (filter === "pending") return traces.filter((t) => t.outcome === "pending");
    return traces;
  }, [traces, filter]);

  return (
    <div className="container py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Flag className="h-7 w-7" /> Outcomes &amp; Evals</h1>
          <p className="text-muted-foreground mt-1">Track what happened after each decision and where humans diverged from AI.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            <SelectItem value="divergent">Deviations / divergences</SelectItem>
            <SelectItem value="incorrect">Incorrect</SelectItem>
            <SelectItem value="pending">Pending review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Decision</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Human choice</TableHead>
                <TableHead>AI recommended</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const human = t.decision_made?.choice ?? "—";
                const ai = t.ai_recommendation?.choice ?? "—";
                const divergent = human !== ai && ai !== "—";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.category ?? "Other"}</TableCell>
                    <TableCell><code className="text-xs">{human}</code></TableCell>
                    <TableCell>
                      <code className="text-xs">{ai}</code>
                      {divergent && <Badge variant="secondary" className="ml-2 text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400">divergent</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className={tone[t.outcome]}>{t.outcome}</Badge></TableCell>
                    <TableCell><Link to={`/telemetry/traces?id=${t.id}`} className="text-xs text-primary hover:underline">View trace</Link></TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No decisions match.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Outcomes;
