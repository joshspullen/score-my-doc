import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

const REGS = [
  { code: "ACPR", name: "Autorité de contrôle prudentiel et de résolution", country: "France" },
  { code: "EBA", name: "European Banking Authority", country: "EU" },
  { code: "ECB", name: "European Central Bank", country: "EU" },
  { code: "ESMA", name: "European Securities and Markets Authority", country: "EU" },
  { code: "FATF", name: "Financial Action Task Force", country: "Global" },
  { code: "OFAC", name: "Office of Foreign Assets Control", country: "USA" },
  { code: "FCA", name: "Financial Conduct Authority", country: "UK" },
  { code: "BaFin", name: "Federal Financial Supervisory Authority", country: "Germany" },
  { code: "ENISA", name: "European Union Agency for Cybersecurity", country: "EU" },
];

export default function RegulatoryLibrary() {
  return (
    <MarketingLayout title="Regulatory library">
      <PageHero eyebrow="Public preview" title="The regulators we track." description="Every connector below feeds a live database of obligations, sanctions and decisions inside MERIDIAN." />
      <section className="container py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGS.map((r) => (
            <div key={r.code} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{r.code}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{r.country}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.name}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Don't see your regulator?</p>
          <Link to="/contact"><Button>Request a regulator</Button></Link>
        </div>
      </section>
    </MarketingLayout>
  );
}