import { Link } from "react-router-dom";
import { ScrollText, Workflow, GraduationCap, BookOpen, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero, FeatureGrid, CtaBand } from "@/components/marketing/PageHero";

export default function PlatformKnowledge() {
  return (
    <MarketingLayout title="Knowledge">
      <PageHero
        eyebrow="Platform · Knowledge"
        title={<>The single source of truth for every regulation, process and training.</>}
        description="Knowledge unifies regulator obligations, internal business processes and training content — and links them, so a change in a regulator decision automatically surfaces the impacted process and the analysts who need re-training."
      >
        <div className="flex gap-3">
          <Link to="/contact"><Button size="lg" className="gap-2">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/platform/agents"><Button size="lg" variant="outline">See Agents</Button></Link>
        </div>
      </PageHero>

      <section className="container py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Three connected databases</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One graph. Zero duplication.</h2>
        </div>
        <FeatureGrid items={[
          { icon: ScrollText, title: "Regulations", desc: "Every obligation classified by central-bank taxonomy: AML, sanctions, prudential, conduct, ESG, operational resilience." },
          { icon: Workflow, title: "Business processes", desc: "Your KYC, onboarding, monitoring and reporting processes — mapped to the exact regulations they answer to." },
          { icon: GraduationCap, title: "Training", desc: "Every learning module is tied to a regulation and a process. Coverage gaps become obvious." },
          { icon: BookOpen, title: "Linked entities", desc: "Click a regulation to see related processes, trainings and the team responsible. Like Notion for compliance." },
        ]} />
      </section>

      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Built on the central-bank taxonomy</h2>
          <ul className="space-y-3">
            {["AML / CFT", "Sanctions & embargoes", "Prudential (Capital, Liquidity, CRR/CRD)", "Conduct & Consumer protection", "Operational resilience (DORA)", "Reporting & disclosure", "ESG & sustainability"].map((c) => (
              <li key={c} className="flex gap-3 items-center"><Check className="h-4 w-4 text-primary" /> <span className="font-medium">{c}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title="See your regulatory graph in 30 minutes."
        sub="Bring three of your processes — we'll map them to live ACPR, EBA and ESMA obligations."
        primary={<Link to="/contact"><Button size="lg">Book a demo</Button></Link>}
      />
    </MarketingLayout>
  );
}