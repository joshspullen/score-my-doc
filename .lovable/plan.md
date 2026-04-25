# KYC & Regulatory Doc Scoring — MVP Plan

A clean, fintech-style web app where users upload KYC or council/regulatory documents and instantly get an AI-generated compliance score with actionable feedback. Accounts let users track all past uploads.

## Core User Flow

1. Land on a clean marketing-style homepage explaining what the tool does.
2. Sign up / log in (email + password, plus Google).
3. Land on a dashboard listing past documents and scores.
4. Upload a document (PDF, DOCX, or image — KYC form, ID, council regulation doc, etc.).
5. AI analyzes the doc and returns:
   - **Overall compliance score** (0–100) with a colored gauge.
   - **Sub-scores** for: Completeness, Clarity, Regulatory Alignment, Risk Flags.
   - **Plain-English summary** of what the document is.
   - **Issues found** (missing fields, ambiguous clauses, expired dates, etc.).
   - **Recommendations** to improve the score.
6. Result is saved to history; user can revisit, re-download, or delete.

## Pages

- **`/` Landing** — hero with value prop, "How it works" 3-step section, sample score visualization, CTA to sign up. Footer.
- **`/auth`** — combined sign-in / sign-up with email/password and Google.
- **`/dashboard`** — list of past uploads (filename, date, score chip, status), prominent "Upload new document" button, empty state for new users.
- **`/upload`** — drag-and-drop zone, file picker, progress state during analysis, redirects to result on completion.
- **`/results/:id`** — full analysis view: score gauge, sub-scores, summary, issues list, recommendations, download original doc, delete button.

## Visual Style (Clean Fintech)

- White background, generous whitespace, subtle gray borders.
- Primary blue accent (`hsl(217 91% 60%)` family) for CTAs and score highlights.
- Score color scale: red (<50), amber (50–75), green (>75).
- Inter font, rounded-lg cards with soft shadows.
- All colors as semantic tokens in `index.css`; no hardcoded colors in components.

## Data Model (Lovable Cloud)

- `profiles` — `id` (FK to auth.users), `display_name`, `created_at`. Auto-created via trigger on signup.
- `user_roles` — separate roles table (`user`, `admin`) with `has_role()` security definer function.
- `documents` — `id`, `user_id`, `filename`, `storage_path`, `mime_type`, `file_size`, `status` (processing/complete/failed), `created_at`.
- `analyses` — `id`, `document_id`, `overall_score`, `sub_scores` (jsonb), `summary`, `issues` (jsonb), `recommendations` (jsonb), `created_at`.
- **Storage bucket** `documents` (private), per-user folder structure, RLS so users only access their own files.
- RLS on every table: users can only read/write their own rows.

## AI Analysis

- Edge function `analyze-document`:
  1. Receives `document_id`, fetches signed URL from storage.
  2. For PDFs/images: extracts text (pdf-parse or sends image directly to a vision model).
  3. Calls Lovable AI Gateway (`google/gemini-2.5-pro` for accuracy on regulatory text) with a structured tool-call schema returning `{ overall_score, sub_scores, summary, issues[], recommendations[] }`.
  4. Inserts into `analyses` table, updates document status.
- System prompt tuned for KYC and council/regulatory doc evaluation: completeness of required fields, clarity of language, regulatory alignment (mentions of GDPR, AML, KYC standards, council bylaws), red flags (missing signatures, expired dates, vague terms).
- Handle 429/402 errors and surface friendly toasts to the user.

## Out of Scope for MVP

- Case studies / showcase pages.
- Payment / subscription tiers.
- Multi-doc batch upload.
- Team / org accounts.
- Admin dashboard (roles table is set up so this can be added later).

## Technical Notes

- Lovable Cloud for auth, database, storage, edge functions.
- Lovable AI Gateway for analysis (no separate API key needed).
- File size cap: 20 MB. Allowed: PDF, DOCX, PNG, JPG.
- Zod validation on all edge function inputs.
- Toaster for success / error feedback.
