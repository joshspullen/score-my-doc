import { Link } from "react-router-dom";
import logo from "@/assets/meridian-logo.svg";

const COLS = [
  {
    title: "Platform",
    links: [
      { to: "/platform/knowledge", label: "Knowledge" },
      { to: "/platform/integrations", label: "Integrations" },
      { to: "/platform/agents", label: "Agents" },
      { to: "/platform/people-ops", label: "People Ops" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/resources/blog", label: "Blog" },
      { to: "/resources/customers", label: "Customers" },
      { to: "/resources/regulatory-library", label: "Regulatory library" },
      { to: "/resources/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/company", label: "About" },
      { to: "/pricing", label: "Pricing" },
      { to: "/contact", label: "Contact" },
      { to: "/auth", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "#", label: "Privacy" },
      { to: "#", label: "Terms" },
      { to: "#", label: "Security" },
      { to: "#", label: "DPA" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="container py-16 grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="MERIDIAN" className="h-8 w-8" />
            <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            The AI compliance platform for banks. Knowledge, integrations and agents — built around real regulator decisions.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm hover:text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container py-6 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MERIDIAN. All rights reserved.</p>
          <p>Built for compliance teams. Backed by regulator-grade data.</p>
        </div>
      </div>
    </footer>
  );
}