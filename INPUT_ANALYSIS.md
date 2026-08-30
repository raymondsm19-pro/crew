# INPUT ANALYSIS — Builtwell Crew

**Loop-engineering artifact.** This is the intake document: a durable, evidence-based map of the system as it exists today. Later loops (contract, roadmap, maker/verifier, STATE) should read this file instead of rediscovering the repo.

- **Repo:** `raymondsm19-pro/crew` (`https://github.com/raymondsm19-pro/crew.git`)
- **Local path:** `/Users/apple/Desktop/Crew/crew`
- **Branch:** `main` @ `1ce9825`, tracking `origin/main`
- **Analyzed:** 2026-08-30
- **Amended:** 2026-08-30 (same day) — an Android-first distribution decision landed and several §14 unknowns were resolved by the same operator session that did the backend migration and PIN setup this document treats as history. See §2 and §14 for what changed.
- **Grade for this artifact:** L-DRAFT (local markdown only; no production writes, no deploys, no merges)
- **Evidence base:** full read of schema, 12 Edge Functions, both apps, shared contracts, README, rollout docket, git history, local `.env` files, and uncommitted diffs. No live backend probes were run. The amendment below is first-hand: the amending session performed the backend cutover, PIN setup, and Android build it describes.

---

## 1. What this product is

Builtwell Crew is a **field labor operations product** extracted from a larger construction-office app (`chrome-board-sync` / Builtwell Tracker). It is now a standalone monorepo with its own Supabase project.

Two surfaces, one backend:

| Surface | Who | Job |
|---|---|---|
| `apps/crew-mobile` | Field workers | Sign in with phone + password. Clock in/out with GPS. Meal breaks. Daily safety checklist. Hazard/injury reports with photos. Questions, material/tool asks, progress photos. English/Spanish. |
| `apps/admin-web` | Office staff | PIN-gated dashboard: who is on site, today's punches, 7-day hours, safety flags, incident/request inbox, worker CRUD, project CRUD. |

The product's governing product rule, repeated in comments and code, is **"never block a punch."** Missing GPS, incomplete safety checks, and weak network must not prevent a worker from clocking in or out. Safety gaps are flagged to the office rather than rejected.

Payroll day is **America/Los_Angeles**, not UTC. That is hardcoded in `supabase/functions/_shared/dates.ts`.

---

## 2. Current world state (facts, not hopes)

### Git

Three commits on `main`:

| SHA | Date | Message |
|---|---|---|
| `6860dea` | 2026-08-12 | Standalone Crew + Crew Admin monorepo |
| `21bc71e` | 2026-08-12 | Document live Supabase deployment status and setup steps |
| `1ce9825` | 2026-08-24 | Add EAS build config and English/Spanish toggle to crew-mobile |

Uncommitted local work (not on origin):

- `apps/crew-mobile/app.json` — adds Android `package: "com.builtwellcrew.app"`
- `apps/crew-mobile/eas.json` — preview profile can emit an Android APK
- untracked `crew-rollout-docket.md` (handoff written 2026-08-22)
- untracked `.claude/` local settings

No `.github/` workflows. No test files. No `AGENTS.md`, `CLAUDE.md`, or loop state files besides this document.

### Backend vs documentation mismatch (must resolve before any loop that talks to live data)

| Source | Supabase project ref |
|---|---|
| `README.md` | `jzvifmixdydmhnbkarwo` (claimed live, 12 functions deployed) |
| Local `apps/admin-web/.env` | `rmfwrxltrnjnirtudenn` |
| Local `apps/crew-mobile/.env` | `rmfwrxltrnjnirtudenn` |
| `crew-rollout-docket.md` | A new dedicated project was provisioned after discovering the README backend was shared with live Builtwell Tracker data |

The local apps and the README do **not** point at the same project. Any later loop that "deploys," "seeds," or "verifies against production" must confirm which ref is canonical before touching it. Do not assume README is truth.

> **Resolved 2026-08-30 (amendment):** `rmfwrxltrnjnirtudenn` is canonical — confirmed first-hand by the session that provisioned it. `jzvifmixdydmhnbkarwo` (the README's project) was found to be a **shared backend** also serving an unrelated, already-live product ("Builtwell Tracker": real WhatsApp/attendance/profile data plus 3 Edge Functions with no source in this repo). A dedicated project was created rather than reused. `README.md`'s Supabase status section is stale — it still names the old ref and has not been corrected in this pass (correcting it is a small follow-up, not done here).

### Runtime status (from README + docket, unverified this session)

- Edge Functions and schema: claimed deployed and happy-path verified (sign-in → clock-in → safety → break → incident+photo → request → clock-out; admin reflects it).
- `apps/admin-web`: not permanently deployed. Local only (`vite` on port 3100), previously exposed via rotating ngrok.
- `apps/crew-mobile`: Expo SDK 54, EAS project `@saksham2302s-team/builtwell-crew` (`cc619b44-9774-4e0f-b5c1-63ef01c9148f`). iOS Simulator build succeeded; not on a physical iPhone. App Store / TestFlight blocked by missing Apple Developer Program account and missing Xcode on this Mac — see the distribution-pivot note below.
- `CREW_ADMIN_PIN` is still a placeholder (`123456` per docket) — confirmed directly, not just "per docket": the amending session is the one that set it via `supabase secrets set` on the new project. Never rotated. Rotate before real use.
- Test project + test worker still seeded. Replace before go-live.
- **Distribution pivot (2026-08-30 amendment):** the client decided against an App Store release for now — workers should install via a **direct APK download link**, no Play Store, no App Store, nothing to install first. This is Android-only by nature: iOS has no unsigned-install path at all, so the iOS work above (D1/D2) is on hold, not abandoned. `app.json` now declares `android.package: "com.builtwellcrew.app"` and `eas.json`'s `preview` profile now sets `android.buildType: "apk"` (both changes are uncommitted, consistent with §2's git section above). An EAS Android build was run and succeeded, producing an install link — **installation on a physical Android device has not yet been confirmed**, so this is a build success, not a verified go-live.
- Both apps were also tested this session by a second party ("Raymond," a stakeholder with admin access to the client's Supabase account) over temporary ngrok tunnels — one for Expo Go, one for the admin dashboard. Those tunnels only live as long as the dev servers stay open on the operator's machine and are almost certainly down now; they are not a durable testing setup (see D6, S-equivalent gap in §10).

---

## 3. Repository map

Bun workspace monorepo. ~3,400 lines of first-party TS/TSX/SQL/CSS across 61 source files. Small enough that a loop should prefer reading source over guessing.

```
crew/
├── apps/
│   ├── crew-mobile/          Expo 54 + expo-router + React Native 0.81 / React 19.1
│   └── admin-web/            TanStack Start + Vite 8 + Tailwind 4 + React ^19.2
├── packages/shared/          Types, API contracts, SAFETY/INCIDENT/REQUEST constants
├── supabase/
│   ├── migrations/           3 SQL migrations
│   └── functions/            12 Edge Functions + _shared/
├── README.md
├── crew-rollout-docket.md    untracked handoff (2026-08-22)
└── INPUT_ANALYSIS.md         this file
```

### Commands that actually exist

| Intent | Command | Notes |
|---|---|---|
| Install | `bun install` at repo root | Workspaces: `apps/*`, `packages/*` |
| Admin dev | `bun run dev:admin` | http://localhost:3100, `allowedHosts: true` |
| Mobile dev | `bun run dev:mobile` | Expo. Device must use LAN IP, not localhost |
| Local DB | `bun run db:start` / `db:reset` | Ports 56321–56324 (offset to avoid another local stack named "Saave") |
| Functions | `bun run functions:serve` | Needs `supabase/.env.local`. JWT verification is off in production deploys |
| Admin build | `bun --cwd apps/admin-web run build` | Generic `dist/server/server.js`. Cloudflare preset **not** wired |
| Typecheck | none at root | Mobile was type-checked ad hoc in prior sessions |
| Test / lint / CI | **none** | |

### Tooling constraints later loops must honor

- Package manager is **bun**, not npm/pnpm.
- Edge Functions are **Deno**. They cannot import `@crew/shared`. Constants and types are **hand-synced**.
- Mobile env vars must be `EXPO_PUBLIC_*`. They are inlined into the client bundle. No secrets there.
- Admin env var is `VITE_EDGE_FUNCTIONS_URL`.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are platform-injected. Do not set them in client `.env`.
- Functions are deployed with `--no-verify-jwt` because auth is custom (bearer session / PIN), not Supabase Auth JWTs.
- `packages/shared` is the **client** source of truth. `supabase/functions/_shared/constants.ts` is a copy of `SAFETY_ITEMS` only. Incident/request kind lists live only in shared (the function accepts a free string).

---

## 4. Architecture

```
┌─────────────────────┐     HTTPS POST/GET      ┌──────────────────────────┐
│  crew-mobile        │  Bearer <uuid token>    │  Supabase Edge Functions │
│  Expo / RN          │ ──────────────────────► │  12 Deno functions       │
└─────────────────────┘                         │  service_role client     │
                                                │         │                │
┌─────────────────────┐     HTTPS POST/GET      │         ▼                │
│  admin-web          │  PIN in JSON body or    │  Postgres (RLS on,       │
│  TanStack Start     │  x-admin-pin header     │   zero client policies)  │
└─────────────────────┘ ──────────────────────► │  Storage: field-receipts │
                                                └──────────────────────────┘
```

**All business logic lives in Edge Functions.** Neither app has a Supabase client. Neither app talks to Postgres. This is an intentional extraction from the source app's TanStack Start `useServerFn` / cookie session model.

Clients share shapes via `@crew/shared`. Functions keep their own copies of a few constants and assemble JSON that happens to match those shapes. There is no generated OpenAPI, no Zod, no runtime contract test.

### Why this shape exists

The source app used httpOnly cookies (`useSession`) and a `boards.ts` project list, and mirrored punches/safety/incidents to Google Sheets plus a wall-board "crew on site" marker. Those were dropped:

- Sessions → `crew_sessions` table + `Authorization: Bearer`
- Projects → `projects` table, office-managed
- Sheets / wall-board sync → deleted

Comments in the functions still name the dropped behaviors. Do not reintroduce them unless a later contract says so.

---

## 5. Data model

Seven tables, all RLS-enabled, **no anon/authenticated policies**. Only `service_role` (Edge Functions) can read/write. This is the security boundary.

### `crew_workers`

| Column | Notes |
|---|---|
| `id` uuid PK | |
| `name` text | |
| `phone` text UNIQUE | Normalized to last 10 digits |
| `role` text | Trade label, default `''` |
| `password_hash` text | `pbkdf2$100000$<salt>$<hash>` SHA-256 |
| `active` bool | Inactive workers fail `requireWorker` with a generic 401 |

### `crew_sessions`

| Column | Notes |
|---|---|
| `token` uuid PK | Returned at sign-in, stored in Expo SecureStore |
| `worker_id` | ON DELETE CASCADE |
| `expires_at` | 30 days from sign-in |
| `last_seen_at` | Best-effort update; must not block a punch |

No cleanup job for expired rows. Sign-out **deletes** the row (not just client-side discard) so a leaked token cannot be replayed.

### `projects`

`id` uuid, `name` unique, `active` bool. Replaces the source app's hardcoded board list.

### `crew_shifts`

The timesheet row.

- `project_id` is **text**, not a FK to `projects.id` (uuid stored as text).
- `project_name` is denormalized at clock-in. Renaming a project does not rewrite history. That is a payroll snapshot, not a bug, unless a later spec says otherwise.
- Open shift = `clock_out_at IS NULL`. Partial unique is **not** enforced in SQL; one-open-shift is enforced in `crew-clock-in`.
- GPS columns on both in and out: `lat`, `lng`, `accuracy`. All nullable. GPS is best-effort.
- `worked_minutes` is null until clock-out. `break_minutes` accumulates as breaks end.

### `crew_breaks`

Tied to a shift. `kind` defaults to `'meal'`. UI only supports one open break. Clock-out server-side auto-closes any open break so hours are not overstated.

### `crew_safety_checks`

Inserted on **every** clock-in, not once per day.

- `answers` jsonb of the five `SAFETY_ITEMS` keys (`ppe`, `area`, `ladders`, `tools`, `fit`).
- `flagged = true` if any item is unchecked.
- Incomplete checklists still clock the worker in (by design).
- `crewStatusFor.safetyDone` is "any row for this worker today," but clock-in always inserts another row. Multiple clock-ins in one Pacific day produce multiple safety rows. Admin lists all of them.

### `crew_incidents`

**One table for two product concepts.** Hazard/injury reports **and** office requests (question, materials, tool, progress photos, other) both go through `crew-report-incident`. Discriminator is `kind` (free string, English wire value).

- `urgent` bool
- `status` text default `'Open'` — written, displayed, **never updated** by any function
- `photo_urls` text[] — 1-year signed Storage URLs, not durable paths
- up to 4 files: image/*, video/*, or application/pdf
- Storage path: `crew-safety/<projectId>/<timestamp>_<safeName>` even for non-safety requests

### Storage

Bucket `field-receipts`, **private**. No public URLs. Signed URL TTL = 365 days. After expiry, rows still hold dead URLs. There is no refresh path.

Local `config.toml` file size limit: 50MiB. Uploads travel as JSON base64, so a large video is a large function payload.

---

## 6. API surface (the real contract)

Twelve functions. Uniform wrapper: `serveJson` handles OPTIONS/CORS, JSON, and maps `HttpError` → `{ error }` with that status. **Any other thrown Error becomes HTTP 400**, not 500.

CORS defaults to `*`. `CORS_ALLOWED_ORIGINS` can tighten it. Wildcard is considered acceptable today because auth is a bearer header, not a cookie. Tighten once admin-web has a real origin.

### Worker functions (Bearer token except sign-in)

| Function | Auth | Input | Success |
|---|---|---|---|
| `crew-signin` | none | `{ phone, password }` | `{ token, expiresAt, status }` |
| `crew-signout` | optional bearer | `{}` | `{ ok: true }` always |
| `crew-status` | worker | GET | `CrewStatus` |
| `crew-clock-in` | worker | `{ projectId, safety, safetyNote?, lat?, lng?, accuracy? }` | `CrewStatus` |
| `crew-start-break` | worker | `{}` | `CrewStatus` |
| `crew-end-break` | worker | `{}` | `CrewStatus` |
| `crew-clock-out` | worker | `{ note?, lat?, lng?, accuracy? }` | `CrewStatus` |
| `crew-report-incident` | worker | `{ projectId, kind, description, urgent?, files? }` | `{ ok: true }` |

`CrewStatus` is the mobile app's entire session model: worker, active projects, open shift, open break, today's shifts, live minutes, `safetyDone`.

Mutators (except report-incident) end by returning a fresh `crewStatusFor(worker)`. Report-incident does **not** — the mobile incident mutation does not refresh status, which is fine because status does not include incidents.

### Admin functions (shared PIN secret `CREW_ADMIN_PIN`)

| Function | PIN transport | Input | Success |
|---|---|---|---|
| `admin-board` | JSON `pin` | `{ pin }` | `AdminBoard` |
| `admin-save-worker` | JSON `pin` | worker fields | `AdminBoard` |
| `admin-list-projects` | header `x-admin-pin` **or** query `pin` | none | `Project[]` |
| `admin-save-project` | JSON `pin` | `{ pin, id?, name, active? }` | `Project[]` |

There is **no admin session**. The PIN sits in React state after unlock and is resent on every call. Comparison is `!==` (not constant-time).

Worker create rules: name required, phone must normalize to 10 digits, password min length **4**. Duplicate phone → 409. Update can change name/role/active; phone only if the new value is 10 digits; password only if provided.

### Domain constants (`packages/shared/src/constants.ts`)

Safety keys: `ppe`, `area`, `ladders`, `tools`, `fit`.

Incident wire values (English, even when the UI is Spanish): `Hazard`, `Near miss`, `Injury`, `Property damage`.

Request wire values: `Question`, `Materials needed`, `Tool / equipment request`, `Progress photos`, `Other request`.

Spanish is a **display-only** layer. The office dashboard is English and keys off the English `kind` string.

---

## 7. Auth and session model

### Workers

1. Phone normalized to last 10 digits.
2. PBKDF2-SHA256, 100k iterations, 16-byte random salt, constant-time compare on the hash.
3. Inactive or bad password → same 401 copy: "That phone number and password don't match."
4. Session UUID, 30-day expiry.
5. `requireWorker`: missing/expired/inactive → 401 "Sign in again to continue."
6. Mobile stores token in `expo-secure-store`. Client also refuses expired tokens locally.
7. Any 401 from `call()` clears the token.

**Client footgun:** `useCrewStatus` catches **all** errors and treats them as signed-out. A network failure, 500, or misconfigured `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` shows the Sign In screen, not an error. That is how testers can report "I got logged out" when the backend is unreachable.

### Office

Single shared PIN in an Edge Function secret. Anyone with the PIN can read every worker's hours, GPS, incidents (including photos via signed URL), reset passwords, and deactivate workers. There are no per-user admin accounts, audit logs, or role split (payroll vs safety vs superintendent).

---

## 8. Client behavior that loops must not break

### Mobile (`apps/crew-mobile`)

Single route (`app/index.tsx`). Layout provides React Query + `LanguageProvider`.

State machine on the home screen:

```
no status          → SignIn
status, no shift   → ClockInCard (project + safety + optional note + GPS)
status, open shift → on-clock card (break toggle, optional note, clock-out)
always when signed in → hazard button, sign out, Today's shifts list
tab "requests"     → RequestsTab (same endpoint as incidents, different kinds)
```

Hard UI rules:

- Clock-out button is **disabled while on break**. Copy: "End your break before clocking out." The **server** would auto-close the break. Client is stricter than server. Do not "fix" this without a product decision.
- GPS via `readCoords()`: permission denied or timeout returns `{}`. Punches still go through.
- Safety: clock-in is enabled as long as a project is selected. Unchecked items only show a hint. Server flags them.
- Incident modal does **not** require a description on the client; the server does. Requests tab **does** require a trimmed description.
- i18n: device locale default, persisted in AsyncStorage key `crew.language`. `LanguageProvider` returns `null` until storage loads → brief blank screen.
- Photos: camera or library, max 4, quality 0.7, encoded to base64 with the SDK 54 `File` API (`expo-file-system`).
- Status poll: `refetchInterval: 60_000`.
- Bundle id / Android package: `com.builtwellcrew.app`. Scheme: `builtwellcrew`. Display name: Builtwell Crew.

React Query key: `["crew-status"]`. Mutations write the returned status into that cache. Mirror this if you add new mutators.

### Admin (`apps/admin-web`)

`/` redirects to `/admin`. One page.

- Locked: PIN form.
- Unlocked: on-site list, today's punches, last 7 days, today's safety, 7-day incidents/requests, worker manager, project manager, OSM map modal, incident detail dialog.
- **No auto-refresh.** Office must reload / re-unlock to see new urgent items. Docket flags this as the root cause of a "urgent action missing" tester report.
- PIN remains in component state for subsequent mutations. Refreshing the tab locks the dashboard again.
- Map: keyless OpenStreetMap embed + Google Maps outbound link. Shown only when lat/lng are numbers.
- Incident dialog: image / video / generic file by URL extension. Relies on the signed URL still being valid.
- Worker password reset uses `window.prompt`.
- No logout control other than refreshing.

SSR is registered (`routeTree.gen.ts` `ssr: true`) but the page is a client PIN gate. Cloudflare deploy is **not** configured; `vite.config.ts` documents that `tanstackStart()` in this version has no `target`/`preset` option.

---

## 9. Invariants (the things a loop must preserve)

Treat these as the product's unwritten tests. A change that violates one is a regression even if TypeScript is clean.

1. **A worker has at most one open shift.** Clock-in of a second open shift → 409.
2. **A shift has at most one open break.** Start-break of a second → 409. Start-break with no open shift → 409.
3. **Clock-out of a non-open shift → 409.** End-break with no open break → 409.
4. **GPS must never be required** for clock-in, clock-out, or anything else.
5. **Incomplete safety must never block clock-in.** It must flag.
6. **Pacific calendar date** is the payroll `work_date`, including safety-done and "today" on the admin board.
7. **Project names on historical punches are snapshots.** Do not rewrite them on rename.
8. **Incident `kind` wire values stay English.** Translate only in the mobile UI.
9. **Requests and incidents share `crew_incidents` + `crew-report-incident`.** Splitting them is a product change, not a cleanup.
10. **Clients never hold the service role key.** All writes go through functions.
11. **Sign-out deletes the server session.**
12. **Inactive workers cannot use an otherwise-valid token.**
13. **Photos are private.** Never make `field-receipts` public.
14. **Admin PIN is a secret, not a user account.** Do not log it. Do not put it in client source.
15. **Functions deploy with `--no-verify-jwt`.** Turning JWT verification on without also adopting Supabase Auth will lock both apps out.

---

## 10. Known defects, gaps, and traps

Severity is for later loop triage. None of these were "fixed" in this analysis pass.

### Correctness / product

| ID | Issue | Where |
|---|---|---|
| C1 | Weekly hours ignore open shifts (`worked_minutes ?? 0`) and only count a day if the worker has clocked out. A crew still on site at 4pm looks like they worked 0 hours this week. | `_shared/admin-board.ts` |
| C2 | On-site minutes do **not** subtract a live open break. `crewStatusFor` does. Admin overstates hours for anyone currently on break. | `_shared/admin-board.ts` vs `_shared/crew-status.ts` |
| C3 | Clock-in always inserts a new safety row. Multiple punches in a day → multiple sign-offs on the admin list. | `crew-clock-in` |
| C4 | Incident `status` is display-only. Office cannot mark resolved / in-progress. | schema + `CrewAdmin.tsx` |
| C5 | File upload failure is swallowed; the incident is saved with fewer/no photos and the worker sees success. | `crew-report-incident` |
| C6 | Signed photo URLs die after 1 year with no refresh. Historical incidents go blind. | `createSignedUrl(..., 365d)` stored on the row |
| C7 | Admin "Crew inputs & hazards" mixes injuries with "need more screws" because both are `crew_incidents`. | shared table |
| C8 | Client clock-out is blocked on break; server would close the break. Two sources of truth. | `CrewHome.tsx` vs `crew-clock-out` |
| C9 | `useCrewStatus` maps every error to signed-out. | `apps/crew-mobile/src/api/hooks.ts` |
| C10 | Incident modal can send an empty description; server 400s. Requests tab already validates. | `IncidentModal.tsx` |

### Security / ops

| ID | Issue | Where |
|---|---|---|
| S1 | Shared admin PIN, placeholder value, non-constant-time compare, resent in JSON on every call. | `auth.ts`, admin client |
| S2 | CORS `*`. Fine while there is no cookie auth; must tighten at first public admin origin. | `_shared/cors.ts` |
| S3 | Password minimum is 4 characters. No lockout / rate limit on `crew-signin`. | `admin-save-worker`, `crew-signin` |
| S4 | `Database` type is `any`. Schema drift will not fail typecheck. | `_shared/db-types.ts` |
| S5 | README project ref ≠ local `.env` project ref. High chance of writing to the wrong backend. | README vs `.env` |
| S6 | `handler.ts` reports unexpected failures as 400, hiding 500s from operators. | `_shared/handler.ts` |
| S7 | No session-expiry sweeper. `crew_sessions` grows forever. | schema |
| S8 | Three Edge Functions existed on the old shared project with no source here: `send-push-notification`, `create-employee`, `export-report`. Need a human decision on whether Crew wants them. | docket |

### Distribution / go-live (from docket, still true in this tree)

| ID | Issue |
|---|---|
| D1 | Blocker **for iOS**, not for the current rollout: no Apple Developer Program account. No device install, TestFlight, or App Store. *(Downgraded 2026-08-30: client chose Android-first direct-APK distribution, so this no longer blocks v1.)* |
| D2 | Blocker **for iOS**, not for the current rollout: no Xcode on this Mac. Simulator artifacts cannot be opened here. *(Same downgrade as D1.)* |
| D3 | `ITSAppUsesNonExemptEncryption` missing from `app.json`. App Store Connect will demand it. Still relevant whenever iOS App Store work resumes. |
| D4 | App icon and splash are Expo defaults. |
| D5 | No App Store Connect listing (screenshots, privacy nutrition, support URL). Not needed while distribution is direct-APK only. |
| D6 | Admin not deployed to a stable URL. Testers depend on a machine that stays awake. Confirmed again 2026-08-30: this session's ngrok tunnel for admin-web is already gone once the operator's dev server stops. |
| D7 | **Updated 2026-08-30:** no longer "never launched." An Android APK preview build was produced via EAS this session (`app.json`/`eas.json` changes, still uncommitted) and the build itself succeeded. What's still open: installation and the golden-path walkthrough have not yet been confirmed on a physical Android device. |
| D8 | No automated tests, no CI, no lint/typecheck scripts. |
| D9 | Happy path only. Untested: no GPS, offline, large video, expired session, concurrent punches, timezone boundary (Pacific midnight), and now also the Android APK install path itself (D7). |

### Engineering hygiene

- `SAFETY_ITEMS` duplicated across `packages/shared` and `supabase/functions/_shared`.
- React versions diverge: mobile pins `19.1.0`, admin-web `^19.2.0`.
- `project_id` on shifts/safety/incidents is text, not a FK.
- Base64 JSON uploads will not survive large videos on a jobsite LTE connection.
- No offline queue. A punch attempted in a basement is a failed punch.
- No push notifications in this repo (the old project's `send-push-notification` was not ported).
- Admin dashboard English-only. Worker app is bilingual. Office staff who are Spanish-primary are unserved.

---

## 11. What is actually strong

Do not "clean up" these without cause.

- **Clear module boundary.** UI has no SQL. Functions have no React. Shared package is small and honest.
- **Extraction was deliberate.** Sheets, wall-board, Lovable vite wrapper, cookie sessions, and board-only CSS tokens were dropped on purpose. Comments say so.
- **Auth for workers is real:** PBKDF2, constant-time compare, server-side session delete, SecureStore, RLS that denies the world.
- **"Never block a punch" is implemented,** not just written: GPS and safety are advisory.
- **Pacific work-date** is centralized in one helper.
- **i18n is consistent:** English wire values, Spanish UI, typed keys, `{{var}}` interpolation.
- **Conflict codes are used correctly:** 409 for illegal time-clock state, 401 for auth, 400 for validation.
- **Happy-path product is complete enough to test:** sign-in, clock, break, safety, incident+photo, request, admin visibility, worker/project CRUD.
- Repo is small. A loop that greps instead of reading will miss comments that encode product law.

---

## 12. Verification surface (what a loop can actually check)

There is almost no machine-checkable "done" today. That is the main loop-engineering gap.

| Check | Exists? | How |
|---|---|---|
| Unit tests | No | — |
| Integration tests against functions | No | — |
| Playwright / Maestro / Detox | No | — |
| `tsc` script | No | Can still run ad hoc: mobile `tsc --noEmit`, admin `tsc --noEmit` |
| Lint | No | — |
| CI | No | — |
| Type-level API contract between apps and functions | Partial | Shared types on clients only; functions are hand-shaped |
| Generated DB types | No | `db-types.ts` is `any` |
| Deploy verification | Manual | Prior session walked the happy path in Expo Go + admin |

**Until tests exist, every code-changing loop is L-DRAFT at best** and needs a human to click the worker path and reload admin.

The cheapest first verifier, if a later loop is allowed to add one:

1. `tsc --noEmit` in both apps.
2. A Deno/HTTP script hitting local `supabase functions serve` for: sign-in fail, sign-in ok, double clock-in → 409, break without shift → 409, clock-out closes break, safety flagged when items omitted, incident without description → 400.
3. Do **not** point that script at whichever live project is currently in `.env` until S5 (project-ref mismatch) is resolved.

---

## 13. Loop-engineering read of this repo

This analysis is the **Discovery / intake** step. The repo is a good loop candidate for some work and a bad one for others.

### 3 hard gates (should this work become a loop?)

| Gate | Verdict |
|---|---|
| Repeatable? | **Yes** for the remaining go-live list (docket items, the defects above, bilingual copy, admin refresh). The same classes of work will recur: function change → both clients → typecheck → human path test. |
| Checkable? | **Weak today.** Almost nothing is machine-verifiable. A loop that ships code without first adding a verifier will self-approve. |
| Survivable if wrong? | **No for production data / App Store / PIN / the live Supabase project.** Wrong-backend writes (S5) and PIN rotation are L-ACT with a human gate. Local TypeScript/docs/tests are L-DRAFT. |

### Recommended grading for follow-on work

| Work | Grade | Human gate? |
|---|---|---|
| Keep this analysis current; write `AGENTS.md` / `contract.md` / `roadmap.md` | L-DRAFT | No |
| Add `tsc` scripts + a local function smoke test | L-DRAFT | No, but do not target live Supabase |
| Admin auto-refresh / refresh button | L-DRAFT locally, L-ACT if deployed | Visual check |
| Fix C1/C2 week/on-site minutes | L-DRAFT + human payroll sanity check | Yes — hours are money |
| Split incidents vs requests | L-ACT (schema) | Yes — product decision first |
| Rotate admin PIN | L-ACT | Yes |
| Confirm which Supabase ref is canonical | L-READ then human | Yes |
| Seed real workers/projects | L-ACT | Yes |
| EAS device build / TestFlight / App Store | L-ACT | Yes — Apple account, icons, privacy |
| Deploy admin-web | L-ACT | Yes — origin, CORS allow-list, PIN |

### Candidate loops (do not start until a contract names one)

1. **Repo-hardening loop (safest first loop).** Add root scripts (`typecheck`), generate real `Database` types from the linked project *after* S5 is resolved, add a local happy-path + 409 smoke test. Stop when `bun run typecheck` and the smoke script pass on a local stack.
2. **Office-visibility loop.** Admin refresh (button or 30s poll) + distinguish urgent hazards from materials requests in the same list. Stop when a new incident appears without a full page reload and urgent rows stay visually distinct.
3. **Time-clock honesty loop.** Align admin on-site minutes with `crewStatusFor` (subtract live break); include open-shift minutes in the week rollup *or* label them "in progress." Stop when a worker on break is not overstated, and a still-clocked-in worker is not zeroed on the week card.
4. **Go-live gate loop (report-only, L-READ).** Re-read Apple / EAS / PIN / backend-ref / seed data and emit a single launch checklist. Must not change production.

### What must not be looped yet

- Anything that writes to a live Supabase project until the README vs `.env` ref is confirmed.
- App Store submission.
- Schema splits (incidents vs requests) without a human product call.
- Reintroducing Google Sheets, wall-board, or Supabase Auth "because that's more standard."

### State files later loops should create (not created in this pass)

Per the loop-engineering method, keep memory on disk:

| File | Role |
|---|---|
| `INPUT_ANALYSIS.md` | This file. Refresh when architecture changes, not every PR. |
| `AGENTS.md` | How to build, run, and not-break this repo (invariants from §9). |
| `contract.md` | The one current task: scope, done criteria, checks, restart signals. |
| `roadmap.md` | Small checkable tasks drawn from §10 and the docket. |
| `progress.md` | Append-only log of loop runs. |
| `verification.md` | The actual commands a verifier must run. |

---

## 14. Unknowns (do not invent answers)

A later loop that needs one of these must ask a human.

1. ~~Which Supabase project is the real one: `jzvifmixdydmhnbkarwo` or `rmfwrxltrnjnirtudenn`?~~ **Resolved 2026-08-30:** `rmfwrxltrnjnirtudenn`, confirmed first-hand by the session that created it. See §2.
2. Who owns that project long-term (client org vs contractor)? *(Still open — it was created under the client's Supabase org during this session, but no one has confirmed who administers it going forward.)*
3. ~~Is the admin PIN still `123456`, and who is allowed to rotate it?~~ **Partially resolved 2026-08-30:** yes, still `123456`, confirmed first-hand. Who is *allowed* to rotate it is still open.
4. Does Crew need push notifications, CSV/PDF export, or a "create employee" path beyond `admin-save-worker`?
5. Should incomplete safety **block** clock-in for some trades, or stay advisory forever?
6. Should the office be able to close/ack incidents? Who is on-call for `urgent`?
7. ~~Android in v1, or iOS-only until the Apple account exists?~~ **Resolved 2026-08-30:** Android in v1 — the client chose direct-APK distribution over the App Store, making Android the near-term priority. iOS App Store work is deferred, not cancelled.
8. Production admin host (Cloudflare / other) and the final origin for CORS.
9. Timezone: is every Builtwell jobsite Pacific, or will Texas/Arizona break payroll dates?
10. Are requests supposed to be a separate inbox, or is "one stream of stuff from the field" the intended UX?
11. Data retention / photo retention policy. 1-year signed URLs will silently expire.
12. **Partially answered 2026-08-30:** this session's testers were the requesting user and a second stakeholder ("Raymond") via temporary ngrok tunnels for both apps. Those tunnels are not durable and are almost certainly down already — whether tunnels are still required going forward, or a permanent host is warranted, is still open.

---

## 15. Suggested first human decision (not a loop)

Before any agent is allowed to edit production-shaped things, a person should answer:

> **S5 + S1:** Which backend is canonical, and is the admin PIN still a placeholder?

**Answered 2026-08-30 (amendment):** canonical backend is `rmfwrxltrnjnirtudenn`; the PIN is still the placeholder `123456`. Both confirmed first-hand — see §2 and §14. The *decision* question is closed. The *action* it implies — rotating the PIN before real use, and correcting `README.md`'s stale project ref — is still outstanding and belongs on a roadmap, not in this document.

Everything else in this file can inform a contract. Those two can destroy live data or leak a door.

---

## 16. How a later agent should use this file

1. Read this file and `README.md`. Do not re-audit every function unless the task touches it.
2. Treat §9 invariants as the regression bar.
3. Treat §10 IDs (`C1`, `S5`, `D1`, …) as stable handles in contracts and PRs.
4. If you change architecture, auth, schema, or the punch state machine, update **this file in the same change**.
5. If you only change copy, styling, or a single screen, do not rewrite this file.
6. Never "helpfully" add Supabase client code to an app, JWT verification to functions, or a public storage bucket.

---

*Builtwell Crew — input analysis for loop engineering. Compiled 2026-08-30 from the tree at `main@1ce9825` plus local uncommitted mobile config and the untracked rollout docket.*
