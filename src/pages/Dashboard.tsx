import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload as UploadIcon, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreChip } from "@/components/ScoreGauge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRoles } from "@/hooks/useRoles";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { RegulatoryRadar } from "@/components/dashboard/RegulatoryRadar";

type DocRow = {
  id: string;
  filename: string;
  status: "processing" | "complete" | "failed";
  created_at: string;
  error_message: string | null;
  analyses: { id: string; overall_score: number; document_type: string | null } | { id: string; overall_score: number; document_type: string | null }[] | null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Dashboard — MERIDIAN"; }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, filename, status, created_at, error_message, analyses(id, overall_score, document_type)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data ?? []) as DocRow[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  // Poll while any doc is processing
  useEffect(() => {
    if (!docs.some((d) => d.status === "processing")) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [docs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document and its analysis?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  if (!rolesLoading && isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-10"><AdminDashboard /></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your workspace</h1>
            <p className="text-muted-foreground mt-1">Your recent analyses, training and flagged files.</p>
          </div>
          <Link to="/upload">
            <Button size="lg" className="gap-2"><UploadIcon className="h-4 w-4" /> New analysis</Button>
          </Link>
        </div>

        <div className="mb-10">
          <RegulatoryRadar />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center bg-card">
            <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Upload your first KYC or regulatory document to get an instant compliance score.
            </p>
            <Link to="/upload"><Button>Upload your first document</Button></Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="divide-y divide-border">
              {docs.map((d) => {
                const analysis = Array.isArray(d.analyses) ? d.analyses[0] : d.analyses;
                return (
                  <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{d.filename}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {analysis?.document_type ? `${analysis.document_type} · ` : ""}
                        {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.status === "processing" && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
                        </span>
                      )}
                      {d.status === "failed" && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-destructive" title={d.error_message ?? ""}>
                          <AlertCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                      {d.status === "complete" && analysis && <ScoreChip score={analysis.overall_score} />}
                      {d.status === "complete" && analysis && (
                        <Link to={`/results/${analysis.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;