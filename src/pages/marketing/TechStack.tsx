import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/card";
import {
  Layers, Database, Bot, Shield, Cloud, GitBranch, Cpu, Lock,
  Workflow, Network, Server, Zap, Code2, FileCode2, Boxes, Eye,
} from "lucide-react";

const STACK = [
  {
    layer: "Frontend",
    icon: Layers,
    desc: "Type-safe, accessible UI built on a modern React foundation.",
    items: [
      { name: "React 18 + TypeScript", note: "Strict mode, hooks-first" },
      { name: "Vite 5", note: "Sub-second HMR, ESM-native bundling" },
      { name: "Tailwind CSS + shadcn/ui", note: "Semantic design tokens, Radix primitives" },
      { name: "TanStack Query", note: "Server-state caching & invalidation" },
      { name: "React Router 6", note: "Nested routes, protected boundaries" },
    ],
  },
  {
    layer: "Backend & Data",
    icon: Database,
    desc: "Postgres-first backend with row-level security and realtime streams.",
    items: [
      { name: "PostgreSQL 15", note: "JSONB, full-text search, RLS policies" },
      { name: "PostgREST API", note: "Auto-generated typed endpoints" },
      { name: "Edge Functions (Deno)", note: "Low-latency compute at the edge" },
      { name: "Realtime (WebSockets)", note: "Live decision & assignment updates" },
      { name: "Object Storage", note: "Document upload & evidence archival" },
    ],
  },
  {
    layer: "AI & Reasoning",
    icon: Bot,
    desc: "Multi-model orchestration through a unified gateway — no vendor lock-in.",
    items: [
      { name: "Lovable AI Gateway", note: "Single endpoint, model-agnostic routing" },
      { name: "Google Gemini 2.5 Pro / Flash", note: "Long-context regulatory analysis" },
      { name: "OpenAI GPT-5 family", note: "Reasoning, training generation, summarization" },
      { name: "Streaming responses", note: "Token-by-token agent output" },
      { name: "Structured tool-calling", note: "JSON schemas for deterministic actions" },
    ],
  },
  {
    layer: "Identity & Security",
    icon: Shield,
    desc: "Defense-in-depth — auth, authorization and audit at every layer.",
    items: [
      { name: "JWT + httpOnly sessions", note: "Refresh-token rotation" },
      { name: "OAuth 2.0 (Google, SSO)", note: "Enterprise SAML available" },
      { name: "Role-based access control", note: "Separate user_roles table, no client trust" },
      { name: "Row-Level Security", note: "Per-row policies enforced at the database" },
      { name: "Encrypted at rest + TLS 1.3", note: "AES-256, HSTS, CSP headers" },
    ],
  },
  {
    layer: "Infrastructure",
    icon: Cloud,
    desc: "Serverless, multi-region, scaled to thousands of concurrent decisions.",
    items: [
      { name: "Edge CDN", note: "Global distribution, sub-50ms TTFB" },
      { name: "Auto-scaling Postgres", note: "Read replicas, point-in-time recovery" },
      { name: "Background workers", note: "Queued analysis & training generation" },
      { name: "Continuous deploy", note: "Preview environments per pull-request" },
    ],
  },
  {
    layer: "Observability",
    icon: Eye,
    desc: "Every agent decision is traced, scored and replayable.",
    items: [
      { name: "Decision telemetry", note: "Structured spans per agent step" },
      { name: "Outcome tracking", note: "Closed-loop feedback into training" },
      { name: "Audit logs", note: "Immutable, exportable for regulators" },
      { name: "Performance metrics", note: "P50/P95 latency, model cost per call" },
    ],
  },
];

const PRINCIPLES = [
  { icon: Lock, title: "Security by default", desc: "RLS on every table. Secrets never touch the client. Roles checked server-side." },
  { icon: Workflow, title: "Composable agents", desc: "Each agent is a small, testable function. Orchestration happens in the data plane." },
  { icon: Zap, title: "Latency is a feature", desc: "Edge compute, streaming responses and aggressive caching keep interactions instant." },
  { icon: GitBranch, title: "Type-safe end-to-end", desc: "Schema → generated types → typed queries → typed UI. Drift is impossible." },
  { icon: Network, title: "Open by interface", desc: "Standard HTTP, JSON, OpenAPI. No proprietary SDK required to integrate." },
  { icon: Cpu, title: "Model-agnostic AI", desc: "Swap providers per task. We optimize for capability and cost, not loyalty." },
];

const FLOW = [
  { step: "01", icon: FileCode2, title: "Ingest", desc: "Documents, regulations and connector data land in object storage and are normalized into Postgres." },
  { step: "02", icon: Bot, title: "Reason", desc: "Agents fan out through the AI Gateway, calling tools, citing sources and producing structured decisions." },
  { step: "03", icon: Boxes, title: "Persist", desc: "Decisions, traces and outcomes are written with RLS — every row owned by a team and a context." },
  { step: "04", icon: Server, title: "Serve", desc: "Realtime channels push updates to the UI; edge functions handle on-demand actions." },
  { step: "05", icon: Eye, title: "Observe", desc: "Telemetry feeds dashboards, training generation and continuous improvement loops." },
];

export default function TechStack() {
  return (
    <MarketingLayout title="Technical stack & architecture">
      <PageHero
        eyebrow="Engineering"
        title="The stack behind MERIDIAN."
        description="A modern, type-safe, AI-native architecture — engineered for the security and auditability financial institutions require."
      />

      {/* Principles */}
      <section className="container py-20 border-b border-border">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">01 — Principles</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Six commitments we never break.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stack layers */}
      <section className="container py-20 border-b border-border">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">02 — Stack</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Layer by layer.</h2>
          <p className="text-muted-foreground mt-3">Each layer chosen for a single reason: it is the best tool for the job, today.</p>
        </div>
        <div className="space-y-6">
          {STACK.map((s) => (
            <Card key={s.layer} className="p-7" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="grid md:grid-cols-[260px_1fr] gap-8">
                <div>
                  <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{s.layer}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {s.items.map((it) => (
                    <div key={it.name} className="rounded-lg border border-border bg-background/50 p-4">
                      <div className="flex items-start gap-2.5">
                        <Code2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{it.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{it.note}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="container py-20 border-b border-border">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">03 — Architecture flow</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How a decision travels through the system.</h2>
        </div>
        <ol className="relative border-l border-border ml-3 space-y-8">
          {FLOW.map((f) => (
            <li key={f.step} className="pl-8 relative">
              <span className="absolute -left-[17px] top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <f.icon className="h-4 w-4" />
              </span>
              <div className="text-xs uppercase tracking-[0.25em] text-primary">{f.step}</div>
              <h3 className="font-semibold text-lg mt-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{f.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Compliance footer */}
      <section className="container py-20">
        <Card className="p-8 md:p-10 bg-secondary/30">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">04 — Compliance posture</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Built for regulated environments.</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl">SOC 2 Type II in progress. ISO 27001 alignment. EU data residency on request. Every customer gets isolated tenancy and exportable audit trails.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["SOC 2", "ISO 27001", "GDPR", "EU residency", "SSO/SAML"].map((b) => (
                <span key={b} className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background">{b}</span>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </MarketingLayout>
  );
}