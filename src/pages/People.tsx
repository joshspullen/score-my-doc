import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Shield, Briefcase } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";

type Tile = { to: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>; admin?: boolean; manager?: boolean; soon?: boolean };

const TILES: Tile[] = [
  { to: "/people/users", title: "Users", desc: "Roles, access and accounts.", icon: Shield, admin: true },
  { to: "/people/teams", title: "Teams", desc: "Org units and managers.", icon: Users, manager: true },
  { to: "/people/ops", title: "People Ops", desc: "Careers, operations and people-finance.", icon: Briefcase, soon: true },
];

const People = () => {
  const { isAdmin, isManager } = useRoles();
  useEffect(() => { document.title = "People — MERIDIAN"; }, []);

  const visible = TILES.filter((t) => !t.admin || isAdmin).filter((t) => !t.manager || isAdmin || isManager);

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">People</h1>
        <p className="text-muted-foreground mt-1">Users, roles and teams across your organization.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((t) => (
          <Link key={t.to} to={t.to}
            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all relative"
            style={{ boxShadow: "var(--shadow-card)" }}>
            {t.soon && <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">Beta</span>}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default People;
