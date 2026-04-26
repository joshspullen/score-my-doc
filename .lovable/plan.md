## Goal

Add a **Decision Telemetry** module that treats every human decision as a traceable event (trigger → options → choice → policy referenced → outcome), reusing what we already have:

- **Documentation** (`business_processes`) = Policy Library (already built, no duplication)
- **People / Teams** = Users & Teams view (link from telemetry, don't rebuild)
- **Analyses** = existing eval/outcome surface for AI; we extend the concept to humans

## New top-level navigation

In `AppSidebar.tsx`, add a new group **Telemetry** (visible to all authenticated users; admin-only for settings):

- Decisions (live feed + KPIs) — `/telemetry`
- Trace Explorer — `/telemetry/traces`
- Outcomes & Evals — `/telemetry/outcomes`

Policy Library stays under **Knowledge → Documentation** (no duplicate). Users & Teams stay under **People**. The telemetry pages link into them.

## Pages (4 new)

1. **`/telemetry` — Decisions Home**
   KPI strip (decisions today, deviation rate, avg decision time, policy compliance %), decisions-by-category bar chart, live feed (last 20 traces) with status chips. Click row → trace detail.

2. **`/telemetry/traces` — Trace Explorer (Langfuse-style)**
   Filter bar: user, team, policy (FK to `business_processes`), date range, outcome. Master list left, expandable trace detail right showing **spans**: Trigger / Context → Options Presented → Decision Made → Policy Referenced → Outcome. Each span is a collapsible card with JSON payload + duration.

3. **`/telemetry/outcomes` — Outcomes & Evals**
   Table of decisions with outcome status (correct / incorrect / pending), AI recommendation vs human choice, divergence flag, link to the trace. Filter by divergence/policy.

4. **Policy detail enrichment** — extend existing `BusinessProcesses.tsx` row drawer with a "Decisions" tab: compliance rate, deviation count, recent linked traces. No new page.

## Data model (1 migration)

```sql
CREATE TYPE public.decision_outcome AS ENUM ('pending','correct','incorrect','divergent','n_a');

CREATE TABLE public.decision_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                      -- who decided
  team_id uuid REFERENCES public.teams(id),
  policy_id uuid REFERENCES public.business_processes(id),  -- policy referenced
  category text,                              -- e.g. KYC, credit, AML
  trigger_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  options_presented jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_made jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_recommendation jsonb,                    -- nullable
  outcome public.decision_outcome NOT NULL DEFAULT 'pending',
  outcome_notes text,
  deviation boolean NOT NULL DEFAULT false,
  duration_ms integer,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.decision_spans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.decision_traces(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  step_type text NOT NULL,                    -- 'trigger'|'options'|'decision'|'policy_ref'|'outcome'
  label text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.decision_traces (user_id, decided_at DESC);
CREATE INDEX ON public.decision_traces (policy_id);
CREATE INDEX ON public.decision_spans (trace_id, step_order);
```

**RLS** (mirror existing patterns):
- `decision_traces`: owner full access; managers SELECT via `manages_user`; admins ALL.
- `decision_spans`: SELECT/ALL gated through parent trace via EXISTS check.

## Seed data (MECE-light)

3 sample policies are already there. Seed **8 decision traces** across 3 fictional users covering KYC onboarding, sanctions screening hit, and a credit override — including 1 deviation and 1 divergence vs AI recommendation. Each gets 4–5 spans. Just enough to populate KPIs and charts without bloat.

## Files to create

- `supabase/migrations/<ts>_decision_telemetry.sql` — schema + RLS + seed
- `src/pages/telemetry/Decisions.tsx` — home + KPIs + feed
- `src/pages/telemetry/TraceExplorer.tsx` — list + span detail
- `src/pages/telemetry/Outcomes.tsx` — eval table
- `src/components/telemetry/TraceSpanCard.tsx` — reusable span renderer
- `src/components/telemetry/KpiStrip.tsx` — KPI tiles

## Files to edit

- `src/App.tsx` — 3 new routes under `ProtectedRoute`
- `src/components/AppSidebar.tsx` — new "Telemetry" group with `data-tour` keys
- `src/pages/BusinessProcesses.tsx` — add "Decisions" tab in detail drawer
- `src/lib/productTour.ts` — add 1 tour step pointing at Telemetry

## Out of scope (for this round)

- No new Policy Library page (reuses Documentation)
- No new Users page (Trace Explorer filters/links into existing People)
- No write API for external systems yet — traces created via in-app UI / seed; ingestion endpoint can come later

## Notes

- Reuses existing `recharts` for the category bar chart.
- All RLS follows the `manages_user` / `has_role` patterns already in the project.
- No new dependencies.
