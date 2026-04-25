import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function scoreStroke(score: number) {
  if (score >= 75) return "hsl(var(--success))";
  if (score >= 50) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function ScoreGauge({ score, size = 180, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreStroke(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            fill="none"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold", scoreColor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-semibold", scoreColor(value))}>{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: scoreStroke(value) }}
        />
      </div>
    </div>
  );
}

export function ScoreChip({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-sm font-semibold",
        score >= 75 && "bg-success/10 text-success",
        score >= 50 && score < 75 && "bg-warning/10 text-warning",
        score < 50 && "bg-destructive/10 text-destructive",
      )}
    >
      {score}
    </span>
  );
}