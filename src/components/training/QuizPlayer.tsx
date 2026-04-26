import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  quiz: QuizQuestion[];
  assignmentId?: string;
  onComplete?: (score: number) => void;
}

export const QuizPlayer = ({ open, onClose, title, quiz, assignmentId, onComplete }: Props) => {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This module has no quiz attached.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const q = quiz[idx];
  const isCorrect = picked === q.correct_index;
  const isLast = idx === quiz.length - 1;

  const reset = () => {
    setIdx(0); setPicked(null); setRevealed(false); setCorrectCount(0); setDone(false);
  };

  const handleCheck = () => {
    if (picked === null) return;
    setRevealed(true);
    if (picked === q.correct_index) {
      setCorrectCount((c) => c + 1);
    } else {
      // ALERT on wrong answer
      toast.error("Incorrect answer", {
        icon: <AlertCircle className="h-4 w-4" />,
        description: q.explanation ?? "Review the linked documentation before continuing.",
        duration: 6000,
      });
    }
  };

  const handleNext = async () => {
    if (!isLast) {
      setIdx((i) => i + 1); setPicked(null); setRevealed(false);
      return;
    }
    // Finish
    const finalScore = Math.round(((correctCount + (isCorrect ? 0 : 0)) / quiz.length) * 100);
    // correctCount is already updated by handleCheck on the last question
    const score = Math.round((correctCount / quiz.length) * 100);
    setDone(true);
    if (assignmentId) {
      setSaving(true);
      const { error } = await supabase
        .from("training_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          score,
          last_attempt: { correct: correctCount, total: quiz.length, at: new Date().toISOString() },
        })
        .eq("id", assignmentId);
      setSaving(false);
      if (error) toast.error(error.message);
    }
    onComplete?.(score);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="truncate">{title}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {done ? "Finished" : `Question ${idx + 1} of ${quiz.length}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!done ? (
          <div className="space-y-4">
            <div className="text-base font-medium">{q.question}</div>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isPicked = picked === i;
                const isAnswer = i === q.correct_index;
                const showRight = revealed && isAnswer;
                const showWrong = revealed && isPicked && !isAnswer;
                return (
                  <button
                    key={i}
                    disabled={revealed}
                    onClick={() => setPicked(i)}
                    className={`w-full text-left border rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2
                      ${isPicked && !revealed ? "border-primary bg-primary/5" : "border-border"}
                      ${showRight ? "border-emerald-500/60 bg-emerald-500/10" : ""}
                      ${showWrong ? "border-destructive/60 bg-destructive/10" : ""}
                      ${!revealed ? "hover:border-primary/40" : ""}
                    `}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {showRight && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {showWrong && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {revealed && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {isCorrect ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Correct</> : <><AlertCircle className="h-4 w-4 text-destructive" /> Incorrect</>}
                </div>
                {q.explanation && <div className="text-muted-foreground mt-1">{q.explanation}</div>}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-4 text-center">
            <Trophy className="h-10 w-10 text-primary mx-auto" />
            <div className="text-2xl font-bold">{Math.round((correctCount / quiz.length) * 100)}%</div>
            <p className="text-sm text-muted-foreground">{correctCount} of {quiz.length} correct</p>
            {correctCount < quiz.length && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Some answers were wrong — please review the documentation.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!done ? (
            !revealed ? (
              <Button onClick={handleCheck} disabled={picked === null}>Check answer</Button>
            ) : (
              <Button onClick={handleNext} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? "Finish" : "Next question"}
              </Button>
            )
          ) : (
            <>
              <Button variant="ghost" onClick={() => { reset(); }}>Retry</Button>
              <Button onClick={() => { onClose(); reset(); }}>Close</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};