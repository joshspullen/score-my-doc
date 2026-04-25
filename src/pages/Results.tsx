import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Lightbulb, Loader2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ScoreGauge, ScoreBar } from "@/components/ScoreGauge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Issue = { severity: "low" | "medium" | "high"; title: string; detail: string };

type AnalysisRow = {
  id: string;
  document_id: string;
  overall_score: number;
  sub_scores: { completeness: number; clarity: number; regulatory_alignment: number; risk_flags: number };
  summary: string;
  document_type: string | null;
  issues: Issue[];
  recommendations: string[];
  created_at: string;
  documents: { filename: string; storage_path: string };
};

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*, documents(filename, storage_path)")
        .eq("id", id)
        .single();
      if (error) toast.error(error.message);
      else {
        setAnalysis(data as unknown as AnalysisRow);
        document.title = `${data.document_type ?? "Analysis"} — MERIDIAN`;
      }
      setLoading(false);
    })();
  }, [id]);

  const handleDownload = async () => {
    if (!analysis) return;
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(analysis.documents.storage_path, 60);
    if (error || !data) { toast.error("Could not generate download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async () => {
    if (!analysis) return;
    if (!confirm("Delete this document and analysis?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", analysis.document_id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); navigate("/dashboard"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Analysis not found.</p>
          <Link to="/dashboard"><Button variant="outline" className="mt-4">Back to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const sevColor = (s: Issue["severity"]) =>
    s === "high" ? "bg-destructive/10 text-destructive border-destructive/20"
    : s === "medium" ? "bg-warning/10 text-warning border-warning/20"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-10 max-w-5xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">{analysis.document_type ?? "Document"}</p>
            <h1 className="text-3xl font-bold tracking-tight">{analysis.documents.filename}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-sm font-medium text-muted-foreground mb-4">Overall score</p>
            <ScoreGauge score={analysis.overall_score} size={200} />
          </div>

          <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-sm font-medium text-muted-foreground">Sub-scores</p>
            <ScoreBar label="Completeness" value={analysis.sub_scores.completeness} />
            <ScoreBar label="Clarity" value={analysis.sub_scores.clarity} />
            <ScoreBar label="Regulatory alignment" value={analysis.sub_scores.regulatory_alignment} />
            <ScoreBar label="Risk flags (higher = lower risk)" value={analysis.sub_scores.risk_flags} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-semibold text-lg mb-2">Summary</h2>
          <p className="text-foreground/80 leading-relaxed">{analysis.summary}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="font-semibold text-lg">Issues found ({analysis.issues.length})</h2>
            </div>
            {analysis.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No significant issues detected.</p>
            ) : (
              <ul className="space-y-3">
                {analysis.issues.map((issue, i) => (
                  <li key={i} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("text-xs font-semibold uppercase px-2 py-0.5 rounded border", sevColor(issue.severity))}>
                        {issue.severity}
                      </span>
                      <p className="font-medium text-sm">{issue.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Recommendations</h2>
            </div>
            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations.</p>
            ) : (
              <ul className="space-y-2.5">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-foreground/80">{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;