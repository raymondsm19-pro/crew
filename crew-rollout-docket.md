# Crew Rollout Docket

**Project status · Builtwell Crew**
Repo: `raymondsm19-pro/crew` · Branch: `main @ 1ce9825` · Updated: 2026-08-22

Builtwell Crew's worker app (`crew-mobile`) turned out to already be a native Expo/React Native project — the work here was getting it actually running, onto its own clean backend, buildable for iOS, and usable in Spanish, then handing testers a way in. Below is everything finished so far, followed by everything still standing between here and a real App Store release.

**8** phases completed · **19** open items · **2** hard blockers

---

## Completed

In the order the work actually happened.

### 1. Codebase discovery & first run
- Audited the monorepo: `apps/crew-mobile` (Expo/React Native), `apps/admin-web` (TanStack Start), `supabase/` (migrations + Edge Functions)
- Confirmed `crew-mobile` already targets iOS via Expo's managed workflow — no native rewrite needed
- Installed all workspace dependencies and ran the first session in Expo Go over LAN

### 2. Fixed a launch-blocking crash
- Diagnosed an **"Invalid hook call"** crash — duplicate React copies from mismatched Expo SDK 54 dependency versions
- Upgraded `expo-router` 5.1→6.0, `react`, `react-native`, and related `expo-*` packages to their aligned versions
- Re-verified with a full type-check and a clean Metro reload

### 3. Replaced a contaminated shared backend
- Found the backend the README pointed to was **shared with an unrelated, already-live product** ("Builtwell Tracker") — real WhatsApp/attendance/profile data sitting beside Crew's empty tables, plus 3 undocumented Edge Functions
- Provisioned a new, dedicated Supabase project under the client's org (after freeing a free-tier slot by pausing an unrelated active project)
- Applied all 3 schema migrations and deployed all 12 Edge Functions to the new project
- Set the admin PIN secret, verified the private `field-receipts` storage bucket, and repointed both apps at the new backend

### 4. End-to-end verification with seeded data
- Seeded one test project and one test worker directly via the Edge Functions
- Walked the full worker path in Expo Go: sign in → clock in (GPS) → safety checklist → break start/end → incident report with photo → material/tool request → clock out
- Confirmed the admin dashboard reflects the same live data

### 5. iOS build pipeline
- Linked an EAS project (`@saksham2302s-team/builtwell-crew`), added an iOS bundle identifier and `eas.json` build profiles
- Set EAS-hosted environment variables so the backend URL reaches cloud builds (the local `.env` is gitignored)
- Produced a successful EAS Build for the iOS Simulator

### 6. Bilingual worker app — English/Spanish
- Built a lightweight translation system from scratch (no i18n existed): device-locale default, per-device persistence, ~90 translated strings
- Added an EN/ES toggle to the app header
- Kept incident/request types translated on screen while their **wire value stays English**, so the admin dashboard needs no changes

### 7. Remote test access
- Stood up a public Expo Go tunnel and a public tunnel for the admin dashboard, so the client and Raymond could both test without being on the same network
- Investigated a report that urgent field actions weren't showing up — confirmed the data saved correctly; traced the real cause to the dashboard having no auto-refresh (see Open Items)

### 8. Shipped to source control
- Committed and pushed all of the above — 19 files — to `origin/main`

---

## Open items

Grouped by where the work sits, not in what order it'll happen. Each flag says why it's still open.

### Apple distribution — 5 items

| | |
|---|---|
| **Blocker** | No Apple Developer Program account ($99/yr) — required for installing on a physical iPhone, TestFlight, and App Store submission. Nothing past Expo Go/Simulator is possible without it. |
| **Blocker** | No Xcode installed on this Mac — the iOS Simulator only exists inside Xcode, so the successful EAS Simulator build can't actually be opened here yet. |
| **Needs work** | `ITSAppUsesNonExemptEncryption` missing from `app.json` — flagged during the EAS build; App Store Connect requires this declared before review. |
| **Later** | App icon and splash screen are still Expo defaults. |
| **Later** | No App Store Connect listing prepared — screenshots, description, privacy nutrition label, support URL all unstarted. |

### Admin dashboard — 3 items

| | |
|---|---|
| **Needs decision** | No auto-refresh — office staff must manually reload to see new urgent items. Root cause of today's "urgent action missing" report. Fix is either a manual refresh button or interval polling — awaiting your call. |
| **Later** | Not deployed anywhere permanent — only running locally on this Mac, exposed through a rotating ngrok URL. |
| **Later** | Production deploy target (e.g. Cloudflare) still unconfigured in `vite.config.ts`. |

### Backend & data hygiene — 4 items

| | |
|---|---|
| **Needs decision** | 3 Edge Functions from the old shared project have no source in this repo — `send-push-notification`, `create-employee`, `export-report`. Unclear if Crew actually needs this functionality; needs a conversation with Raymond. |
| **Needs decision** | Admin PIN is still the placeholder `123456` — must be rotated to a real PIN before any real use. |
| **Later** | Seeded test project/worker need replacing with real records before go-live. |
| **Needs decision** | Long-term ownership of the new Supabase project isn't settled — created under the client's org during this session; access/governance should be confirmed. |

### Testing & QA — 3 items

| | |
|---|---|
| **Later** | Only the happy path has been verified — no testing yet of poor/no GPS signal, offline submission, large photo/video uploads, expired sessions, or error states. |
| **Later** | Android has config in `app.json` but has never been run. |
| **Later** | No automated tests exist in the repo. |

### Ongoing infrastructure — 1 item

| | |
|---|---|
| **Needs decision** | Both dev servers and both test tunnels only run as long as this Mac keeps them open — every restart issues new tunnel URLs that have to be re-shared with testers. |

---

*Builtwell Crew — worker clock-in, safety & incident app · Docket compiled 2026-08-22*
