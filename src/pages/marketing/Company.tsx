import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

export default function Company() {
  return (
    <MarketingLayout title="Company">
      <PageHero eyebrow="Company" title="We're building the operating system for compliance." description="Founded by ex-MLROs and engineers from Google Cloud, MERIDIAN exists because annual e-learning failed an entire industry." />
      <section className="container py-20 max-w-3xl space-y-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Mission</h2>
          <p className="text-muted-foreground text-lg">Turn every regulator decision into prevention. Every prevented mistake into training. Every team into a compounding knowledge engine.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Backed by</h2>
          <p className="text-muted-foreground text-lg">Google Cloud, HG Catalyst, Lovable, Cerebras, Red Bull.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Headquarters</h2>
          <p className="text-muted-foreground text-lg">Paris · London · Stockholm.</p>
        </div>
      </section>
    </MarketingLayout>
  );
}