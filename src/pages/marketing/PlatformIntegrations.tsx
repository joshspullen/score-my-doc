import { Link } from "react-router-dom";
import { Plug, Database, Cloud, Lock, Shuffle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero, FeatureGrid, CtaBand } from "@/components/marketing/PageHero";

export default function PlatformIntegrations() {
  return (
    <MarketingLayout title="Integrations">
      <PageHero
        eyebrow="Platform · Integrations"
        title={<>Plug into every system that produces compliance data — internal and external.</>}
        description="Integrations is your data layer: regulator portals (ACPR, EBA, OFAC, FATF) on one side, your KYC tools, ticketing, HRIS and document storage on the other. Connect once, route everywhere."
      >
        <div className="flex gap-3">
          <Link to="/contact"><Button size="lg" className="gap-2">Talk to us <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/platform/agents"><Button size="lg" variant="outline">Pair with Agents</Button></Link>
        </div>
      </PageHero>

      <section className="container py-20">
        <FeatureGrid items={[
          { icon: Cloud, title: "External regulator feeds", desc: "ACPR, EBA, ESMA, OFAC, FATF, BaFin, FCA, ENISA — RSS, scrapers and APIs out of the box." },
          { icon: Database, title: "Internal systems", desc: "KYC platforms, GRC tools, ticketing (Jira/ServiceNow), HRIS, document stores. SFTP, REST, webhooks." },
          { icon: Plug, title: "Connector catalog", desc: "Each connector exposes a uniform record schema so agents can act across sources without custom glue code." },
          { icon: Shuffle, title: "Bi-directional", desc: "Pull obligations in, push alerts and assignments out to where your teams already work." },
          { icon: Lock, title: "Secure by default", desc: "Secrets vaulted. Per-connector RLS. Full audit trail on every fetched record." },
          { icon: Database, title: "Document analysis", desc: "Upload KYC files directly — they become connector records the rest of the platform can reason over." },
        ]} />
      </section>

      <CtaBand
        title="Need a custom connector?"
        sub="Most banks have one homegrown system that matters. We'll build a connector for it."
        primary={<Link to="/contact"><Button size="lg">Request a connector</Button></Link>}
      />
    </MarketingLayout>
  );
}