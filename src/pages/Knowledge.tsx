import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ScrollText, FileText, GraduationCap, BookOpen } from "lucide-react";

const TILES = [
  { to: "/knowledge/regulations", title: "Regulations", desc: "Central-bank obligations classified by taxonomy.", icon: ScrollText },
  { to: "/knowledge/processes", title: "Documentation", desc: "Policies → Standards → Procedures → Work Instructions, linked to real sanctions.", icon: FileText },
  { to: "/knowledge/training", title: "Training", desc: "Learning content linked to each regulation.", icon: GraduationCap },
];

const Knowledge = () => {
  useEffect(() => { document.title = "Knowledge — MERIDIAN"; }, []);
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BookOpen className="h-7 w-7" /> Knowledge</h1>
        <p className="text-muted-foreground mt-1">Regulations, processes and training — your compliance knowledge base.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to}
            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all"
            style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Knowledge;