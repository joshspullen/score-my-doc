import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TEAM = [
  {
    name: "Baptiste DUBOURDIEU",
    role: "Co-founder & CEO",
    bio: "Former MLRO turned product leader. Sets the company vision and works directly with banks to translate regulator pain into product.",
  },
  {
    name: "Hiram Lannes",
    role: "Co-founder & CTO",
    bio: "Architect of the MERIDIAN platform. Designs the agent infrastructure, knowledge graph and the integration layer that powers every module.",
  },
  {
    name: "Josh PULLEN",
    role: "Head of AI",
    bio: "Leads model selection, evaluation and the training-generation pipeline. Obsessed with grounded, auditable AI for regulated environments.",
  },
  {
    name: "Nadhir MAZARI BOUFARES",
    role: "Head of Engineering",
    bio: "Owns reliability, security and the developer platform. Makes sure every release ships fast and meets bank-grade quality bars.",
  },
  {
    name: "Tenzin TRIDHE",
    role: "Head of Design",
    bio: "Crafts the MERIDIAN identity end-to-end — from the brand system to every interaction inside the product.",
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Team() {
  return (
    <MarketingLayout title="Team">
      <PageHero
        eyebrow="The team"
        title="The people building MERIDIAN."
        description="A small, senior team of operators, engineers and designers — shipping the operating system for compliance."
      />
      <section className="container py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEAM.map((m) => (
            <article
              key={m.name}
              className="rounded-2xl border border-border bg-card p-7"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Avatar className="h-16 w-16 mb-5">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-xl">{m.name}</h3>
              <p className="text-sm text-primary mt-1">{m.role}</p>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{m.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}