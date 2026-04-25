import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 20 * 1024 * 1024;

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");

  useEffect(() => { document.title = "Upload — MERIDIAN"; }, []);

  const validateAndSet = (f: File) => {
    if (!ALLOWED.includes(f.type)) {
      toast.error("Unsupported file type. Use PDF, image, DOCX, or TXT.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File too large (max 20 MB).");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setStage("uploading");
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;

      const { data: doc, error: docErr } = await supabase.from("documents").insert({
        user_id: user.id,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        file_size: file.size,
        status: "processing",
      }).select().single();
      if (docErr) throw docErr;

      setStage("analyzing");

      const { data: result, error: fnErr } = await supabase.functions.invoke("analyze-document", {
        body: { document_id: doc.id },
      });

      if (fnErr) {
        // surface 429/402
        const msg = (fnErr as any)?.context?.error || fnErr.message || "Analysis failed";
        throw new Error(msg);
      }

      toast.success("Analysis complete");
      navigate(`/results/${result.analysis_id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Something went wrong");
      setStage("idle");
    }
  };

  const busy = stage !== "idle";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-10 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">New analysis</h1>
        <p className="text-muted-foreground mb-8">Upload a KYC or council regulation document to score it.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) validateAndSet(f);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-12 text-center transition-colors bg-card",
            dragOver ? "border-primary bg-accent" : "border-border",
          )}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
                </p>
              </div>
              {!busy && (
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Choose a different file
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <UploadIcon className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">Drag & drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, DOCX, or TXT — up to 20 MB</p>
              </div>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>Browse files</Button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || busy} className="gap-2 min-w-[160px]">
            {stage === "uploading" && <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>}
            {stage === "analyzing" && <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>}
            {stage === "idle" && "Analyze document"}
          </Button>
        </div>

        {stage === "analyzing" && (
          <p className="text-sm text-muted-foreground text-center mt-6">
            This usually takes 10–30 seconds. Please keep this tab open.
          </p>
        )}
      </main>
    </div>
  );
};

export default Upload;