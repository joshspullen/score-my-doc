## Goal

Tighten navigation so admin tooling lives where admins expect it (Settings), People only shows people-related items, and the guided tour matches the new 5-group sidebar.

## Changes

### 1. Sidebar — People cleanup
File: `src/components/AppSidebar.tsx`
- Remove **Users** (admin) from the People group.
- Keep People sub-items: **Overview**, **People Ops**, **Teams** (admins/managers only).
- Remove **Connectors** from the Connections group (moves to Settings).
- Remove the standalone **Agents** group route from sidebar visibility for non-admins (already the case); keep Automation → Agents only for admins.

### 2. New Settings area (admin-only)
- New page `src/pages/Settings.tsx` with tabs:
  - **Users & Roles** — embed existing Admin user-management UI.
  - **Connectors** — link/embed connectors page.
  - **Workspace** — placeholder for org name/branding (basic stub).
- Add route `/settings` (AdminRoute) in `src/App.tsx`.
- Refactor `src/pages/Admin.tsx` content into a reusable `AdminUsersPanel` component used inside Settings (keep `/admin` as redirect to `/settings?tab=users` for backward compatibility).

### 3. UserMenu — surface Settings properly
File: `src/components/UserMenu.tsx`
- "Profile" → `/profile`.
- "Settings" → `/settings` (visible only to admins via `useRoles`); for non-admins hide the entry.
- Keep "Resources & Guide" and "Sign out".

### 4. AppHeader — remove duplicates
File: `src/components/AppHeader.tsx`
- Remove top-bar buttons: **Profile**, **Teams**, **Admin**, **Connectors** (all reachable from sidebar/UserMenu).
- Keep: logo, **Dashboard**, **New analysis** CTA, UserMenu (sign-out moves into UserMenu only — already there).

### 5. People page tiles
File: `src/pages/People.tsx`
- Remove the **Users** tile (it now lives in Settings).
- Keep **Teams** and **People Ops**; add a small note linking admins to Settings → Users for role management.

### 6. Guided tour rewrite
File: `src/lib/productTour.ts`
- Reduce noise; align to new 5 groups + Workspace. Steps:
  1. Sidebar intro (5 groups, bottom-up flow).
  2. **Connections** — where data comes in.
  3. **Knowledge** — regulations, documentation, training.
  4. **People** — teams and ops.
  5. **Decision Intelligence** — decision log & outcomes.
  6. **Automation** — agents (admins only; skip if not admin).
  7. **New analysis** CTA.
  8. UserMenu (Profile, Settings if admin, re-launch tour).
- Auto-expand the relevant sidebar group before each step by clicking the group trigger (or navigating to a child route which auto-expands via existing effect).
- Skip admin-only steps for non-admin users.

## Technical notes

- `Settings.tsx` uses shadcn `Tabs` with URL query param (`?tab=users|connectors|workspace`) for deep-linking and tour targeting.
- `Admin.tsx` becomes a thin wrapper that renders `<Navigate to="/settings?tab=users" />` to avoid breaking existing links.
- Add `data-tour="nav-connections"`, `nav-people`, `nav-decisions`, `nav-automation` attributes on the group triggers in `AppSidebar.tsx` so the tour can target them reliably.
- No DB or RLS changes required.

## Out of scope

- Visual redesign of pages.
- New permissions model — role checks remain (`isAdmin`, `isManager`).
