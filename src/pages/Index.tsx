import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Sparkles, AlertTriangle, MousePointerClick, Layers, ShieldX, Brain, GraduationCap, Infinity as InfinityIcon, Check, Calendar, FileSearch, MessageSquare, BarChart3, Quote, X, Bot, BookOpen, Plug, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import googleCloud from "@/assets/partners/google-cloud.png";
import hgCatalyst from "@/assets/partners/hg-catalyst.png";
import lovableLogo from "@/assets/partners/lovable.png";
import redBull from "@/assets/partners/red-bull.png";
import cerebras from "@/assets/partners/cerebras.png";

const PARTNERS = [
  { name: "Google Cloud", src: googleCloud },
  { name: "HG Catalyst", src: hgCatalyst },
  { name: "Lovable", src: lovableLogo },
  { name: "Red Bull", src: redBull },
  { name: "Cerebras", src: cerebras },
];

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero — Meet MERIDIAN */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-subtle)" }} />
        <div className="container py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Link to="/platform/agents" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
              <Bot className="h-3.5 w-3.5" /> RegTech for fintechs · Live regulator feeds
              <ArrowRight className="h-3 w-3" />
            </Link>
            <p className="text-sm md:text-base font-semibold text-primary">Meet MERIDIAN — the RegTech intelligence layer for fintechs.</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Every regulator. Every rule. Mapped to your policies, tied to every <a href="/dashboard" className="underline decoration-primary/40 underline-offset-[6px] hover:decoration-primary">automated decision</a>.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Live feeds from EBA, ACPR, ESMA, OFAC and more — AI-mapped to your internal policies and to every decision your platform makes. Built for fintech CTOs and Heads of Risk who need a verifiable audit trail, not a PDF library.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Radar</div>
                <div className="text-xs text-muted-foreground mt-1">Live regulator ingest</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Mapping</div>
                <div className="text-xs text-muted-foreground mt-1">AI-linked to your policies</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Audit trail</div>
                <div className="text-xs text-muted-foreground mt-1">Every decision, traceable</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#demo">
                <Button size="lg" className="gap-2">
                  Book a demo <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/auth">
                <Button size="lg" variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-2xl bg-card border border-border p-6 md:p-8 space-y-4"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              {/* Bot bubble */}
              <div className="flex gap-3 items-start">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-primary/10 px-4 py-3 text-sm text-foreground max-w-[85%]">
                  Hey — I'm MERIDIAN. Your bank was sanctioned by the ACPR in 2022 for the exact gap I'm seeing on this file. Want to walk through it before you sign off?
                </div>
              </div>
              {/* User bubble */}
              <div className="flex gap-3 items-start justify-end">
                <div className="rounded-2xl rounded-tr-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]">
                  Yes — same source-of-funds issue I missed on a PEP file last week. Coach me through what the ACPR expected.
                </div>
                <div className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                  KA
                </div>
              </div>
              {/* Bot bubble 2 */}
              <div className="flex gap-3 items-start">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-primary/10 px-4 py-3 text-sm text-foreground max-w-[85%]">
                  Got it. 2-minute scenario rebuilt from ACPR Decision n°2022-04 on PEP source-of-funds — let's go.
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live coaching session — grounded in real ACPR enforcement decisions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner marquee */}
      <section className="py-12 border-t border-border bg-background">
        <div className="container">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8">
            Trusted & backed by teams at
          </p>
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-24 pr-24">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex items-center shrink-0 h-28 px-6 opacity-80 hover:opacity-100 transition-opacity"
                aria-label={p.name}
              >
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  width={280}
                  height={96}
                  className="h-24 md:h-28 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Platform — 4 tiles */}
      <section className="py-24 border-t border-border bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">The platform</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">Four pillars. One operating system for compliance.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: "/platform/knowledge", icon: BookOpen, title: "Knowledge", desc: "Regulations, processes, training — linked." },
              { to: "/platform/integrations", icon: Plug, title: "Integrations", desc: "Internal & external data connections." },
              { to: "/platform/agents", icon: Bot, title: "Agents", desc: "Autonomous search, analyze and act." },
              { to: "/platform/people-ops", icon: UsersRound, title: "People Ops", desc: "Careers, ops & people-finance.", soon: true },
            ].map((t) => (
              <Link key={t.to} to={t.to} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all relative" style={{ boxShadow: "var(--shadow-card)" }}>
                {t.soon && <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">Soon</span>}
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI vs Traditional comparison */}
      <section className="py-24 border-t border-border bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">The learning gap</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              AI compliance training vs. the way banks do it today.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg">
              Same regulatory pressure. Radically different outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* Traditional */}
            <div className="bg-card p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <X className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                  <h3 className="font-bold text-lg">Traditional compliance training</h3>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  ["Generic", "Same module for every analyst, every jurisdiction, every customer risk profile."],
                  ["Passive", "Slides and videos. Click 'next' until the certificate prints."],
                  ["Annual", "Once a year, then forgotten. 70% of content gone within 24 hours."],
                  ["Disconnected", "Happens in an LMS, not in the actual KYC workflow where decisions are made."],
                  ["Reactive", "Triggered by a fine, an audit finding, or a regulatory deadline."],
                  ["Unmeasurable", "Completion rates ≠ behaviour change. Nobody knows if it actually works."],
                  ["Expensive to scale", "More analysts → more seats, more facilitators, more cost."],
                ].map(([label, desc]) => (
                  <li key={label} className="flex gap-3">
                    <X className="h-4 w-4 text-muted-foreground/70 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{label}.</span>{" "}
                      <span className="text-sm text-muted-foreground">{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI */}
            <div className="bg-card p-8 md:p-10 relative" style={{ background: "var(--gradient-subtle)" }}>
              <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                MERIDIAN
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">With AI</p>
                  <h3 className="font-bold text-lg">AI compliance copilot</h3>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  ["Personalised", "Coaching is generated from each analyst's own near-misses, role, and jurisdiction."],
                  ["Interactive", "Conversational scenarios — the analyst is prompted to think, justify, and decide."],
                  ["Continuous", "Micro-lessons triggered the moment a real mistake is prevented. Not once a year."],
                  ["Embedded", "Lives inside the document review workflow. Coaching happens at the point of decision."],
                  ["Proactive", "Catches the gap before the file is signed off — not after the fine lands."],
                  ["Measurable", "Every prevented error and every coaching outcome is logged. Risk is quantifiable."],
                  ["Compounds with scale", "Every new file makes the trainer smarter, for everyone, at zero marginal cost."],
                ].map(([label, desc]) => (
                  <li key={label} className="flex gap-3">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{label}.</span>{" "}
                      <span className="text-sm text-muted-foreground">{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
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
                { n: "01", icon: ShieldX, title: "Built on ACPR failures", desc: "MERIDIAN ingests every published ACPR enforcement decision, sanction, and inspection finding — turning a decade of regulator rulings into a live training corpus." },
                { n: "02", icon: Brain, title: "Mapped to your bank's mistakes", desc: "Each ACPR failure pattern is matched against the gaps your team has actually made, so the AI knows the exact blind spots of your institution and each analyst." },
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

      {/* The end-to-end workflow — 4 numbered product blocks reflecting the live modules */}
      <section id="product" className="py-24 border-t border-border bg-background">
        <div className="container">
          <div className="max-w-2xl mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">The MERIDIAN workflow</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              From regulator feed to analyst certificate — every step is a live module inside MERIDIAN.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg">
              Sources ingest the rules. Knowledge documents the sanctions. AI generates the training. Analysts take the quiz. Every decision is logged on their profile.
            </p>
          </div>

          <div className="space-y-24">
            {[
              {
                n: "01",
                title: "Sources — connect every regulator and internal system",
                icon: Plug,
                desc: "The Sources module pulls live data from ACPR, EBA, ESMA, OFAC, FATF and your internal KYC, ticketing and document stores. Add a connector or upload a file — it becomes a record the rest of the platform can reason over.",
                bullets: [
                  "Browse the connector catalog or add custom feeds",
                  "Upload KYC files for instant analysis",
                  "Per-source RLS and full audit trail on every fetch",
                  "Bi-directional: pull obligations in, push alerts out",
                ],
                reverse: false,
              },
              {
                n: "02",
                title: "Knowledge — regulations, sanctions and documentation, linked",
                icon: ScrollX,
                desc: "Every regulator decision and sanction case (including new EU enforcement actions) is documented, classified by central-bank taxonomy, and linked to the internal processes and teams it impacts.",
                bullets: [
                  "ACPR, EBA, ESMA, OFAC sanction cases — including EU additions",
                  "Click a regulation to open its dedicated module page",
                  "Mapped to your internal processes and documentation",
                  "Searchable graph of obligations, processes and owners",
                ],
                reverse: true,
              },
              {
                n: "03",
                title: "AI Training — generate a learning module from any regulation",
                icon: GraduationCap,
                desc: "From any regulation page, click 'Generate training' and our AI builds a tailored learning module plus a multiple-choice quiz, persisted in your training library — no external links, everything in-house.",
                bullets: [
                  "One-click AI generation grounded in the source regulation",
                  "Built-in quiz player with scored multiple-choice questions",
                  "Each module is linked back to its parent regulation",
                  "Stored in your library for re-assignment and analytics",
                ],
                reverse: false,
              },
              {
                n: "04",
                title: "Decisions & Profile — every action logged, per analyst",
                icon: BarChart3,
                desc: "The Intelligence module records every agent run, decision and quiz outcome. Each analyst's profile shows their training history, completed modules and risk coverage — audit-ready.",
                bullets: [
                  "Decision Log with full trace of every automated reasoning step",
                  "Outcomes dashboard for risk and coverage trends",
                  "Per-user profile with training history and certifications",
                  "Role-based access via People & Teams",
                ],
                reverse: true,
              },
            ].map((b) => (
              <div
                key={b.n}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${b.reverse ? "md:[&>div:first-child]:order-2" : ""}`}
              >
                <div>
                  <p className="text-6xl md:text-7xl font-bold text-primary/20 leading-none">{b.n}</p>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">{b.title}</h3>
                  <p className="text-muted-foreground mt-4 text-lg">{b.desc}</p>
                  <ul className="mt-6 space-y-3">
                    {b.bullets.map((bl) => (
                      <li key={bl} className="flex gap-3 items-start text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/90">{bl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="rounded-2xl border border-border bg-card aspect-[4/3] flex items-center justify-center relative overflow-hidden"
                  style={{ boxShadow: "var(--shadow-elegant)", background: "var(--gradient-subtle)" }}
                >
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: "radial-gradient(circle at 30% 30%, hsl(var(--primary)) 0%, transparent 50%)"
                  }} />
                  <b.icon className="h-24 w-24 md:h-32 md:w-32 text-primary relative" strokeWidth={1.2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research backed results — stats */}
      <section className="py-24 border-t border-border bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Research-backed results</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Built on financial-crime research from former regulators and MLROs.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            {[
              { value: "87%", label: "Knowledge gain", desc: "Higher post-training scores than annual e-learning modules." },
              { value: "62%", label: "Behaviour shift", desc: "Analysts apply correct controls on first review without prompting." },
              { value: "73%", label: "Time saved", desc: "Reduction in average analyst time per complex KYC file." },
              { value: "9.1", suffix: "/10", label: "Analyst rating", desc: "Compliance officers rate MERIDIAN coaching above their LMS." },
            ].map((s, i) => (
              <div key={i} className="bg-card p-8">
                <div className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                  {s.value}
                  {s.suffix && <span className="text-2xl text-muted-foreground">{s.suffix}</span>}
                </div>
                <div className="text-sm font-semibold text-foreground mt-4">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — already trusted and loved */}
      <section className="py-24 border-t border-border bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Trusted by compliance teams</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Already loved by MLROs and KYC analysts.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "It caught a source-of-funds gap on a high-risk PEP file my whole team had signed off. Then it coached the analyst through it in three minutes. That's the difference between an LMS and a copilot.",
                name: "Head of Financial Crime",
                org: "Tier-1 European Bank",
              },
              {
                quote: "Our annual AML training had 4% retention after a quarter. With MERIDIAN, analysts learn from their own near-misses on real files. Knowledge actually sticks.",
                name: "MLRO",
                org: "UK Challenger Bank",
              },
              {
                quote: "I stopped feeling like I was clicking through slides. The conversation actually challenged how I was reading the file — and I caught the gap myself.",
                name: "Senior KYC Analyst",
                org: "Global Asset Manager",
              },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-7 flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
                <Quote className="h-7 w-7 text-primary/40 mb-4" />
                <p className="text-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Book a demo */}
      <section id="demo" className="py-24 border-t border-border bg-black text-white relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--primary)) 0%, transparent 40%)",
          }}
        />
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-4">Book a demo</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              See MERIDIAN catch a real KYC gap in under 60 seconds.
            </h2>
            <p className="text-white/60 mt-5 text-lg max-w-lg">
              We'll walk you through a live document review, show you the personalised AI trainer in action, and benchmark it against your current process.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "30-minute walkthrough with a compliance specialist",
                "Bring your own (redacted) KYC file or use ours",
                "Custom risk-scoring tuned to your jurisdiction",
                "No obligation — pilot terms available on request",
              ].map((b) => (
                <li key={b} className="flex gap-3 text-sm text-white/80">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white text-foreground p-8 md:p-10 border border-white/10" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                <p className="font-bold">Pick a time that works</p>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
                window.location.href = `mailto:demo@meridian.ai?subject=MERIDIAN demo request&body=Email: ${encodeURIComponent(email || "")}`;
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">First name</label>
                  <input
                    name="firstName"
                    required
                    className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <input
                    name="company"
                    required
                    className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Work email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@bank.com"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  name="role"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  defaultValue=""
                >
                  <option value="" disabled>Select your role</option>
                  <option>MLRO / Head of Compliance</option>
                  <option>KYC / AML analyst</option>
                  <option>Risk leadership</option>
                  <option>Operations / Transformation</option>
                  <option>Other</option>
                </select>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2 mt-2">
                Book my demo <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                We'll reply within one business day. No spam — ever.
              </p>
            </form>
          </div>
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

      <MarketingFooter />
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
