## Goal

Reposition the marketing experience around the new platform architecture (Knowledge, Integrations, Agents, with People Ops as the upcoming pillar) and turn it into a multi-page, "startup ready to scale" site with a proper top navigation (Platform / Resources). Keep the existing landing copy as much as possible — only reframe and reuse it across the new structure.

We'll also align in-app philosophy: move "New analysis" out of the workspace into the right module, and make the Workspace Dashboard a role-aware home rather than an analyst-only screen. People Ops gets a real foundation we can build careers + people-finance on next.

---

## 1. Marketing site — multi-page with top nav

### 1.1 New shared marketing layout
- New `MarketingLayout` (header + footer) used by every public page.
- New `MarketingHeader` replacing the current `AppHeader` for public routes:
  - Left: MERIDIAN logo
  - Center: top nav with **Platform** and **Resources** dropdowns + simple links (Pricing, Customers, Company)
  - Right: Sign in + Book a demo
  - Mobile: collapsible menu
- Dropdowns built with `NavigationMenu` (shadcn), keyboard-accessible.

**Platform dropdown** (one entry per core module):
- Knowledge — regulations, processes, training
- Integrations — internal & external data connections
- Agents — Search & Collect / Analyze / Act
- People Ops *(coming soon badge)* — careers + people operations + people-finance

**Resources dropdown:**
- Blog
- Customer stories
- Regulatory library (links to public knowledge previews)
- Changelog
- Help center
- About / Company

### 1.2 Pages (routes)
All new routes are public and use `MarketingLayout`.

- `/` — Home (refreshed Index, see §1.3)
- `/platform/knowledge`
- `/platform/integrations`
- `/platform/agents`
- `/platform/people-ops` (teaser / waitlist)
- `/resources` (hub)
- `/resources/blog` + `/resources/blog/:slug` (static MDX-style stub posts)
- `/resources/customers`
- `/resources/changelog`
- `/resources/regulatory-library`
- `/company` (about + mission)
- `/pricing`
- `/contact` (reuses existing demo form)

For v1, content pages are statically authored React (no CMS); each follows the same template (hero, features, proof, CTA) so we can scale fast.

### 1.3 Home page (`/`) — keep, lightly reframe
Keep all existing sections. Adjustments only:
- **Hero** — keep MERIDIAN ACPR copy, but add a small "Now with autonomous Agents" pill above the H1 linking to `/platform/agents`.
- **Add a new "The Platform" section** right after the hero/comparison: 4 tiles (Knowledge, Integrations, Agents, People Ops) — each linking to its `/platform/*` page. People Ops shows a "Coming soon" tag.
- Keep: partner marquee, AI vs Traditional, Compliance Gap, Compounding Loop, "Better way to learn", stats, testimonials, demo, FAQ.
- Footer becomes a real marketing footer (Platform / Resources / Company / Legal columns + social).

---

## 2. In-app IA fixes (philosophy alignment)

### 2.1 Sidebar restructure
Update `AppSidebar` groups to mirror the platform pillars:

```text
Workspace
  - Dashboard            (role-aware home)
  - My Profile

Knowledge
  - Overview
  - Regulations
  - Business Processes
  - Training

Integrations
  - Connectors
  - New analysis         (moved here — analysis is a data ingestion action)
  - Documents            (renamed from analyses list, optional)

Automation
  - Agents

People
  - Overview
  - Teams
  - Users (admin)
  (People Ops sub-items will land here next: Careers, People Ops, People Finance)
```

- Remove "New analysis" from Workspace.
- Keep collapsible icon mode.

### 2.2 Workspace Dashboard becomes role-aware
Refactor `src/pages/Dashboard.tsx` so the layout is composed of widgets selected by role:

- **Admin** — platform health (connectors synced, agents runs last 24h, regulations count, users count) + recent agent runs + critical regulation changes.
- **Manager** — team training completion, team KYC throughput, team's recent flagged files.
- **User / analyst** — my open analyses, my training due, my recent flags, "Run new analysis" CTA (deep-links to Integrations → New analysis).

Implementation:
- New `src/components/dashboard/widgets/*` (small, self-contained, one query each).
- New `getDashboardLayout(role)` returning an ordered widget list.
- Driven by `useRoles()` already in the codebase.

### 2.3 Module-level dashboards
Each module page (Knowledge, Integrations, Agents, People) gets a top "Overview" strip with KPIs scoped to that module (most already have stats — we'll standardize them with a shared `ModuleStats` component). No new data needed; queries already exist.

---

## 3. People Ops — foundation only (so we can scale into it)

We'll add the *shell* now and grow it next iteration.

- New page `/people/ops` with three tabs (UI only, wired to empty states + seed copy):
  1. **Careers** — career paths, levels, mobility (will later read from `profile_experience` + new `career_paths` table).
  2. **People Operations** — onboarding, time-off, reviews (placeholder cards).
  3. **People Finance** — comp bands, payroll integrations, fintech hooks (placeholder cards + "Connect a payroll provider" CTA pointing to Integrations).
- Add "People Ops" tile on `/people` with a "Beta" tag.
- No DB changes in this step — explicitly deferred so we plan the schema properly with you next round.

---

## 4. Files

**New**
- `src/components/marketing/MarketingLayout.tsx`
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/components/marketing/PlatformMegaMenu.tsx`
- `src/components/marketing/ResourcesMegaMenu.tsx`
- `src/components/marketing/PageHero.tsx` (shared template)
- `src/pages/marketing/PlatformKnowledge.tsx`
- `src/pages/marketing/PlatformIntegrations.tsx`
- `src/pages/marketing/PlatformAgents.tsx`
- `src/pages/marketing/PlatformPeopleOps.tsx`
- `src/pages/marketing/Resources.tsx`
- `src/pages/marketing/Blog.tsx` + `BlogPost.tsx`
- `src/pages/marketing/Customers.tsx`
- `src/pages/marketing/Changelog.tsx`
- `src/pages/marketing/RegulatoryLibrary.tsx`
- `src/pages/marketing/Company.tsx`
- `src/pages/marketing/Pricing.tsx`
- `src/pages/marketing/Contact.tsx`
- `src/components/dashboard/widgets/*` (5–7 small widgets)
- `src/pages/PeopleOps.tsx`

**Edited**
- `src/App.tsx` — add all marketing routes, mount `MarketingLayout`, add `/people/ops`, keep existing app routes.
- `src/pages/Index.tsx` — add "Now with Agents" pill, "The Platform" tiles section, swap header/footer to marketing layout.
- `src/components/AppSidebar.tsx` — new grouping, move "New analysis" under Integrations, add Automation group, add People Ops sub-item.
- `src/pages/Dashboard.tsx` — role-aware widget layout.
- `src/pages/People.tsx` — add People Ops tile (Beta).

No database migrations in this step. No edge function changes.

---

## What I won't do (calling out)
- I won't build the People Ops data model yet — that needs its own design pass with you (careers schema, people-finance integrations, payroll connectors). I'll ship the shell so the IA is right.
- I won't author full blog content — just 2 placeholder posts and a clean template you can fill.
- I won't touch agents / connectors / regulations functionality.