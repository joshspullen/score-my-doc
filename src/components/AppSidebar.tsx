import {
  LayoutDashboard, Upload as UploadIcon, User, Users, Shield, Plug,
  GraduationCap, ScrollText, FileText, UsersRound, BookOpen, Bot, Briefcase,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useRoles } from "@/hooks/useRoles";
import logo from "@/assets/meridian-logo.svg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const WORKSPACE: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/profile", icon: User },
];

const PEOPLE_BASE: Item[] = [
  { title: "Overview", url: "/people", icon: UsersRound },
  { title: "People Ops", url: "/people/ops", icon: Briefcase },
];
const PEOPLE_TEAMS: Item = { title: "Teams", url: "/teams", icon: Users };
const PEOPLE_USERS: Item = { title: "Users", url: "/admin", icon: Shield };

const KNOWLEDGE: Item[] = [
  { title: "Overview", url: "/knowledge", icon: BookOpen },
  { title: "Regulations", url: "/knowledge/regulations", icon: ScrollText },
  { title: "Documentation", url: "/knowledge/processes", icon: FileText },
  { title: "Training", url: "/knowledge/training", icon: GraduationCap },
];

const INTEGRATIONS_BASE: Item[] = [
  { title: "New analysis", url: "/upload", icon: UploadIcon },
];
const INTEGRATIONS_ADMIN: Item = { title: "Connectors", url: "/connectors", icon: Plug };

const AUTOMATION: Item[] = [
  { title: "Agents", url: "/agents", icon: Bot },
];

const TOUR_KEYS: Record<string, string> = {
  "/knowledge": "nav-knowledge",
  "/knowledge/processes": "nav-docs",
  "/knowledge/regulations": "nav-regs",
  "/agents": "nav-agents",
  "/upload": "nav-upload",
};
const tourKey = (url: string) => TOUR_KEYS[url];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isManager } = useRoles();
  const location = useLocation();

  const peopleVisible: Item[] = [...PEOPLE_BASE];
  if (isAdmin || isManager) peopleVisible.push(PEOPLE_TEAMS);
  if (isAdmin) peopleVisible.push(PEOPLE_USERS);
  const integrationsVisible: Item[] = [...INTEGRATIONS_BASE];
  if (isAdmin) integrationsVisible.unshift(INTEGRATIONS_ADMIN);
  const automationVisible = isAdmin ? AUTOMATION : [];

  const linkBase = "flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors";
  const linkActive = "bg-sidebar-accent text-sidebar-accent-foreground font-medium";

  const renderGroup = (label: string, items: Item[]) => {
    if (items.length === 0) return null;
    return (
      <SidebarGroup>
        {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider">{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url} data-tour={tourKey(item.url)}>
                <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                  <NavLink to={item.url} end className={linkBase} activeClassName={linkActive}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" data-tour="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <img src={logo} alt="MERIDIAN" className="h-7 w-7 flex-shrink-0" />
          {!collapsed && <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Workspace", WORKSPACE)}
        {renderGroup("People", peopleVisible)}
        {renderGroup("Knowledge", KNOWLEDGE)}
        {renderGroup("Automation", automationVisible)}
        {renderGroup("Integrations", integrationsVisible)}
      </SidebarContent>
    </Sidebar>
  );
}