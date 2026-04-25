import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Users, UserPlus, X, BarChart3, Crown, User as UserIcon, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";
import { ModuleHeader, ViewMode } from "@/components/ModuleHeader";

type Team = { id: string; name: string; description: string | null; created_at: string };
type Member = { id: string; team_id: string; user_id: string; member_role: "manager" | "member" };
type Person = { id: string; display_name: string; job_title?: string | null; department?: string | null; is_real: boolean };
type Training = { user_id: string; status: string };

const Teams = () => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("cards");
  const [selected, setSelected] = useState<Team | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => { document.title = "Teams — MERIDIAN"; }, []);

  const load = async () => {
    const [t, m, p, f, tr] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("team_members").select("*"),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("fictional_users").select("id, display_name, job_title, department"),
      supabase.from("training_assignments").select("user_id, status"),
    ]);
    setTeams((t.data ?? []) as Team[]);
    setAllMembers((m.data ?? []) as Member[]);
    const map = new Map<string, Person>();
    (p.data ?? []).forEach((x: any) => map.set(x.id, { id: x.id, display_name: x.display_name ?? x.id.slice(0, 8), is_real: true }));
    (f.data ?? []).forEach((x: any) => map.set(x.id, { id: x.id, display_name: x.display_name, job_title: x.job_title, department: x.department, is_real: false }));
    setPeople(map);
    setTrainings((tr.data ?? []) as Training[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const createTeam = async () => {
    if (!newName.trim() || !user) return;
    const { data, error } = await supabase.from("teams").insert({ name: newName.trim(), description: newDesc.trim() || null, created_by: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id, member_role: "manager" });
    setNewName(""); setNewDesc(""); setCreateOpen(false);
    toast.success("Team created"); load();
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted"); load();
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const teamMembers = (teamId: string) => allMembers.filter((m) => m.team_id === teamId);
  const teamManager = (teamId: string) => teamMembers(teamId).find((m) => m.member_role === "manager");
  const personOf = (uid: string): Person => people.get(uid) ?? { id: uid, display_name: uid.slice(0, 8) + "…", is_real: false };

  const stats = useMemo(() => {
    const totalMembers = allMembers.length;
    const totalManagers = allMembers.filter((m) => m.member_role === "manager").length;
    const completed = trainings.filter((t) => t.status === "completed").length;
    const inProgress = trainings.filter((t) => t.status === "in_progress").length;
    const assigned = trainings.filter((t) => t.status === "assigned").length;
    const completionRate = trainings.length ? Math.round((completed / trainings.length) * 100) : 0;
    return { totalMembers, totalManagers, completed, inProgress, assigned, completionRate, totalTrainings: trainings.length };
  }, [allMembers, trainings]);

  const teamStats = (teamId: string) => {
    const members = teamMembers(teamId);
    const memberIds = new Set(members.map((m) => m.user_id));
    const teamTrainings = trainings.filter((t) => memberIds.has(t.user_id));
    const completed = teamTrainings.filter((t) => t.status === "completed").length;
    const total = teamTrainings.length;
    return { members: members.length, managers: members.filter((m) => m.member_role === "manager").length, completed, total, rate: total ? Math.round((completed / total) * 100) : 0 };
  };

  const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  // ============ RENDERS ============

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((t) => {
        const members = teamMembers(t.id);
        const mgr = teamManager(t.id);
        const s = teamStats(t.id);
        return (
          <button key={t.id} onClick={() => setSelected(t)}
            className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
              </div>
              <Badge variant="outline" className="flex-shrink-0">{members.length}</Badge>
            </div>
            {mgr && (
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <Crown className="h-3 w-3 text-amber-500" /> Manager: <span className="text-foreground font-medium">{personOf(mgr.user_id).display_name}</span>
              </div>
            )}
            <div className="flex -space-x-2 mb-3">
              {members.slice(0, 6).map((m) => {
                const p = personOf(m.user_id);
                return (
                  <div key={m.id} className="h-8 w-8 rounded-full bg-primary/10 text-primary border-2 border-card flex items-center justify-center text-[10px] font-semibold" title={p.display_name}>
                    {initials(p.display_name)}
                  </div>
                );
              })}
              {members.length > 6 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  +{members.length - 6}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Training completion</span>
              <span className="font-semibold">{s.rate}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${s.rate}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderTable = () => (
    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <Table>
        <TableHeader><TableRow>
          <TableHead>Team</TableHead><TableHead>Manager</TableHead><TableHead>Members</TableHead>
          <TableHead>Training completion</TableHead><TableHead className="w-12"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {teams.map((t) => {
            const mgr = teamManager(t.id);
            const s = teamStats(t.id);
            return (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                <TableCell>
                  <div className="font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                </TableCell>
                <TableCell>{mgr ? personOf(mgr.user_id).display_name : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>{s.members}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${s.rate}%` }} /></div>
                    <span className="text-xs font-medium w-10">{s.rate}%</span>
                    <span className="text-xs text-muted-foreground">({s.completed}/{s.total})</span>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {isAdmin && <Button size="icon" variant="ghost" onClick={() => deleteTeam(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderDashboard = () => {
    const tile = (label: string, value: string | number, sub?: string, icon?: React.ComponentType<{ className?: string }>) => {
      const Icon = icon;
      return (
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {Icon && <Icon className="h-3.5 w-3.5" />} {label}
          </div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tile("Teams", teams.length, "Active organizational units", Users)}
          {tile("Members", stats.totalMembers, `${stats.totalManagers} managers`, UserIcon)}
          {tile("Trainings", stats.totalTrainings, `${stats.completed} completed · ${stats.inProgress} in progress`, GraduationCap)}
          {tile("Completion rate", `${stats.completionRate}%`, "Across all teams", BarChart3)}
        </div>

        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-semibold mb-4">Training completion by team</h3>
          <div className="space-y-3">
            {teams.map((t) => {
              const s = teamStats(t.id);
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{s.completed} / {s.total} ({s.rate}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${s.rate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4">Team headcount</h3>
            <div className="space-y-2">
              {teams.map((t) => {
                const s = teamStats(t.id);
                const max = Math.max(...teams.map((x) => teamStats(x.id).members), 1);
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate">{t.name}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden flex items-center">
                      <div className="h-full bg-primary/80 flex items-center justify-end px-2" style={{ width: `${(s.members / max) * 100}%` }}>
                        <span className="text-[10px] font-semibold text-primary-foreground">{s.members}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-semibold mb-4">Training status mix</h3>
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
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <ModuleHeader
          icon={Users}
          title="Teams"
          subtitle="Organize people, assign managers and track training across the organization."
          views={["dashboard", "cards", "table"]}
          view={view}
          onViewChange={setView}
          actions={isAdmin ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> New team</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. AML Analysts — Paris" /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} /></div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createTeam}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          ) : undefined}
        />

        {loading || rolesLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No teams yet.</div>
        ) : view === "cards" ? renderCards() : view === "table" ? renderTable() : renderDashboard()}
      </main>

      {/* Team detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            {selected?.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
          </DialogHeader>
          {selected && (
            <div className="space-y-3 mt-2">
              {teamMembers(selected.id).map((m) => {
                const p = personOf(m.user_id);
                return (
                  <div key={m.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">{initials(p.display_name)}</div>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {p.display_name}
                          {!p.is_real && <Badge variant="outline" className="text-[9px] py-0 px-1.5">demo</Badge>}
                        </div>
                        {p.job_title && <div className="text-xs text-muted-foreground truncate">{p.job_title}{p.department ? ` · ${p.department}` : ""}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={m.member_role === "manager" ? "default" : "outline"} className="capitalize gap-1">
                        {m.member_role === "manager" && <Crown className="h-3 w-3" />} {m.member_role}
                      </Badge>
                      {isAdmin && <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}><X className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </div>
                );
              })}
              {teamMembers(selected.id).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No members yet.</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
