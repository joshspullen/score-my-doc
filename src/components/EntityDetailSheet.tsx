import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Maximize2, ExternalLink, X, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface DetailLink {
  label: string;
  to?: string;
  icon?: LucideIcon;
  meta?: string;
  badge?: string;
}

export interface DetailSection {
  title: string;
  icon?: LucideIcon;
  links?: DetailLink[];
  empty?: string;
  content?: ReactNode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: { label: string; className?: string }[];
  description?: string | null;
  fields?: { label: string; value: ReactNode }[];
  sections?: DetailSection[];
  primaryHref?: string;
  primaryLabel?: string;
}

export const EntityDetailSheet = ({
  open, onClose, icon: Icon, eyebrow, title, subtitle, badges, description, fields, sections, primaryHref, primaryLabel,
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className={`p-0 overflow-hidden flex flex-col ${expanded ? "!max-w-[95vw] sm:!max-w-[1100px] w-[95vw]" : "!max-w-xl w-full sm:!max-w-xl"}`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow ?? "Detail"}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setExpanded((v) => !v)} title={expanded ? "Collapse" : "Expand"}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-3">
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle className="text-2xl tracking-tight">{title}</SheetTitle>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              {badges && badges.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {badges.map((b, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${b.className ?? "bg-muted text-muted-foreground"}`}>{b.label}</span>
                  ))}
                </div>
              )}
            </SheetHeader>
          </div>

          {description && (
            <div className="px-6 pb-5">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {fields && fields.length > 0 && (
            <div className="px-6 pb-5">
              <div className="bg-muted/30 border border-border rounded-lg divide-y divide-border">
                {fields.map((f, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
                    <div className="text-muted-foreground">{f.label}</div>
                    <div className="col-span-2">{f.value ?? <span className="text-muted-foreground">—</span>}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections && sections.map((s, i) => (
            <div key={i} className="px-6 pb-5">
              <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                {s.icon && <s.icon className="h-3.5 w-3.5" />}
                {s.title}
                {s.links && <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">{s.links.length}</Badge>}
              </div>
              {s.content}
              {s.links && (s.links.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2">{s.empty ?? "Nothing linked yet."}</div>
              ) : (
                <div className="space-y-1.5">
                  {s.links.map((l, j) => {
                    const inner = (
                      <div className="group flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 hover:border-primary/40 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          {l.icon && <l.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                          <span className="text-sm font-medium truncate">{l.label}</span>
                          {l.badge && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex-shrink-0">{l.badge}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {l.meta && <span className="text-xs text-muted-foreground">{l.meta}</span>}
                          {l.to && <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </div>
                    );
                    return l.to
                      ? <Link key={j} to={l.to} onClick={onClose} className="block">{inner}</Link>
                      : <div key={j}>{inner}</div>;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {primaryHref && (
          <div className="border-t border-border px-6 py-3 flex justify-end">
            <Link to={primaryHref} onClick={onClose}>
              <Button size="sm" className="gap-1.5">{primaryLabel ?? "Open"} <ExternalLink className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};