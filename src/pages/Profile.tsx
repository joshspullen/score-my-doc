import { useEffect, useState } from "react";
import { Loader2, User, Plus, Pencil, Trash2, Briefcase, GraduationCap, Award, Linkedin, Globe, Github, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Profile = {
  id: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  github_url: string | null;
};
type Edu = { id: string; institution: string; degree: string | null; field_of_study: string | null; start_year: number | null; end_year: number | null; description: string | null };
type Exp = { id: string; company: string; role: string; location: string | null; start_date: string | null; end_date: string | null; is_current: boolean; description: string | null };
type Cert = { id: string; name: string; issuer: string | null; issue_date: string | null; expiry_date: string | null; credential_url: string | null };

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [education, setEducation] = useState<Edu[]>([]);
  const [experience, setExperience] = useState<Exp[]>([]);
  const [certifications, setCertifications] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [eduOpen, setEduOpen] = useState(false);
  const [eduEditing, setEduEditing] = useState<Partial<Edu> | null>(null);
  const [expOpen, setExpOpen] = useState(false);
  const [expEditing, setExpEditing] = useState<Partial<Exp> | null>(null);
  const [certOpen, setCertOpen] = useState(false);
  const [certEditing, setCertEditing] = useState<Partial<Cert> | null>(null);

  useEffect(() => { document.title = "My Profile — MERIDIAN"; }, []);

  const load = async () => {
    if (!user) return;
    const [p, e, x, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profile_education").select("*").eq("user_id", user.id).order("end_year", { ascending: false, nullsFirst: false }),
      supabase.from("profile_experience").select("*").eq("user_id", user.id).order("start_date", { ascending: false, nullsFirst: false }),
      supabase.from("profile_certifications").select("*").eq("user_id", user.id).order("issue_date", { ascending: false, nullsFirst: false }),
    ]);
    if (p.error) toast.error(p.error.message);
    setProfile((p.data as Profile) ?? { id: user.id, display_name: null, headline: null, bio: null, location: null, avatar_url: null, linkedin_url: null, website_url: null, github_url: null });
    setEducation((e.data ?? []) as Edu[]);
    setExperience((x.data ?? []) as Exp[]);
    setCertifications((c.data ?? []) as Cert[]);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: profile.display_name,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      avatar_url: profile.avatar_url,
      linkedin_url: profile.linkedin_url,
      website_url: profile.website_url,
      github_url: profile.github_url,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
  };

  // ----- Education CRUD -----
  const saveEdu = async () => {
    if (!user || !eduEditing?.institution) return;
    const row = {
      user_id: user.id,
      institution: eduEditing.institution!,
      degree: eduEditing.degree ?? null,
      field_of_study: eduEditing.field_of_study ?? null,
      start_year: eduEditing.start_year ?? null,
      end_year: eduEditing.end_year ?? null,
      description: eduEditing.description ?? null,
    };
    const q = eduEditing.id
      ? supabase.from("profile_education").update(row).eq("id", eduEditing.id)
      : supabase.from("profile_education").insert(row);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Education saved");
    setEduOpen(false); setEduEditing(null); load();
  };
  const deleteEdu = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("profile_education").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  // ----- Experience CRUD -----
  const saveExp = async () => {
    if (!user || !expEditing?.company || !expEditing?.role) return;
    const row = {
      user_id: user.id,
      company: expEditing.company!,
      role: expEditing.role!,
      location: expEditing.location ?? null,
      start_date: expEditing.start_date ?? null,
      end_date: expEditing.is_current ? null : (expEditing.end_date ?? null),
      is_current: !!expEditing.is_current,
      description: expEditing.description ?? null,
    };
    const q = expEditing.id
      ? supabase.from("profile_experience").update(row).eq("id", expEditing.id)
      : supabase.from("profile_experience").insert(row);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Experience saved");
    setExpOpen(false); setExpEditing(null); load();
  };
  const deleteExp = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("profile_experience").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  // ----- Certifications CRUD -----
  const saveCert = async () => {
    if (!user || !certEditing?.name) return;
    const row = {
      user_id: user.id,
      name: certEditing.name!,
      issuer: certEditing.issuer ?? null,
      issue_date: certEditing.issue_date ?? null,
      expiry_date: certEditing.expiry_date ?? null,
      credential_url: certEditing.credential_url ?? null,
    };
    const q = certEditing.id
      ? supabase.from("profile_certifications").update(row).eq("id", certEditing.id)
      : supabase.from("profile_certifications").insert(row);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Certification saved");
    setCertOpen(false); setCertEditing(null); load();
  };
  const deleteCert = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("profile_certifications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-7 w-7" /> My Profile
            </h1>
            <p className="text-muted-foreground mt-1">Your CV: background, experience, certifications, and links.</p>
          </div>
        </div>

        {/* Profile core */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-semibold text-lg mb-4">About you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" placeholder="e.g. Senior AML Analyst" value={profile.headline ?? ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Location</Label>
              <Input id="loc" value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" value={profile.avatar_url ?? ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln" className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
              <Input id="ln" placeholder="https://linkedin.com/in/..." value={profile.linkedin_url ?? ""} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
              <Input id="web" placeholder="https://..." value={profile.website_url ?? ""} onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gh" className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</Label>
              <Input id="gh" placeholder="https://github.com/..." value={profile.github_url ?? ""} onChange={(e) => setProfile({ ...profile, github_url: e.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
            </Button>
          </div>
        </section>

        {/* Experience */}
        <SectionList
          title="Experience"
          icon={<Briefcase className="h-5 w-5" />}
          onAdd={() => { setExpEditing({}); setExpOpen(true); }}
          empty="No work experience added yet."
        >
          {experience.map((x) => (
            <EntryRow
              key={x.id}
              title={`${x.role} · ${x.company}`}
              subtitle={[x.location, dateRange(x.start_date, x.end_date, x.is_current)].filter(Boolean).join(" · ")}
              description={x.description}
              onEdit={() => { setExpEditing(x); setExpOpen(true); }}
              onDelete={() => deleteExp(x.id)}
            />
          ))}
        </SectionList>

        {/* Education */}
        <SectionList
          title="Education"
          icon={<GraduationCap className="h-5 w-5" />}
          onAdd={() => { setEduEditing({}); setEduOpen(true); }}
          empty="No education added yet."
        >
          {education.map((e) => (
            <EntryRow
              key={e.id}
              title={[e.degree, e.field_of_study].filter(Boolean).join(", ") || e.institution}
              subtitle={[e.institution, yearRange(e.start_year, e.end_year)].filter(Boolean).join(" · ")}
              description={e.description}
              onEdit={() => { setEduEditing(e); setEduOpen(true); }}
              onDelete={() => deleteEdu(e.id)}
            />
          ))}
        </SectionList>

        {/* Certifications */}
        <SectionList
          title="Certifications"
          icon={<Award className="h-5 w-5" />}
          onAdd={() => { setCertEditing({}); setCertOpen(true); }}
          empty="No certifications added yet."
        >
          {certifications.map((c) => (
            <EntryRow
              key={c.id}
              title={c.name}
              subtitle={[c.issuer, dateRange(c.issue_date, c.expiry_date, false)].filter(Boolean).join(" · ")}
              description={c.credential_url ? `Credential: ${c.credential_url}` : null}
              onEdit={() => { setCertEditing(c); setCertOpen(true); }}
              onDelete={() => deleteCert(c.id)}
            />
          ))}
        </SectionList>
      </main>

      {/* Experience dialog */}
      <Dialog open={expOpen} onOpenChange={(o) => { setExpOpen(o); if (!o) setExpEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{expEditing?.id ? "Edit" : "Add"} experience</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Role *"><Input value={expEditing?.role ?? ""} onChange={(e) => setExpEditing({ ...expEditing, role: e.target.value })} /></Field>
            <Field label="Company *"><Input value={expEditing?.company ?? ""} onChange={(e) => setExpEditing({ ...expEditing, company: e.target.value })} /></Field>
            <Field label="Location"><Input value={expEditing?.location ?? ""} onChange={(e) => setExpEditing({ ...expEditing, location: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date"><Input type="date" value={expEditing?.start_date ?? ""} onChange={(e) => setExpEditing({ ...expEditing, start_date: e.target.value })} /></Field>
              <Field label="End date"><Input type="date" disabled={!!expEditing?.is_current} value={expEditing?.end_date ?? ""} onChange={(e) => setExpEditing({ ...expEditing, end_date: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!expEditing?.is_current} onCheckedChange={(v) => setExpEditing({ ...expEditing, is_current: v })} />
              I currently work here
            </label>
            <Field label="Description"><Textarea rows={3} value={expEditing?.description ?? ""} onChange={(e) => setExpEditing({ ...expEditing, description: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExpOpen(false)}>Cancel</Button>
            <Button onClick={saveExp}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education dialog */}
      <Dialog open={eduOpen} onOpenChange={(o) => { setEduOpen(o); if (!o) setEduEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{eduEditing?.id ? "Edit" : "Add"} education</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Institution *"><Input value={eduEditing?.institution ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, institution: e.target.value })} /></Field>
            <Field label="Degree"><Input placeholder="e.g. M.Sc." value={eduEditing?.degree ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, degree: e.target.value })} /></Field>
            <Field label="Field of study"><Input value={eduEditing?.field_of_study ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, field_of_study: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start year"><Input type="number" value={eduEditing?.start_year ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, start_year: e.target.value ? parseInt(e.target.value) : null })} /></Field>
              <Field label="End year"><Input type="number" value={eduEditing?.end_year ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, end_year: e.target.value ? parseInt(e.target.value) : null })} /></Field>
            </div>
            <Field label="Description"><Textarea rows={3} value={eduEditing?.description ?? ""} onChange={(e) => setEduEditing({ ...eduEditing, description: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEduOpen(false)}>Cancel</Button>
            <Button onClick={saveEdu}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification dialog */}
      <Dialog open={certOpen} onOpenChange={(o) => { setCertOpen(o); if (!o) setCertEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{certEditing?.id ? "Edit" : "Add"} certification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Name *"><Input value={certEditing?.name ?? ""} onChange={(e) => setCertEditing({ ...certEditing, name: e.target.value })} /></Field>
            <Field label="Issuer"><Input value={certEditing?.issuer ?? ""} onChange={(e) => setCertEditing({ ...certEditing, issuer: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Issue date"><Input type="date" value={certEditing?.issue_date ?? ""} onChange={(e) => setCertEditing({ ...certEditing, issue_date: e.target.value })} /></Field>
              <Field label="Expiry date"><Input type="date" value={certEditing?.expiry_date ?? ""} onChange={(e) => setCertEditing({ ...certEditing, expiry_date: e.target.value })} /></Field>
            </div>
            <Field label="Credential URL"><Input placeholder="https://..." value={certEditing?.credential_url ?? ""} onChange={(e) => setCertEditing({ ...certEditing, credential_url: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCertOpen(false)}>Cancel</Button>
            <Button onClick={saveCert}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SectionList({ title, icon, onAdd, empty, children }: { title: string; icon: React.ReactNode; onAdd: () => void; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.filter(Boolean).length > 0;
  return (
    <section className="bg-card border border-border rounded-xl p-6 mb-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">{icon} {title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
      </div>
      {hasItems ? <div className="space-y-3">{children}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

function EntryRow({ title, subtitle, description, onEdit, onDelete }: { title: string; subtitle?: string; description?: string | null; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border border-border rounded-lg p-4">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {description && <p className="text-sm mt-2 whitespace-pre-wrap">{description}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function dateRange(start: string | null, end: string | null, current: boolean) {
  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "";
  if (!start && !end && !current) return "";
  return `${fmt(start) || "?"} — ${current ? "Present" : (fmt(end) || "?")}`;
}
function yearRange(s: number | null, e: number | null) {
  if (!s && !e) return "";
  return `${s ?? "?"} — ${e ?? "?"}`;
}

export default Profile;