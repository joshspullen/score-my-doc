import { Link } from "react-router-dom";
import { Search, Brain, Zap, Bot, Clock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero, CtaBand } from "@/components/marketing/PageHero";

const PATTERNS = [
  { icon: Search, n: "01", title: "Search & Collect", desc: "Monitor regulator portals, scrape official documentation, detect new versions and pull them into Knowledge — automatically." },
  { icon: Brain, n: "02", title: "Analyze", desc: "Compare new regulations against your existing processes and trainings. Surface impact, gaps and required updates." },
  { icon: Zap, n: "03", title: "Act", desc: "Open tickets, assign trainings, draft procedure updates, notify owners. Acting agents close the loop." },
];

export default function PlatformAgents() {
  return (
    <MarketingLayout title="Agents">
      <PageHero
        eyebrow="Platform · Agents"
        title={<>Autonomous agents that watch the regulator so your team doesn't have to.</>}
        description="Three patterns — Search & Collect, Analyze, Act — all built around your Connectors and Knowledge. Trigger them manually, on a schedule, or via cron."
      >
        <div className="flex gap-3">
          <Link to="/contact"><Button size="lg" className="gap-2">See it live <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/platform/integrations"><Button size="lg" variant="outline">Browse connectors</Button></Link>
        </div>
      </PageHero>

      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {PATTERNS.map((p) => (
            <div key={p.n} className="rounded-2xl border border-border bg-card p-7" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                <p.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-mono text-muted-foreground mb-1">{p.n}</p>
              <h3 className="font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="h-7 w-7 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Example: ACPR Watcher</h2>
          </div>
          <p className="text-muted-foreground text-lg mb-8">
            A Search & Collect agent linked to the ACPR connector, scraping the official publications page weekly. Each new document is versioned, classified, and pushed into Knowledge as a regulation candidate.
          </p>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            {[
              ["Pattern", "Search & Collect"],
              ["Connector", "ACPR (acpr.banque-france.fr)"],
              ["Trigger", "Weekly · Mondays 06:00 UTC"],
              ["Output", "Connector records + version detection"],
              ["Downstream", "Analyze agent runs impact assessment"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 max-w-2xl">Triggers that fit how compliance actually works.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {["Manual run", "Hourly", "Daily", "Weekly", "Monthly", "Custom cron"].map((t) => (
            <div key={t} className="rounded-lg border border-border p-4 flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{t}</span>
              <Check className="h-4 w-4 text-primary ml-auto" />
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Replace 4 hours/week of regulator-watching."
        sub="Spin up your first agent in 10 minutes. No engineering required."
        primary={<Link to="/contact"><Button size="lg">Start with one agent</Button></Link>}
      />
    </MarketingLayout>
  );
}