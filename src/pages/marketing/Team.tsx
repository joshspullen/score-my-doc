import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageHero } from "@/components/marketing/PageHero";
import { motion } from "framer-motion";
import { Linkedin, Mail, Sparkles } from "lucide-react";

type Member = {
  name: string;
  role: string;
  bio: string;
  emoji: string;
  accent: string; // gradient
  glow: string; // shadow color
  tagline: string;
};

const TEAM: Member[] = [
  {
    name: "Baptiste DUBOURDIEU",
    role: "Co-founder & CEO",
    bio: "Former MLRO turned product leader. Sets the company vision and works directly with banks to translate regulator pain into product.",
    emoji: "🧭",
    tagline: "Pointing the ship at the right regulator.",
    accent: "from-[#6366F1] via-[#8B5CF6] to-[#EC4899]",
    glow: "99,102,241",
  },
  {
    name: "Hiram Lannes",
    role: "Co-founder & CTO",
    bio: "Architect of the MERIDIAN platform. Designs the agent infrastructure, knowledge graph and the integration layer that powers every module.",
    emoji: "🛠️",
    tagline: "Wiring agents to reality.",
    accent: "from-[#0EA5E9] via-[#22D3EE] to-[#10B981]",
    glow: "14,165,233",
  },
  {
    name: "Josh PULLEN",
    role: "Head of AI",
    bio: "Leads model selection, evaluation and the training-generation pipeline. Obsessed with grounded, auditable AI for regulated environments.",
    emoji: "🧠",
    tagline: "Teaching models to cite their sources.",
    accent: "from-[#F59E0B] via-[#F97316] to-[#EF4444]",
    glow: "249,115,22",
  },
  {
    name: "Nadhir MAZARI BOUFARES",
    role: "Head of Engineering",
    bio: "Owns reliability, security and the developer platform. Makes sure every release ships fast and meets bank-grade quality bars.",
    emoji: "⚙️",
    tagline: "Ships fast. Sleeps well.",
    accent: "from-[#10B981] via-[#14B8A6] to-[#0EA5E9]",
    glow: "16,185,129",
  },
  {
    name: "Tenzin TRIDHE",
    role: "Head of Design",
    bio: "Crafts the MERIDIAN identity end-to-end — from the brand system to every interaction inside the product.",
    emoji: "🎨",
    tagline: "Pixel by pixel, on purpose.",
    accent: "from-[#EC4899] via-[#A855F7] to-[#6366F1]",
    glow: "236,72,153",
  },
];

export default function Team() {
  return (
    <MarketingLayout title="Team">
      <PageHero
        eyebrow="The team"
        title="The people building MERIDIAN."
        description="A small, senior team of operators, engineers and designers — shipping the operating system for compliance."
      />
      <section className="container py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((m, i) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-border bg-card p-7 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Animated gradient glow */}
              <motion.div
                aria-hidden
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${m.accent} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
              />
              {/* Animated emoji avatar */}
              <div className="relative mb-5">
                <motion.div
                  className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${m.accent} flex items-center justify-center text-4xl select-none`}
                  style={{ boxShadow: `0 12px 30px -10px rgba(${m.glow}, 0.55)` }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.08, rotate: [0, -6, 6, -3, 0] }}
                >
                  <motion.span
                    animate={{ rotate: [0, 8, -6, 0] }}
                    transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    className="drop-shadow-sm"
                  >
                    {m.emoji}
                  </motion.span>
                  <motion.span
                    aria-hidden
                    className="absolute -top-1 -right-1 text-primary"
                    animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.6, 1, 0.6], rotate: [0, 25, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.span>
                </motion.div>
              </div>

              <h3 className="font-bold text-xl tracking-tight">{m.name}</h3>
              <p className="text-sm text-primary mt-1 font-medium">{m.role}</p>
              <p className="text-xs italic text-muted-foreground/80 mt-2">"{m.tagline}"</p>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{m.bio}</p>

              <div className="mt-5 flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label={`${m.name} on LinkedIn`}
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label={`Email ${m.name}`}
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Animated bottom accent line */}
              <motion.div
                aria-hidden
                className={`absolute left-0 bottom-0 h-[3px] w-full bg-gradient-to-r ${m.accent} origin-left`}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: "easeOut" }}
              />
            </motion.article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}