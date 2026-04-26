import { ArrowRight, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function Contact() {
  return (
    <MarketingLayout title="Contact">
      <section className="border-b border-border" style={{ background: "var(--gradient-subtle)" }}>
        <div className="container py-16 md:py-24 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Book a demo</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">See MERIDIAN catch a real KYC gap in under 60 seconds.</h1>
            <p className="text-muted-foreground mt-5 text-lg">30-minute walkthrough with a compliance specialist. Bring your own (redacted) file or use ours.</p>
            <ul className="mt-8 space-y-3">
              {["Live document review", "Custom risk-scoring tuned to your jurisdiction", "Pilot terms available on request", "No obligation — ever"].map((b) => (
                <li key={b} className="flex gap-3 text-sm"><Check className="h-4 w-4 text-primary mt-0.5" />{b}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-card border border-border p-8" style={{ boxShadow: "var(--shadow-elegant)" }}>
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
                window.location.href = `mailto:demo@meridian.ai?subject=MERIDIAN demo&body=Email: ${encodeURIComponent(email || "")}`;
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">First name</label>
                  <input name="firstName" required className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <input name="company" required className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Work email</label>
                <input name="email" type="email" required placeholder="you@bank.com" className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select name="role" defaultValue="" className="mt-1 w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="" disabled>Select your role</option>
                  <option>MLRO / Head of Compliance</option>
                  <option>KYC / AML analyst</option>
                  <option>Risk leadership</option>
                  <option>Operations / Transformation</option>
                  <option>Other</option>
                </select>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2 mt-2">Book my demo <ArrowRight className="h-4 w-4" /></Button>
              <p className="text-[11px] text-muted-foreground text-center">We'll reply within one business day.</p>
            </form>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}