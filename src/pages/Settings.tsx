import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Settings as SettingsIcon, Shield, Plug, Building2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Admin from "./Admin";
import Connectors from "./Connectors";

const Settings = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "users";

  useEffect(() => { document.title = "Settings — MERIDIAN"; }, []);

  const onChange = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-7 w-7" /> Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Administrator-only configuration for users, connectors and your workspace.
          </p>
        </div>

        <Tabs value={tab} onValueChange={onChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5"><Shield className="h-4 w-4" /> Users & Roles</TabsTrigger>
            <TabsTrigger value="connectors" className="gap-1.5"><Plug className="h-4 w-4" /> Connectors</TabsTrigger>
            <TabsTrigger value="workspace" className="gap-1.5"><Building2 className="h-4 w-4" /> Workspace</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="-mx-4 sm:mx-0">
            {/* Reuse Admin page */}
            <div className="[&>div>main]:py-0 [&>div>main]:px-0 [&>div]:bg-transparent">
              <Admin />
            </div>
          </TabsContent>

          <TabsContent value="connectors" className="-mx-4 sm:mx-0">
            <div className="[&>div>main]:py-0 [&>div>main]:px-0 [&>div]:bg-transparent">
              <Connectors />
            </div>
          </TabsContent>

          <TabsContent value="workspace">
            <div className="bg-card border border-border rounded-xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Workspace settings</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Branding, organization name and workspace-wide defaults will live here.
              </p>
              <Link to="/dashboard" className="text-sm text-primary mt-4 inline-block">Back to dashboard</Link>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
