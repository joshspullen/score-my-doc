import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

const ENTRIES = [
  { date: "2026-04-26", tag: "New", title: "Agents module", body: "Build and schedule autonomous agents — Search & Collect, Analyze, Act." },
  { date: "2026-04-25", tag: "New", title: "Regulators database", body: "Connectors now point to specific regulators (ACPR, EBA, OFAC, FATF…)." },
  { date: "2026-04-23", tag: "Improved", title: "Knowledge module", body: "Compliance renamed to Regulations and grouped under Knowledge." },
  { date: "2026-04-20", tag: "New", title: "Notion-style entity panels", body: "Click any regulation, process or training to see linked entities and jump across the graph." },
];

export default function Changelog() {
  return (
    <MarketingLayout title="Changelog">
      <PageHero eyebrow="Changelog" title="What we shipped." description="Every meaningful change in MERIDIAN." />
      <section className="container py-16 max-w-3xl">
        <ul className="space-y-8">
          {ENTRIES.map((e) => (
            <li key={e.date + e.title} className="border-l-2 border-primary/30 pl-6 relative">
              <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" />
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{e.tag}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{e.title}</h3>
              <p className="text-muted-foreground">{e.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </MarketingLayout>
  );
}