# Orchestration Output Contract v1

This file is the canonical contract for the first orchestration release.

- Scope: quiz-first training generation for `/knowledge/training`
- Compatibility target: existing `training_modules` storage + existing `QuizPlayer` renderer
- Version tag: `training_orchestration_v1`

## Purpose

The orchestration pipeline must emit strict, machine-validated JSON before any DB write.
If the payload fails validation, the run is marked failed (or falls back to legacy generation if enabled).

## Top-Level JSON Shape

```json
{
  "schema_version": "training_orchestration_v1",
  "title": "string",
  "description": "string",
  "duration_minutes": 15,
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_index": 1,
      "explanation": "string"
    }
  ]
}
```

## Field Rules

- `schema_version`
  - Required
  - Must be exactly `"training_orchestration_v1"`
- `title`
  - Required, non-empty string
  - Recommended max length: 140 chars
- `description`
  - Required, non-empty string
  - Concise summary only (2-6 sentences)
- `duration_minutes`
  - Required integer
  - Allowed range: `5..90`
- `quiz`
  - Required array
  - Allowed size: `4..8`
  - Every question object requires:
    - `question` (non-empty string)
    - `options` (array of exactly 4 non-empty strings)
    - `correct_index` (integer `0..3`)
    - `explanation` (non-empty string)

## Persistence Mapping

Valid output maps into existing `training_modules` fields:

- `title` -> `training_modules.title`
- `description` -> `training_modules.description`
- `duration_minutes` -> `training_modules.duration_minutes`
- `quiz` -> `training_modules.quiz`

Non-contract fields like `compliance_requirement_id`, `business_process_id`, and `team_id` are provided by request context, not by this generated payload.

## Failure Policy

- Reject payload on any schema violation.
- Never insert partial/invalid `training_modules` rows.
- Return structured validation errors for run logs.

## Prompt Versioning Convention

All orchestration prompts must carry explicit tags in code:

- `POLICY_MAPPER_PROMPT_VERSION = "v1"`
- `SANCTION_ANALYST_PROMPT_VERSION = "v1"`
- `RELEVANCE_MAPPER_PROMPT_VERSION = "v1"`
- `TRAINING_SCENARIO_PROMPT_VERSION = "v1"`

The run log should record these versions to make output reproducible and auditable.
