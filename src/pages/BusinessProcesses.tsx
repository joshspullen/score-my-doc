import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Workflow, Upload as UploadIcon, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";

type BP = { id: string; code: string | null; name: string; category: string | null; owner: string | null; description: string | null };
type Req = { id: string; business_process_id: string | null };

const empty: Partial<BP> = { code: "", name: "", category: "", owner: "", description: "" };

const BusinessProcesses = () => {
  const { isAdmin } = useRoles();
  const [rows, setRows] = useState<BP[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BP> | null>(null);
  const [view, setView] = useState<ViewMode>("table");
  const [filter, setFilter] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Business Processes — MERIDIAN"; load(); }, []);

  const load = async () => {
    const [b, r] = await Promise.all([
      supabase.from("business_processes").select("*").order("name"),
      supabase.from("compliance_requirements").select("id, business_process_id"),
    ]);
    setRows((b.data ?? []) as BP[]);
    setReqs((r.data ?? []) as Req[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing?.name) { toast.error("Name required"); return; }
    const payload = { code: editing.code || null, name: editing.name, category: editing.category || null, owner: editing.owner || null, description: editing.description || null };
    const { error } = editing.id
      ? await supabase.from("business_processes").update(payload).eq("id", editing.id)
      : await supabase.from("business_processes").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this process?")) return;
    const { error } = await supabase.from("business_processes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) { toast.error("Empty CSV"); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (k: string) => headers.indexOf(k);
    const records = lines.slice(1).map((l) => {
      const cols = l.split(",").map((c) => c.trim());
      return {
        code: idx("code") >= 0 ? cols[idx("code")] || null : null,
        name: cols[idx("name")] || "",
        category: idx("category") >= 0 ? cols[idx("category")] || null : null,
        owner: idx("owner") >= 0 ? cols[idx("owner")] || null : null,
        description: idx("description") >= 0 ? cols[idx("description")] || null : null,
      };
    }).filter((r) => r.name);
    if (!records.length) { toast.error("No valid rows (need 'name' column)"); return; }
    const { error } = await supabase.from("business_processes").insert(records);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${records.length} processes`); load();
  };

  const downloadTemplate = () => {
    const csv = "code,name,category,owner,description\nKYC-01,Customer Onboarding,KYC,Compliance Officer,Onboarding flow for new retail customers\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "business_processes_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const reqCount = (id: string) => reqs.filter((r) => r.business_process_id === id).length;
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "uncategorized") return rows.filter((r) => !r.category);
    if (filter === "no-req") return rows.filter((r) => reqCount(r.id) === 0);
    return rows.filter((r) => r.category === filter);
  }, [rows, filter, reqs]);

  const filters = [
    { value: "all", label: "All", count: rows.length },
    { value: "no-req", label: "No requirement", count: rows.filter((r) => reqCount(r.id) === 0).length },
    { value: "uncategorized", label: "Uncategorized", count: rows.filter((r) => !r.category).length },
    ...categories.slice(0, 3).map((c) => ({ value: c, label: c, count: rows.filter((r) => r.category === c).length })),
  ];

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
            <TableHead>Owner</TableHead><TableHead>Requirements</TableHead>
            {isAdmin && <TableHead className="w-24"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.category ? <Badge variant="outline" className="text-xs">{r.category}</Badge> : "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{r.owner || "—"}</TableCell>
              <TableCell className="text-sm">{reqCount(r.id)}</TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              {r.code && <Badge variant="outline" className="font-mono text-xs mb-1.5">{r.code}</Badge>}
              <h3 className="font-semibold">{r.name}</h3>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                {r.category && <Badge variant="secondary" className="text-xs">{r.category}</Badge>}
                {r.owner && <span>Owner: {r.owner}</span>}
              </div>
            </div>
          </div>
          {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{reqCount(r.id)} requirement(s)</span>
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDashboard = () => {
    const tile = (label: string, value: string | number, sub?: string) => (
      <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    );
    const byCategory = categories.map((c) => ({ c, n: rows.filter((r) => r.category === c).length }));
    const max = Math.max(...byCategory.map((b) => b.n), 1);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tile("Processes", rows.length, "Total catalog")}
          {tile("Categories", categories.length)}
          {tile("With requirements", rows.filter((r) => reqCount(r.id) > 0).length, `${rows.filter((r) => reqCount(r.id) === 0).length} without`)}
          {tile("With owner", rows.filter((r) => r.owner).length)}
        </div>
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> By category</h3>
          {byCategory.length === 0 ? <div className="text-sm text-muted-foreground">No categories yet.</div> : (
            <div className="space-y-2">
              {byCategory.map((b) => (
                <div key={b.c} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate">{b.c}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary/80 flex items-center justify-end px-2" style={{ width: `${(b.n / max) * 100}%` }}>
                      <span className="text-[10px] font-semibold text-primary-foreground">{b.n}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container py-10">
      <ModuleHeader
        icon={Workflow}
        title="Business Processes"
        subtitle="Catalog of bank processes mapped to compliance and training."
        views={["dashboard", "cards", "table"]}
        view={view}
        onViewChange={setView}
        filters={filters}
        filter={filter}
        onFilterChange={setFilter}
        actions={isAdmin ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5"><Download className="h-4 w-4" /> Template</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5"><UploadIcon className="h-4 w-4" /> Import CSV</Button>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
            <Button size="sm" onClick={() => setEditing(empty)} className="gap-1.5"><Plus className="h-4 w-4" /> New</Button>
          </div>
        ) : undefined}
      />

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        filtered.length === 0 && view !== "dashboard" ? <div className="text-center py-20 text-muted-foreground">No processes match.</div> :
        view === "table" ? renderTable() : view === "cards" ? renderCards() : renderDashboard()}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} business process</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Code</Label><Input value={editing?.code ?? ""} onChange={(e) => setEditing({ ...editing!, code: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={editing?.category ?? ""} onChange={(e) => setEditing({ ...editing!, category: e.target.value })} placeholder="KYC, AML, Credit…" /></div>
            </div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Owner</Label><Input value={editing?.owner ?? ""} onChange={(e) => setEditing({ ...editing!, owner: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessProcesses;