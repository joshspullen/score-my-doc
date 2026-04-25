import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Users, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

type Team = { id: string; name: string; description: string | null; created_at: string };
type Member = { id: string; user_id: string; member_role: "manager" | "member"; display_name: string | null };

const Teams = () => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"manager" | "member">("member");

  useEffect(() => { document.title = "Teams — MERIDIAN"; }, []);

  const loadTeams = async () => {
    const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTeams((data ?? []) as Team[]);
    setLoading(false);
  };

  const loadMembers = async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, user_id, member_role, profiles:user_id(display_name)")
      .eq("team_id", teamId);
    if (error) { toast.error(error.message); return; }
    setMembers(
      (data ?? []).map((m: any) => ({
        id: m.id, user_id: m.user_id, member_role: m.member_role,
        display_name: m.profiles?.display_name ?? null,
      })),
    );
  };

  useEffect(() => { if (user) loadTeams(); }, [user]);
  useEffect(() => { if (selected) loadMembers(selected.id); }, [selected]);

  const createTeam = async () => {
    if (!newName.trim() || !user) return;
    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, created_by: user.id })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    // Auto-add creator as manager
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id, member_role: "manager" });
    setNewName(""); setNewDesc(""); setCreateOpen(false);
    toast.success("Team created");
    loadTeams();
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selected?.id === id) setSelected(null);
    toast.success("Team deleted");
    loadTeams();
  };

  const addMember = async () => {
    if (!selected || !newMemberId.trim()) return;
    const { error } = await supabase.from("team_members").insert({
      team_id: selected.id, user_id: newMemberId.trim(), member_role: newMemberRole,
    });
    if (error) { toast.error(error.message); return; }
    setNewMemberId(""); setNewMemberRole("member"); setAddOpen(false);
    toast.success("Member added");
    loadMembers(selected.id);
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selected) loadMembers(selected.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7" /> Teams
            </h1>
            <p className="text-muted-foreground mt-1">Group analysts and assign managers to oversee them.</p>
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Name</Label>
                    <Input id="team-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. AML Analysts — Paris" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-desc">Description (optional)</Label>
                    <Input id="team-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={createTeam}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading || rolesLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Teams list */}
            <div className="md:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground bg-secondary/30">
                {teams.length} team{teams.length === 1 ? "" : "s"}
              </div>
              <div className="divide-y divide-border">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/40 transition ${selected?.id === t.id ? "bg-secondary/60" : ""}`}
                  >
                    <div className="font-medium">{t.name}</div>
                    {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                  </button>
                ))}
                {teams.length === 0 && (
                  <div className="px-4 py-10 text-sm text-muted-foreground text-center">No teams yet.</div>
                )}
              </div>
            </div>

            {/* Team detail */}
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
              {!selected ? (
                <div className="text-sm text-muted-foreground py-12 text-center">Select a team to view its members.</div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">{selected.name}</h2>
                      {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2"><UserPlus className="h-4 w-4" /> Add member</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="member-id">User ID</Label>
                              <Input id="member-id" value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} placeholder="uuid…" />
                              <p className="text-xs text-muted-foreground">Find the user's ID in the Admin page.</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Role in team</Label>
                              <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as "manager" | "member")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  {isAdmin && <SelectItem value="manager">Manager</SelectItem>}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                            <Button onClick={addMember}>Add</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => deleteTeam(selected.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{m.display_name ?? m.user_id}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.user_id}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={m.member_role === "manager" ? "default" : "outline"} className="capitalize">
                            {m.member_role}
                          </Badge>
                          <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-6">No members in this team yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Teams;