import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-40">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                  <Button
                    variant="ghost" size="icon"
                    onClick={async () => { await signOut(); navigate("/"); }}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}