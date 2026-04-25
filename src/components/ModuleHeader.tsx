import { ReactNode } from "react";
import { LayoutGrid, Table as TableIcon, BarChart3, LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ViewMode = "dashboard" | "cards" | "table";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ModuleHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  views?: ViewMode[];
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  filters?: FilterOption[];
  filter?: string;
  onFilterChange?: (v: string) => void;
  actions?: ReactNode;
}

const viewMeta: Record<ViewMode, { label: string; icon: LucideIcon }> = {
  dashboard: { label: "Dashboard", icon: BarChart3 },
  cards: { label: "Cards", icon: LayoutGrid },
  table: { label: "Table", icon: TableIcon },
};

export const ModuleHeader = ({ icon: Icon, title, subtitle, views, view, onViewChange, filters, filter, onFilterChange, actions }: ModuleHeaderProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Icon className="h-7 w-7" /> {title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {views && view && onViewChange && (
            <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
              <TabsList>
                {views.map((v) => {
                  const M = viewMeta[v];
                  return (
                    <TabsTrigger key={v} value={v} className="gap-1.5">
                      <M.icon className="h-3.5 w-3.5" /> {M.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}
          {actions}
        </div>
      </div>
      {filters && filter !== undefined && onFilterChange && (
        <Tabs value={filter} onValueChange={onFilterChange}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}{f.count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground">({f.count})</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
};