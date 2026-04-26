import { useEffect, useMemo, useState } from "react";
import { Loader2, Plug, RefreshCw, ExternalLink, Database, AlertCircle, CheckCircle2, KeyRound, LayoutGrid, Table as TableIcon, Settings2, Globe, Code2, FileText, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ConnectorType = "api" | "scraping" | "file" | "other";
type Connector = {
  id: string; slug: string; name: string; category: string; description: string | null;
  homepage_url: string | null; api_base_url: string | null; source_url: string | null;
  requires_api_key: boolean; api_key_secret_name: string | null;
  enabled: boolean; last_sync_at: string | null; last_sync_status: string | null; last_sync_error: string | null;
  records_count: number; connector_type: ConnectorType; config: Record<string, any>;
};

type RecordRow = { id: string; title: string; summary: string | null; url: string | null; published_at: string | null; record_type: string | null };

const TYPE_META: Record<ConnectorType, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  api: { label: "API", icon: Code2, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  scraping: { label: "Scraping", icon: Globe, tone: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  file: { label: "File feed", icon: FileText, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  other: { label: "Other", icon: Puzzle, tone: "bg-muted text-muted-foreground" },
};

const Connectors = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [typeFilter, setTypeFilter] = useState<"all" | ConnectorType>("all");
  const [recordsFor, setRecordsFor] = useState<Connector | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [configFor, setConfigFor] = useState<Connector | null>(null);
  const [draft, setDraft] = useState<Partial<Connector> | null>(null);

  useEffect(() => { document.title = "Connectors — MERIDIAN"; load(); }, []);

  const load = async () => {
    const { data, error } = await supabase.from("connectors").select("*").order("category").order("name");
    if (error) toast.error(error.message);
    else setConnectors((data ?? []).map((c: any) => ({ ...c, config: c.config ?? {}, connector_type: c.connector_type ?? "api" })) as Connector[]);
    setLoading(false);
  };

  const toggleEnabled = async (c: Connector, v: boolean) => {
    const { error } = await supabase.from("connectors").update({ enabled: v }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    setConnectors((prev) => prev.map((x) => x.id === c.id ? { ...x, enabled: v } : x));
  };

  const sync = async (c: Connector) => {
    setSyncing(c.id);
    const { data, error } = await supabase.functions.invoke("connector-sync", { body: { connector_id: c.id } });
    setSyncing(null);
    if (error) { toast.error(error.message); load(); return; }
    toast.success(`${c.name}: synced ${data?.fetched ?? 0} records`);
    load();
  };

  const viewRecords = async (c: Connector) => {
    setRecordsFor(c); setRecords([]);
    const { data } = await supabase.from("connector_records")
      .select("id, title, summary, url, published_at, record_type")
      .eq("connector_id", c.id).order("published_at", { ascending: false, nullsFirst: false }).limit(50);
    setRecords((data ?? []) as RecordRow[]);
  };

  const openConfig = (c: Connector) => { setConfigFor(c); setDraft({ ...c, config: { ...(c.config ?? {}) } }); };

  const saveConfig = async () => {
    if (!configFor || !draft) return;
    const { error } = await supabase.from("connectors").update({
      connector_type: draft.connector_type ?? "api",
      api_base_url: draft.api_base_url || null,
      homepage_url: draft.homepage_url || null,
      source_url: draft.source_url || null,
      api_key_secret_name: draft.api_key_secret_name || null,
      requires_api_key: !!draft.api_key_secret_name,
      config: draft.config ?? {},
    }).eq("id", configFor.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Configuration saved"); setConfigFor(null); setDraft(null); load();
  };

  const filtered = useMemo(() => typeFilter === "all" ? connectors : connectors.filter((c) => c.connector_type === typeFilter), [connectors, typeFilter]);
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: connectors.length, api: 0, scraping: 0, file: 0, other: 0 };
    connectors.forEach((x) => { c[x.connector_type] = (c[x.connector_type] ?? 0) + 1; });
    return c;
  }, [connectors]);

  const updateDraftConfig = (k: string, v: any) => setDraft((d) => d ? { ...d, config: { ...(d.config ?? {}), [k]: v } } : d);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Plug className="h-7 w-7" /> Connectors</h1>
            <p className="text-muted-foreground mt-1">Plug regulatory data sources. Configure each by type — API, scraping, file feed or other.</p>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Cards</TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5"><TableIcon className="h-3.5 w-3.5" /> Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(["all", "api", "scraping", "file", "other"] as const).map((t) => {
            const meta = t === "all" ? null : TYPE_META[t];
            const active = typeFilter === t;
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors flex items-center gap-1.5 ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}>
                {meta && <meta.icon className="h-3 w-3" />}
                {t === "all" ? "All" : meta!.label}
                <span className="opacity-70">({typeCounts[t] ?? 0})</span>
              </button>
            );
          })}
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
          filtered.length === 0 ? <div className="text-center py-20 text-muted-foreground">No connectors match this filter.</div> :
          view === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((c) => {
                const TypeIcon = TYPE_META[c.connector_type].icon;
                return (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{c.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${TYPE_META[c.connector_type].tone}`}>
                            <TypeIcon className="h-3 w-3" /> {TYPE_META[c.connector_type].label}
                          </span>
                          {c.last_sync_status === "ok" && <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Synced</Badge>}
                          {c.last_sync_status === "error" && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.category}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                      </div>
                      <Switch checked={c.enabled} onCheckedChange={(v) => toggleEnabled(c, v)} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" /> {c.records_count} records</span>
                      {c.last_sync_at && <span>{formatDistanceToNow(new Date(c.last_sync_at), { addSuffix: true })}</span>}
                      {c.requires_api_key && <span className="inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Key</span>}
                    </div>
                    {c.last_sync_error && <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-3 line-clamp-2">{c.last_sync_error}</div>}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => sync(c)} disabled={syncing === c.id || !c.enabled} className="gap-1.5">
                        {syncing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Sync
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => viewRecords(c)} disabled={c.records_count === 0}>Records</Button>
                      <Button size="sm" variant="ghost" onClick={() => openConfig(c)} className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Configure</Button>
                      {c.homepage_url && <a href={c.homepage_url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">Source <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead>
                  <TableHead>Status</TableHead><TableHead>Records</TableHead><TableHead>Last sync</TableHead>
                  <TableHead className="w-12"></TableHead><TableHead className="w-48"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const TypeIcon = TYPE_META[c.connector_type].icon;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><span className={`text-[10px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${TYPE_META[c.connector_type].tone}`}><TypeIcon className="h-3 w-3" /> {TYPE_META[c.connector_type].label}</span></TableCell>
                        <TableCell className="text-muted-foreground">{c.category}</TableCell>
                        <TableCell>{c.last_sync_status === "ok" ? <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> OK</Badge> : c.last_sync_status === "error" ? <Badge variant="destructive">Error</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{c.records_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.last_sync_at ? formatDistanceToNow(new Date(c.last_sync_at), { addSuffix: true }) : "—"}</TableCell>
                        <TableCell><Switch checked={c.enabled} onCheckedChange={(v) => toggleEnabled(c, v)} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => sync(c)} disabled={syncing === c.id || !c.enabled}>{syncing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</Button>
                            <Button size="sm" variant="ghost" onClick={() => viewRecords(c)} disabled={c.records_count === 0}><Database className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openConfig(c)}><Settings2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        }
      </main>

      {/* Records dialog */}
      <Dialog open={!!recordsFor} onOpenChange={(o) => !o && setRecordsFor(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{recordsFor?.name} — latest records</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {records.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records yet.</p> :
              records.map((r) => (
                <div key={r.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      {r.summary && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.summary}</p>}
                    </div>
                    {r.record_type && <Badge variant="outline" className="text-xs flex-shrink-0">{r.record_type}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {r.published_at && <span>{new Date(r.published_at).toLocaleDateString()}</span>}
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Type-aware config dialog */}
      <Dialog open={!!configFor} onOpenChange={(o) => !o && (setConfigFor(null), setDraft(null))}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Configure {configFor?.name}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Connector type</Label>
                  <Select value={draft.connector_type ?? "api"} onValueChange={(v: ConnectorType) => setDraft({ ...draft, connector_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="scraping">Scraping</SelectItem>
                      <SelectItem value="file">File feed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Homepage URL</Label>
                  <Input value={draft.homepage_url ?? ""} onChange={(e) => setDraft({ ...draft, homepage_url: e.target.value })} placeholder="https://…" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Source URL <span className="text-xs text-muted-foreground font-normal">— what agents will fetch (RSS / page / file feed)</span></Label>
                <Input value={draft.source_url ?? ""} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} placeholder="https://acpr.banque-france.fr/rss.xml" />
              </div>

              {/* Type-specific fields */}
              {draft.connector_type === "api" && (
                <>
                  <div className="space-y-1.5"><Label>API base URL</Label>
                    <Input value={draft.api_base_url ?? ""} onChange={(e) => setDraft({ ...draft, api_base_url: e.target.value })} placeholder="https://api.example.com/v1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Auth header name</Label>
                      <Input value={draft.config?.auth_header ?? ""} onChange={(e) => updateDraftConfig("auth_header", e.target.value)} placeholder="Authorization" />
                    </div>
                    <div className="space-y-1.5"><Label>Pagination style</Label>
                      <Select value={draft.config?.pagination ?? "none"} onValueChange={(v) => updateDraftConfig("pagination", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="page">Page number</SelectItem>
                          <SelectItem value="cursor">Cursor</SelectItem>
                          <SelectItem value="offset">Offset</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {draft.connector_type === "scraping" && (
                <>
                  <div className="space-y-1.5"><Label>Target URL</Label>
                    <Input value={draft.config?.target_url ?? ""} onChange={(e) => updateDraftConfig("target_url", e.target.value)} placeholder="https://regulator.example/news" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Item selector (CSS)</Label>
                      <Input value={draft.config?.item_selector ?? ""} onChange={(e) => updateDraftConfig("item_selector", e.target.value)} placeholder="article.news-item" />
                    </div>
                    <div className="space-y-1.5"><Label>Crawl depth</Label>
                      <Input type="number" value={draft.config?.depth ?? 1} onChange={(e) => updateDraftConfig("depth", Number(e.target.value))} />
                    </div>
                  </div>
                </>
              )}

              {draft.connector_type === "file" && (
                <>
                  <div className="space-y-1.5"><Label>Feed URL</Label>
                    <Input value={draft.config?.feed_url ?? ""} onChange={(e) => updateDraftConfig("feed_url", e.target.value)} placeholder="https://…/feed.xml" />
                  </div>
                  <div className="space-y-1.5"><Label>Format</Label>
                    <Select value={draft.config?.format ?? "rss"} onValueChange={(v) => updateDraftConfig("format", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rss">RSS / Atom</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {draft.connector_type === "other" && (
                <div className="space-y-1.5"><Label>Notes</Label>
                  <Input value={draft.config?.notes ?? ""} onChange={(e) => updateDraftConfig("notes", e.target.value)} placeholder="Custom integration details" />
                </div>
              )}

              {/* Common: schedule + auth */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="space-y-1.5"><Label>Sync schedule</Label>
                  <Select value={draft.config?.schedule ?? "manual"} onValueChange={(v) => updateDraftConfig("schedule", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual only</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>API key secret name</Label>
                  <Input value={draft.api_key_secret_name ?? ""} onChange={(e) => setDraft({ ...draft, api_key_secret_name: e.target.value })} placeholder="Optional, e.g. ACPR_API_KEY" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Add the secret value in <strong>Cloud → Secrets</strong> if your endpoint requires authentication.</p>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => { setConfigFor(null); setDraft(null); }}>Cancel</Button><Button onClick={saveConfig}>Save configuration</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Connectors;
