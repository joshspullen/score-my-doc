import { useEffect, useRef, useState } from "react";
import { FileText, Upload as UploadIcon, Loader2, Trash2, Download, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

type PolicyDoc = {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  extraction_status: "pending" | "ready" | "error";
  extraction_error: string | null;
  created_at: string;
};

interface Props {
  /** Either a regulation (compliance_requirement) or a policy (business_process) */
  target:
    | { type: "regulation"; id: string }
    | { type: "policy"; id: string };
}

const STATUS_META: Record<PolicyDoc["extraction_status"], { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Extracting…", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
  ready:   { label: "Ready for AI",  cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
  error:   { label: "Extraction failed", cls: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export const PolicyDocuments = ({ target }: Props) => {
  const { isAdmin } = useRoles();
  const [docs, setDocs] = useState<PolicyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filterCol = target.type === "regulation" ? "compliance_requirement_id" : "business_process_id";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("policy_documents")
      .select("id, filename, storage_path, mime_type, file_size, extraction_status, extraction_error, created_at")
      .eq(filterCol, target.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data ?? []) as PolicyDoc[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [target.id, target.type]);

  const triggerExtraction = async (docId: string) => {
    setExtractingId(docId);
    try {
      const { error } = await supabase.functions.invoke("extract-policy-pdf", {
        body: { document_id: docId },
      });
      if (error) throw error;
      toast.success("Text extracted");
    } catch (e: any) {
      toast.error(e?.message ?? "Extraction failed");
    } finally {
      setExtractingId(null);
      load();
    }
  };

  const upload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max 20 MB");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const path = `policies/${target.type}/${target.id}/${Date.now()}_${safeName}`;

      const up = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });
      if (up.error) throw up.error;

      const insertPayload: any = {
        uploaded_by: user.id,
        filename: file.name,
        storage_path: path,
        mime_type: file.type || "application/pdf",
        file_size: file.size,
      };
      insertPayload[filterCol] = target.id;

      const { data: ins, error: insErr } = await supabase
        .from("policy_documents")
        .insert(insertPayload)
        .select("id")
        .single();
      if (insErr) throw insErr;

      toast.success("Uploaded — extracting text…");
      await load();
      // Fire and forget extraction (component still updates after load on return)
      triggerExtraction(ins.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (doc: PolicyDoc) => {
    if (!confirm(`Delete ${doc.filename}?`)) return;
    await supabase.storage.from("documents").remove([doc.storage_path]).catch(() => {});
    const { error } = await supabase.from("policy_documents").delete().eq("id", doc.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const download = async (doc: PolicyDoc) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    if (error || !data?.signedUrl) { toast.error(error?.message ?? "Failed to sign URL"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          PDFs uploaded here are read by the AI when generating training. Max 20 MB per file.
        </p>
        {isAdmin && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadIcon className="h-3.5 w-3.5" />}
              Upload PDF
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
          No policy documents yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => {
            const meta = STATUS_META[d.extraction_status];
            const StatusIcon = meta.icon;
            return (
              <li key={d.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{d.filename}</span>
                    <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
                      <StatusIcon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fmtSize(d.file_size)} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                  {d.extraction_status === "error" && d.extraction_error && (
                    <div className="text-xs text-destructive mt-1 truncate" title={d.extraction_error}>{d.extraction_error}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => download(d)} title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && d.extraction_status !== "ready" && (
                    <Button size="icon" variant="ghost" onClick={() => triggerExtraction(d.id)} disabled={extractingId === d.id} title="Re-extract text">
                      {extractingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => remove(d)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PolicyDocuments;