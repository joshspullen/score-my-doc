import { Link, Navigate } from "react-router-dom";
import { ArrowRight, FileCheck2, Gauge, ShieldCheck, Sparkles, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ScoreGauge, ScoreBar } from "@/components/ScoreGauge";
import { useAuth } from "@/hooks/useAuth";

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

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MERIDIAN. AI-assisted analysis is for guidance only.
        </div>
      </footer>
    </div>
  );
};

export default Index;
