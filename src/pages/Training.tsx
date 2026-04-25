import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, GraduationCap, Play, CheckCircle2, ExternalLink, UserPlus, BarChart3, ScrollText, Workflow, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";
import { EntityDetailSheet } from "@/components/EntityDetailSheet";

type Module = { id: string; title: string; description: string | null; content_url: string | null; duration_minutes: number | null; compliance_requirement_id: string | null };
type Req = { id: string; title: string; reference_code: string | null; business_process_id: string | null; category: string | null };
type BP = { id: string; name: string };
type CompAssign = { id: string; compliance_requirement_id: string; target_type: string; target_role: string | null; target_team_id: string | null; target_user_id: string | null };
type Team = { id: string; name: string };
type Assignment = { id: string; training_module_id: string; user_id: string; status: string; due_at: string | null; completed_at: string | null };

const empty: Partial<Module> = { title: "", description: "", content_url: "", duration_minutes: null, compliance_requirement_id: null };

const Training = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [modules, setModules] = useState<Module[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [bps, setBps] = useState<BP[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [compAssigns, setCompAssigns] = useState<CompAssign[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Module> | null>(null);
  const [view, setView] = useState<ViewMode>("cards");
  const [filter, setFilter] = useState<string>("mine");
  const [detail, setDetail] = useState<Module | null>(null);

  useEffect(() => { document.title = "Training — MERIDIAN"; load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const [m, r, a, b, t, ca] = await Promise.all([
      supabase.from("training_modules").select("*").order("title"),
      supabase.from("compliance_requirements").select("id,title,reference_code,business_process_id,category").order("title"),
      supabase.from("training_assignments").select("*").eq("user_id", user.id),
      supabase.from("business_processes").select("id,name"),
      supabase.from("teams").select("id,name"),
      supabase.from("compliance_assignments").select("*"),
    ]);
    setModules((m.data ?? []) as Module[]);
    setReqs((r.data ?? []) as Req[]);
    setMyAssignments((a.data ?? []) as Assignment[]);
    setBps((b.data ?? []) as BP[]);
    setTeams((t.data ?? []) as Team[]);
    setCompAssigns((ca.data ?? []) as CompAssign[]);
    setLoading(false);
  };

  const saveModule = async () => {
    if (!editing?.title) { toast.error("Title required"); return; }
    const payload = {
      title: editing.title!, description: editing.description || null,
      content_url: editing.content_url || null,
      duration_minutes: editing.duration_minutes ? Number(editing.duration_minutes) : null,
      compliance_requirement_id: editing.compliance_requirement_id || null,
    };
    const { error } = editing.id
      ? await supabase.from("training_modules").update(payload).eq("id", editing.id)
      : await supabase.from("training_modules").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setEditing(null); load();
  };

  const removeModule = async (id: string) => {
    if (!confirm("Delete this module and all its assignments?")) return;
    const { error } = await supabase.from("training_modules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const autoAssign = async (m: Module) => {
    if (!m.compliance_requirement_id) { toast.error("Link this module to a compliance requirement first."); return; }
    const { data: ca } = await supabase.from("compliance_assignments").select("*").eq("compliance_requirement_id", m.compliance_requirement_id);
    if (!ca || ca.length === 0) { toast.error("Linked requirement has no targets yet."); return; }
    const userIds = new Set<string>();
    for (const a of ca) {
      if (a.target_type === "user" && a.target_user_id) userIds.add(a.target_user_id);
      else if (a.target_type === "role" && a.target_role) {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", a.target_role);
        (data ?? []).forEach((r: any) => userIds.add(r.user_id));
      } else if (a.target_type === "team" && a.target_team_id) {
        const { data } = await supabase.from("team_members").select("user_id").eq("team_id", a.target_team_id);
        (data ?? []).forEach((r: any) => userIds.add(r.user_id));
      }
    }
    if (userIds.size === 0) { toast.error("No users resolved from targets."); return; }
    const rows = Array.from(userIds).map((uid) => ({ training_module_id: m.id, user_id: uid, status: "assigned" }));
    const { error } = await supabase.from("training_assignments").upsert(rows, { onConflict: "training_module_id,user_id", ignoreDuplicates: true });
    if (error) { toast.error(error.message); return; }
    toast.success(`Assigned to ${userIds.size} user(s)`); load();
  };

  const setStatus = async (a: Assignment, status: "in_progress" | "completed") => {
    const payload: any = { status };
    if (status === "completed") payload.completed_at = new Date().toISOString();
    const { error } = await supabase.from("training_assignments").update(payload).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const moduleById = (id: string) => modules.find((m) => m.id === id);
  const reqById = (id: string | null) => id ? reqs.find((r) => r.id === id) : null;

  const statusBadge = (s: string) => {
    if (s === "completed") return <Badge variant="outline" className="gap-1 text-green-700 dark:text-green-400 border-green-600/30"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
    if (s === "in_progress") return <Badge variant="outline" className="gap-1"><Play className="h-3 w-3" /> In progress</Badge>;
    return <Badge variant="secondary">Assigned</Badge>;
  };

  const stats = useMemo(() => {
    const total = myAssignments.length;
    const completed = myAssignments.filter((a) => a.status === "completed").length;
    const inProgress = myAssignments.filter((a) => a.status === "in_progress").length;
    const assigned = myAssignments.filter((a) => a.status === "assigned").length;
    return { total, completed, inProgress, assigned, rate: total ? Math.round((completed / total) * 100) : 0 };
  }, [myAssignments]);

  const filters = isAdmin
    ? [
        { value: "mine", label: "My training", count: myAssignments.length },
        { value: "catalog", label: "Catalog", count: modules.length },
      ]
    : [{ value: "mine", label: "My training", count: myAssignments.length }];

  // Items in the active filter
  const items: { module: Module; assignment?: Assignment; req: Req | null }[] = useMemo(() => {
    if (filter === "mine") {
      return myAssignments.map((a) => {
        const m = moduleById(a.training_module_id);
        if (!m) return null;
        return { module: m, assignment: a, req: reqById(m.compliance_requirement_id) };
      }).filter(Boolean) as any;
    }
    return modules.map((m) => ({ module: m, req: reqById(m.compliance_requirement_id) }));
  }, [filter, myAssignments, modules, reqs]);

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(({ module: m, assignment: a, req: r }) => (
        <div key={a?.id ?? m.id} onClick={() => setDetail(m)} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{m.title}</h3>
                {a && statusBadge(a.status)}
                {m.duration_minutes && <Badge variant="outline" className="text-xs">{m.duration_minutes} min</Badge>}
              </div>
              {r ? <p className="text-xs text-muted-foreground mt-1">→ {r.reference_code ? `${r.reference_code} — ` : ""}{r.title}</p> :
                filter === "catalog" && <p className="text-xs text-destructive mt-1">No requirement linked</p>}
            </div>
          </div>
          {m.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.description}</p>}
          <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {filter === "mine" && a && m.content_url && <a href={m.content_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1.5">Open <ExternalLink className="h-3.5 w-3.5" /></Button></a>}
            {filter === "mine" && a?.status === "assigned" && <Button size="sm" onClick={() => setStatus(a, "in_progress")} className="gap-1.5"><Play className="h-3.5 w-3.5" /> Start</Button>}
            {filter === "mine" && a?.status === "in_progress" && <Button size="sm" onClick={() => setStatus(a, "completed")} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</Button>}
            {filter === "catalog" && (
              <>
                <Button size="sm" variant="outline" onClick={() => autoAssign(m)} className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Assign to targets</Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => removeModule(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Module</TableHead>
          <TableHead>Requirement</TableHead>
          <TableHead>Duration</TableHead>
          {filter === "mine" && <TableHead>Status</TableHead>}
          <TableHead className="w-32"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nothing here.</TableCell></TableRow>
          ) : items.map(({ module: m, assignment: a, req: r }) => (
            <TableRow key={a?.id ?? m.id} className="cursor-pointer" onClick={() => setDetail(m)}>
              <TableCell className="font-medium">{m.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r ? `${r.reference_code ?? ""} ${r.title}` : "—"}</TableCell>
              <TableCell className="text-xs">{m.duration_minutes ? `${m.duration_minutes} min` : "—"}</TableCell>
              {filter === "mine" && <TableCell>{a && statusBadge(a.status)}</TableCell>}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 justify-end">
                  {filter === "mine" && a?.status === "assigned" && <Button size="sm" variant="ghost" onClick={() => setStatus(a, "in_progress")}><Play className="h-3.5 w-3.5" /></Button>}
                  {filter === "mine" && a?.status === "in_progress" && <Button size="sm" variant="ghost" onClick={() => setStatus(a, "completed")}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                  {filter === "catalog" && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => autoAssign(m)}><UserPlus className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeModule(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filter === "mine" ? (
            <>
              {tile("My total", stats.total, "Assignments")}
              {tile("Completed", stats.completed)}
              {tile("In progress", stats.inProgress)}
              {tile("Completion", `${stats.rate}%`)}
            </>
          ) : (
            <>
              {tile("Catalog", modules.length, "Total modules")}
              {tile("Linked", modules.filter((m) => m.compliance_requirement_id).length, "To requirements")}
              {tile("Avg duration", modules.filter((m) => m.duration_minutes).length ? `${Math.round(modules.filter((m) => m.duration_minutes).reduce((s, m) => s + (m.duration_minutes || 0), 0) / modules.filter((m) => m.duration_minutes).length)} min` : "—")}
              {tile("Requirements", reqs.length, "Available")}
            </>
          )}
        </div>
        {filter === "mine" && (
          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Status mix</h3>
            <div className="flex items-end gap-3 h-40">
              {[
                { label: "Completed", value: stats.completed, color: "bg-green-500" },
                { label: "In progress", value: stats.inProgress, color: "bg-blue-500" },
                { label: "Assigned", value: stats.assigned, color: "bg-amber-500" },
              ].map((b) => {
                const max = Math.max(stats.completed, stats.inProgress, stats.assigned, 1);
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold">{b.value}</div>
                    <div className="w-full bg-muted rounded-t flex-1 flex items-end overflow-hidden">
                      <div className={`w-full ${b.color}`} style={{ height: `${(b.value / max) * 100}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container py-10">
      <ModuleHeader
        icon={GraduationCap}
        title="Training"
        subtitle="Learning paths derived from your compliance assignments."
        views={["dashboard", "cards", "table"]}
        view={view}
        onViewChange={setView}
        filters={filters}
        filter={filter}
        onFilterChange={setFilter}
        actions={isAdmin && filter === "catalog" ? <Button onClick={() => setEditing(empty)} className="gap-1.5"><Plus className="h-4 w-4" /> New module</Button> : undefined}
      />

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        items.length === 0 && view !== "dashboard" ? <div className="text-center py-20 text-muted-foreground">Nothing to show.</div> :
        view === "cards" ? renderCards() : view === "table" ? renderTable() : renderDashboard()}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} training module</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={editing?.title ?? ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Linked compliance requirement</Label>
              <Select value={editing?.compliance_requirement_id ?? "none"} onValueChange={(v) => setEditing({ ...editing!, compliance_requirement_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {reqs.map((r) => <SelectItem key={r.id} value={r.id}>{r.reference_code ? `${r.reference_code} — ` : ""}{r.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Content URL</Label><Input value={editing?.content_url ?? ""} onChange={(e) => setEditing({ ...editing!, content_url: e.target.value })} placeholder="https://…" /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={editing?.duration_minutes ?? ""} onChange={(e) => setEditing({ ...editing!, duration_minutes: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveModule}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Training;