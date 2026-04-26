import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, ScrollText, Target, Users as UsersIcon, User as UserIcon, Shield, BarChart3, Workflow, GraduationCap, ArrowUpDown, ArrowUp, ArrowDown, Building2, X } from "lucide-react";
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
import { EntityDetailSheet } from "@/components/EntityDetailSheet";
import { PolicyDocuments } from "@/components/PolicyDocuments";
import { GenerateTrainingDialog } from "@/components/training/GenerateTrainingDialog";
import { Sparkles } from "lucide-react";

type Category = "sanctions" | "aml_cft" | "prudential" | "conduct_reporting" | "operational_cyber";
type Req = { id: string; reference_code: string | null; title: string; regulator: string | null; requirement_type: string | null; severity: string | null; description: string | null; business_process_id: string | null; category: Category | null; regulator_id: string | null; subcategory_id: string | null };
type BP = { id: string; name: string };
type Team = { id: string; name: string };
type Profile = { id: string; display_name: string | null };
type Assignment = { id: string; compliance_requirement_id: string; target_type: string; target_role: string | null; target_team_id: string | null; target_user_id: string | null };
type Module = { id: string; title: string; compliance_requirement_id: string | null; duration_minutes?: number | null };
type Regulator = { id: string; name: string; short_code: string; jurisdiction: string | null; country: string | null; website_url: string | null; description: string | null; category: Category | null };
type Sub = { id: string; regulator_id: string; name: string; code: string | null; description: string | null };
type Connector = { id: string; name: string; slug: string; regulator_id: string | null };
type OrchestrateTrainingResponse = {
  module_id?: string;
  mode_used?: "orchestrated" | "legacy_fallback";
  warnings?: string[];
  error?: string;
};

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

const SEVERITIES = ["low", "medium", "high", "critical"];
const sevColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};
const sevRank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

const emptyReq: Partial<Req> = { reference_code: "", title: "", regulator: "", requirement_type: "", severity: "medium", description: "", business_process_id: null, category: null, regulator_id: null, subcategory_id: null };

type SortKey = "reference_code" | "title" | "category" | "regulator" | "subcategory" | "severity" | "targets" | "trainings";
type SortDir = "asc" | "desc";

const Compliance = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRoles();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [bps, setBps] = useState<BP[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [regulators, setRegulators] = useState<Regulator[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Req> | null>(null);
  const [assignFor, setAssignFor] = useState<Req | null>(null);
  const [newAssign, setNewAssign] = useState<{ type: "role" | "team" | "user"; value: string }>({ type: "role", value: "user" });
  const [view, setView] = useState<ViewMode>("table");
  const [detail, setDetail] = useState<Req | null>(null);
  const [genFor, setGenFor] = useState<Req | null>(null);
  const [orchestratingId, setOrchestratingId] = useState<string | null>(null);

  // filters
  const [fCategory, setFCategory] = useState<string>("all");
  const [fRegulator, setFRegulator] = useState<string>("all");
  const [fSubcategory, setFSubcategory] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => { document.title = "Regulations — MERIDIAN"; load(); }, []);

  const load = async () => {
    const [r, b, t, p, a, m, rg, sb, cn] = await Promise.all([
      supabase.from("compliance_requirements").select("*").order("title"),
      supabase.from("business_processes").select("id,name").order("name"),
      supabase.from("teams").select("id,name").order("name"),
      supabase.from("profiles").select("id,display_name").order("display_name"),
      supabase.from("compliance_assignments").select("*"),
      supabase.from("training_modules").select("id,title,compliance_requirement_id,duration_minutes"),
      supabase.from("regulators").select("*").order("short_code"),
      supabase.from("regulator_subcategories").select("*").order("name"),
      supabase.from("connectors").select("id,name,slug,regulator_id"),
    ]);
    setReqs((r.data ?? []) as Req[]);
    setBps((b.data ?? []) as BP[]);
    setTeams((t.data ?? []) as Team[]);
    setProfiles((p.data ?? []) as Profile[]);
    setAssignments((a.data ?? []) as Assignment[]);
    setModules((m.data ?? []) as Module[]);
    setRegulators((rg.data ?? []) as Regulator[]);
    setSubs((sb.data ?? []) as Sub[]);
    setConnectors((cn.data ?? []) as Connector[]);
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
      regulator_id: editing.regulator_id || null,
      subcategory_id: editing.subcategory_id || null,
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

  const generateWithOrchestration = async (r: Req) => {
    setOrchestratingId(r.id);
    try {
      const payload = {
        regulation_id: r.id,
        policy_ids: r.business_process_id ? [r.business_process_id] : [],
        category: catLabel(r.category),
        use_fallback: true,
      };
      const { data, error } = await supabase.functions.invoke("orchestrate-training", { body: payload });
      if (error) throw error;
      const response = (data ?? {}) as OrchestrateTrainingResponse;
      if (response.error) throw new Error(response.error);

      const moduleId = response.module_id;
      const mode = response.mode_used;
      const warnings = Array.isArray(response.warnings) ? response.warnings : [];

      if (!moduleId) throw new Error("Orchestration completed without module id");

      if (mode === "legacy_fallback") {
        toast.warning("Orchestration fallback used", {
          description: warnings.length ? warnings.slice(0, 2).join(" | ") : "Legacy generator was used to complete module creation.",
        });
      } else {
        toast.success("Orchestrated module generated");
      }

      await load();
      setDetail(null);
      navigate(`/knowledge/training?module=${moduleId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate with orchestration";
      toast.error(message);
    } finally {
      setOrchestratingId(null);
    }
  };

  const reqAssignments = (reqId: string) => assignments.filter((a) => a.compliance_requirement_id === reqId);
  const reqModules = (reqId: string) => modules.filter((m) => m.compliance_requirement_id === reqId);
  const regById = (id: string | null) => id ? regulators.find((r) => r.id === id) ?? null : null;
  const subById = (id: string | null) => id ? subs.find((s) => s.id === id) ?? null : null;
  const subsForReg = (regId: string | null) => regId ? subs.filter((s) => s.regulator_id === regId) : [];
  const connectorsForReg = (regId: string | null) => regId ? connectors.filter((c) => c.regulator_id === regId) : [];

  const targetLabel = (a: Assignment) => {
    if (a.target_type === "role") return { icon: Shield, text: `Role: ${a.target_role}` };
    if (a.target_type === "team") return { icon: UsersIcon, text: `Team: ${teams.find((t) => t.id === a.target_team_id)?.name ?? "—"}` };
    return { icon: UserIcon, text: `User: ${profiles.find((p) => p.id === a.target_user_id)?.display_name ?? "—"}` };
  };

  // filtered list
  const filteredReqs = useMemo(() => {
    return reqs.filter((r) => {
      if (fCategory !== "all" && r.category !== fCategory) return false;
      if (fRegulator !== "all" && r.regulator_id !== fRegulator) return false;
      if (fSubcategory !== "all" && r.subcategory_id !== fSubcategory) return false;
      if (fStatus === "critical" && !(r.severity === "critical" || r.severity === "high")) return false;
      if (fStatus === "unassigned" && reqAssignments(r.id).length !== 0) return false;
      if (fStatus === "no-training" && reqModules(r.id).length !== 0) return false;
      return true;
    });
  }, [reqs, assignments, modules, fCategory, fRegulator, fSubcategory, fStatus]);

  // sorted list
  const sortedReqs = useMemo(() => {
    const arr = [...filteredReqs];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const get = (r: Req): string | number => {
        switch (sortKey) {
          case "reference_code": return r.reference_code?.toLowerCase() ?? "";
          case "title": return r.title.toLowerCase();
          case "category": return catLabel(r.category).toLowerCase();
          case "regulator": return regById(r.regulator_id)?.short_code.toLowerCase() ?? r.regulator?.toLowerCase() ?? "";
          case "subcategory": return subById(r.subcategory_id)?.name.toLowerCase() ?? "";
          case "severity": return sevRank[r.severity ?? "medium"] ?? 1;
          case "targets": return reqAssignments(r.id).length;
          case "trainings": return reqModules(r.id).length;
        }
      };
      const av = get(a); const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filteredReqs, sortKey, sortDir, regulators, subs, assignments, modules]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };
  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  const Sortable = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">{children}<SortIcon k={k} /></button>
  );

  // dropdown subcategories depend on regulator filter
  const availableSubs = fRegulator === "all" ? subs : subs.filter((s) => s.regulator_id === fRegulator);
  const activeFilters = [fCategory, fRegulator, fSubcategory, fStatus].filter((v) => v !== "all").length;
  const clearFilters = () => { setFCategory("all"); setFRegulator("all"); setFSubcategory("all"); setFStatus("all"); };

  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap bg-card border border-border rounded-lg p-2.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground px-1">Filter</span>
      <Select value={fCategory} onValueChange={setFCategory}>
        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fRegulator} onValueChange={(v) => { setFRegulator(v); setFSubcategory("all"); }}>
        <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All regulators</SelectItem>
          {regulators.map((r) => <SelectItem key={r.id} value={r.id}>{r.short_code} — {r.jurisdiction}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fSubcategory} onValueChange={setFSubcategory}>
        <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All subcategories</SelectItem>
          {availableSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={fStatus} onValueChange={setFStatus}>
        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="critical">Critical & high</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          <SelectItem value="no-training">No training</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground ml-auto px-1">{sortedReqs.length} of {reqs.length}</span>
      {activeFilters > 0 && <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8 gap-1 text-xs"><X className="h-3 w-3" /> Clear</Button>}
    </div>
  );

  const renderCards = () => (
    <div className="space-y-3">
      {sortedReqs.map((r) => {
        const reg = regById(r.regulator_id);
        const sub = subById(r.subcategory_id);
        return (
          <div key={r.id} onClick={() => setDetail(r)} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {r.reference_code && <Badge variant="outline" className="font-mono text-xs">{r.reference_code}</Badge>}
                  <h3 className="font-semibold">{r.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-md ${r.category ? catColor[r.category] : "bg-muted text-muted-foreground"}`}>{catLabel(r.category)}</span>
                  {r.severity && <span className={`text-xs px-2 py-0.5 rounded-md ${sevColor[r.severity] ?? sevColor.medium}`}>{r.severity}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                  {reg && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{reg.short_code}</span>}
                  {sub && <span>· {sub.name}</span>}
                  {r.requirement_type && <span>· {r.requirement_type}</span>}
                </div>
                {r.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => setAssignFor(r)} className="gap-1.5"><Target className="h-3.5 w-3.5" /> Assign</Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeReq(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader><TableRow>
          <TableHead><Sortable k="reference_code">Code</Sortable></TableHead>
          <TableHead><Sortable k="title">Title</Sortable></TableHead>
          <TableHead><Sortable k="category">Category</Sortable></TableHead>
          <TableHead><Sortable k="regulator">Regulator</Sortable></TableHead>
          <TableHead><Sortable k="subcategory">Subcategory</Sortable></TableHead>
          <TableHead><Sortable k="severity">Severity</Sortable></TableHead>
          <TableHead className="text-right"><Sortable k="targets">Targets</Sortable></TableHead>
          <TableHead className="text-right"><Sortable k="trainings">Trainings</Sortable></TableHead>
          {isAdmin && <TableHead className="w-32"></TableHead>}
        </TableRow></TableHeader>
        <TableBody>
          {sortedReqs.map((r) => {
            const reg = regById(r.regulator_id);
            const sub = subById(r.subcategory_id);
            return (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
                <TableCell className="font-mono text-xs">{r.reference_code || "—"}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-md ${r.category ? catColor[r.category] : "bg-muted text-muted-foreground"}`}>{catLabel(r.category)}</span></TableCell>
                <TableCell className="text-xs">{reg ? <Badge variant="outline" className="text-xs">{reg.short_code}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-xs">{sub?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{r.severity && <span className={`text-xs px-2 py-0.5 rounded-md ${sevColor[r.severity] ?? sevColor.medium}`}>{r.severity}</span>}</TableCell>
                <TableCell className="text-sm text-right">{reqAssignments(r.id).length}</TableCell>
                <TableCell className="text-sm text-right">{reqModules(r.id).length}</TableCell>
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => setAssignFor(r)}><Target className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeReq(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderDashboard = () => {
    const bySeverity = SEVERITIES.map((s) => ({ s, n: reqs.filter((r) => r.severity === s).length }));
    const byCategory = CATEGORIES.map((c) => ({ c: c.value, label: c.label, n: reqs.filter((r) => r.category === c.value).length }));
    const byRegulator = regulators.map((r) => ({ r, n: reqs.filter((x) => x.regulator_id === r.id).length })).sort((a, b) => b.n - a.n).slice(0, 8);
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
          {tile("Regulators", regulators.length, "Active authorities")}
          {tile("Assigned", totalAssigned, `${reqs.length - totalAssigned} unassigned`)}
          {tile("With training", totalWithTraining, `${reqs.length - totalWithTraining} missing`)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> By taxonomy category</h3>
            <div className="space-y-2">
              {byCategory.map((b) => {
                const max = Math.max(...byCategory.map((x) => x.n), 1);
                return (
                  <div key={b.c} className="flex items-center gap-3">
                    <span className="text-sm w-44">{b.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div className={`h-full ${catColor[b.c]} flex items-center justify-end px-2`} style={{ width: `${(b.n / max) * 100}%` }}>
                        <span className="text-[10px] font-semibold">{b.n}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Building2 className="h-4 w-4" /> By regulator</h3>
            <div className="space-y-2">
              {byRegulator.map((b) => {
                const max = Math.max(...byRegulator.map((x) => x.n), 1);
                return (
                  <div key={b.r.id} className="flex items-center gap-3">
                    <span className="text-sm w-24 font-mono">{b.r.short_code}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary/20 flex items-center justify-end px-2" style={{ width: `${(b.n / max) * 100}%` }}>
                        <span className="text-[10px] font-semibold">{b.n}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const editingSubs = editing?.regulator_id ? subsForReg(editing.regulator_id) : [];

  return (
    <div className="container py-10">
      <ModuleHeader
        icon={ScrollText}
        title="Regulations"
        subtitle="Central-bank regulations classified by taxonomy and linked to processes and training."
        views={["dashboard", "cards", "table"]}
        view={view}
        onViewChange={setView}
        actions={isAdmin ? <Button onClick={() => setEditing(emptyReq)} className="gap-1.5"><Plus className="h-4 w-4" /> New regulation</Button> : undefined}
      />

      {view !== "dashboard" && <div className="mb-4"><FilterBar /></div>}

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        sortedReqs.length === 0 && view !== "dashboard" ? <div className="text-center py-20 text-muted-foreground">No regulations match these filters.</div> :
        view === "cards" ? renderCards() : view === "table" ? renderTable() : renderDashboard()}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} regulation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Reference code</Label><Input value={editing?.reference_code ?? ""} onChange={(e) => setEditing({ ...editing!, reference_code: e.target.value })} placeholder="e.g. AML-2024-01" /></div>
              <div className="space-y-1.5"><Label>Severity</Label>
                <Select value={editing?.severity ?? "medium"} onValueChange={(v) => setEditing({ ...editing!, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Title *</Label><Input value={editing?.title ?? ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={editing?.category ?? "none"} onValueChange={(v) => setEditing({ ...editing!, category: v === "none" ? null : (v as Category) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Uncategorized —</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Type</Label><Input value={editing?.requirement_type ?? ""} onChange={(e) => setEditing({ ...editing!, requirement_type: e.target.value })} placeholder="reporting / control / KYC…" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Regulator</Label>
                <Select value={editing?.regulator_id ?? "none"} onValueChange={(v) => setEditing({ ...editing!, regulator_id: v === "none" ? null : v, subcategory_id: null })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {regulators.map((r) => <SelectItem key={r.id} value={r.id}>{r.short_code} — {r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Subcategory</Label>
                <Select value={editing?.subcategory_id ?? "none"} onValueChange={(v) => setEditing({ ...editing!, subcategory_id: v === "none" ? null : v })} disabled={!editing?.regulator_id}>
                  <SelectTrigger><SelectValue placeholder={editing?.regulator_id ? "Choose…" : "Pick regulator first"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {editingSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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

      {detail && (() => {
        const r = detail;
        const bp = r.business_process_id ? bps.find((b) => b.id === r.business_process_id) : null;
        const reg = regById(r.regulator_id);
        const sub = subById(r.subcategory_id);
        const linkedModules = reqModules(r.id);
        const linkedAssignments = reqAssignments(r.id);
        const regConnectors = connectorsForReg(r.regulator_id);
        return (
          <EntityDetailSheet
            open={!!detail}
            onClose={() => setDetail(null)}
            icon={ScrollText}
            eyebrow="Regulation"
            title={r.title}
            subtitle={r.reference_code ? `Reference ${r.reference_code}` : undefined}
            badges={[
              { label: catLabel(r.category), className: r.category ? catColor[r.category] : "bg-muted text-muted-foreground" },
              ...(r.severity ? [{ label: r.severity, className: sevColor[r.severity] ?? sevColor.medium }] : []),
            ]}
            description={r.description}
            fields={[
              { label: "Regulator", value: reg ? `${reg.short_code} — ${reg.name}` : r.regulator || null },
              { label: "Jurisdiction", value: reg?.jurisdiction || null },
              { label: "Subcategory", value: sub?.name || null },
              { label: "Type", value: r.requirement_type || null },
            ]}
            sections={[
              {
                title: "Policy documents (PDFs)", icon: FileText,
                content: <PolicyDocuments target={{ type: "regulation", id: r.id }} />,
              },
              {
                title: "Generate training", icon: Sparkles,
                content: (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-medium">AI-generated training module</div>
                      <div className="text-xs text-muted-foreground">
                        Pick a team, documentation and category — get a quiz with alerts on wrong answers.
                      </div>
                    </div>
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 flex-shrink-0"
                          variant="secondary"
                          onClick={() => setGenFor(r)}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Legacy
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 flex-shrink-0"
                          onClick={() => generateWithOrchestration(r)}
                          disabled={orchestratingId === r.id}
                        >
                          {orchestratingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          Orchestrate
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">Admin only</Badge>
                    )}
                  </div>
                ),
              },
              {
                title: "Linked business process", icon: Workflow,
                links: bp ? [{ label: bp.name, to: "/knowledge/processes", icon: Workflow }] : [],
                empty: "No process linked to this regulation.",
              },
              {
                title: "Training modules", icon: GraduationCap,
                links: linkedModules.map((m) => ({
                  label: m.title, to: `/knowledge/training?module=${m.id}`, icon: GraduationCap,
                  meta: m.duration_minutes ? `${m.duration_minutes} min` : undefined,
                })),
                empty: "No training module references this regulation yet.",
              },
              {
                title: "Data connectors", icon: Building2,
                links: regConnectors.map((c) => ({ label: c.name, to: "/integrations/connectors", icon: Building2, badge: c.slug })),
                empty: reg ? `No connectors are pointing to ${reg.short_code} yet.` : "Link a regulator to see related data connectors.",
              },
              {
                title: "Assigned to", icon: Target,
                links: linkedAssignments.map((a) => {
                  const { icon, text } = targetLabel(a);
                  const to = a.target_type === "team" && a.target_team_id ? "/teams" : a.target_type === "user" ? "/people/users" : undefined;
                  return { label: text, icon, to, badge: a.target_type };
                }),
                empty: "No targets assigned. Use Assign to attach a role, team or user.",
              },
            ]}
          />
        );
      })()}

      <GenerateTrainingDialog
        open={!!genFor}
        onClose={() => setGenFor(null)}
        regulation={genFor as any}
        onCreated={() => { setGenFor(null); load(); toast.success("Module added to Training"); }}
      />
    </div>
  );
};

export default Compliance;
