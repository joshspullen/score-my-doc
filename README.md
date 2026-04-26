# MERIDIAN

**The RegTech intelligence layer for fintechs.**

MERIDIAN ingests live regulator feeds, maps every new rule, sanction or
enforcement to your internal policies, and ties it to a verifiable audit
trail of every automated decision your platform makes.

- **Regulatory Radar** — live ingest from regulators (EBA, OFAC, ACPR…)
- **Policy Impact Mapping** — AI-mapped to your business processes & docs
- **Auditable Decisions** — every agent step traced, scored and exportable
- **AI Training** — generate learning material & quizzes from regulations

Built for fintech CTOs and Heads of Risk.

---

## Tech stack

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, Framer Motion
- **Routing / data**: React Router 6, TanStack Query, React Hook Form + Zod
- **Backend (Lovable Cloud)**: PostgreSQL 15 with Row-Level Security, PostgREST,
  Edge Functions (Deno), Realtime, Object Storage
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Pro/Flash, OpenAI GPT-5 family)
- **Auth**: Email/password + Google OAuth, role-based access via a dedicated
  `user_roles` table
- **Tooling**: ESLint, Vitest, Testing Library, SWC

---

## Prerequisites

You need one of the following package managers installed:

- [**Bun**](https://bun.sh) `>= 1.0` (recommended — used in CI)
- or **Node.js** `>= 18.18` with `npm` / `pnpm` / `yarn`

No local database is required: the project connects to **Lovable Cloud**
(managed Postgres + Edge Functions) using the credentials in `.env`.

---

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install dependencies

With Bun (recommended):

```bash
bun install
```

Or with npm:

```bash
npm install
```

### 3. Configure environment variables

The `.env` file is **auto-generated and managed by Lovable Cloud**. When you
open the project in Lovable it is populated automatically. For local
development outside Lovable, create a `.env` at the project root with:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

These keys are **publishable** (safe for the client). Server-side secrets
(such as `LOVABLE_API_KEY` for the AI Gateway) are stored in Lovable Cloud
and consumed by edge functions — never commit them.

### 4. Run the dev server

```bash
bun run dev
# or
npm run dev
```

The app will be available at **http://localhost:8080**.

---

## Available scripts

| Script              | Description                                      |
| ------------------- | ------------------------------------------------ |
| `dev`               | Start the Vite dev server with HMR on port 8080  |
| `build`             | Production build                                 |
| `build:dev`         | Build in development mode (sourcemaps, no minify)|
| `preview`           | Preview the production build locally             |
| `lint`              | Run ESLint across the project                    |
| `test`              | Run the Vitest test suite once                   |
| `test:watch`        | Run Vitest in watch mode                         |

Run with `bun run <script>` or `npm run <script>`.

---

## Project structure

```
src/
├── assets/                 Static images and the Meridian logo
├── components/
│   ├── dashboard/          Dashboard widgets (RegulatoryRadar, AdminDashboard…)
│   ├── marketing/          Public marketing site (header, footer, hero…)
│   ├── telemetry/          Decision intelligence UI
│   ├── training/           AI-generated training & quizzes
│   └── ui/                 shadcn/ui primitives
├── hooks/                  useAuth, useRoles, use-toast…
├── integrations/
│   └── supabase/           Auto-generated Cloud client + types (do not edit)
├── lib/                    Utilities and the product tour
├── pages/                  Route components
│   ├── marketing/          Public pages (Team, Pricing, Brand, TechStack…)
│   └── telemetry/          Decisions, Outcomes, TraceExplorer
└── test/                   Vitest setup and example tests

supabase/
├── functions/              Edge functions (analyze-document, agent-run,
│                           connector-sync, generate-training, radar-impact…)
└── migrations/             SQL migrations (schema + RLS policies)
```

---

## Backend (Lovable Cloud)

The backend is a managed Postgres + Edge Functions stack. Key principles:

- **Row-Level Security on every table.** Roles live in a dedicated
  `user_roles` table — never on the user/profile row — and are checked
  server-side via a `has_role()` security-definer function.
- **Edge functions are auto-deployed** when you push code in Lovable. No
  manual `supabase functions deploy` step is required.
- **AI calls go through the Lovable AI Gateway** using `LOVABLE_API_KEY`,
  so no per-provider key management is needed.

---

## Testing

Tests use **Vitest** + **Testing Library** with a `jsdom` environment.

```bash
bun run test           # one-shot
bun run test:watch     # watch mode
```

---

## Deployment

Open the project in [Lovable](https://lovable.dev) and click **Publish**.
You can also self-host: build the app with `bun run build` and serve the
`dist/` directory from any static host (Vercel, Netlify, Cloudflare Pages,
S3 + CloudFront…). The backend remains on Lovable Cloud.

---

## License

Proprietary — © MERIDIAN. All rights reserved.