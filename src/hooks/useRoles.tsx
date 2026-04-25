import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "user" | "manager";

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!cancelled) {
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isManager: roles.includes("manager"),
  };
}