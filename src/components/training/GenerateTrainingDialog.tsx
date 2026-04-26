import { useEffect, useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Reg = { id: string; title: string; reference_code: string | null; severity: string | null; description: string | null; category: string | null };
type Team = { id: string; name: string };
type Doc = { id: string; name: string; description: string | null };

interface Props {
  open: boolean;
  onClose: () => void;
  regulation: Reg | null;
  onCreated?: (moduleId: string) => void;
}

const CATEGORIES = ["Awareness", "Procedure", "Risk & Controls", "Reporting", "Sanction response"];

export const GenerateTrainingDialog = ({ open, onClose, regulation, onCreated }: Props) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [teamId, setTeamId] = useState<string>("none");
  const [docId, setDocId] = useState<string>("none");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [duration, setDuration] = useState<string>("15");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [t, d] = await Promise.all([
        supabase.from("teams").select("id,name").order("name"),
        supabase.from("business_processes").select("id,name,description").order("name"),
      ]);
      setTeams((t.data ?? []) as Team[]);
      setDocs((d.data ?? []) as Doc[]);
    })();
  }, [open]);

  const handleGenerate = async () => {
    if (!regulation) return;
    setBusy(true);
    try {
      const documentation = docId !== "none" ? docs.find((x) => x.id === docId) : null;
      const team = teamId !== "none" ? teams.find((x) => x.id === teamId)?.name : null;

      const { data, error } = await supabase.functions.invoke("generate-training", {
        body: { regulation, documentation, category, team },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const payload = {
        title: data.title || `Training: ${regulation.title}`,
        description: data.description ?? null,
        duration_minutes: data.duration_minutes ?? Number(duration) ?? 15,
        compliance_requirement_id: regulation.id,
        team_id: teamId !== "none" ? teamId : null,
        business_process_id: docId !== "none" ? docId : null,
        category,
        quiz: data.quiz ?? [],
      };
      const { data: ins, error: insErr } = await supabase.from("training_modules").insert(payload).select("id").single();
      if (insErr) throw insErr;

      // Auto-assign to selected team members
      if (teamId !== "none") {
        const { data: members } = await supabase.from("team_members").select("user_id").eq("team_id", teamId);
        const rows = (members ?? []).map((m: any) => ({ training_module_id: ins.id, user_id: m.user_id, status: "assigned" }));
        if (rows.length > 0) {
          await supabase.from("training_assignments").upsert(rows, { onConflict: "training_module_id,user_id", ignoreDuplicates: true });
        }
      }

      toast.success("Training module generated", {
        icon: <CheckCircle2 className="h-4 w-4" />,
        description: `Quiz with ${(data.quiz ?? []).length} questions ready.`,
      });
      onCreated?.(ins.id);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate training");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generate training module
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">From regulation</div>
            <div className="font-medium">{regulation?.title}</div>
            {regulation?.reference_code && <div className="text-xs text-muted-foreground">Ref {regulation.reference_code}</div>}
          </div>

          <div className="space-y-1.5">
            <Label>Target team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No specific team —</SelectItem>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Relative documentation</Label>
            <Select value={docId} onValueChange={setDocId}>
              <SelectTrigger><SelectValue placeholder="No documentation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target duration (min)</Label>
              <Input type="number" min={5} max={90} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Lovable AI will draft a short module and a multiple-choice quiz. Wrong answers alert the learner.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Generating…" : "Generate module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};