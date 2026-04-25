import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plug, RefreshCw, ExternalLink, Database, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Connector = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  homepage_url: string | null;
  api_base_url: string | null;
  requires_api_key: boolean;
  api_key_secret_name: string | null;
  enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  records_count: number;
};

type RecordRow = {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  published_at: string | null;
  record_type: string | null;
};

const Connectors = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [recordsFor, setRecordsFor] = useState<Connector | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [keyDialogFor, setKeyDialogFor] = useState<Connector | null>(null);
  const [keyName, setKeyName] = useState("");

  useEffect(() => { document.title = "Connectors — MERIDIAN"; }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("connectors").select("*")
      .order("category").order("name");
    if (error) toast.error(error.message);
    else setConnectors((data ?? []) as Connector[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleEnabled = async (c: Connector, v: boolean) => {
    const { error } = await supabase.from("connectors").update({ enabled: v }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    setConnectors((prev) => prev.map((x) => x.id === c.id ? { ...x, enabled: v } : x));
  };

  const sync = async (c: Connector) => {
    setSyncing(c.id);
    const { data, error } = await supabase.functions.invoke("connector-sync", {
      body: { connector_id: c.id },
    });
    setSyncing(null);
    if (error) { toast.error(error.message); load(); return; }
    toast.success(`${c.name}: synced ${data?.fetched ?? 0} records (total ${data?.total ?? 0})`);
    load();
  };

  const viewRecords = async (c: Connector) => {
    setRecordsFor(c);
    setRecords([]);
    const { data, error } = await supabase
      .from("connector_records")
      .select("id, title, summary, url, published_at, record_type")
      .eq("connector_id", c.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) { toast.error(error.message); return; }
    setRecords((data ?? []) as RecordRow[]);
  };

  const saveKeyName = async () => {
    if (!keyDialogFor) return;
    const { error } = await supabase.from("connectors").update({
      api_key_secret_name: keyName.trim() || null,
      requires_api_key: !!keyName.trim(),
    }).eq("id", keyDialogFor.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved. Add the secret in Cloud → Secrets if you haven't already.");
    setKeyDialogFor(null); setKeyName("");
    load();
  };

  // Group by category
  const byCategory = connectors.reduce((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {} as Record<string, Connector[]>);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Plug className="h-7 w-7" /> Connectors
            </h1>
            <p className="text-muted-foreground mt-1">
              Plug regulatory data sources into MERIDIAN. Synced records feed the AI training engine.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byCategory).map(([cat, list]) => (
              <section key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((c) => (
                    <div key={c.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{c.name}</h3>
                            {c.last_sync_status === "ok" && <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Synced</Badge>}
                            {c.last_sync_status === "error" && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                        </div>
                        <Switch checked={c.enabled} onCheckedChange={(v) => toggleEnabled(c, v)} />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" /> {c.records_count} records</span>
                        {c.last_sync_at && (
                          <span>Synced {formatDistanceToNow(new Date(c.last_sync_at), { addSuffix: true })}</span>
                        )}
                        {c.requires_api_key && (
                          <span className="inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> Key required</span>
                        )}
                      </div>

                      {c.last_sync_error && (
                        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-3 line-clamp-2">
                          {c.last_sync_error}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => sync(c)} disabled={syncing === c.id || !c.enabled} className="gap-1.5">
                          {syncing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Sync now
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => viewRecords(c)} disabled={c.records_count === 0}>
                          View records
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setKeyDialogFor(c); setKeyName(c.api_key_secret_name ?? ""); }} className="gap-1.5">
                          <KeyRound className="h-3.5 w-3.5" /> API key
                        </Button>
                        {c.homepage_url && (
                          <a href={c.homepage_url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Records dialog */}
      <Dialog open={!!recordsFor} onOpenChange={(o) => !o && setRecordsFor(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{recordsFor?.name} — latest records</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No records yet.</p>
            ) : records.map((r) => (
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

      {/* API key dialog */}
      <Dialog open={!!keyDialogFor} onOpenChange={(o) => !o && setKeyDialogFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>API key for {keyDialogFor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Most regulators publish open data — leave blank if no key is required. To use a credentialed endpoint,
              add the secret in <strong>Cloud → Secrets</strong>, then enter its name below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="secret-name">Secret name</Label>
              <Input id="secret-name" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. ACPR_API_KEY" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setKeyDialogFor(null)}>Cancel</Button>
            <Button onClick={saveKeyName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Connectors;