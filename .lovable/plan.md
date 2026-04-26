## Goal

Reposition MERIDIAN as **the RegTech intelligence layer for fintechs** — and back it with one live regulator feed plus a unified "Regulatory Radar" surface that ties Connections → Knowledge → Decision Intelligence into a single hackathon-winning story for a CTO / Head of Risk.

## The narrative we're selling

> "When a regulator publishes something new, every fintech today finds out by accident. MERIDIAN watches every regulator, maps each new rule, sanction or enforcement to *your* policies and decisions, and gives your CTO a verifiable audit trail of every automated call your platform made."

Three pillars, one product:
1. **Regulatory Radar** — ingest (live)
2. **Policy Impact Mapping** — translate (AI-mapped to your docs)
3. **Auditable Decisions** — prove (every action tied back to a regulation)

## Changes

### 1. Reposition the homepage (light touch, big impact)
File: `src/pages/Index.tsx`
- New hero tagline: **"The RegTech intelligence layer for fintechs."**
- Sub: *"Live regulator feeds → mapped to your policies → tied to every automated decision. Built for fintech CTOs and Heads of Risk."*
- Replace the current ACPR-centric one-liner with a 3-pillar block (Radar / Mapping / Audit Trail) using existing icons.
- Add a small "Live now" ticker showing the latest 3 items pulled by the live connector (real data when available, seeded fallback otherwise).
- Keep the rest of the page intact — no full redesign.
- Update page title and hero badge: `"RegTech for fintechs · Live regulator feeds"`.

### 2. New "Regulatory Radar" dashboard module
New file: `src/components/dashboard/RegulatoryRadar.tsx`, mounted on `/dashboard`.
- Top strip: KPIs — *New rules this week*, *Impacted policies*, *Open decisions affected*, *Sources monitored*.
- Center: live feed list of recent `connector_records` joined with their connector + regulator. Each item shows: regulator badge, title, published date, "Impacts X policies" pill (computed via simple keyword/category match against `business_processes` and `compliance_requirements`).
- Click an item → side sheet with: full summary, mapped policies, mapped decisions (from `decision_traces`), and a "Notify owner" stub action.
- This *is* the demo. It shows ingest → mapping → decisions in one screen.

### 3. Wire one real, live regulator source
- Pick **EBA news/press feed** (RSS, no key, CORS-friendly via edge function). Fallback if EBA blocks: **OFAC SDN consolidated list** (public JSON).
- Update `supabase/functions/connector-sync/index.ts` to add a real fetcher for `eba-news` (parse RSS → records). Keep existing seed-style fetchers untouched.
- Seed a connector row `slug='eba-news'` via migration with `connector_type='api'`, `enabled=true`, `requires_api_key=false`.
- Add a "Sync now" button on the radar that calls `connector-sync` for `eba-news` and refreshes the list — perfect on-stage moment.
- Seeded fallback: if the live fetch fails (offline/firewall), the function inserts a small set of realistic seeded EBA-style records so the demo never breaks.

### 4. Policy Impact Mapping (lightweight, demoable)
- New edge function `radar-impact` that, given a `connector_records.id`, runs a Lovable AI call (`google/gemini-2.5-flash`) with a tight prompt: *"Given this regulatory item and these policy titles + categories, return JSON `{policy_ids:[], decision_categories:[], severity}`."*
- Inputs: the record + a compact list of `business_processes` (id, name, category) and distinct `decision_traces.category` values.
- Output stored on `connector_records.payload.impact` (jsonb) — no new table needed.
- Triggered automatically after a sync, and on-demand from the radar item sheet ("Re-analyze impact").

### 5. Decision audit trail polish (CTO pitch)
File: `src/pages/telemetry/TraceExplorer.tsx`
- Add a "Triggering regulation" field on the detail panel. When a decision's `category` matches a recent radar item, surface a link: *"Triggered by EBA Guideline 2026/03 — view source."*
- Add an "Export audit pack" button that downloads a clean JSON of the decision + spans + linked regulation + linked policy. (Pure client-side, no backend.) Sells the "DORA / EU AI Act ready" line in 5 seconds.

### 6. Demo seed data
Migration to insert ~8 realistic `connector_records` for `eba-news` (DORA, MiCA, AML6, EBA Guidelines, ESMA Q&A) with categories that overlap our existing `business_processes` so impact mapping yields satisfying results offline.

## Technical notes

- Live source: EBA press releases RSS (`https://www.eba.europa.eu/rss-events.xml` or equivalent). Fetched server-side from the edge function, parsed with a tiny regex/XML pass — no extra dependency.
- AI mapping: uses existing Lovable AI Gateway via `LOVABLE_API_KEY`, model `google/gemini-2.5-flash`. Prompt returns strict JSON; we `JSON.parse` defensively.
- No new tables. Reuses `connectors`, `connector_records` (`payload` jsonb for impact), `business_processes`, `decision_traces`.
- All new UI uses existing semantic tokens — no theme changes.
- Fully role-gated: Radar visible to all authenticated users; "Sync now" + Connectors remain admin-only.

## Demo script (90 seconds)

1. Open `/dashboard` → Radar shows "12 new items this week, 4 impacted policies".
2. Click "Sync now" → live EBA item appears at the top.
3. Click the new item → side sheet shows mapped policies + 2 affected decisions.
4. Jump to Decision Intelligence → open one of those decisions → "Triggered by EBA Guideline 2026/03" → click "Export audit pack" → JSON downloads.
5. Close: *"Live regulator feed → policy mapping → auditable decision, in 90 seconds. That's RegTech for fintechs."*

## Out of scope

- No product rename. No full marketing redesign.
- No new regulators beyond the one live source for now (architecture supports adding more post-hackathon).
- No per-user OAuth — the live source is public.
