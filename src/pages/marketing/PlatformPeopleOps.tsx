import { useState } from "react";
import { Link } from "react-router-dom";
import { UsersRound, Briefcase, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero, FeatureGrid } from "@/components/marketing/PageHero";
import { toast } from "sonner";

export default function PlatformPeopleOps() {
  const [email, setEmail] = useState("");
  return (
    <MarketingLayout title="People Ops">
      <PageHero
        eyebrow="Coming soon · People Ops"
        title={<>The full lifecycle of compliance people — careers, operations, finance.</>}
        description="People Ops extends MERIDIAN beyond compliance work into how compliance people grow, operate and get paid. The fintech layer for compliance teams."
      >
        <form
          onSubmit={(e) => { e.preventDefault(); toast.success("You're on the list. We'll be in touch."); setEmail(""); }}
          className="flex gap-2 max-w-md"
        >
          <input
            value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@bank.com"
            className="flex-1 h-11 px-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" size="lg" className="gap-2">Join the waitlist <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </PageHero>

      <section className="container py-20">
        <FeatureGrid items={[
          { icon: Briefcase, title: "Careers", desc: "Career paths, level frameworks and mobility — built around real compliance role progressions." },
          { icon: UsersRound, title: "People Operations", desc: "Onboarding, time-off, performance reviews — purpose-built for regulated teams." },
          { icon: Wallet, title: "People Finance", desc: "Comp bands, payroll connectors, expense governance. Where compliance meets fintech." },
        ]} />
      </section>

      <section className="border-t border-border bg-secondary/30 py-20 text-center">
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">Want to shape the People Ops roadmap with us? Design partners get free pilot access.</p>
        <Link to="/contact"><Button size="lg">Become a design partner</Button></Link>
      </section>
    </MarketingLayout>
  );
}