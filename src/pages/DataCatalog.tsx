import { useEffect, useMemo, useState } from "react";
import { Database, Search, Plus, ExternalLink, CheckCircle2, Clock, Loader2, Code2, Globe, FileText, Puzzle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Connector = {
  id: string; slug: string; name: string; category: string; description: string | null;
  homepage_url: string | null; connector_type: string;
  enabled: boolean; last_sync_at: string | null; records_count: number;
};

type Request = {
  id: string; name: string; source_url: string | null; category: string | null;
  rationale: string | null; status: string; requested_by: string; created_at: string;
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  api: Code2, scraping: Globe, file: FileText, other: Puzzle,
};

const DataCatalog = () => {
  const { user } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", source_url: "", category: "", rationale: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Data Catalog — MERIDIAN"; load(); }, []);

  const load = async () => {
    const [{ data: cs }, { data: rs }] = await Promise.all([
      supabase.from("connectors").select("id, slug, name, category, description, homepage_url, connector_type, enabled, last_sync_at, records_count").order("category").order("name"),
      supabase.from("data_source_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setConnectors((cs ?? []) as Connector[]);
    setRequests((rs ?? []) as Request[]);
    setLoading(false);
  };

  const categories = useMemo(() => Array.from(new Set(connectors.map((c) => c.category))).sort(), [connectors]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return connectors.filter((c) => {
      if (catFilter !== "all" && c.category !== catFilter) return false;
      if (!needle) return true;
      return c.name.toLowerCase().includes(needle) || (c.description ?? "").toLowerCase().includes(needle) || c.category.toLowerCase().includes(needle);
    });
  }, [connectors, q, catFilter]);

  const submitRequest = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("data_source_requests").insert({
      requested_by: user.id,
      name: draft.name.trim(),
      source_url: draft.source_url.trim() || null,
      category: draft.category.trim() || null,
      rationale: draft.rationale.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request submitted — admins will review it");
    setOpen(false);
    setDraft({ name: "", source_url: "", category: "", rationale: "" });
    load();
  };

  const stats = {
    total: connectors.length,
    live: connectors.filter((c) => c.enabled && c.last_sync_at).length,
    records: connectors.reduce((s, c) => s + (c.records_count ?? 0), 0),
    pending: requests.filter((r) => r.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-7 w-7" /> Data Catalog
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Browse the regulatory data landscape powering MERIDIAN. See what's flowing in, and request new sources to extend coverage.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Request a source</Button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Sources catalogued", value: stats.total, icon: Database },
            { label: "Live & syncing", value: stats.live, icon: CheckCircle2 },
            { label: "Records collected", value: stats.records.toLocaleString(), icon: Sparkles },
            { label: "Pending requests", value: stats.pending, icon: Clock },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="requests">Requests {requests.length > 0 && <span className="ml-1.5 text-xs bg-muted px-1.5 rounded">{requests.length}</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sources, categories…" className="pl-9" />
              </div>
              <button onClick={() => setCatFilter("all")} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${catFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}>
                All <span className="opacity-70">({connectors.length})</span>
              </button>
              {categories.map((cat) => {
                const n = connectors.filter((c) => c.category === cat).length;
                const active = catFilter === cat;
                return (
                  <button key={cat} onClick={() => setCatFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}>
                    {cat} <span className="opacity-70">({n})</span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No sources match. <button onClick={() => setOpen(true)} className="text-primary underline">Request one</button>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => {
                  const TypeIcon = TYPE_ICON[c.connector_type] ?? Puzzle;
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-xl p-5 flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{c.name}</h3>
                          <p className="text-xs text-muted-foreground">{c.category}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted inline-flex items-center gap-1 flex-shrink-0">
                          <TypeIcon className="h-3 w-3" /> {c.connector_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{c.description ?? "No description."}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        {c.enabled && c.last_sync_at ? (
                          <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Live</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">Not connected</Badge>
                        )}
                        <span>{c.records_count.toLocaleString()} records</span>
                        {c.last_sync_at && <span className="ml-auto">{formatDistanceToNow(new Date(c.last_sync_at), { addSuffix: true })}</span>}
                      </div>
                      {c.homepage_url && (
                        <a href={c.homepage_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-2">
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl" style={{ boxShadow: "var(--shadow-card)" }}>
                <p>No requests yet.</p>
                <Button variant="link" onClick={() => setOpen(true)} className="mt-2">Be the first to request a source</Button>
              </div>
            ) : requests.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{r.name}</h4>
                    {r.category && <Badge variant="outline" className="text-xs">{r.category}</Badge>}
                    <Badge variant={r.status === "pending" ? "outline" : r.status === "approved" ? "default" : "secondary"} className="text-xs capitalize">{r.status}</Badge>
                  </div>
                  {r.rationale && <p className="text-sm text-muted-foreground mt-1">{r.rationale}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1">Source <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Request dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request a new data source</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. AMF (France)" />
            </div>
            <div className="space-y-1.5">
              <Label>Source URL</Label>
              <Input value={draft.source_url} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} placeholder="https://www.amf-france.org/rss.xml" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Regulator, Sanctions, Standard…" />
            </div>
            <div className="space-y-1.5">
              <Label>Why is this useful?</Label>
              <Textarea value={draft.rationale} onChange={(e) => setDraft({ ...draft, rationale: e.target.value })} placeholder="Which regulations, processes or risks would this cover?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataCatalog;
