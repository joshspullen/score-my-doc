import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/meridian-logo.svg";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-black/80 bg-black text-white sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 text-white">
          <img src={logo} alt="MERIDIAN" className="h-9 w-9 text-white" />
          <span className="font-bold text-lg tracking-[0.18em]">MERIDIAN</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">Dashboard</Button>
              </Link>
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