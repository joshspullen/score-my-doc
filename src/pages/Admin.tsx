import { useEffect, useState } from "react";
import { Loader2, Shield, Trash2, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useRoles";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AppRole[];
};

const ROLES: AppRole[] = ["admin", "manager", "user"];

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => { document.title = "Admin — MERIDIAN"; }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    if (error) toast.error(error.message);
    else setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: AppRole, enabled: boolean) => {
    setPending(`${userId}:${role}`);
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_role", user_id: userId, role, enabled },
    });
    setPending(null);
    if (error) { toast.error(error.message); return; }
    setUsers((prev) => prev.map((u) =>
      u.id === userId
        ? { ...u, roles: enabled ? Array.from(new Set([...u.roles, role])) : u.roles.filter((r) => r !== role) }
        : u,
    ));
    toast.success(`Role ${enabled ? "granted" : "revoked"}`);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user and their data?")) return;
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete_user", user_id: userId },
    });
    if (error) { toast.error(error.message); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7" /> Administration
            </h1>
            <p className="text-muted-foreground mt-1">Manage users, roles, and access across the platform.</p>
          </div>
          <Link to="/teams"><Button variant="outline" className="gap-2"><UserCog className="h-4 w-4" /> Teams</Button></Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/30">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Last sign-in</div>
              <div className="col-span-5">Roles</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="grid grid-cols-12 items-center px-4 py-4 hover:bg-secondary/30">
                  <div className="col-span-4 min-w-0">
                    <p className="font-medium truncate">{u.display_name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                  </div>
                  <div className="col-span-5 flex flex-wrap gap-3">
                    {ROLES.map((role) => {
                      const has = u.roles.includes(role);
                      const key = `${u.id}:${role}`;
                      return (
                        <label key={role} className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={has}
                            disabled={pending === key}
                            onCheckedChange={(v) => toggleRole(u.id, role, v)}
                          />
                          <Badge variant={has ? "default" : "outline"} className="capitalize">{role}</Badge>
                        </label>
                      );
                    })}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">No users found.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;