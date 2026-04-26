import { ChevronRight, Zap, ListChecks, MousePointerClick, BookMarked, Flag } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

type Span = {
  id: string;
  step_order: number;
  step_type: string;
  label: string;
  payload: any;
  duration_ms: number | null;
};

const ICONS: Record<string, any> = {
  trigger: Zap,
  options: ListChecks,
  decision: MousePointerClick,
  policy_ref: BookMarked,
  outcome: Flag,
};

export const TraceSpanCard = ({ span }: { span: Span }) => {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[span.step_type] ?? Zap;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-muted/40 transition-colors text-left">
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{span.label}</div>
          <div className="text-xs text-muted-foreground">{span.step_type}</div>
        </div>
        {span.duration_ms !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">{(span.duration_ms / 1000).toFixed(1)}s</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 text-xs bg-muted/40 border border-border rounded-md p-3 overflow-auto max-h-64">
          {JSON.stringify(span.payload, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
};
