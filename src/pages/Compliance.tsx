import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, ScrollText, Target, Users as UsersIcon, User as UserIcon, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";

type Category = "sanctions" | "aml_cft" | "prudential" | "conduct_reporting" | "operational_cyber";
type Req = { id: string; reference_code: string | null; title: string; regulator: string | null; requirement_type: string | null; severity: string | null; description: string | null; business_process_id: string | null; category: Category | null };
type BP = { id: string; name: string };
type Team = { id: string; name: string };
type Profile = { id: string; display_name: string | null };
type Assignment = { id: string; compliance_requirement_id: string; target_type: string; target_role: string | null; target_team_id: string | null; target_user_id: string | null };
type Module = { id: string; title: string; compliance_requirement_id: string | null };

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "sanctions", label: "Sanctions" },
  { value: "aml_cft", label: "AML/CFT" },
  { value: "prudential", label: "Prudential" },
  { value: "conduct_reporting", label: "Conduct & Reporting" },
  { value: "operational_cyber", label: "Operational & Cyber" },
];
const catLabel = (c: Category | null) => CATEGORIES.find((x) => x.value === c)?.label ?? "Uncategorized";
const catColor: Record<Category, string> = {
  sanctions: "bg-destructive/10 text-destructive",
  aml_cft: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  prudential: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  conduct_reporting: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  operational_cyber: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const emptyReq: Partial<Req> = { reference_code: "", title: "", regulator: "", requirement_type: "", severity: "medium", description: "", business_process_id: null, category: null };

const sevColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

const Compliance = () => {
  const { isAdmin } = useRoles();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [bps, setBps] = useState<BP[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Req> | null>(null);
  const [assignFor, setAssignFor] = useState<Req | null>(null);
  const [newAssign, setNewAssign] = useState<{ type: "role" | "team" | "user"; value: string }>({ type: "role", value: "user" });
  const [view, setView] = useState<ViewMode>("cards");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { document.title = "Regulations — MERIDIAN"; load(); }, []);

  const load = async () => {
    const [r, b, t, p, a, m] = await Promise.all([
      supabase.from("compliance_requirements").select("*").order("title"),
      supabase.from("business_processes").select("id,name").order("name"),
      supabase.from("teams").select("id,name").order("name"),
      supabase.from("profiles").select("id,display_name").order("display_name"),
      supabase.from("compliance_assignments").select("*"),
      supabase.from("training_modules").select("id,title,compliance_requirement_id"),
    ]);
    setReqs((r.data ?? []) as Req[]);
    setBps((b.data ?? []) as BP[]);
    setTeams((t.data ?? []) as Team[]);
    setProfiles((p.data ?? []) as Profile[]);
    setAssignments((a.data ?? []) as Assignment[]);
    setModules((m.data ?? []) as Module[]);
    setLoading(false);
  };

  const saveReq = async () => {
    if (!editing?.title) { toast.error("Title required"); return; }
    const payload = {
      reference_code: editing.reference_code || null, title: editing.title!,
      regulator: editing.regulator || null, requirement_type: editing.requirement_type || null,
      severity: editing.severity || "medium", description: editing.description || null,
      business_process_id: editing.business_process_id || null,
      category: (editing.category as Category | null) || null,
    };
    const { error } = editing.id
      ? await supabase.from("compliance_requirements").update(payload).eq("id", editing.id)
      : await supabase.from("compliance_requirements").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setEditing(null); load();
  };

  const removeReq = async (id: string) => {
    if (!confirm("Delete requirement and all its assignments?")) return;
    const { error } = await supabase.from("compliance_requirements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const addAssignment = async () => {
    if (!assignFor) return;
    const payload: any = { compliance_requirement_id: assignFor.id, target_type: newAssign.type };
    if (newAssign.type === "role") payload.target_role = newAssign.value;
    if (newAssign.type === "team") payload.target_team_id = newAssign.value;
    if (newAssign.type === "user") payload.target_user_id = newAssign.value;
    const { error } = await supabase.from("compliance_assignments").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Assigned"); load();
  };

  const removeAssignment = async (id: string) => {
    const { error } = await supabase.from("compliance_assignments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const reqAssignments = (reqId: string) => assignments.filter((a) => a.compliance_requirement_id === reqId);
  const reqModules = (reqId: string) => modules.filter((m) => m.compliance_requirement_id === reqId);

  const targetLabel = (a: Assignment) => {
    if (a.target_type === "role") return { icon: Shield, text: `Role: ${a.target_role}` };
    if (a.target_type === "team") return { icon: UsersIcon, text: `Team: ${teams.find((t) => t.id === a.target_team_id)?.name ?? "—"}` };
    return { icon: UserIcon, text: `User: ${profiles.find((p) => p.id === a.target_user_id)?.display_name ?? "—"}` };
  };

  const filteredReqs = useMemo(() => {
    if (filter === "all") return reqs;
    if (filter === "critical") return reqs.filter((r) => r.severity === "critical" || r.severity === "high");
    if (filter === "unassigned") return reqs.filter((r) => reqAssignments(r.id).length === 0);
    if (filter === "no-training") return reqs.filter((r) => reqModules(r.id).length === 0);
    if (CATEGORIES.some((c) => c.value === filter)) return reqs.filter((r) => r.category === filter);
    return reqs;
  }, [filter, reqs, assignments, modules]);

  const filters = [
    { value: "all", label: "All", count: reqs.length },
    ...CATEGORIES.map((c) => ({ value: c.value, label: c.label, count: reqs.filter((r) => r.category === c.value).length })),
    { value: "critical", label: "Critical & high", count: reqs.filter((r) => r.severity === "critical" || r.severity === "high").length },
    { value: "unassigned", label: "Unassigned", count: reqs.filter((r) => reqAssignments(r.id).length === 0).length },
    { value: "no-training", label: "No training", count: reqs.filter((r) => reqModules(r.id).length === 0).length },
  ];

  const renderCards = () => (
    <div className="space-y-3">
      {filteredReqs.map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {r.reference_code && <Badge variant="outline" className="font-mono text-xs">{r.reference_code}</Badge>}
                <h3 className="font-semibold">{r.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md ${r.category ? catColor[r.category] : "bg-muted text-muted-foreground"}`}>{catLabel(r.category)}</span>
                {r.severity && <span className={`text-xs px-2 py-0.5 rounded-md ${sevColor[r.severity] ?? sevColor.medium}`}>{r.severity}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                {r.regulator && <span>Regulator: {r.regulator}</span>}
                {r.requirement_type && <span>Type: {r.requirement_type}</span>}
                {r.business_process_id && <span>Process: {bps.find((b) => b.id === r.business_process_id)?.name ?? "—"}</span>}
              </div>
              {r.description && <p className="text-sm text-muted-foreground mt-2">{r.description}</p>}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setAssignFor(r)} className="gap-1.5"><Target className="h-3.5 w-3.5" /> Assign</Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => removeReq(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Assigned to:</span>
            {reqAssignments(r.id).length === 0 ? <span className="text-xs text-muted-foreground">No targets</span> :
              reqAssignments(r.id).map((a) => {
                const { icon: Icon, text } = targetLabel(a);
                return <Badge key={a.id} variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{text}</Badge>;
              })}
            <span className="text-xs uppercase tracking-wider text-muted-foreground ml-3">Trainings:</span>
            <span className="text-xs">{reqModules(r.id).length} linked</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Regulator</TableHead>
          <TableHead>Severity</TableHead><TableHead>Targets</TableHead><TableHead>Trainings</TableHead>
          {isAdmin && <TableHead className="w-32"></TableHead>}
        </TableRow></TableHeader>
        <TableBody>
          {filteredReqs.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.reference_code || "—"}</TableCell>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell className="text-xs">{r.regulator || "—"}</TableCell>
              <TableCell>{r.severity && <span className={`text-xs px-2 py-0.5 rounded-md ${sevColor[r.severity] ?? sevColor.medium}`}>{r.severity}</span>}</TableCell>
              <TableCell className="text-sm">{reqAssignments(r.id).length}</TableCell>
              <TableCell className="text-sm">{reqModules(r.id).length}</TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => setAssignFor(r)}><Target className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeReq(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderDashboard = () => {
    const bySeverity = ["low", "medium", "high", "critical"].map((s) => ({ s, n: reqs.filter((r) => r.severity === s).length }));
    const tile = (label: string, value: string | number, sub?: string) => (
      <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    );
    const totalAssigned = reqs.filter((r) => reqAssignments(r.id).length > 0).length;
    const totalWithTraining = reqs.filter((r) => reqModules(r.id).length > 0).length;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tile("Requirements", reqs.length, "Total tracked")}
          {tile("Assigned", totalAssigned, `${reqs.length - totalAssigned} unassigned`)}
          {tile("With training", totalWithTraining, `${reqs.length - totalWithTraining} missing`)}
          {tile("Critical+high", bySeverity.filter((b) => b.s === "critical" || b.s === "high").reduce((s, b) => s + b.n, 0))}
        </div>
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> By severity</h3>
          <div className="space-y-2">
            {bySeverity.map((b) => {
              const max = Math.max(...bySeverity.map((x) => x.n), 1);
              return (
                <div key={b.s} className="flex items-center gap-3">
                  <span className="text-sm w-24 capitalize">{b.s}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div className={`h-full ${sevColor[b.s]} flex items-center justify-end px-2`} style={{ width: `${(b.n / max) * 100}%` }}>
                      <span className="text-[10px] font-semibold">{b.n}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-10">
      <ModuleHeader
        icon={ScrollText}
        title="Compliance"
        subtitle="Regulatory requirements linked to business processes and training."
        views={["dashboard", "cards", "table"]}
        view={view}
        onViewChange={setView}
        filters={filters}
        filter={filter}
        onFilterChange={setFilter}
        actions={isAdmin ? <Button onClick={() => setEditing(emptyReq)} className="gap-1.5"><Plus className="h-4 w-4" /> New requirement</Button> : undefined}
      />

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        filteredReqs.length === 0 && view !== "dashboard" ? <div className="text-center py-20 text-muted-foreground">No requirements match this filter.</div> :
        view === "cards" ? renderCards() : view === "table" ? renderTable() : renderDashboard()}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} compliance requirement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Reference code</Label><Input value={editing?.reference_code ?? ""} onChange={(e) => setEditing({ ...editing!, reference_code: e.target.value })} placeholder="e.g. AML-2024-01" /></div>
              <div className="space-y-1.5"><Label>Regulator</Label><Input value={editing?.regulator ?? ""} onChange={(e) => setEditing({ ...editing!, regulator: e.target.value })} placeholder="ACPR / EBA…" /></div>
            </div>
            <div className="space-y-1.5"><Label>Title *</Label><Input value={editing?.title ?? ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label><Input value={editing?.requirement_type ?? ""} onChange={(e) => setEditing({ ...editing!, requirement_type: e.target.value })} placeholder="reporting / control / KYC…" /></div>
              <div className="space-y-1.5"><Label>Severity</Label>
                <Select value={editing?.severity ?? "medium"} onValueChange={(v) => setEditing({ ...editing!, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Business process</Label>
              <Select value={editing?.business_process_id ?? "none"} onValueChange={(v) => setEditing({ ...editing!, business_process_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {bps.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveReq}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Assign: {assignFor?.title}</DialogTitle></DialogHeader>
          <Tabs defaultValue="add">
            <TabsList><TabsTrigger value="add">Add target</TabsTrigger><TabsTrigger value="current">Current ({assignFor ? reqAssignments(assignFor.id).length : 0})</TabsTrigger></TabsList>
            <TabsContent value="add" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Target type</Label>
                  <Select value={newAssign.type} onValueChange={(v: any) => setNewAssign({ type: v, value: v === "role" ? "user" : "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role</SelectItem><SelectItem value="team">Team</SelectItem><SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Value</Label>
                  {newAssign.type === "role" ? (
                    <Select value={newAssign.value} onValueChange={(v) => setNewAssign({ ...newAssign, value: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : newAssign.type === "team" ? (
                    <Select value={newAssign.value} onValueChange={(v) => setNewAssign({ ...newAssign, value: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose team" /></SelectTrigger>
                      <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Select value={newAssign.value} onValueChange={(v) => setNewAssign({ ...newAssign, value: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose user" /></SelectTrigger>
                      <SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name ?? p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <Button onClick={addAssignment} disabled={!newAssign.value} className="w-full">Add target</Button>
            </TabsContent>
            <TabsContent value="current" className="space-y-2">
              {assignFor && reqAssignments(assignFor.id).map((a) => {
                const { icon: Icon, text } = targetLabel(a);
                return (
                  <div key={a.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                    <span className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" />{text}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeAssignment(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compliance;