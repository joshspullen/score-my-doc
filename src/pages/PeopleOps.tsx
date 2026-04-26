import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, UsersRound, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PeopleOps = () => {
  useEffect(() => { document.title = "People Ops — MERIDIAN"; }, []);
  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7" /> People Ops
          </h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">Beta</span>
        </div>
        <p className="text-muted-foreground">Careers, operations and finance for compliance teams. The fintech layer for regulated workforces.</p>
      </div>

      <Tabs defaultValue="careers" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="careers">Careers</TabsTrigger>
          <TabsTrigger value="operations">People Operations</TabsTrigger>
          <TabsTrigger value="finance">People Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="careers">
          <PlaceholderGrid icon={Briefcase} cards={[
            { title: "Career paths", desc: "Define progressions for KYC, AML, MLRO, Sanctions and Risk roles." },
            { title: "Levels & competencies", desc: "Level frameworks tied to certifications already in your profiles." },
            { title: "Mobility", desc: "Internal moves and rotations across teams and jurisdictions." },
          ]} />
        </TabsContent>

        <TabsContent value="operations">
          <PlaceholderGrid icon={UsersRound} cards={[
            { title: "Onboarding", desc: "First 30/60/90 with the trainings and access automatically scheduled." },
            { title: "Time off & shifts", desc: "Coverage planning for second-line teams and on-call sanctions desks." },
            { title: "Performance & 1:1s", desc: "Reviews tied to real compliance outcomes from MERIDIAN." },
          ]} />
        </TabsContent>

        <TabsContent value="finance">
          <PlaceholderGrid icon={Wallet} cards={[
            { title: "Compensation bands", desc: "Market data for compliance roles by geography and seniority." },
            { title: "Payroll connectors", desc: "Connect a payroll provider via Integrations to push comp updates." },
            { title: "Expense governance", desc: "Compliance-grade controls for travel, training and external counsel." },
          ]} extra={
            <Link to="/connectors"><Button variant="outline" className="gap-2">Open Integrations <ArrowRight className="h-4 w-4" /></Button></Link>
          } />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function PlaceholderGrid({
  icon: Icon,
  cards,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>;
  cards: { title: string; desc: string }[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-dashed border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"><Icon className="h-4 w-4" /></div>
            <h3 className="font-semibold mb-1">{c.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">Coming soon</p>
          </div>
        ))}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}

export default PeopleOps;