import { Quote } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

const STORIES = [
  { org: "Tier-1 European Bank", role: "Head of Financial Crime", quote: "MERIDIAN caught a source-of-funds gap on a high-risk PEP file the team had signed off — and coached the analyst through it in three minutes." },
  { org: "UK Challenger Bank", role: "MLRO", quote: "Annual AML training had 4% retention after a quarter. With MERIDIAN, analysts learn from their own near-misses on real files." },
  { org: "Global Asset Manager", role: "Senior KYC Analyst", quote: "I stopped clicking through slides. The conversation challenged how I was reading the file — and I caught the gap myself." },
];

export default function Customers() {
  return (
    <MarketingLayout title="Customers">
      <PageHero eyebrow="Customers" title="Loved by MLROs and KYC analysts." description="A few words from the compliance teams using MERIDIAN every day." />
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-7 flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
              <Quote className="h-7 w-7 text-primary/40 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">"{s.quote}"</p>
              <div className="mt-6 pt-5 border-t border-border">
                <p className="font-semibold text-sm">{s.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.org}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}