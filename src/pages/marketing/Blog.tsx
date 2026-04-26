import { Link } from "react-router-dom";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";

export const POSTS = [
  {
    slug: "why-acpr-decisions-matter",
    title: "Why every ACPR decision is training data waiting to happen",
    date: "2026-04-12",
    author: "MERIDIAN Team",
    excerpt: "We've ingested every ACPR enforcement decision from the past decade. Here's what they tell us about how compliance training should change.",
  },
  {
    slug: "agents-vs-monitoring",
    title: "Regulator monitoring is dead. Long live regulator agents.",
    date: "2026-04-04",
    author: "MERIDIAN Team",
    excerpt: "Manual portal-watching doesn't scale. Here's how a 3-agent setup replaces a half-FTE — and is more reliable.",
  },
];

export default function Blog() {
  return (
    <MarketingLayout title="Blog">
      <PageHero eyebrow="Blog" title="Notes from the compliance frontier." />
      <section className="container py-16 max-w-3xl">
        <ul className="space-y-6">
          {POSTS.map((p) => (
            <li key={p.slug}>
              <Link to={`/resources/blog/${p.slug}`} className="block rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-xs text-muted-foreground mb-2">{new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {p.author}</p>
                <h2 className="text-xl font-bold mb-2">{p.title}</h2>
                <p className="text-muted-foreground">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingLayout>
  );
}