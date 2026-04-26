import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, FileText, Upload as UploadIcon, Download, BarChart3, ScrollText, GraduationCap, ChevronRight, AlertTriangle, ChevronDown, BookOpen, FileCheck, ListChecks, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";
import { EntityDetailSheet } from "@/components/EntityDetailSheet";

type DocLevel = "policy" | "standard" | "procedure" | "work_instruction";
type BP = {
  id: string; code: string | null; name: string; category: string | null;
  owner: string | null; description: string | null;
  doc_level: DocLevel; parent_id: string | null;
  linked_sanction: string | null; sanction_amount: string | null; sanction_year: number | null;
  violation_summary: string | null; approved_by: string | null; version: string | null;
};
type Req = { id: string; business_process_id: string | null; title: string; reference_code: string | null; category: string | null };
type Module = { id: string; title: string; compliance_requirement_id: string | null; duration_minutes: number | null };

const empty: Partial<BP> = { code: "", name: "", category: "", owner: "", description: "", doc_level: "procedure", parent_id: null };

const LEVEL_META: Record<DocLevel, { label: string; icon: LucideIcon; cls: string; rank: number }> = {
  policy:           { label: "Policy",           icon: BookOpen,    cls: "bg-primary/10 text-primary border-primary/20",          rank: 1 },
  standard:         { label: "Standard",         icon: FileCheck,   cls: "bg-blue-500/10 text-blue-700 border-blue-500/20",        rank: 2 },
  procedure:        { label: "Procedure (SOP)",  icon: ListChecks,  cls: "bg-amber-500/10 text-amber-700 border-amber-500/20",     rank: 3 },
  work_instruction: { label: "Work Instruction", icon: FileText,    cls: "bg-muted text-muted-foreground border-border",           rank: 4 },
};

const Documentation = () => {
  const { isAdmin } = useRoles();
  const [rows, setRows] = useState<BP[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BP> | null>(null);
  const [view, setView] = useState<ViewMode>("cards");
  const [filter, setFilter] = useState<string>("all");
  const [detail, setDetail] = useState<BP | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Documentation — MERIDIAN"; load(); }, []);

  const load = async () => {
    const [b, r, m] = await Promise.all([
      supabase.from("business_processes").select("*").order("doc_level").order("code"),
      supabase.from("compliance_requirements").select("id, business_process_id, title, reference_code, category"),
      supabase.from("training_modules").select("id, title, compliance_requirement_id, duration_minutes"),
    ]);
    setRows((b.data ?? []) as BP[]);
    setReqs((r.data ?? []) as Req[]);
    setModules((m.data ?? []) as Module[]);
    setLoading(false);
  };

  const save = async () => {
    if (!editing?.name) { toast.error("Name required"); return; }
    const payload = {
      code: editing.code || null, name: editing.name, category: editing.category || null,
      owner: editing.owner || null, description: editing.description || null,
      doc_level: (editing.doc_level || "procedure") as DocLevel,
      parent_id: editing.parent_id || null,
      linked_sanction: editing.linked_sanction || null,
      sanction_amount: editing.sanction_amount || null,
      sanction_year: editing.sanction_year || null,
      violation_summary: editing.violation_summary || null,
      approved_by: editing.approved_by || null,
      version: editing.version || null,
    };
    const { error } = editing.id
      ? await supabase.from("business_processes").update(payload).eq("id", editing.id)
      : await supabase.from("business_processes").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document?")) return;
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
        doc_level: (idx("doc_level") >= 0 && cols[idx("doc_level")] ? cols[idx("doc_level")] : "procedure") as DocLevel,
      };
    }).filter((r) => r.name);
    if (!records.length) { toast.error("No valid rows (need 'name' column)"); return; }
    const { error } = await supabase.from("business_processes").insert(records);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${records.length} documents`); load();
  };

  const downloadTemplate = () => {
    const csv = "code,name,category,owner,description,doc_level\nPOL-KYC-01,KYC Policy,KYC,Chief Compliance Officer,Bank-wide KYC principles,policy\nSOP-KYC-01,Corporate Onboarding SOP,KYC,KYC Manager,Step-by-step onboarding,procedure\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "documentation_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const reqCount = (id: string) => reqs.filter((r) => r.business_process_id === id).length;
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[], [rows]);
  const policies = useMemo(() => rows.filter((r) => r.doc_level === "policy"), [rows]);
  const childrenOf = (id: string) => rows.filter((r) => r.parent_id === id);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (["policy", "standard", "procedure", "work_instruction"].includes(filter)) return rows.filter((r) => r.doc_level === filter);
    if (filter === "with-sanction") return rows.filter((r) => r.linked_sanction);
    return rows.filter((r) => r.category === filter);
  }, [rows, filter]);

  const filters = [
    { value: "all", label: "All", count: rows.length },
    { value: "policy", label: "Policies", count: rows.filter((r) => r.doc_level === "policy").length },
    { value: "standard", label: "Standards", count: rows.filter((r) => r.doc_level === "standard").length },
    { value: "procedure", label: "SOPs", count: rows.filter((r) => r.doc_level === "procedure").length },
    { value: "work_instruction", label: "Work Instr.", count: rows.filter((r) => r.doc_level === "work_instruction").length },
    { value: "with-sanction", label: "Sanction-linked", count: rows.filter((r) => r.linked_sanction).length },
  ];

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const LevelBadge = ({ level }: { level: DocLevel }) => {
    const m = LEVEL_META[level];
    return (
      <Badge variant="outline" className={`text-xs gap-1 ${m.cls}`}>
        <m.icon className="h-3 w-3" /> {m.label}
      </Badge>
    );
  };

  const renderHierarchyNode = (doc: BP, depth: number) => {
    const kids = childrenOf(doc.id);
    const isOpen = expanded.has(doc.id);
    return (
      <div key={doc.id}>
        <div
          className="flex items-center gap-2 py-2.5 px-3 rounded-md hover:bg-secondary/50 cursor-pointer group"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => setDetail(doc)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(doc.id); }}
            className={`h-5 w-5 flex items-center justify-center rounded ${kids.length ? "hover:bg-muted" : "opacity-0"}`}
          >
            {kids.length > 0 && (isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
          </button>
          <LevelBadge level={doc.doc_level} />
          {doc.code && <span className="font-mono text-xs text-muted-foreground">{doc.code}</span>}
          <span className="font-medium truncate">{doc.name}</span>
          {doc.linked_sanction && (
            <Badge variant="outline" className="ml-2 text-xs gap-1 border-destructive/30 text-destructive bg-destructive/5">
              <AlertTriangle className="h-3 w-3" /> {doc.sanction_amount || "Sanctioned"}
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{kids.length > 0 && `${kids.length} child${kids.length > 1 ? "ren" : ""}`}</span>
        </div>
        {isOpen && kids.map((c) => renderHierarchyNode(c, depth + 1))}
      </div>
    );
  };

  const renderHierarchy = () => (
    <div className="bg-card border border-border rounded-xl p-3" style={{ boxShadow: "var(--shadow-card)" }}>
      {policies.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No policies yet. Create a top-level Policy to start the hierarchy.</div>
      ) : (
        policies.map((p) => renderHierarchyNode(p, 0))
      )}
    </div>
  );

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
            <TableHead>Owner</TableHead><TableHead>Sanction</TableHead><TableHead>Reqs</TableHead>
            {isAdmin && <TableHead className="w-24"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
              <TableCell><LevelBadge level={r.doc_level} /></TableCell>
              <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.category ? <Badge variant="outline" className="text-xs">{r.category}</Badge> : "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{r.owner || "—"}</TableCell>
              <TableCell className="text-xs">
                {r.linked_sanction ? (
                  <span className="text-destructive">{r.sanction_amount || "Yes"}{r.sanction_year ? ` · ${r.sanction_year}` : ""}</span>
                ) : "—"}
              </TableCell>
              <TableCell className="text-sm">{reqCount(r.id)}</TableCell>
              {isAdmin && (
                <TableCell onClick={(e) => e.stopPropagation()}>
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
        <div key={r.id} onClick={() => setDetail(r)} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <LevelBadge level={r.doc_level} />
                {r.code && <span className="font-mono text-[10px] text-muted-foreground">{r.code}</span>}
                {r.version && <Badge variant="secondary" className="text-[10px]">{r.version}</Badge>}
              </div>
              <h3 className="font-semibold">{r.name}</h3>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                {r.category && <Badge variant="secondary" className="text-xs">{r.category}</Badge>}
                {r.owner && <span>Owner: {r.owner}</span>}
              </div>
            </div>
          </div>
          {r.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
          {r.linked_sanction && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Triggered by sanction
              </div>
              <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{r.linked_sanction}{r.sanction_amount ? ` · ${r.sanction_amount}` : ""}{r.sanction_year ? ` (${r.sanction_year})` : ""}</p>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{reqCount(r.id)} requirement(s)</span>
            {isAdmin && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
    const byLevel = (Object.keys(LEVEL_META) as DocLevel[]).map((lv) => ({ lv, n: rows.filter((r) => r.doc_level === lv).length }));
    const maxLv = Math.max(...byLevel.map((b) => b.n), 1);
    const sanctioned = rows.filter((r) => r.linked_sanction);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tile("Documents", rows.length, "Across all levels")}
          {tile("Policies", policies.length, "Top-level")}
          {tile("Sanction-linked", sanctioned.length, "Triggered by an enforcement")}
          {tile("Categories", categories.length)}
        </div>
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> By documentation level</h3>
          <div className="space-y-2">
            {byLevel.map((b) => (
              <div key={b.lv} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{LEVEL_META[b.lv].label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary/80 flex items-center justify-end px-2" style={{ width: `${(b.n / maxLv) * 100}%` }}>
                    <span className="text-[10px] font-semibold text-primary-foreground">{b.n}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sanctioned.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Policies triggered by real sanctions</h3>
            <div className="space-y-3">
              {sanctioned.map((p) => (
                <div key={p.id} onClick={() => setDetail(p)} className="rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LevelBadge level={p.doc_level} />
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs border-destructive/30 text-destructive bg-destructive/5">
                      {p.sanction_amount}{p.sanction_year ? ` · ${p.sanction_year}` : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{p.linked_sanction}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const possibleParents = rows.filter((r) => {
    if (!editing) return true;
    if (editing.id && r.id === editing.id) return false;
    const editingLevel = (editing.doc_level || "procedure") as DocLevel;
    return LEVEL_META[r.doc_level].rank < LEVEL_META[editingLevel].rank;
  });

  return (
    <div className="container py-10">
      <ModuleHeader
        icon={FileText}
        title="Documentation"
        subtitle="Policies → Standards → Procedures → Work Instructions. Linked to the sanctions that shaped them."
        views={["dashboard", "cards", "table", "tree"]}
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
        filtered.length === 0 && view !== "dashboard" && view !== "tree" ? <div className="text-center py-20 text-muted-foreground">No documents match.</div> :
        view === "tree" ? renderHierarchy() :
        view === "table" ? renderTable() :
        view === "cards" ? renderCards() :
        renderDashboard()}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Level *</Label>
                <Select value={editing?.doc_level ?? "procedure"} onValueChange={(v) => setEditing({ ...editing!, doc_level: v as DocLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LEVEL_META) as DocLevel[]).map((lv) => (
                      <SelectItem key={lv} value={lv}>{LEVEL_META[lv].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Parent document</Label>
                <Select value={editing?.parent_id ?? "none"} onValueChange={(v) => setEditing({ ...editing!, parent_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {possibleParents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{LEVEL_META[p.doc_level].label}: {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Code</Label><Input value={editing?.code ?? ""} onChange={(e) => setEditing({ ...editing!, code: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={editing?.category ?? ""} onChange={(e) => setEditing({ ...editing!, category: e.target.value })} placeholder="KYC, AML, Credit…" /></div>
            </div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Owner</Label><Input value={editing?.owner ?? ""} onChange={(e) => setEditing({ ...editing!, owner: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Approved by</Label><Input value={editing?.approved_by ?? ""} onChange={(e) => setEditing({ ...editing!, approved_by: e.target.value })} placeholder="Board, ExCom…" /></div>
              <div className="space-y-1.5"><Label>Version</Label><Input value={editing?.version ?? ""} onChange={(e) => setEditing({ ...editing!, version: e.target.value })} placeholder="v1.0" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" /> Sanction context (if this document was triggered by an enforcement)
              </div>
              <div className="space-y-1.5"><Label>Linked sanction</Label><Input value={editing?.linked_sanction ?? ""} onChange={(e) => setEditing({ ...editing!, linked_sanction: e.target.value })} placeholder="e.g. ING — Dutch authorities settlement" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount</Label><Input value={editing?.sanction_amount ?? ""} onChange={(e) => setEditing({ ...editing!, sanction_amount: e.target.value })} placeholder="€775M" /></div>
                <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={editing?.sanction_year ?? ""} onChange={(e) => setEditing({ ...editing!, sanction_year: e.target.value ? Number(e.target.value) : null })} placeholder="2018" /></div>
              </div>
              <div className="space-y-1.5"><Label>Violation summary</Label><Textarea rows={3} value={editing?.violation_summary ?? ""} onChange={(e) => setEditing({ ...editing!, violation_summary: e.target.value })} placeholder="What went wrong and why this document exists." /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {detail && (() => {
        const p = detail;
        const linkedReqs = reqs.filter((r) => r.business_process_id === p.id);
        const linkedReqIds = new Set(linkedReqs.map((r) => r.id));
        const linkedTrainings = modules.filter((m) => m.compliance_requirement_id && linkedReqIds.has(m.compliance_requirement_id));
        const parent = p.parent_id ? rows.find((r) => r.id === p.parent_id) : null;
        const kids = childrenOf(p.id);
        return (
          <EntityDetailSheet
            open={!!detail}
            onClose={() => setDetail(null)}
            icon={LEVEL_META[p.doc_level].icon}
            eyebrow={LEVEL_META[p.doc_level].label}
            title={p.name}
            subtitle={[p.code, p.version].filter(Boolean).join(" · ") || undefined}
            badges={[
              { label: LEVEL_META[p.doc_level].label, className: LEVEL_META[p.doc_level].cls },
              ...(p.category ? [{ label: p.category, className: "bg-primary/10 text-primary" }] : []),
              ...(p.linked_sanction ? [{ label: "Sanction-linked", className: "bg-destructive/10 text-destructive" }] : []),
            ]}
            description={p.description}
            fields={[
              { label: "Level", value: LEVEL_META[p.doc_level].label },
              { label: "Code", value: p.code ? <span className="font-mono text-xs">{p.code}</span> : null },
              { label: "Version", value: p.version || null },
              { label: "Category", value: p.category || null },
              { label: "Owner", value: p.owner || null },
              { label: "Approved by", value: p.approved_by || null },
              { label: "Parent document", value: parent ? <span>{LEVEL_META[parent.doc_level].label}: {parent.name}</span> : null },
            ]}
            sections={[
              ...(p.linked_sanction ? [{
                title: "Sanction this document responds to",
                icon: AlertTriangle,
                children: (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5">
                        {p.sanction_amount || "Sanction"}{p.sanction_year ? ` · ${p.sanction_year}` : ""}
                      </Badge>
                      <span className="font-semibold text-sm">{p.linked_sanction}</span>
                    </div>
                    {p.violation_summary && <p className="text-sm text-foreground/80">{p.violation_summary}</p>}
                  </div>
                ),
              }] : []),
              ...(kids.length > 0 ? [{
                title: "Child documents", icon: ChevronRight,
                links: kids.map((k) => ({
                  label: k.name, to: "/knowledge/processes", icon: LEVEL_META[k.doc_level].icon,
                  badge: LEVEL_META[k.doc_level].label,
                  meta: k.code ?? undefined,
                  onClick: () => setDetail(k),
                })),
                empty: "No child documents.",
              }] : []),
              {
                title: "Regulations applying to this process", icon: ScrollText,
                links: linkedReqs.map((r) => ({
                  label: r.title, to: "/knowledge/regulations", icon: ScrollText,
                  badge: r.reference_code ?? undefined,
                  meta: r.category ?? undefined,
                })),
                empty: "No regulations linked to this process.",
              },
              {
                title: "Training derived from these regulations", icon: GraduationCap,
                links: linkedTrainings.map((m) => ({
                  label: m.title, to: "/knowledge/training", icon: GraduationCap,
                  meta: m.duration_minutes ? `${m.duration_minutes} min` : undefined,
                })),
                empty: "No training modules cover this process yet.",
              },
            ]}
          />
        );
      })()}
    </div>
  );
};

export default Documentation;