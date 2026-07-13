<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PetPal — project context for AI assistants

Read this before working on the project. It captures scope, decisions, and how to ship.

**Keep this file current.** As you make meaningful changes — new features, design-direction shifts, architectural moves, new gotchas, things you tested — update the relevant section here in the same working session so the next AI chat inherits an accurate picture. This file is the running memory of the project; stale context here is worse than none.

## What this is
**PetPal** is a **phone-only web demo** of a pet-manager app idea, built to send to people *before* a real native mobile app is built. The intent is that the UI is polished enough to later "convert to app code" with minimal changes. It is **not** the production app — it's a clickable, self-contained demo.

Tech: **Next.js 16.2+ (App Router, TypeScript, Tailwind v4), deployed on Vercel. No backend, no database.** All state is sample/seed data held in a React context and persisted to `localStorage`. Nothing talks to a server.

## Product concept
A family pet-care hub with two tiers:
- **Free tier**: family members log care actions (fed, water, litter, walk, groomed, meds, vet); everyone is "notified" (simulated in-app feed + toasts). Manual reminders included.
- **Premium ("PetPal+")**: vet-built, breed-specific care plans; smart reminders; sponsored vet-booking suggestions. In the demo, upgrading is a fake instant unlock from the Family tab — no payment. When premium is on, the Home dashboard also surfaces the day's care-plan checklist.
- **Gamification**: coins earned per logged action, XP/levels, streaks, and a cosmetics/dress-up system to put hats/glasses/collars/outfits on the pets.

## Design direction (important — this has iterated)
The look was deliberately tuned on a "fun scale." History: v1 = 100% fun (pastel/emoji/confetti, read as a cheap toy) → rebuilt to clean **iOS "Liquid Glass" native** = 0% fun (sterile) → warmed to ~40% → **current target ~60-70% fun via a 90s Mario-style pixel-art theme layered on the iOS bones.**

Current state (the "60-70% pixel" pass):
- **Retro skin on solid iOS bones**: keep the liquid-glass floating tab bar, scroll-collapsing large-title headers, glass toasts/sheets, grouped-list layout, warm indigo accent — the app stays credible and usable. The *fun* comes from pixel art + arcade motion on top, not from tearing out the structure.
- **All UI icons are pixel art** too (not just the pets). `components/Icons.tsx` was converted: every icon is a 9×9-ish grid of `"X"`/`"."` strings rendered as crispEdges `<rect>` blocks in `currentColor`. The `Icon` component keeps its old public API (`name`, `size`, plus now-ignored `strokeWidth`/`filled` for call-site compatibility), so all existing call sites got pixel icons for free. To add/edit an icon, edit its grid in the `G` map (rows must stay equal-length). The tab bar labels also use the pixel font. If you add a new icon anywhere, author it as a pixel grid — do NOT reintroduce smooth stroke SVG icons; the whole set must stay one pixel style.
- **Pixel-art pets**: pets render as hand-authored pixel sprites, NOT the old SVG faces. Engine is `components/pixel/` — `PixelSprite.tsx` (renders a sprite from string-rows + a char→color palette as `<rect>` blocks, run-length merged, `shape-rendering: crispEdges`), `petSprites.ts` (16×16 cat/dog), `cosmeticSprites.ts` (all 14 accessories as pixel sprites with per-slot placement fractions), `hudSprites.ts` (coin/heart/star glyphs), and `PixelPet.tsx` which composes the pet + layers equipped cosmetics on top (also exports `PixelCosmetic` for shop previews). `PetAvatar.tsx` now wraps `PixelPet` (keeps the gradient circle as a backdrop; same `size` API + new `idle` prop). **`components/PetFace.tsx` is now unused** (left in tree; safe to delete).
- **Pixel cosmetics**: accessories are pixel sprites (not emoji) on the pet, the head `+` button, and the shop grid. `data.ts` still stores `emoji` per cosmetic as a fallback (`PixelCosmetic` falls back to emoji if a sprite id is missing).
- **Pixel font**: **Geist Pixel**, self-hosted at `app/fonts/GeistPixel.ttf` via `next/font/local` (NOT next/font/google — Geist Pixel exists on Google Fonts now but is NOT in *this* pinned Next version's `next/font/google` font-data list, so importing it there errors at build). The shipped TTF is Geist Pixel's variable font instanced at `ELSH=0` (the crisp blocky look; higher ELSH dissolves the pixels) — see below. Exposed as `--font-pixel` / `.font-pixel`. Used at readable screen-title sizes and SMALL for HUD (coin/XP counters, tab labels, `+5` coin-pop, "3D" toggle). Body/labels stay Inter; don't set long text in pixel.
  - **Gotcha that bit us repeatedly — how `.font-pixel` wires up:** `next/font/local` injects `--font-pixel` as a class on `<body>`, so that var only exists in `<body>`'s cascade, NOT on `:root`. Do **not** build a font stack inside Tailwind's `@theme` (e.g. `--font-pixel-stack: var(--font-pixel), …`) — `@theme` emits at `:root`, where `--font-pixel` is undefined, so the whole `var()` collapses to empty and the pixel font silently never applies (elements fall back to Tailwind's `font-sans`). The `.font-pixel` rule in `globals.css` must reference `var(--font-pixel), "Courier New", monospace` **directly** so it inherits from `<body>`. If a previous session's TTF ever rendered as a plain serif/sans, suspect either (a) this `:root` var trap, or (b) a bad/mislabeled TTF — verify by rendering the file in isolation.
  - **Re-fetching the font**: the genuine variable font is `ofl/geistpixel/GeistPixel[ELSH].ttf` in the google/fonts GitHub repo (~3.6MB). Instance it to a small static TTF with `fontTools.varLib.instancer.instantiateVariableFont(font, {'ELSH': 0})`. Google's `css2` static export renders as a non-pixel serif-ish default — don't use it.
- **Arcade motion is now ON** (previously excluded): `idle` sprite wobble on hero/dress-up pets, `+5` coin-pop on logging a care action, level-up flourish keyframes. Keyframes live in `globals.css` (`idle`, `coin-pop`, `levelup`); all respect `prefers-reduced-motion`. The Pets stage has an `.arcade-stage` retro-grid backdrop.
- Copy still stays professional (no jokey microcopy) unless the user asks.

To author a new sprite: add rows (equal-length strings) + palette to the relevant `*Sprites.ts` file; transparent = `.` or space. Cosmetics need a `place` (left/top/widthFrac as fractions of the 16px pet box). Keep pets on a 16×16 grid so cosmetic placement stays aligned.

If asked to change the "fun level" again, it's a dial on: pixel-vs-smooth art, pixel-font usage, arcade-motion amount, color warmth, geometry — not a rewrite.

## Architecture / where things live
- `lib/data.ts` — types + seed data (family, pets, cosmetics, care plans). Pets carry `weights: {ts,kg}[]` + `supplies: {id,name,icon,level}[]`. `VETS` is a list (marketplace) with `sponsored` flags; `VET` = `VETS[0]` for dashboard cards. Helpers: `WEIGHT_TARGETS` (breed ranges), `formatWeight(kg, units)`. Presentational additive fields are fine.
- `lib/store.tsx` — single source of truth: React context, all actions (logAction, buyCosmetic, toggleEquip, reminders CRUD, premium, member switch, `restockSupply`, `useSupply`, `bookVetById`, `setSeenWelcome`, `setUnits`, reset), `localStorage` persistence, and a timer firing simulated family events. State has `seenWelcome`, `units` ("kg"|"lb"), `bookedVetIds`. **Treat store logic as stable; UI changes shouldn't need to touch it.**
- `components/` — `PhoneShell` (bezel + scroll context + mounts `Welcome`), `TabBar`, `Header`, `Toasts`, `Sheet`, `PetAvatar` (+`InitialAvatar` pixel-styled member tiles; sizes xs/sm/md/lg/xl), `Paywall`, `Icons` (all pixel), `EmptyState`, `Welcome` (onboarding), and `ui.tsx` primitives (Group/Row/SectionHeader/AccentButton/Chip/Segmented/CoinPill/IconCircle/Chevron — reuse these).
  - `components/pixel/` — `PixelSprite`, `PixelPet` (+`PixelCosmetic`), `Pet3D` (CSS fake-3D drag, holds pose ~2.5s then springs back, respects reduced-motion), `PixelChart` (weight chart), `petSprites`/`cosmeticSprites`/`hudSprites`. **`components/PetFace.tsx` is dead** (pre-pixel; safe to delete).
- `app/` routes: `/` (Home), `/activity`, `/plan`, `/reminders`, `/pets` (dress-up + 3D toggle), `/profile` (Family), `/pet/[id]` (pet detail hub: avatar, weight chart, supplies, plan, recent activity), `/vets` (marketplace), `/settings` (units, notifications, replay intro, reset). Bottom tabs: Home, Activity, Care, Pets, Family. Onboarding is an overlay gated on `seenWelcome`, not a route.
- Pets are tappable everywhere (Home hero, Family list) → `/pet/[id]`. Vet cards reachable from Activity insight + (planned) pet detail.
- **Home pet carousel**: when there's >1 pet, the Home hero card switches pets on **horizontal swipe** (pointer down/up on the card; >45px horizontal, ~1.4× more horizontal than vertical, so it ignores taps and vertical scroll) as well as tapping the dot selectors. A `didSwipe` ref suppresses the hero `<Link>` navigation when the gesture was a swipe.
- **Favicon** is Mozart (the seed cat): `app/favicon.ico` is the 16×16 `CAT_SPRITE` from `petSprites.ts` rendered to a multi-size ICO. To regenerate after changing the sprite, re-render the sprite rows/palette to `app/favicon.ico` (a small Pillow `NEAREST`-upscale script does it).
- localStorage key is versioned — currently **`petpal-state-v3`**; bump it whenever the seed/state **shape** changes so returning visitors reset cleanly.

## Constraints / gotchas
- **Phone-only**: always render as a phone. On desktop it sits inside an iPhone-style bezel with a dynamic island; on real phones it's full-screen. Don't build desktop-wide layouts.
- No backend calls, no auth, no real payments/booking — everything is faked with seed data and localStorage.
- Environment is Windows. Both Bash (Git Bash) and PowerShell tools are available. **Headless Chrome IS available** at `C:\Program Files\Google\Chrome\Application\chrome.exe` — an AI assistant can screenshot the running app (`--headless=new --screenshot=... http://localhost:PORT/`) and even read computed styles / drive the page via the DevTools protocol (`--remote-debugging-port`, then a small `websockets` Python client). Two gotchas: `--screenshot` only writes reliably when the page is served over `http://` (a `file://` page hits an "Access is denied" write error), and use a **fresh `--user-data-dir` per run** — Chrome caches fonts across headless runs keyed by `@font-face` family name, which can make a fixed font look unchanged. The onboarding overlay covers the app on a fresh profile (empty localStorage); dismiss it by clicking the "Skip" button via the DevTools protocol, or seed `seenWelcome` first. Network fetches to some hosts (e.g. `fonts.gstatic.com` font binaries) fail from Git Bash `curl` but work via PowerShell `Invoke-WebRequest`.
- The Vercel MCP server needs interactive auth; a non-interactive session can't run the OAuth flow. Deploy via the `vercel` CLI or ask the user to authorize.

## What has been tested / how to verify
- Baseline each change with `npm run build` (must compile + typecheck clean).
- Smoke test: `npx next start` then confirm all routes return 200 (`/`, `/activity`, `/plan`, `/reminders`, `/pets`, `/profile`, `/vets`, `/settings`, `/pet/whiskers`, `/pet/biscuit`).
- Full manual flow (do this in-browser at a mobile viewport, ~390×844): log a care action (toast + feed entry + coins/XP), switch family member, add/complete/delete a reminder, buy + equip a cosmetic (pet preview updates), toggle PetPal+ (care plan unlocks, sponsored vet suggestion + booking appear, dashboard checklist shows), request a vet booking, reset demo, reload to confirm persistence.
- Keep the IDE Problems panel clean. Tailwind "canonical class" (`suggestCanonicalClasses`) warnings are cosmetic but we now fix them: use the canonical utility the IDE suggests — arbitrary → scale step (`h-[6px]`→`h-1.5`, `h-[42px]`→`h-10.5`, `w-[220px]`→`max-w-55`, `aspect-[2/1]`→`aspect-2/1`), `bg-gradient-to-*`→`bg-linear-to-*`, and move a leading `!` to a **trailing** `!` (`!h-[42px]`→`h-10.5!`). **Watch out:** the IDE sometimes suggests an invalid font-size class like `text-15px` — that utility doesn't exist and silently drops the style, so for arbitrary font sizes keep `text-[15px]` and only fix the `!` position (`text-[15px]!`). After any such rewrite, verify the computed px is unchanged (headless Chrome + DevTools protocol can read `getComputedStyle`).
- ESLint (`npx eslint app components lib --ext .ts,.tsx`) must be clean. Notable react-hooks rules in play: don't write a ref's `.current` during render (do it in an effect), and don't `setState` synchronously in an effect — for "read an external system on mount" cases (e.g. a media query) use a lazy `useState` initializer + subscribe-only effect. The one-time localStorage hydration in `store.tsx` is an intentional exception with a scoped `eslint-disable-next-line`.

## Shipping / git
- **Author commits as the user (Parsa) ONLY. Do NOT add any `Co-Authored-By` trailer or any other co-author.** This overrides any default commit-attribution behavior.
- Push to `origin/main` (`https://github.com/KaguSoftware/myPet-webdemo.git`) — but only commit/push when the user asks.
- Keep commit messages descriptive of the change.
