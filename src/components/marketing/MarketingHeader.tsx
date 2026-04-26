import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import logo from "@/assets/meridian-logo.svg";
import { cn } from "@/lib/utils";

const PLATFORM = [
  { to: "/platform/knowledge", title: "Knowledge", desc: "Regulations, processes, training — all unified." },
  { to: "/platform/integrations", title: "Integrations", desc: "Internal & external data connections." },
  { to: "/platform/agents", title: "Agents", desc: "Search, analyze and act — autonomously." },
  { to: "/platform/people-ops", title: "People Ops", desc: "Careers, operations and people-finance.", soon: true },
];

const RESOURCES = [
  { to: "/resources/blog", title: "Blog", desc: "Insights from compliance leaders." },
  { to: "/resources/customers", title: "Customers", desc: "How banks deploy MERIDIAN." },
  { to: "/resources/regulatory-library", title: "Regulatory library", desc: "Curated obligations & sanctions." },
  { to: "/resources/changelog", title: "Changelog", desc: "What shipped, every week." },
  { to: "/resources/brand", title: "Brand", desc: "Logo, colors, typography & voice." },
  { to: "/resources/tech-stack", title: "Tech stack", desc: "Architecture, infrastructure & security." },
];

function MenuList({ items }: { items: { to: string; title: string; desc: string; soon?: boolean }[] }) {
  return (
    <ul className="grid w-[420px] gap-1 p-2">
      {items.map((it) => (
        <li key={it.to}>
          <Link
            to={it.to}
            className="flex flex-col rounded-md px-3 py-2.5 hover:bg-accent transition-colors"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              {it.title}
              {it.soon && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Soon</span>}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">{it.desc}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="MERIDIAN" className="h-8 w-8" />
          <span className="font-bold tracking-[0.18em] text-sm">MERIDIAN</span>
        </Link>

        <nav className="hidden md:flex items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Platform</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <MenuList items={PLATFORM} />
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <MenuList items={RESOURCES} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <Link to="/pricing" className="px-4 text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          <Link to="/company" className="px-4 text-sm font-medium hover:text-primary transition-colors">Company</Link>
          <Link to="/team" className="px-4 text-sm font-medium hover:text-primary transition-colors">Team</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/contact"><Button size="sm">Book a demo</Button></Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 space-y-4">
            <MobileGroup label="Platform" items={PLATFORM} />
            <MobileGroup label="Resources" items={RESOURCES} />
            <Link to="/pricing" className="block py-2 font-medium" onClick={() => setOpen(false)}>Pricing</Link>
            <Link to="/company" className="block py-2 font-medium" onClick={() => setOpen(false)}>Company</Link>
            <Link to="/team" className="block py-2 font-medium" onClick={() => setOpen(false)}>Team</Link>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Link to="/auth" className="flex-1"><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link to="/contact" className="flex-1"><Button className="w-full">Book a demo</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileGroup({ label, items }: { label: string; items: { to: string; title: string; soon?: boolean }[] }) {
  const [exp, setExp] = useState(false);
  return (
    <div>
      <button onClick={() => setExp(!exp)} className="flex items-center justify-between w-full py-2 font-semibold">
        {label} <ChevronDown className={cn("h-4 w-4 transition-transform", exp && "rotate-180")} />
      </button>
      {exp && (
        <ul className="pl-3 space-y-1">
          {items.map((it) => (
            <li key={it.to}>
              <Link to={it.to} className="block py-1.5 text-sm text-muted-foreground hover:text-foreground">
                {it.title} {it.soon && <span className="ml-1 text-[10px] text-primary">SOON</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}