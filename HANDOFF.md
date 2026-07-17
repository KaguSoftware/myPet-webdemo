# PetPal — Handoff

> Read this first when starting a fresh chat. Companion: `AGENTS.md` (the deep project context — architecture, design system, gotchas). This file is the quick "where are we" layer on top of it.

## Working style
- **Plan mode first** for non-trivial or direction-setting work; the owner (Parsa) approves before build.
- **Commit as Parsa only — no Co-Authored-By trailers.** Commit/push only when asked.
- Verify UI work by actually looking at it: run `npm run dev`, drive headless Chrome (`scratchpad cdp.js` pattern — login wall applies; ask the owner for a test account), screenshot at 390×844.
- Keep `AGENTS.md` **and this file** current in the same session as the change.

## What this is
PetPal: a phone-only web app (later to become a mobile app — the web version exists because it's faster to iterate on) for managing a family's pet care. Real product on a real Supabase backend (auth + RLS + Postgres); payments/booking are still faked. Design: clean native-iOS chrome (Inter, stroke icons, liquid glass) with the pixel-art language confined to the pets and their world (Duolingo model: illustrated character, native chrome). **No emoji anywhere in the UI — the owner hates them; everything renders through the `Icon` set or pixel sprites.**

## Stack & environment
Next.js 16.2 (App Router, TS strict, Tailwind v4), Supabase (`@supabase/ssr`), Vercel. Dev on Windows 11; headless Chrome available at `C:\Program Files\Google\Chrome\Application\chrome.exe`. Env needs `.env.local` (copy `.env.example`). **No secrets in this file.**

## Conventions
See `AGENTS.md` — notably: UI icons are clean stroke SVGs in `components/Icons.tsx` (never pixel, never emoji); pets are hand-authored pixel sprites (`components/pixel/`) and are the ONLY pixel surface; store logic (`lib/store.tsx`) is stable, don't touch it for UI work; forward-only SQL migrations; the `.font-pixel` / `@theme` CSS-var trap (font currently unused); phone-only layouts.

## Current status
- **2026-07-17 "health & scheduling + usability" pass — DONE on branch `feature/health-scheduling`, pushed.** The owner gave an open mandate (features + usability, HCI-minded); via questions he approved all four directions (health & records, smart scheduling, safety, light memories) plus a usability sweep. Two commits: Phase A (usability: zoom fix, empty-state CTAs, activity filter + paging, reminders agenda view, tappable /plan checklist + shared `FeedPortionSheet`, weight-history delete/backfill, retro logging + log Undo, invite link + `/join`, chip affordance) and Phase B (vaccinations w/ auto next-due reminders, vet-visit history + post-log details sheet, pet identity: editable sex / birth date / microchip / allergies, recurring reminders w/ date+time picker, emergency/profile pet card at `/pet/[id]/card`, 4 new stroke icons). Full detail in `AGENTS.md`.
- **⚠ BLOCKING: migrations `0013_health_records.sql` + `0014_reminders_v2.sql` are written but NOT applied.** The owner must run both in the Supabase dashboard (SQL editor, in order). Until then the store's legacy-select fallback keeps the app loading with health features inert (adding a vaccination/visit or a recurring reminder fails with a rollback toast). Do not merge to `main`/deploy before applying — and after applying, re-verify the health flows against the live schema.
- Verified 2026-07-17 (pre-migration, so in legacy mode): build + tsc + lint clean; logged-in headless-Chrome tour of every route at 390×844 incl. the new card/join pages, reminder-v2 sheet, retro-log sheet, weight history. Health-record WRITES not yet verified (need the SQL applied).
- The "real app" redesign is merged to `main` (PR #2); the earlier declutter pass was PR #1.

## File map (key files)
- `AGENTS.md` — the real documentation; read it fully.
- `lib/store.tsx` — Supabase-backed store, all actions. Toast signature: `toast(icon, title, body?, action?)`.
- `lib/data.ts` — types (+ `Vaccination`/`VetVisit`, repeat helpers) + static reference data (care plans, vets, cosmetics).
- `components/Icons.tsx` — the stroke icon set + `ACTION_ICON`; `components/FeedPortionSheet.tsx` — shared fed portion picker.
- `components/ui.tsx` — Group/Row/SectionHeader/AccentButton/Chip/… primitives.
- `components/Header.tsx` (tab pages) / `components/BackBar.tsx` (pushed pages — the ONLY top bar there).
- `app/*/page.tsx` — one file per screen (new: `app/join/page.tsx`, `app/pet/[id]/card/page.tsx`); `proxy.ts` — auth-wall middleware.
- `supabase/migrations/0013_health_records.sql` + `0014_reminders_v2.sql` — **pending application by the owner.**

## Roadmap / next steps
1. **← ACTIVE** Owner applies migrations 0013 + 0014 in the Supabase dashboard.
2. Re-verify health-record writes against the live schema (add vaccination → reminder appears; recurring check-off rolls due; identity fields persist), then open a PR from `feature/health-scheduling` to `main`.
3. Follow-ups parked: public (unauthenticated) lost-pet page + QR code; real pet photos (needs Supabase Storage); web push + installable PWA; store-level alert dedupe; drop the unused Geist Pixel font wiring.

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Payments/booking | Fake instant premium unlock, "booking requested" | Real billing + clinic integration | App conversion |
| Alert dedupe | UI-level dedupe by `petId|title` | Store/DB-level dedupe on write | Store pass |
| Reminders list | Raw list (can contain duplicate titles) | Grouped/merged view | If owner asks |
| Lost-pet mode | In-app emergency/ID card, share as text / print | Public flyer URL + QR (needs an unauthenticated route + RLS design) | Next safety pass |
| Memories | Milestones (birthday, gotcha day) + profile card | Real photo gallery/avatar (needs Supabase Storage bucket + policies) | Photos pass |
| Med adherence | "Last given" line derived from activities | Per-med dose schedule, refill/expiry tracking | If owner asks |
| Notifications | In-app simulated toasts + bell badge only | Web push + service worker/PWA | Push pass |

## Gotchas / open issues
All in `AGENTS.md` (font trap, headless-Chrome notes, Tailwind canonical-class rules, migration rules). Plus: the app requires a login — ask the owner for test credentials; never store them in the repo.

## Running it
```
npm install
npm run dev          # http://localhost:3000 (needs .env.local)
npm run build && npx tsc --noEmit && npm run lint   # must all be clean
```
