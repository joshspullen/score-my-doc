import { useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, Loader2, Wallet, CalendarDays, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "sonner";

type Position = { id: string; title: string; department: string | null; location: string | null; seniority: string | null; status: string; description: string | null; opened_at: string | null };
type Candidate = { id: string; position_id: string | null; full_name: string; email: string | null; stage: string; notes: string | null; applied_at: string | null };
type Leave = { id: string; user_id: string; leave_type: string; start_date: string; end_date: string; status: string; reason: string | null };
type Payroll = { id: string; user_id: string; period_start: string; period_end: string; base_amount: number; bonus_amount: number; currency: string };

const POS_STATUS = ["open", "interviewing", "filled", "on_hold", "closed"];
const CAND_STAGE = ["applied", "screening", "interview", "offer", "hired", "rejected"];
const LEAVE_TYPE = ["vacation", "sick", "personal", "training", "other"];
const LEAVE_STATUS = ["pending", "approved", "rejected", "cancelled"];

const STAGE_COLOR: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  screening: "bg-blue-500/10 text-blue-700",
  interview: "bg-amber-500/10 text-amber-700",
  offer: "bg-purple-500/10 text-purple-700",
  hired: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-destructive/10 text-destructive",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-700",
  interviewing: "bg-amber-500/10 text-amber-700",
  filled: "bg-blue-500/10 text-blue-700",
  on_hold: "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
  pending: "bg-amber-500/10 text-amber-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const PeopleOps = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const [posEdit, setPosEdit] = useState<Partial<Position> | null>(null);
  const [candEdit, setCandEdit] = useState<Partial<Candidate> | null>(null);
  const [leaveEdit, setLeaveEdit] = useState<Partial<Leave> | null>(null);
  const [payEdit, setPayEdit] = useState<Partial<Payroll> | null>(null);

  useEffect(() => { document.title = "People Ops — MERIDIAN"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const [p, c, l, pr] = await Promise.all([
      supabase.from("positions" as any).select("*").order("opened_at", { ascending: false }),
      supabase.from("candidates" as any).select("*").order("applied_at", { ascending: false }),
      supabase.from("leave_requests" as any).select("*").order("start_date", { ascending: false }),
      supabase.from("payroll_entries" as any).select("*").order("period_start", { ascending: false }),
    ]);
    setPositions((p.data ?? []) as Position[]);
    setCandidates((c.data ?? []) as Candidate[]);
    setLeaves((l.data ?? []) as Leave[]);
    setPayroll((pr.data ?? []) as Payroll[]);
    setLoading(false);
  };

  const savePos = async () => {
    if (!posEdit?.title) { toast.error("Title required"); return; }
    const payload: any = {
      title: posEdit.title, department: posEdit.department || null, location: posEdit.location || null,
      seniority: posEdit.seniority || null, status: posEdit.status || "open", description: posEdit.description || null,
    };
    const { error } = posEdit.id
      ? await supabase.from("positions" as any).update(payload).eq("id", posEdit.id)
      : await supabase.from("positions" as any).insert({ ...payload, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Saved"); setPosEdit(null); load();
  };
  const removePos = async (id: string) => {
    if (!confirm("Delete position and its candidates?")) return;
    const { error } = await supabase.from("positions" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const saveCand = async () => {
    if (!candEdit?.full_name) { toast.error("Name required"); return; }
    const payload: any = {
      full_name: candEdit.full_name, email: candEdit.email || null,
      stage: candEdit.stage || "applied", notes: candEdit.notes || null,
      position_id: candEdit.position_id || null,
    };
    const { error } = candEdit.id
      ? await supabase.from("candidates" as any).update(payload).eq("id", candEdit.id)
      : await supabase.from("candidates" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setCandEdit(null); load();
  };
  const removeCand = async (id: string) => {
    if (!confirm("Delete candidate?")) return;
    const { error } = await supabase.from("candidates" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const saveLeave = async () => {
    if (!leaveEdit?.start_date || !leaveEdit?.end_date) { toast.error("Dates required"); return; }
    const payload: any = {
      user_id: user!.id,
      leave_type: leaveEdit.leave_type || "vacation",
      start_date: leaveEdit.start_date, end_date: leaveEdit.end_date,
      status: leaveEdit.status || "pending", reason: leaveEdit.reason || null,
    };
    const { error } = leaveEdit.id
      ? await supabase.from("leave_requests" as any).update(payload).eq("id", leaveEdit.id)
      : await supabase.from("leave_requests" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setLeaveEdit(null); load();
  };
  const removeLeave = async (id: string) => {
    if (!confirm("Delete this leave request?")) return;
    const { error } = await supabase.from("leave_requests" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const savePay = async () => {
    if (!payEdit?.period_start || !payEdit?.period_end) { toast.error("Period required"); return; }
    const payload: any = {
      user_id: payEdit.user_id || user!.id,
      period_start: payEdit.period_start, period_end: payEdit.period_end,
      base_amount: Number(payEdit.base_amount ?? 0), bonus_amount: Number(payEdit.bonus_amount ?? 0),
      currency: payEdit.currency || "EUR",
    };
    const { error } = payEdit.id
      ? await supabase.from("payroll_entries" as any).update(payload).eq("id", payEdit.id)
      : await supabase.from("payroll_entries" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setPayEdit(null); load();
  };

  if (loading) return <div className="container py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7" /> People Ops
          </h1>
          <p className="text-muted-foreground mt-1">Careers, operations and finance for compliance teams.</p>
        </div>
      </div>

      <Tabs defaultValue="careers" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="careers" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Careers</TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Operations</TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5"><Wallet className="h-3.5 w-3.5" /> Finance</TabsTrigger>
        </TabsList>

        {/* CAREERS */}
        <TabsContent value="careers" className="space-y-8">
          <section>
            <SectionHeader title="Open positions" count={positions.length} action={isAdmin && (
              <Button size="sm" onClick={() => setPosEdit({ status: "open" })} className="gap-1.5"><Plus className="h-4 w-4" /> New position</Button>
            )} />
            {positions.length === 0 ? <Empty msg="No positions yet." /> : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Candidates</TableHead>
                    {isAdmin && <TableHead className="w-20"></TableHead>}
                  </TableRow></TableHeader>
                  <TableBody>
                    {positions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}{p.seniority && <span className="text-xs text-muted-foreground ml-2">{p.seniority}</span>}</TableCell>
                        <TableCell>{p.department || "—"}</TableCell>
                        <TableCell>{p.location || "—"}</TableCell>
                        <TableCell><Badge className={STATUS_COLOR[p.status]}>{p.status}</Badge></TableCell>
                        <TableCell>{candidates.filter((c) => c.position_id === p.id).length}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setPosEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => removePos(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Candidates" count={candidates.length} action={isAdmin && (
              <Button size="sm" onClick={() => setCandEdit({ stage: "applied" })} className="gap-1.5"><UserPlus className="h-4 w-4" /> New candidate</Button>
            )} />
            {candidates.length === 0 ? <Empty msg="No candidates yet." /> : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Position</TableHead><TableHead>Stage</TableHead>
                    {isAdmin && <TableHead className="w-20"></TableHead>}
                  </TableRow></TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                        <TableCell className="text-sm">{positions.find((p) => p.id === c.position_id)?.title || "—"}</TableCell>
                        <TableCell><Badge className={STAGE_COLOR[c.stage]}>{c.stage}</Badge></TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setCandEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => removeCand(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>

        {/* OPERATIONS */}
        <TabsContent value="operations">
          <section>
            <SectionHeader title="Leave requests" count={leaves.length} action={
              <Button size="sm" onClick={() => setLeaveEdit({ leave_type: "vacation", status: "pending" })} className="gap-1.5"><Plus className="h-4 w-4" /> Request leave</Button>
            } />
            {leaves.length === 0 ? <Empty msg="No leave requests yet." /> : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Status</TableHead><TableHead>Reason</TableHead><TableHead className="w-20"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {leaves.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="capitalize">{l.leave_type}</TableCell>
                        <TableCell className="text-sm">{l.start_date}</TableCell>
                        <TableCell className="text-sm">{l.end_date}</TableCell>
                        <TableCell><Badge className={STATUS_COLOR[l.status]}>{l.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.reason || "—"}</TableCell>
                        <TableCell>
                          {(l.user_id === user?.id || isAdmin) && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setLeaveEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => removeLeave(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>

        {/* FINANCE */}
        <TabsContent value="finance">
          <section>
            <SectionHeader title="Payroll entries" count={payroll.length} action={isAdmin && (
              <Button size="sm" onClick={() => setPayEdit({ currency: "EUR" })} className="gap-1.5"><Plus className="h-4 w-4" /> New entry</Button>
            )} />
            {payroll.length === 0 ? <Empty msg={isAdmin ? "No payroll entries yet." : "You have no payroll entries yet."} /> : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Period</TableHead><TableHead className="text-right">Base</TableHead><TableHead className="text-right">Bonus</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Currency</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payroll.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{p.period_start} → {p.period_end}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(p.base_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(p.bonus_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{(Number(p.base_amount) + Number(p.bonus_amount)).toLocaleString()}</TableCell>
                        <TableCell>{p.currency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* Position dialog */}
      <Dialog open={!!posEdit} onOpenChange={(o) => !o && setPosEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{posEdit?.id ? "Edit" : "New"} position</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Title *"><Input value={posEdit?.title ?? ""} onChange={(e) => setPosEdit({ ...posEdit!, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department"><Input value={posEdit?.department ?? ""} onChange={(e) => setPosEdit({ ...posEdit!, department: e.target.value })} placeholder="Compliance" /></Field>
              <Field label="Location"><Input value={posEdit?.location ?? ""} onChange={(e) => setPosEdit({ ...posEdit!, location: e.target.value })} placeholder="Paris / Remote" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Seniority"><Input value={posEdit?.seniority ?? ""} onChange={(e) => setPosEdit({ ...posEdit!, seniority: e.target.value })} placeholder="Senior" /></Field>
              <Field label="Status">
                <Select value={posEdit?.status ?? "open"} onValueChange={(v) => setPosEdit({ ...posEdit!, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POS_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description"><Textarea rows={3} value={posEdit?.description ?? ""} onChange={(e) => setPosEdit({ ...posEdit!, description: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPosEdit(null)}>Cancel</Button><Button onClick={savePos}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate dialog */}
      <Dialog open={!!candEdit} onOpenChange={(o) => !o && setCandEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{candEdit?.id ? "Edit" : "New"} candidate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Full name *"><Input value={candEdit?.full_name ?? ""} onChange={(e) => setCandEdit({ ...candEdit!, full_name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={candEdit?.email ?? ""} onChange={(e) => setCandEdit({ ...candEdit!, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Position">
                <Select value={candEdit?.position_id ?? "none"} onValueChange={(v) => setCandEdit({ ...candEdit!, position_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Stage">
                <Select value={candEdit?.stage ?? "applied"} onValueChange={(v) => setCandEdit({ ...candEdit!, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CAND_STAGE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Notes"><Textarea rows={3} value={candEdit?.notes ?? ""} onChange={(e) => setCandEdit({ ...candEdit!, notes: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setCandEdit(null)}>Cancel</Button><Button onClick={saveCand}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave dialog */}
      <Dialog open={!!leaveEdit} onOpenChange={(o) => !o && setLeaveEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{leaveEdit?.id ? "Edit" : "New"} leave request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={leaveEdit?.leave_type ?? "vacation"} onValueChange={(v) => setLeaveEdit({ ...leaveEdit!, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_TYPE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={leaveEdit?.status ?? "pending"} onValueChange={(v) => setLeaveEdit({ ...leaveEdit!, status: v })} disabled={!isAdmin && leaveEdit?.id !== undefined}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start *"><Input type="date" value={leaveEdit?.start_date ?? ""} onChange={(e) => setLeaveEdit({ ...leaveEdit!, start_date: e.target.value })} /></Field>
              <Field label="End *"><Input type="date" value={leaveEdit?.end_date ?? ""} onChange={(e) => setLeaveEdit({ ...leaveEdit!, end_date: e.target.value })} /></Field>
            </div>
            <Field label="Reason"><Textarea rows={2} value={leaveEdit?.reason ?? ""} onChange={(e) => setLeaveEdit({ ...leaveEdit!, reason: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setLeaveEdit(null)}>Cancel</Button><Button onClick={saveLeave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll dialog */}
      <Dialog open={!!payEdit} onOpenChange={(o) => !o && setPayEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{payEdit?.id ? "Edit" : "New"} payroll entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Period start *"><Input type="date" value={payEdit?.period_start ?? ""} onChange={(e) => setPayEdit({ ...payEdit!, period_start: e.target.value })} /></Field>
              <Field label="Period end *"><Input type="date" value={payEdit?.period_end ?? ""} onChange={(e) => setPayEdit({ ...payEdit!, period_end: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Base"><Input type="number" value={payEdit?.base_amount ?? ""} onChange={(e) => setPayEdit({ ...payEdit!, base_amount: Number(e.target.value) })} /></Field>
              <Field label="Bonus"><Input type="number" value={payEdit?.bonus_amount ?? ""} onChange={(e) => setPayEdit({ ...payEdit!, bonus_amount: Number(e.target.value) })} /></Field>
              <Field label="Currency"><Input value={payEdit?.currency ?? "EUR"} onChange={(e) => setPayEdit({ ...payEdit!, currency: e.target.value })} /></Field>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPayEdit(null)}>Cancel</Button><Button onClick={savePay}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionHeader = ({ title, count, action }: { title: string; count: number; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground ml-1">({count})</span></h2>
    {action}
  </div>
);
const Empty = ({ msg }: { msg: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">{msg}</div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
);

export default PeopleOps;