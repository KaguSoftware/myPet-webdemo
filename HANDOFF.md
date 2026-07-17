# PetPal — Handoff

> Read this first when starting a fresh chat. Companion: `AGENTS.md` (the deep project context — architecture, design system, gotchas). This file is the quick "where are we" layer on top of it.

## Working style
- **Plan mode first** for non-trivial or direction-setting work; the owner (Parsa) approves before build.
- **Commit as Parsa only — no Co-Authored-By trailers.** Commit/push only when asked.
- Verify UI work by actually looking at it: run `npm run dev`, drive headless Chrome (`scratchpad cdp.js` pattern — login wall applies; ask the owner for a test account), screenshot at 390×844.
- Keep `AGENTS.md` **and this file** current in the same session as the change.

## What this is
PetPal: a phone-only web app (later to become a mobile app — the web version exists because it's faster to iterate on) for managing a family's pet care. Real product on a real Supabase backend (auth + RLS + Postgres); payments/booking are still faked. Design: iOS "liquid glass" bones + 90s pixel-art skin (~60-70% fun dial).

## Stack & environment
Next.js 16.2 (App Router, TS strict, Tailwind v4), Supabase (`@supabase/ssr`), Vercel. Dev on Windows 11; headless Chrome available at `C:\Program Files\Google\Chrome\Application\chrome.exe`. Env needs `.env.local` (copy `.env.example`). **No secrets in this file.**

## Conventions
See `AGENTS.md` — notably: all icons are pixel grids in `components/Icons.tsx`; pets are hand-authored pixel sprites (`components/pixel/`); store logic (`lib/store.tsx`) is stable, don't touch it for UI work; forward-only SQL migrations; the `.font-pixel` / `@theme` CSS-var trap; phone-only layouts.

## Current status
- **`ui-declutter` branch (2026-07-17): aggressive UI declutter — DONE, verified, not yet merged/committed.** Every screen reworked around "one job per screen": persistent care-warning toast + Close-notifications pill removed; single top-bar pattern (BackBar with title/trailing on all pushed pages); Home = hero + one attention banner + next-up; alerts deduped (`petId|title`) and grouped per pet on `/activity`; Pets = dress-up only (Meds → pet detail); premium Today checklist → `/plan`; Reminders/Find-a-vet entry points → `/activity`; vets cards + Account page compressed. Full detail in `AGENTS.md` ("Jul-2026 aggressive declutter" bullet).
- Verified: `npm run build` + `tsc --noEmit` + `lint` clean; every route screenshotted at 390×844 before/after.
- `main` is the pre-declutter state.

## File map (key files)
- `AGENTS.md` — the real documentation; read it fully.
- `lib/store.tsx` — Supabase-backed store, all actions. Stable.
- `lib/data.ts` — types + static reference data (care plans, vets, cosmetics).
- `components/ui.tsx` — Group/Row/SectionHeader/AccentButton/Chip/… primitives.
- `components/Header.tsx` (tab pages) / `components/BackBar.tsx` (pushed pages — the ONLY top bar there).
- `app/*/page.tsx` — one file per screen; `proxy.ts` — auth-wall middleware.

## Roadmap / next steps
1. **← ACTIVE** Owner reviews the `ui-declutter` branch in the browser; then commit (as Parsa) and merge/push on request.
2. Possible follow-ups: dedupe alert *data* at the store level (UI currently dedupes at render); `pet.sex` still not editable post-creation (known gap in `AGENTS.md`).

## Deliberately partial — grows later (scope ledger)
| Area | What shipped now | Intended full shape | Grows in |
|---|---|---|---|
| Payments/booking | Fake instant premium unlock, "booking requested" | Real billing + clinic integration | App conversion |
| Alert dedupe | UI-level dedupe by `petId|title` | Store/DB-level dedupe on write | Store pass |
| Reminders list | Raw list (can contain duplicate titles) | Grouped/merged view | If owner asks |

## Gotchas / open issues
All in `AGENTS.md` (font trap, headless-Chrome notes, Tailwind canonical-class rules, migration rules). Plus: the app requires a login — ask the owner for test credentials; never store them in the repo.

## Running it
```
npm install
npm run dev          # http://localhost:3000 (needs .env.local)
npm run build && npx tsc --noEmit && npm run lint   # must all be clean
```
