import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Workflow, Upload as UploadIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

type BP = { id: string; code: string | null; name: string; category: string | null; owner: string | null; description: string | null };

const empty: Partial<BP> = { code: "", name: "", category: "", owner: "", description: "" };

const BusinessProcesses = () => {
  const { isAdmin } = useRoles();
  const [rows, setRows] = useState<BP[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BP> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Business Processes — MERIDIAN"; load(); }, []);

  const load = async () => {
    const { data, error } = await supabase.from("business_processes").select("*").order("name");
    if (error) toast.error(error.message); else setRows((data ?? []) as BP[]);
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

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Workflow className="h-7 w-7" /> Business Processes</h1>
          <p className="text-muted-foreground mt-1">Catalog of bank processes mapped to compliance and training.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5"><Download className="h-4 w-4" /> Template</Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5"><UploadIcon className="h-4 w-4" /> Import CSV</Button>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
            <Button size="sm" onClick={() => setEditing(empty)} className="gap-1.5"><Plus className="h-4 w-4" /> New process</Button>
          </div>
        )}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Owner</TableHead>
                {isAdmin && <TableHead className="w-24"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No processes yet.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.category || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.owner || "—"}</TableCell>
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
      )}

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
