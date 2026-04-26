# Agent Orchestration Integration Tracker

## Objective
Integrate agent orchestration so policies from `/knowledge/processes` and sanctions from `/knowledge/regulations` are used to generate learning material and quiz questions in `/knowledge/training`, without breaking existing generation flows.

## Guardrails (Do Not Break)
- Keep existing `generate-training` behavior available during rollout.
- Do not change existing training rendering contracts in a breaking way.
- Only create `training_modules` rows after output schema validation passes.
- Log every orchestration run status (success/error/fallback) for traceability.

## Implementation Checklist

### Phase 1: Contracts and Observability
- [x] Define orchestration output schema v1 (quiz-first + summary).
- [x] Add schema versioning (`v1`) and prompt version tags.
- [x] Add code-level contract constants and runtime validator helper.
- [x] Create `training_generation_runs` table migration.
- [x] Add helper methods to write run lifecycle events.

### Phase 2: Backend Orchestration Function
- [ ] Add new edge function `orchestrate-training`.
- [ ] Add auth and role checks (admin-triggered path).
- [ ] Add input validation for `regulation_id`, optional policy/team/category/audience.
- [ ] Implement context loader from `compliance_requirements` and `business_processes`.
- [ ] Add deterministic truncation/context budget logic.
- [ ] Implement 4-step pipeline:
  - [ ] Policy Mapper
  - [ ] Sanction Analyst
  - [ ] Relevance Mapper
  - [ ] Training Scenario
- [ ] Add strict JSON schema validation for final output.
- [ ] Persist module + assignments only after successful validation.
- [ ] Add optional legacy fallback path (`generate-training`), flag-controlled.

### Phase 3: UI Integration
- [ ] Add admin action in `/knowledge/regulations`: `Generate with orchestration`.
- [ ] Connect action to `orchestrate-training`.
- [ ] Show clear success/error/fallback toasts.
- [ ] Route user to generated module in `/knowledge/training`.
- [ ] Keep existing `GenerateTrainingDialog` available.

### Phase 4: Testing and Rollout
- [ ] Add unit tests for context assembly and truncation.
- [ ] Add unit tests for output schema validation.
- [ ] Add integration test for successful module creation/rendering.
- [ ] Add integration test for fallback behavior.
- [ ] Add regression tests for existing legacy generation path.
- [ ] Roll out with feature flag disabled by default.
- [ ] Enable for admin-only first.
- [ ] Review run metrics before broader enablement.

## Change Log

Use this section to track exactly what was changed and why.

| Date (YYYY-MM-DD) | Area | Change | Type | Status | Notes |
|---|---|---|---|---|---|
| 2026-04-26 | Tracking | Created orchestration implementation tracker | docs | done | Initial planning tracker |
| 2026-04-26 | Contract | Added locked orchestration output contract (MD + JSON schema) | docs | done | `training_orchestration_v1` quiz-first schema |
| 2026-04-26 | Contract | Added shared runtime validator + prompt/schema constants | backend | done | `supabase/functions/_shared/orchestration-contract-v1.ts` |
| 2026-04-26 | Observability | Added orchestration run log table migration | backend | done | `training_generation_runs` + RLS + indexes |
| 2026-04-26 | Observability | Added run lifecycle helper methods | backend | done | create/update/success/error/fallback helpers |

## File-Level Change Checklist

Mark touched files as work progresses.

- [ ] `supabase/functions/orchestrate-training/index.ts` (new)
- [ ] `supabase/functions/generate-training/index.ts` (fallback integration only, non-breaking)
- [ ] `supabase/migrations/*` (new run-log table)
- [ ] `src/pages/Compliance.tsx` (new admin trigger)
- [ ] `src/components/training/GenerateTrainingDialog.tsx` (only if wiring reuse is needed)
- [ ] `src/pages/Training.tsx` (only if minimal routing/UX updates are needed)
- [ ] `src/integrations/supabase/types.ts` (generated types update)

## Verification Checklist

### Functional
- [ ] Can trigger orchestration for one regulation from `/knowledge/regulations`.
- [ ] Generated training appears in `/knowledge/training`.
- [ ] Quiz renders and can be completed in `QuizPlayer`.
- [ ] Assignment creation still works.

### Reliability
- [ ] AI error path writes failed run log.
- [ ] Invalid output path is rejected safely (no bad row write).
- [ ] Fallback path works when enabled.

### Non-Regression
- [ ] Legacy `generate-training` still generates modules.
- [ ] Existing manual module CRUD still works.
- [ ] Existing training assignment flows still work.

## Open Decisions / Notes
- [ ] Confirm policy selection strategy for v1 (manual selection vs deterministic auto-selection default).
- [ ] Confirm fallback default at launch (`enabled` recommended for first rollout).
- [ ] Confirm whether to store intermediate agent outputs (run log payload vs dedicated table).

## Artifacts Created
- [x] `docs/orchestration-output-schema-v1.md`
- [x] `docs/orchestration-output-schema-v1.json`
- [x] `supabase/functions/_shared/orchestration-contract-v1.ts`
- [x] `supabase/migrations/20260426103500_b5cce44a-8f86-45cf-bbf1-3edbc07e75ca.sql`
- [x] `supabase/functions/_shared/training-generation-runs.ts`
