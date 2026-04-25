import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, GraduationCap, Play, CheckCircle2, ExternalLink, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

type Module = { id: string; title: string; description: string | null; content_url: string | null; duration_minutes: number | null; compliance_requirement_id: string | null };
type Req = { id: string; title: string; reference_code: string | null };
type Assignment = { id: string; training_module_id: string; user_id: string; status: string; due_at: string | null; completed_at: string | null };

const empty: Partial<Module> = { title: "", description: "", content_url: "", duration_minutes: null, compliance_requirement_id: null };

const Training = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [modules, setModules] = useState<Module[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Module> | null>(null);

  useEffect(() => { document.title = "Training — MERIDIAN"; load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const [m, r, a] = await Promise.all([
      supabase.from("training_modules").select("*").order("title"),
      supabase.from("compliance_requirements").select("id,title,reference_code").order("title"),
      supabase.from("training_assignments").select("*").eq("user_id", user.id),
    ]);
    setModules((m.data ?? []) as Module[]);
    setReqs((r.data ?? []) as Req[]);
    setMyAssignments((a.data ?? []) as Assignment[]);
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

  // Auto-assign by resolving compliance_assignments → users
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

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><GraduationCap className="h-7 w-7" /> Training</h1>
          <p className="text-muted-foreground mt-1">Learning paths derived from your compliance assignments.</p>
        </div>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My training ({myAssignments.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="catalog">Catalog ({modules.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
            myAssignments.length === 0 ? <div className="text-center py-20 text-muted-foreground">No training assigned yet.</div> : (
            <div className="space-y-3">
              {myAssignments.map((a) => {
                const m = moduleById(a.training_module_id);
                if (!m) return null;
                const r = reqById(m.compliance_requirement_id);
                return (
                  <div key={a.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{m.title}</h3>
                          {statusBadge(a.status)}
                          {m.duration_minutes && <Badge variant="outline" className="text-xs">{m.duration_minutes} min</Badge>}
                        </div>
                        {r && <p className="text-xs text-muted-foreground mt-1">For requirement: {r.reference_code ? `${r.reference_code} — ` : ""}{r.title}</p>}
                        {m.description && <p className="text-sm text-muted-foreground mt-2">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.content_url && <a href={m.content_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="gap-1.5">Open <ExternalLink className="h-3.5 w-3.5" /></Button></a>}
                        {a.status === "assigned" && <Button size="sm" onClick={() => setStatus(a, "in_progress")} className="gap-1.5"><Play className="h-3.5 w-3.5" /> Start</Button>}
                        {a.status === "in_progress" && <Button size="sm" onClick={() => setStatus(a, "completed")} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</Button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="catalog" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button onClick={() => setEditing(empty)} className="gap-1.5"><Plus className="h-4 w-4" /> New module</Button>
            </div>
            {modules.length === 0 ? <div className="text-center py-20 text-muted-foreground">No modules yet.</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modules.map((m) => {
                  const r = reqById(m.compliance_requirement_id);
                  return (
                    <div key={m.id} className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold">{m.title}</h3>
                          {r ? <p className="text-xs text-muted-foreground mt-0.5">→ {r.reference_code ? `${r.reference_code} ` : ""}{r.title}</p> :
                            <p className="text-xs text-destructive mt-0.5">No requirement linked</p>}
                        </div>
                        {m.duration_minutes && <Badge variant="outline" className="text-xs flex-shrink-0">{m.duration_minutes} min</Badge>}
                      </div>
                      {m.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.description}</p>}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => autoAssign(m)} className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Assign to targets</Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => removeModule(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

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
