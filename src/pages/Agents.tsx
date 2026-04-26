import { useEffect, useMemo, useState } from "react";
import { Bot, Play, Plus, Pencil, Trash2, Clock, CheckCircle2, AlertCircle, Pause, Search, Brain, Zap, Loader2, ExternalLink, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";
import { formatDistanceToNow } from "date-fns";

type Pattern = "collection" | "analysis" | "action";
type Trigger = "manual" | "hourly" | "daily" | "weekly" | "monthly" | "cron";
type Status = "draft" | "active" | "paused";

type Agent = {
  id: string; name: string; description: string | null;
  pattern: Pattern; status: Status; trigger_type: Trigger; cron_expression: string | null;
  regulator_id: string | null; connector_id: string | null;
  config: any; last_run_at: string | null; last_run_status: string | null; next_run_at: string | null;
};
type Regulator = { id: string; name: string; short_code: string };
type Connector = { id: string; name: string; slug: string; source_url: string | null };
type Run = { id: string; status: string; triggered_by: string; records_collected: number; new_records: number; error_message: string | null; logs: any; started_at: string; finished_at: string | null };

const PATTERN_META: Record<Pattern, { label: string; icon: any; tone: string; desc: string }> = {
  collection: { label: "Search & Collect", icon: Search, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-400", desc: "Scrape sources, gather new documents" },
  analysis:   { label: "Analyze",          icon: Brain,  tone: "bg-purple-500/10 text-purple-700 dark:text-purple-400", desc: "Score, classify or extract data" },
  action:     { label: "Act",              icon: Zap,    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400", desc: "Send notifications, create tasks" },
};

const TRIGGER_LABEL: Record<Trigger, string> = {
  manual: "Manual", hourly: "Every hour", daily: "Daily", weekly: "Weekly", monthly: "Monthly", cron: "Custom cron",
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [regulators, setRegulators] = useState<Regulator[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [view, setView] = useState<ViewMode>("cards");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [editor, setEditor] = useState<Partial<Agent> | null>(null);
  const [runsFor, setRunsFor] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => { document.title = "Agents — MERIDIAN"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const [a, r, c] = await Promise.all([
      supabase.from("agents").select("*").order("created_at", { ascending: false }),
      supabase.from("regulators").select("id, name, short_code").order("name"),
      supabase.from("connectors").select("id, name, slug, source_url").order("name"),
    ]);
    setAgents((a.data ?? []) as Agent[]);
    setRegulators((r.data ?? []) as Regulator[]);
    setConnectors((c.data ?? []) as Connector[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (filter === "all") return agents;
    if (filter === "mine") return agents; // placeholder for "my agents" filter
    return agents.filter((a) => a.pattern === filter);
  }, [agents, filter]);

  const runAgent = async (a: Agent) => {
    setRunning(a.id);
    const { data, error } = await supabase.functions.invoke("agent-run", { body: { agent_id: a.id } });
    setRunning(null);
    if (error) { toast.error(error.message); return; }
    if (data?.error) toast.error(data.error);
    else toast.success(`${a.name}: collected ${data?.records ?? 0} records`);
    load();
  };

  const saveAgent = async () => {
    if (!editor?.name || !editor.pattern) { toast.error("Name and pattern are required"); return; }
    if (editor.pattern === "collection" && !editor.connector_id) {
      toast.error("Collection agents need a connector (the source URL lives there)"); return;
    }
    const payload: any = {
      name: editor.name,
      description: editor.description ?? null,
      pattern: editor.pattern,
      status: editor.status ?? "draft",
      trigger_type: editor.trigger_type ?? "manual",
      cron_expression: editor.trigger_type === "cron" ? (editor.cron_expression ?? null) : null,
      regulator_id: editor.regulator_id ?? null,
      connector_id: editor.connector_id ?? null,
      config: editor.config ?? {},
    };
    const op = editor.id
      ? supabase.from("agents").update(payload).eq("id", editor.id)
      : supabase.from("agents").insert(payload);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success("Agent saved");
    setEditor(null);
    load();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("Delete this agent and its run history?")) return;
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Agent deleted"); load();
  };

  const openRuns = async (a: Agent) => {
    setRunsFor(a); setRuns([]);
    const { data } = await supabase.from("agent_runs").select("*")
      .eq("agent_id", a.id).order("started_at", { ascending: false }).limit(25);
    setRuns((data ?? []) as Run[]);
  };

  const openCreate = (preset?: Pattern) => setEditor({
    name: "", description: "", pattern: preset ?? "collection", status: "draft",
    trigger_type: "manual", config: {},
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ModuleHeader
        icon={Bot}
        title="Agents"
        subtitle="Build autonomous agents to collect, analyze and act on regulatory data"
        views={["cards", "table"]}
        view={view}
        onViewChange={setView}
        filters={[
          { value: "all", label: "All", count: agents.length },
          { value: "collection", label: "Search & Collect", count: agents.filter((a) => a.pattern === "collection").length },
          { value: "analysis", label: "Analyze", count: agents.filter((a) => a.pattern === "analysis").length },
          { value: "action", label: "Act", count: agents.filter((a) => a.pattern === "action").length },
        ]}
        filter={filter}
        onFilterChange={setFilter}
        actions={
          <Button onClick={() => openCreate()} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New agent
          </Button>
        }
      />

      {/* Pattern primer */}
      {agents.length === 0 && !loading && (
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {(Object.keys(PATTERN_META) as Pattern[]).map((p) => {
            const M = PATTERN_META[p];
            return (
              <button key={p} onClick={() => openCreate(p)}
                className="text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${M.tone}`}>
                  <M.icon className="h-3.5 w-3.5" /> {M.label}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{M.desc}</p>
                <p className="text-xs text-primary mt-3">+ Create {M.label.toLowerCase()} agent</p>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : view === "cards" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const M = PATTERN_META[a.pattern];
            const reg = regulators.find((r) => r.id === a.regulator_id);
            return (
              <Card key={a.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${M.tone}`}>
                      <M.icon className="h-3.5 w-3.5" /> {M.label}
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                  <CardTitle className="text-base mt-2">{a.name}</CardTitle>
                  {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <Row label="Trigger"><Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{TRIGGER_LABEL[a.trigger_type]}</Badge></Row>
                  {reg && <Row label="Regulator"><Badge variant="outline">{reg.short_code}</Badge></Row>}
                  <Row label="Last run">
                    {a.last_run_at
                      ? <span className="flex items-center gap-1">{a.last_run_status === "error"
                          ? <AlertCircle className="h-3 w-3 text-destructive" />
                          : <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                          {formatDistanceToNow(new Date(a.last_run_at), { addSuffix: true })}</span>
                      : <span className="text-muted-foreground">never</span>}
                  </Row>
                  <div className="flex items-center gap-1 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" disabled={running === a.id} onClick={() => runAgent(a)}>
                      {running === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openRuns(a)}><History className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditor(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteAgent(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const M = PATTERN_META[a.pattern];
                const reg = regulators.find((r) => r.id === a.regulator_id);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${M.tone}`}><M.icon className="h-3 w-3" />{M.label}</span></TableCell>
                    <TableCell><StatusPill status={a.status} /></TableCell>
                    <TableCell className="text-xs">{TRIGGER_LABEL[a.trigger_type]}</TableCell>
                    <TableCell className="text-xs">{reg?.short_code ?? "—"}</TableCell>
                    <TableCell className="text-xs">{a.last_run_at ? formatDistanceToNow(new Date(a.last_run_at), { addSuffix: true }) : "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" disabled={running === a.id} onClick={() => runAgent(a)}>{running === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}</Button>
                      <Button size="sm" variant="ghost" onClick={() => openRuns(a)}><History className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditor(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteAgent(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Editor */}
      <Dialog open={!!editor} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editor?.id ? "Edit agent" : "New agent"}</DialogTitle></DialogHeader>
          {editor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label>
                  <Input value={editor.name ?? ""} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="ACPR regulation watcher" /></div>
                <div className="space-y-1.5"><Label>Pattern</Label>
                  <Select value={editor.pattern} onValueChange={(v: Pattern) => setEditor({ ...editor, pattern: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PATTERN_META) as Pattern[]).map((p) => (
                        <SelectItem key={p} value={p}>{PATTERN_META[p].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label>
                <Textarea rows={2} value={editor.description ?? ""} onChange={(e) => setEditor({ ...editor, description: e.target.value })} placeholder="Monitors ACPR for new official documents and tracks versions" /></div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Regulator</Label>
                  <Select value={editor.regulator_id ?? "none"} onValueChange={(v) => setEditor({ ...editor, regulator_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Select regulator" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {regulators.map((r) => <SelectItem key={r.id} value={r.id}>{r.short_code} — {r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Connector {editor.pattern === "collection" && <span className="text-destructive">*</span>}</Label>
                  <Select value={editor.connector_id ?? "none"} onValueChange={(v) => setEditor({ ...editor, connector_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="Select connector (source URL lives here)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {connectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.source_url ? "" : " (no URL set)"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editor.pattern === "collection" && (
                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <div className="space-y-1"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Source URL (from connector)</Label>
                    {(() => {
                      const c = connectors.find((x) => x.id === editor.connector_id);
                      if (!c) return <p className="text-xs text-muted-foreground">Select a connector above to inherit its source URL.</p>;
                      if (!c.source_url) return <p className="text-xs text-amber-600 dark:text-amber-400">⚠ This connector has no source URL. Set it in the Connectors page.</p>;
                      return <code className="text-xs break-all bg-background px-2 py-1 rounded border block">{c.source_url}</code>;
                    })()}
                  </div>
                  <div className="space-y-1.5"><Label>Keyword filter (comma separated, optional)</Label>
                    <Input value={(editor.config?.keywords ?? []).join(", ")}
                      onChange={(e) => setEditor({ ...editor, config: { ...editor.config, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) } })}
                      placeholder="DORA, AML, sanctions" /></div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Trigger</Label>
                  <Select value={editor.trigger_type} onValueChange={(v: Trigger) => setEditor({ ...editor, trigger_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRIGGER_LABEL) as Trigger[]).map((t) => <SelectItem key={t} value={t}>{TRIGGER_LABEL[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editor.trigger_type === "cron" && (
                  <div className="space-y-1.5 col-span-2"><Label>Cron expression</Label>
                    <Input value={editor.cron_expression ?? ""} onChange={(e) => setEditor({ ...editor, cron_expression: e.target.value })} placeholder="0 9 * * 1" /></div>
                )}
                {editor.trigger_type !== "cron" && (
                  <div className="space-y-1.5"><Label>Status</Label>
                    <Select value={editor.status} onValueChange={(v: Status) => setEditor({ ...editor, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {editor.trigger_type !== "manual" && (
                <p className="text-xs text-muted-foreground">
                  ℹ️ Scheduled triggers run via the platform scheduler. Manual runs always work via the <b>Run</b> button.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>Cancel</Button>
            <Button onClick={saveAgent}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Runs sheet */}
      <Sheet open={!!runsFor} onOpenChange={(v) => !v && setRunsFor(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{runsFor?.name} — Run history</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
            {runs.map((r) => (
              <div key={r.id} className="border rounded-md p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={r.status === "success" ? "default" : r.status === "error" ? "destructive" : "secondary"}>{r.status}</Badge>
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}</span>
                </div>
                <div className="text-muted-foreground">Trigger: {r.triggered_by} · Records: {r.records_collected} · New: {r.new_records}</div>
                {r.error_message && <div className="text-destructive">{r.error_message}</div>}
                {Array.isArray(r.logs) && r.logs.length > 0 && (
                  <details className="text-muted-foreground">
                    <summary className="cursor-pointer">View logs ({r.logs.length})</summary>
                    <pre className="mt-1 max-h-48 overflow-auto bg-muted p-2 rounded">{JSON.stringify(r.logs, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span>{children}</div>
);

const StatusPill = ({ status }: { status: Status }) => {
  const map = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
    paused: { label: "Paused", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: Pause },
    draft:  { label: "Draft",  cls: "bg-muted text-muted-foreground", icon: ExternalLink },
  } as const;
  const M = map[status] ?? map.draft;
  const Icon = M.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${M.cls}`}><Icon className="h-3 w-3" />{M.label}</span>;
};