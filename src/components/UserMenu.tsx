import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, Settings, BookOpen, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { startProductTour } from "@/lib/productTour";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useRoles();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setName(data?.display_name || user.email?.split("@")[0] || "User");
        setAvatar(data?.avatar_url ?? null);
      });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const initials = (name || "U").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tour="user-menu"
        className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-7 w-7">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden sm:inline max-w-[160px] truncate">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-semibold truncate">{name}</span>
          <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="h-4 w-4 mr-2" /> Profile
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4 mr-2" /> Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => startProductTour(navigate)}>
          <BookOpen className="h-4 w-4 mr-2" /> Resources & Guide
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}