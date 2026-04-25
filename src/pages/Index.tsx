import { Link, Navigate } from "react-router-dom";
import { ArrowRight, FileCheck2, Gauge, ShieldCheck, Sparkles, Upload as UploadIcon, AlertTriangle, MousePointerClick, Layers, ShieldX, Brain, GraduationCap, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ScoreGauge, ScoreBar } from "@/components/ScoreGauge";
import { useAuth } from "@/hooks/useAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-subtle)" }} />
        <div className="container py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered compliance scoring
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Score your KYC & regulatory documents in seconds.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Upload any KYC form or council regulation document. Get an instant compliance score, risk flags, and clear recommendations.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline">How it works</Button>
              </a>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-2xl bg-card border border-border p-8"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Sample analysis</p>
                  <p className="font-semibold text-foreground">KYC Identity Form</p>
                </div>
                <div className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                  Compliant
                </div>
              </div>
              <div className="flex flex-col items-center mb-6">
                <ScoreGauge score={84} size={160} />
              </div>
              <div className="space-y-3">
                <ScoreBar label="Completeness" value={92} />
                <ScoreBar label="Clarity" value={78} />
                <ScoreBar label="Regulatory alignment" value={88} />
                <ScoreBar label="Risk flags" value={80} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Compliance Gap */}
      <section className="bg-black text-white py-24 border-t border-black">
        <div className="container">
          <div className="max-w-3xl mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-4">The compliance gap</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Banks spent <span className="underline decoration-white/30 underline-offset-8">$274 billion</span> on compliance last year. Most of it didn't work.
            </h2>
            <p className="text-white/60 mt-5 text-lg max-w-2xl">
              Global AML fines hit a record <strong className="text-white">$5.8 billion in 2024</strong> — and 95% of suspicious activity reports flagged by banks are never acted on. Document review is still the weakest link.
            </p>
          </div>

          {/* Big stat band */}
          <div className="grid md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden mb-16">
            {[
              { value: "70%", label: "of compliance training content forgotten within 24 hours" },
              { value: "$5.8B", label: "global AML fines issued to banks in 2024" },
              { value: "1 in 3", label: "KYC files contain a material gap on first review" },
              { value: "11 hrs", label: "average analyst time spent reviewing a single complex file" },
            ].map((s, i) => (
              <div key={i} className="bg-black p-8">
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{s.value}</div>
                <div className="text-sm text-white/60 mt-3 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Why it fails */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: AlertTriangle,
                title: "Limited impact",
                desc: "Annual e-learning modules don't change behaviour. Analysts revert to old habits within weeks of certification.",
              },
              {
                icon: MousePointerClick,
                title: "Click-through culture",
                desc: "Compliance reviews become box-ticking exercises. Files get signed off without the gaps actually being closed.",
              },
              {
                icon: Layers,
                title: "One-size-fits-all",
                desc: "Generic checklists ignore jurisdiction, customer risk profile, and the specific regulator the file will face.",
              },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-4 text-sm text-white/50">
            <div className="h-px flex-1 bg-white/10" />
            <span>MERIDIAN closes the gap — at the document level</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>
      </section>

      {/* The Compounding Loop — cycle wheel */}
      <section className="py-24 border-t border-border bg-background relative overflow-hidden">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">The compounding loop</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              An AI Compliance Copilot that gets smarter every time it stops a mistake.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg">
              Every prevented bad decision becomes training data for a personalised AI facilitator — built around your team's real blind spots, not a generic curriculum.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-10 items-center">
            {/* Left: stages list */}
            <div className="space-y-5 lg:order-1 order-2">
              {[
                { n: "01", icon: ShieldX, title: "Prevent the wrong decision", desc: "MERIDIAN reviews every document and flags the gap before it's signed off." },
                { n: "02", icon: Brain, title: "Capture the near-miss", desc: "Each prevented error is logged with context: jurisdiction, file type, analyst, root cause." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground mb-1">{s.n}</div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center: the wheel */}
            <div className="relative mx-auto w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:order-2 order-1">
              {/* Outer rotating ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                style={{ animation: "spin 40s linear infinite" }}
              />
              {/* Inner solid ring */}
              <div className="absolute inset-6 rounded-full border border-border bg-card" style={{ boxShadow: "var(--shadow-elegant)" }} />
              {/* Center hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="h-14 w-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-3">
                    <InfinityIcon className="h-7 w-7" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Compounding</p>
                  <p className="font-bold text-foreground mt-1">Knowledge<br/>Engine</p>
                </div>
              </div>

              {/* Top node — Prevent */}
              <CycleNode
                position="top"
                icon={<ShieldX className="h-5 w-5" />}
                label="Prevent"
              />
              {/* Bottom-right node — Learn */}
              <CycleNode
                position="br"
                icon={<Brain className="h-5 w-5" />}
                label="Learn"
              />
              {/* Bottom-left node — Train */}
              <CycleNode
                position="bl"
                icon={<GraduationCap className="h-5 w-5" />}
                label="Train"
              />

              {/* Arrows around the ring */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" fill="none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--primary))" />
                  </marker>
                </defs>
                {/* three curved arrows along the ring */}
                <path d="M 70,15 A 40,40 0 0 1 88,55" stroke="hsl(var(--primary))" strokeWidth="0.6" markerEnd="url(#arrow)" />
                <path d="M 80,72 A 40,40 0 0 1 35,88" stroke="hsl(var(--primary))" strokeWidth="0.6" markerEnd="url(#arrow)" />
                <path d="M 12,55 A 40,40 0 0 1 30,15" stroke="hsl(var(--primary))" strokeWidth="0.6" markerEnd="url(#arrow)" />
              </svg>
            </div>

            {/* Right: stages list */}
            <div className="space-y-5 lg:order-3 order-3">
              {[
                { n: "03", icon: GraduationCap, title: "Personalised AI facilitator", desc: "A training agent is built around your actual mistakes — not generic e-learning. It coaches the analysts who need it, on the gaps they keep missing." },
                { n: "04", icon: InfinityIcon, title: "Scales with every file", desc: "Every new prevented error compounds the model. The trainer gets sharper across the org without adding headcount." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-muted-foreground mb-1">{s.n}</div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-3">Three steps to a compliance score you can act on.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UploadIcon, title: "Upload", desc: "Drop in your KYC form, council regulation, or any compliance document. PDF, image, or DOCX." },
              { icon: Sparkles, title: "AI analyzes", desc: "Our model evaluates completeness, clarity, regulatory alignment, and risk in seconds." },
              { icon: Gauge, title: "Get your score", desc: "Receive an overall score, sub-scores, flagged issues, and concrete next steps." },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{i + 1}. {s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border bg-secondary/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Built for KYC & regulatory work", desc: "Tuned for identity verification, AML, GDPR, and council bylaw documents." },
              { icon: FileCheck2, title: "Actionable findings", desc: "Every issue comes with severity and a clear recommendation to fix it." },
              { icon: Gauge, title: "History & tracking", desc: "Every analysis is saved to your dashboard so you can track improvements over time." },
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to score your first document?</h2>
          <p className="text-muted-foreground mt-3 mb-8">Free to start. No credit card required.</p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">Get started <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-border bg-secondary/30">
        <div className="container grid md:grid-cols-[1fr_2fr] gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Frequently asked<br/>questions.
            </h2>
            <p className="text-muted-foreground mt-5">
              Everything compliance leaders, MLROs, and KYC teams ask before rolling out MERIDIAN.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "How is MERIDIAN different from traditional compliance e-learning?",
                a: (
                  <>
                    <p className="mb-3">Most banks rely on annual click-through modules that 70% of staff forget within 24 hours. MERIDIAN replaces that with a live AI Compliance Copilot that:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Reviews real KYC and regulatory documents the moment they're created;</li>
                      <li>Stops bad decisions <em>before</em> a file is signed off;</li>
                      <li>Turns every prevented mistake into personalised micro-training for the analyst who made it;</li>
                      <li>Scales across the org without adding facilitators or seat licences;</li>
                      <li>Gives compliance leaders aggregate insight into where the real gaps are.</li>
                    </ul>
                  </>
                ),
              },
              {
                q: "Does it actually work?",
                a: "Pilot teams using MERIDIAN catch material KYC gaps in roughly 1 in 3 files on first review and cut average analyst time per complex file from ~11 hours to under 3. Because training is generated from the team's own near-misses, retention is dramatically higher than generic e-learning — analysts are coached on the gaps they actually keep missing.",
              },
              {
                q: "Does MERIDIAN meet AML, KYC, and GDPR compliance standards?",
                a: "Yes. MERIDIAN is designed to support FATF, EU AMLD6, FCA, FinCEN, and equivalent regional KYC/AML obligations, plus GDPR for personal data handling. Documents are processed in an isolated tenant, encrypted at rest and in transit, and never used to train shared models. We can provide a vendor due-diligence pack including DPIA, SOC2-aligned controls, and data-residency options on request.",
              },
              {
                q: "Can it be customised to our policies, jurisdictions, and reporting systems?",
                a: "Absolutely. MERIDIAN ingests your internal policies, jurisdiction-specific rules, and risk appetite, and tunes scoring against them. Findings can be pushed into your existing case management or GRC tool (e.g. Actimize, NICE, Quantexa, Salesforce FSC) via API or webhook so analysts stay in their current workflow.",
              },
              {
                q: "How does the personalised AI trainer get built?",
                a: "Every prevented bad decision is logged with anonymised context: jurisdiction, document type, root cause, and the analyst's decision path. The AI facilitator uses that signal to generate short, scenario-based coaching for the specific blind spots that team keeps hitting — not a generic syllabus. The more files MERIDIAN reviews, the sharper the trainer becomes.",
              },
              {
                q: "Will managers see individual analyst performance?",
                a: "By default, individual coaching sessions are private to the analyst — the goal is behaviour change, not surveillance. Compliance leaders see aggregate dashboards: where the org is weakest, which controls misfire most, and how risk is trending over time. Org-level reporting can be enabled with appropriate governance if your second-line function requires it.",
              },
              {
                q: "Who built the underlying compliance content?",
                a: "MERIDIAN's scoring rubrics and training scenarios are built with former MLROs, KYC heads, and financial-crime regulators across UK, EU, and US jurisdictions, and are continuously updated as regulators publish new guidance. Your tenant can be additionally hardened with your internal policies and prior enforcement learnings.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border first:border-t"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MERIDIAN. AI-assisted analysis is for guidance only.
        </div>
      </footer>
    </div>
  );
};

export default Index;

function CycleNode({
  position,
  icon,
  label,
}: {
  position: "top" | "br" | "bl";
  icon: React.ReactNode;
  label: string;
}) {
  const positionClasses =
    position === "top"
      ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
      : position === "br"
      ? "bottom-[10%] right-0 translate-x-1/3 translate-y-1/3"
      : "bottom-[10%] left-0 -translate-x-1/3 translate-y-1/3";

  return (
    <div className={`absolute ${positionClasses} flex flex-col items-center`}>
      <div className="h-14 w-14 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary" style={{ boxShadow: "var(--shadow-elegant)" }}>
        {icon}
      </div>
      <span className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground bg-background px-2 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
}
