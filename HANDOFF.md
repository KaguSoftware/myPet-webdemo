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
- **2026-07-17 "real app" redesign — DONE, verified, uncommitted in the working tree.** The owner's gut complaint ("doesn't feel like a real app") was diagnosed as two visual languages fighting: the pixel-arcade skin had bled into the chrome (pixel page titles, 8px pixel tab labels, pixel icons in Settings, emoji as toast severity). The fix, per the owner's direction: **pixel stays on the pets only; everything structural is clean native iOS; gamification stays but quieter.** Concretely: `Icons.tsx` rewritten as a 42-icon stroke set (24-grid, Lucide/SF register); toast API is now `toast(icon: IconName, …)` with tone derived from the icon; ALL emoji removed from the UI (auth brand mark = pixel cat via `BrandMark.tsx`); Header/TabBar/auth/Welcome/MissingEnv/InitialAvatar/weight chart de-pixeled; streak flame moved Home header → Settings ▸ Account row; CoinPill only in shop sheets; off-brand hue-258 shadows/gradients corrected to accent 285. Full detail in `AGENTS.md` ▸ Design direction.
- Verified 2026-07-17: `npm run build` + `tsc --noEmit` + `lint` clean; logged-in screenshot pass over every route at 390×844 (headless Chrome CDP), including an icon-gallery render check.
- The earlier "aggressive declutter" pass is **merged to `main`** (PR #1).

## File map (key files)
- `AGENTS.md` — the real documentation; read it fully.
- `lib/store.tsx` — Supabase-backed store, all actions. Stable (toast signature is `toast(icon: IconName, title, body?)`).
- `lib/data.ts` — types + static reference data (care plans, vets, cosmetics).
- `components/Icons.tsx` — the stroke icon set + `ACTION_ICON`; `components/BrandMark.tsx` — auth brand lockup.
- `components/ui.tsx` — Group/Row/SectionHeader/AccentButton/Chip/… primitives.
- `components/Header.tsx` (tab pages) / `components/BackBar.tsx` (pushed pages — the ONLY top bar there).
- `app/*/page.tsx` — one file per screen; `proxy.ts` — auth-wall middleware.

## Roadmap / next steps
1. **← ACTIVE** Owner reviews the redesign in the browser; then commit (as Parsa) and push on request.
2. Possible follow-ups: dedupe alert *data* at the store level (UI currently dedupes at render); `pet.sex` still not editable post-creation (known gap in `AGENTS.md`); the Geist Pixel font is now unused — drop `app/fonts/GeistPixel.ttf` + its `next/font/local` wiring if no pet-world use appears.

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
