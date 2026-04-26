import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import logo from "@/assets/meridian-logo.svg";

const COLORS = [
  { name: "Primary", var: "--primary", hsl: "217 91% 55%", hex: "#1E6FE8", usage: "Primary actions, links, accents" },
  { name: "Primary Glow", var: "--primary-glow", hsl: "217 91% 65%", hex: "#4D8DEE", usage: "Gradients, hover states" },
  { name: "Foreground", var: "--foreground", hsl: "222 47% 11%", hex: "#0F172A", usage: "Body text, headings" },
  { name: "Background", var: "--background", hsl: "210 40% 99%", hex: "#FAFCFE", usage: "App canvas" },
  { name: "Muted", var: "--muted-foreground", hsl: "215 16% 47%", hex: "#64748B", usage: "Secondary text" },
  { name: "Success", var: "--success", hsl: "142 71% 45%", hex: "#22C55E", usage: "Positive outcomes" },
  { name: "Warning", var: "--warning", hsl: "38 92% 50%", hex: "#F59E0B", usage: "Caution, attention" },
  { name: "Destructive", var: "--destructive", hsl: "0 84% 60%", hex: "#EF4444", usage: "Errors, removal" },
];

const TYPE_SCALE = [
  { label: "Display", className: "text-5xl md:text-6xl font-bold tracking-tight", sample: "Compliance, compounded." },
  { label: "H1", className: "text-4xl font-bold tracking-tight", sample: "The operating system for risk" },
  { label: "H2", className: "text-2xl font-bold tracking-tight", sample: "Built for financial institutions" },
  { label: "Body", className: "text-base", sample: "Every regulator decision becomes prevention. Every prevention becomes training." },
  { label: "Caption", className: "text-sm text-muted-foreground", sample: "Used for metadata, footnotes and labels." },
];

export default function Brand() {
  return (
    <MarketingLayout title="Brand">
      <PageHero
        eyebrow="Brand"
        title="The MERIDIAN brand system."
        description="Logo, typography, colors and voice — everything you need to represent MERIDIAN consistently across products, partnerships and press."
      >
        <div className="flex gap-3">
          <Button asChild>
            <a href="/assets/meridian-logo.svg" download>
              <Download className="h-4 w-4 mr-2" /> Download logo (SVG)
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:brand@meridian.io">Press inquiries</a>
          </Button>
        </div>
      </PageHero>

      {/* Logo */}
      <section className="container py-20 border-b border-border">
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">01 — Logo</p>
            <h2 className="text-3xl font-bold tracking-tight">The mark</h2>
            <p className="text-muted-foreground mt-3">A meridian — the line that orients every position. Use the full mark whenever space allows. Maintain clear space equal to the height of the globe icon.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-background p-10 flex flex-col items-center justify-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={logo} alt="MERIDIAN logo on light" className="h-24 w-24 text-foreground" />
              <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>
              <span className="text-xs text-muted-foreground">On light</span>
            </div>
            <div className="rounded-2xl border border-border bg-foreground text-background p-10 flex flex-col items-center justify-center gap-4">
              <img src={logo} alt="MERIDIAN logo on dark" className="h-24 w-24" />
              <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>
              <span className="text-xs opacity-60">On dark</span>
            </div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className="container py-20 border-b border-border">
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">02 — Color</p>
            <h2 className="text-3xl font-bold tracking-tight">Palette</h2>
            <p className="text-muted-foreground mt-3">Defined as HSL design tokens in <code className="text-xs px-1.5 py-0.5 rounded bg-muted">index.css</code>. Always reference tokens — never hardcoded hex.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLORS.map((c) => (
              <div key={c.name} className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="h-24" style={{ background: `hsl(${c.hsl})` }} />
                <div className="p-4">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{c.hex}</div>
                  <div className="text-xs text-muted-foreground font-mono">hsl({c.hsl})</div>
                  <div className="text-xs text-muted-foreground mt-2">{c.usage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="container py-20 border-b border-border">
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">03 — Typography</p>
            <h2 className="text-3xl font-bold tracking-tight">Type system</h2>
            <p className="text-muted-foreground mt-3">A single sans-serif system: <strong>Inter</strong> for body, with tightened tracking on display weights. Never substitute serifs.</p>
            <div className="mt-6 rounded-lg border border-border p-4 bg-card">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Primary typeface</div>
              <div className="text-2xl font-bold">Inter</div>
              <div className="text-xs text-muted-foreground mt-1">400 · 500 · 600 · 700</div>
            </div>
          </div>
          <div className="space-y-6">
            {TYPE_SCALE.map((t) => (
              <div key={t.label} className="border-b border-border pb-6 last:border-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t.label}</div>
                <div className={t.className}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice */}
      <section className="container py-20">
        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">04 — Voice</p>
            <h2 className="text-3xl font-bold tracking-tight">Tone of voice</h2>
            <p className="text-muted-foreground mt-3">Confident. Specific. Free of jargon. We speak the language of regulators and engineers — never marketing fluff.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-success/30 bg-success/5 p-6">
              <div className="text-xs uppercase tracking-wider text-success mb-2 font-semibold">Do</div>
              <ul className="space-y-2 text-sm">
                <li>"Cuts review time on €450k wires from 38 min to 4 min."</li>
                <li>"Every decision is traced. Every trace is auditable."</li>
                <li>"Built on EBA, DORA and OFAC primary sources."</li>
              </ul>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <div className="text-xs uppercase tracking-wider text-destructive mb-2 font-semibold">Don't</div>
              <ul className="space-y-2 text-sm">
                <li>"Revolutionary AI-powered synergies."</li>
                <li>"Best-in-class cutting-edge solution."</li>
                <li>"Empowering compliance journeys."</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}