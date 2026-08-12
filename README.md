# Crew Monorepo

Standalone extraction of the "Crew" (worker clock-in/timesheet/safety/incident
app) and "Crew Admin" (office dashboard) features that originally lived inside
`chrome-board-sync`. This repo and its Supabase project are fully independent
— no shared code or data with the source app at runtime.

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

## First-time setup

1. `bun install` at the repo root (installs all workspaces).
2. Create a new Supabase project. Set `supabase/config.toml`'s project ref via
   `supabase link --project-ref <ref>` (after `supabase init` if needed).
3. Apply migrations: `supabase db push` (remote) or `supabase start && supabase db reset` (local).
4. Create the `field-receipts` storage bucket if the migration's
   `INSERT INTO storage.buckets` didn't take (some Supabase CLI/API versions
   restrict that from SQL) — Studio → Storage → New bucket, name
   `field-receipts`, private.
5. Set Edge Function secrets: `supabase secrets set CREW_ADMIN_PIN=<your PIN>`.
   `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are auto-injected — do not set manually.
6. Deploy functions: `supabase functions deploy` (or `--no-verify-jwt` per
   function if you don't want Supabase's platform JWT check in front of them —
   these functions do their own auth via bearer token / PIN, not Supabase Auth).
7. Copy `.env.example` → `.env` in both `apps/admin-web` and `apps/crew-mobile`,
   pointing `VITE_EDGE_FUNCTIONS_URL` / `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` at
   `https://<project-ref>.supabase.co/functions/v1`.
8. Seed at least one project (`insert into public.projects (name) values (...)`)
   and one worker via `apps/admin-web`'s Crew Admin once it's running (or seed
   a worker directly via SQL with a `pbkdf2$...` password hash).

## Local development

```bash
bun run db:start          # supabase start
bun run functions:serve   # supabase functions serve --env-file supabase/.env.local
bun run dev:admin         # apps/admin-web on http://localhost:3100
bun run dev:mobile        # apps/crew-mobile via Expo — use your machine's LAN IP,
                           # not localhost, in EXPO_PUBLIC_EDGE_FUNCTIONS_URL when
                           # testing on a physical device via Expo Go.
```

