import {
  LayoutDashboard, Upload as UploadIcon, User, Users,
  GraduationCap, ScrollText, FileText, UsersRound, BookOpen, Bot, Briefcase,
  Activity, Network, Flag, ChevronDown, BrainCircuit, Link2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useRoles } from "@/hooks/useRoles";
import logo from "@/assets/meridian-logo.svg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type Group = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; items: Item[] };

const WORKSPACE: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Profile", url: "/profile", icon: User },
];

const PEOPLE_BASE: Item[] = [
  { title: "Overview", url: "/people", icon: UsersRound },
  { title: "People Ops", url: "/people/ops", icon: Briefcase },
];
const PEOPLE_TEAMS: Item = { title: "Teams", url: "/teams", icon: Users };

const KNOWLEDGE: Item[] = [
  { title: "Overview", url: "/knowledge", icon: BookOpen },
  { title: "Regulations", url: "/knowledge/regulations", icon: ScrollText },
  { title: "Documentation", url: "/knowledge/processes", icon: FileText },
  { title: "Training", url: "/knowledge/training", icon: GraduationCap },
];

const CONNECTIONS_BASE: Item[] = [
  { title: "New analysis", url: "/upload", icon: UploadIcon },
];

const AUTOMATION: Item[] = [
  { title: "Agents", url: "/agents", icon: Bot },
];

const DECISIONS: Item[] = [
  { title: "Overview", url: "/telemetry", icon: Activity },
  { title: "Decision Log", url: "/telemetry/traces", icon: Network },
  { title: "Outcomes", url: "/telemetry/outcomes", icon: Flag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isManager } = useRoles();
  const location = useLocation();

  const peopleVisible: Item[] = [...PEOPLE_BASE];
  if (isAdmin || isManager) peopleVisible.push(PEOPLE_TEAMS);
  const connectionsVisible: Item[] = [...CONNECTIONS_BASE];
  const automationVisible = isAdmin ? AUTOMATION : [];

  // Top → bottom: Automation, Decision Intelligence, People, Knowledge, Connections
  const groups: Group[] = [
    { key: "automation", label: "Automation", icon: Bot, items: automationVisible },
    { key: "decisions", label: "Decision Intelligence", icon: BrainCircuit, items: DECISIONS },
    { key: "people", label: "People", icon: UsersRound, items: peopleVisible },
    { key: "knowledge", label: "Knowledge", icon: BookOpen, items: KNOWLEDGE },
    { key: "connections", label: "Connections", icon: Link2, items: connectionsVisible },
  ].filter((g) => g.items.length > 0);

  const groupContainsActive = (g: Group) => g.items.some((i) => location.pathname === i.url || location.pathname.startsWith(i.url + "/"));
  const [openKey, setOpenKey] = useState<string | null>(() => {
    const active = groups.find(groupContainsActive);
    return active?.key ?? null;
  });

  useEffect(() => {
    const active = groups.find(groupContainsActive);
    if (active) setOpenKey(active.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const linkBase = "flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors";
  const linkActive = "bg-sidebar-accent text-sidebar-accent-foreground font-medium";

  const renderFlat = (label: string, items: Item[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
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

  return (
    <Sidebar collapsible="icon" data-tour="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <NavLink to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <img src={logo} alt="MERIDIAN" className="h-7 w-7 flex-shrink-0" />
          {!collapsed && <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>}
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        {renderFlat("Workspace", WORKSPACE)}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((g) => {
                const isOpen = openKey === g.key;
                const hasActive = groupContainsActive(g);
                return (
                  <Collapsible
                    key={g.key}
                    open={isOpen && !collapsed}
                    onOpenChange={(o) => setOpenKey(o ? g.key : null)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={hasActive} className="w-full">
                          <g.icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{g.label}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <SidebarMenu className="ml-4 mt-1 border-l border-sidebar-border pl-2">
                            {g.items.map((item) => (
                              <SidebarMenuItem key={item.url}>
                                <SidebarMenuButton asChild isActive={location.pathname === item.url} size="sm">
                                  <NavLink to={item.url} end className={linkBase} activeClassName={linkActive}>
                                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{item.title}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
