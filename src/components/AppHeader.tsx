import { Link, useNavigate } from "react-router-dom";
import { LogOut, Shield, Users, Plug, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import logo from "@/assets/meridian-logo.svg";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin, isManager } = useRoles();
  const navigate = useNavigate();

  return (
    <header className="border-b border-black/80 bg-black text-white sticky top-0 z-50 isolate">
      <div className="container flex h-16 items-center justify-between relative z-10">
        <Link
          to={user ? "/dashboard" : "/"}
          className="relative z-10 flex items-center gap-3 text-white cursor-pointer py-2 -my-2 pr-3 hover:opacity-80 transition-opacity"
        >
          <img src={logo} alt="MERIDIAN" className="h-9 w-9 text-white pointer-events-none" />
          <span className="font-bold text-lg tracking-[0.18em]">MERIDIAN</span>
        </Link>
        <nav className="relative z-10 flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">Dashboard</Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
                  <User className="h-4 w-4" /> Profile
                </Button>
              </Link>
              {(isAdmin || isManager) && (
                <Link to="/teams">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
                    <Users className="h-4 w-4" /> Teams
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/connectors">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
                    <Plug className="h-4 w-4" /> Connectors
                  </Button>
                </Link>
              )}
              <Link to="/upload">
                <Button size="sm" className="bg-white text-black hover:bg-white/90">New analysis</Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={async () => { await signOut(); navigate("/"); }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">Sign in</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-white text-black hover:bg-white/90">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}