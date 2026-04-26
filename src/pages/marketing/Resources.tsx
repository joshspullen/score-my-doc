import { Link } from "react-router-dom";
import { FileText, Users, ScrollText, GitCommit, Palette, Cpu } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

const TILES = [
  { to: "/resources/blog", title: "Blog", desc: "Insights from MLROs, regulators and the MERIDIAN team.", icon: FileText },
  { to: "/resources/customers", title: "Customers", desc: "How banks deploy MERIDIAN — and what they get back.", icon: Users },
  { to: "/resources/regulatory-library", title: "Regulatory library", desc: "Curated obligations, sanctions and decisions.", icon: ScrollText },
  { to: "/resources/changelog", title: "Changelog", desc: "Every release, every week.", icon: GitCommit },
  { to: "/resources/brand", title: "Brand", desc: "Logo, colors, typography and voice — the MERIDIAN identity system.", icon: Palette },
  { to: "/resources/tech-stack", title: "Tech stack", desc: "Architecture, infrastructure and security — engineered for regulated environments.", icon: Cpu },
];

export default function Resources() {
  return (
    <MarketingLayout title="Resources">
      <PageHero eyebrow="Resources" title="Everything we've learned, in one place." description="Articles, customer stories, a public regulatory library and our weekly changelog." />
      <section className="container py-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {TILES.map((t) => (
            <Link key={t.to} to={t.to} className="group rounded-2xl border border-border bg-card p-7 hover:border-primary/40 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl mb-2">{t.title}</h3>
              <p className="text-muted-foreground">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}