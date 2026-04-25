## What we're building

A **People hub** that groups everything human-centric (Users, Teams, Training, Compliance, Business Processes), and a redesigned **Connectors** module with a Notion-like card/table experience. Compliance requirements link to business processes and to training modules, then get assigned to roles, teams or specific users.

## Information architecture

```text
Sidebar
├─ Workspace      → Dashboard · New analysis · My Profile
├─ People (hub)   → /people
│   ├─ Users          (admin)
│   ├─ Teams          (manager+)
│   ├─ Training       (everyone — own assignments; admin manages catalog)
│   ├─ Compliance     (everyone view; admin manages)
│   └─ Business Processes (everyone view; admin manages + CSV import)
└─ Integrations   → Connectors  (admin)
```

`/people` is a landing hub with one card per sub-page (clean MECE entry point). Each sub-page is a real route — easier to deep-link, cleaner than a single mega-tabs page.

## Data model (already migrated)

- **business_processes** — code, name, category, owner, description
- **compliance_requirements** — reference_code, title, regulator, requirement_type, severity, description, business_process_id
- **training_modules** — title, description, content_url, duration_minutes, compliance_requirement_id
- **compliance_assignments** — requirement → target (role | team | user)
- **training_assignments** — module → user, status (assigned/in_progress/completed), due_at, completed_at
- **connectors.connector_type** — new column (api / scraping / file / other)

RLS: catalogs visible to all authenticated, mutations admin-only. Users see/update own training; managers see their team's; admins manage all.

## Pages to build

1. **People.tsx** — hub landing with role-aware tile grid. *(done)*
2. **BusinessProcesses.tsx** — table view, create/edit/delete + CSV import + template download. *(done)*
3. **Compliance.tsx** — requirement cards with reference code, severity badge, linked process, assignment chips (role/team/user) and training count. Admin dialog to assign targets. *(done)*
4. **Training.tsx** — two views:
   - **My training** — user's assignments with progress controls (mark in-progress / completed).
   - **Catalog** (admin) — manage modules, link to a compliance requirement, bulk-assign to all users matching the requirement's compliance_assignments (role/team/user expansion).
5. **Connectors.tsx (revamp)** — Notion-style:
   - Toggle between **Cards** and **Table** views.
   - Group/filter by `connector_type` (API · Scraping · File · Other) and category.
   - Each connector opens a side dialog with **type-aware base config**: endpoint URL, auth (none / API key secret name), schedule, plus the existing sync/records actions. Type drives which fields show.

## Sidebar / routing

- Replace flat People/Teams/Connectors items with a single **People** group containing the sub-routes above.
- Keep `/admin`, `/teams`, `/connectors` working (alias to new paths) so existing links don't break.
- New routes: `/people`, `/people/training`, `/people/compliance`, `/people/processes`. Users/Teams/Connectors keep existing URLs and are surfaced under the People group too.

## Technical notes

- All new tables already have RLS + triggers. Types regenerate automatically.
- CSV import is client-side parse → bulk insert (admin only by RLS).
- Training auto-assign: when admin clicks "Assign to targets" on a module, we resolve the linked requirement's `compliance_assignments` into a deduped user set (role → all users with that role; team → team_members; user → direct), then upsert `training_assignments`.
- Connector dialog reads/writes a JSON `config` blob — no schema migration needed beyond the `connector_type` column already added.
- Design tokens only (no hardcoded colors); reuse existing card/table/dialog primitives.

## Out of scope (ask if you want)

- Email notifications on assignment / due dates
- Training quiz/scoring engine (only status tracking for now)
- Per-connector custom field schemas (chose "type + base config")

Ready to finish Training, the Connectors revamp, and wire up the sidebar/routes once you approve.