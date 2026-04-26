import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

const PLANS = [
  {
    name: "Starter",
    price: "€2,900",
    cadence: "/ month",
    desc: "For compliance teams getting started with AI.",
    features: ["Up to 25 analysts", "Knowledge module", "5 connectors", "1 active agent", "Email support"],
    cta: "Start a pilot",
    highlight: false,
  },
  {
    name: "Growth",
    price: "€9,500",
    cadence: "/ month",
    desc: "For mid-sized banks scaling compliance ops.",
    features: ["Up to 200 analysts", "Knowledge + People modules", "Unlimited connectors", "10 active agents", "SSO & audit logs", "Dedicated success manager"],
    cta: "Talk to sales",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For systemic banks and global groups.",
    features: ["Unlimited analysts", "Full platform", "Custom connectors", "Unlimited agents", "On-prem / VPC option", "SLA & DPA"],
    cta: "Contact us",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <MarketingLayout title="Pricing">
      <PageHero eyebrow="Pricing" title="Simple plans. Built to scale with your team." description="All plans include the full Knowledge graph, agent runtime, and unlimited regulator updates." />
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-7 flex flex-col ${p.highlight ? "border-primary bg-card ring-2 ring-primary/20" : "border-border bg-card"}`}
              style={{ boxShadow: p.highlight ? "var(--shadow-elegant)" : "var(--shadow-card)" }}
            >
              <h3 className="font-bold text-xl">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 mb-6">{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Link to="/contact"><Button className="w-full" variant={p.highlight ? "default" : "outline"}>{p.cta}</Button></Link>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}