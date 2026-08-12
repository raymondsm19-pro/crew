# Crew Monorepo

Standalone extraction of the "Crew" (worker clock-in/timesheet/safety/incident
app) and "Crew Admin" (office dashboard) features that originally lived inside
`chrome-board-sync`. This repo and its Supabase project are fully independent
— no shared code or data with the source app at runtime.

## Status

- **Supabase backend**: live. Project ref `jzvifmixdydmhnbkarwo`. All 3
  migrations applied, `field-receipts` bucket created (private), all 12 Edge
  Functions deployed and verified end-to-end (worker sign-in/clock-in/breaks/
  incident-report/clock-out, admin PIN gate, worker + project CRUD).
- `CREW_ADMIN_PIN` is currently set to a **placeholder** value — change it
  before real use: `supabase secrets set CREW_ADMIN_PIN=<new value>`.
- **`apps/admin-web`**: not deployed yet. Runs locally against the live
  backend once `.env` is set (see below).
- **`apps/crew-mobile`**: not run on a device yet — only verified that it
  type-checks and Metro-bundles cleanly. Next step is `expo start` + Expo Go.

## Structure

- `apps/crew-mobile` — Expo (React Native) app for workers: sign in, clock
  in/out, breaks, daily safety checklist, hazard/incident reports, photo &
  question requests.
- `apps/admin-web` — TanStack Start web dashboard for office staff: PIN-gated
  view of who's on the clock, today's punches, weekly hours, safety sign-offs,
  incidents, worker management, and project management.
- `packages/shared` — types/constants shared by both apps' UI code.
- `supabase/` — migrations (schema) and Edge Functions (the backend both apps
  call over HTTPS — the sole implementation of all business logic).

## Connecting the apps to the live backend

```bash
# apps/admin-web/.env
VITE_EDGE_FUNCTIONS_URL=https://jzvifmixdydmhnbkarwo.supabase.co/functions/v1

# apps/crew-mobile/.env
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://jzvifmixdydmhnbkarwo.supabase.co/functions/v1
```

Then `bun run dev:admin` or `bun run dev:mobile`.

## Setting up a Supabase project from scratch (for reference / a fresh clone)

1. `bun install` at the repo root (installs all workspaces).
2. Create a new Supabase project. Link it: `supabase link --project-ref <ref>`.
3. Apply migrations: `supabase db push` (remote) or `supabase start && supabase db reset` (local).
4. Confirm the `field-receipts` storage bucket exists (the migration creates
   it via `INSERT INTO storage.buckets`, which worked on this project — if a
   future Supabase CLI/API version blocks that, create it manually: Studio →
   Storage → New bucket, name `field-receipts`, private).
5. Set Edge Function secrets: `supabase secrets set CREW_ADMIN_PIN=<your PIN>`.
   `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are auto-injected — do not set manually.
6. Deploy functions: `supabase functions deploy --no-verify-jwt` — the
   `--no-verify-jwt` flag is required since these functions do their own auth
   via bearer token / PIN, not Supabase Auth's JWTs.
7. Copy `.env.example` → `.env` in both `apps/admin-web` and `apps/crew-mobile`,
   pointing `VITE_EDGE_FUNCTIONS_URL` / `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` at
   `https://<project-ref>.supabase.co/functions/v1`.
8. Seed at least one project and one worker via `apps/admin-web`'s Crew Admin
   once it's running.

## Local development (against a local Supabase stack instead of the live one)

```bash
bun run db:start          # supabase start
bun run functions:serve   # supabase functions serve --env-file supabase/.env.local --no-verify-jwt
bun run dev:admin         # apps/admin-web on http://localhost:3100
bun run dev:mobile        # apps/crew-mobile via Expo — use your machine's LAN IP,
                           # not localhost, in EXPO_PUBLIC_EDGE_FUNCTIONS_URL when
                           # testing on a physical device via Expo Go.
```

If another local Supabase project is already running on this machine, edit
the ports in `supabase/config.toml` to avoid conflicts before `supabase start`.
