# Dashboard Page Overrides

> **PROJECT:** Solar Tracker Portal (`/tracker`, `src/app/tracker/`)
> **Generated:** 2026-10-11 15:56:36, then edited with the decisions applied in `src/app/tracker/tracker.scss`
> **Page Type:** Dashboard / Data View (private, phone-first, also desktop)

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`../MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

The Master came from `"smart home IoT real-time monitoring" --design-system --variance 4 --motion 3 --density 6`
(Smart Home/IoT Dashboard: Glassmorphism + dark mode, slate neutrals, status colours, Plus Jakarta Sans).
Its landing-page pattern and light-mode component specs do not apply to this page; the rules below replace them.

---

## Layout Overrides

- **Pattern:** a live 3D scene of the tracker with the numbers over it, then cards. Not a landing page: no "How it works" or CTA sections.
- **Order:** sign-in requests and account buttons (floating, top right) → hero scene → Today tiles → History card. No brand, title or footer: everyone who opens it knows what it is.
- **Hero hierarchy:** status and percent extended over the sky (top); temperature and wind over the ground (bottom). The tracker sits in the band between them (`dashboardFraming`).
- **Phone (< 1024 px):** edge-to-edge hero, `clamp(560px, 100svh − 64px, 740px)` tall so the next card peeks; the scrims fade into the page at the top and bottom. 16 px gutters (24 px from 640 px).
- **Desktop (≥ 1024 px):** grid `1.5fr | minmax(400px, 1fr)`; the hero is a sticky 24 px-radius card filling the viewport height; the buttons sit above the right column. Max width 1680 px.
- **Scene:** always shows the latest reading from a fixed camera; it takes no pointer or touch input and nothing in it moves except the array, the sun and the anemometer.

## Color Overrides

| Role | Value | Why |
|------|-------|-----|
| Background | `#0F172A` | Master |
| Card (glass) | `rgba(27,35,54,0.72)` + 16 px blur, border `rgba(148,163,184,0.16)` | Master card `#1B2336` as glass |
| Text 1 / 2 / 3 | `#F8FAFC` / `#94A3B8` / `#8492A6` | ≥ 4.5:1 on bg and card (17.1, 6.3, 5.1 on card) |
| **Accent / CTA** | **`#FBBF24`** (solar gold), hover `#FCD34D`, on-accent `#0F172A` (10.7:1) | Master accent `#22C55E` would collide with the green "Tracking" status. Gold comes from the Sustainable Energy palette note "solar gold". |
| Focus ring | `#FFFFFF`, 2 px, offset 2 px | Master |
| Danger | badge `#DC2626` with white (4.8:1); error text `#FCA5A5` (≥ 6.4:1 on every card) | `#EF4444` with white is 3.8:1 |
| Control border | `#64748B` (≥ 3:1 against field and card) | Master border `#475569` is 2.1:1 on card |
| Status | Tracking `#2FBF5B`, Night hold `#8C9BD6`, Wind safe `#EC835A`, Away `#B8C0C8` (`telemetry.ts`) | Reserved for status, always with an icon and a label |
| Chart series | panel `#C98500`, temperature `#D55181`, wind `#3987E5` | CVD-validated set; 5.1, 4.0, 4.3:1 on the card. One measure per chart, no dual axes |

**Type over the scene:** white and `#E2E8F0` only, never the muted tokens. Scrims: top `rgb(15 23 42)` from 1 (0.82 on desktop) to 0.7 at 55 % to 0 over 58 % of the hero; bottom from 1 (0.9 desktop) to 0.82 at 34 % to 0 over 40 %. Measured against the rendered canvas at live, 1 p.m., 5 p.m., 7 p.m. and 2 a.m.: worst text contrast 6.3:1 (desktop) and 7.7:1 (390 px).

## Typography Overrides

- One family, as in the Master: **Plus Jakarta Sans 400–800** (`wght@400..800`), tabular figures for every number.
- Roles: eyebrow 12/600 uppercase +0.08em · section title 18/700 · hero status 30→52 px/700 · hero percent 60→88 px/700, −0.03em · secondary stats 32→40 px/700 · body 13–15 px · nothing under 12 px except chart annotations (11 px).

## Spacing, Radius, Motion

- Spacing: the Master 4/8 scale (Tailwind defaults). Card padding 16–20 px, section gap 24 px.
- Radius: 8 (inner pills), 12 (buttons, inputs, tiles' icons), 16 (cards, popovers), 24 (hero on desktop, dialog).
- Motion (CSS only, no GSAP dependency): 150 ms press/hover, 200 ms state and popovers, 350 ms enter (rise 12 px), easing `cubic-bezier(0.25,0.46,0.45,0.94)` ≈ power1.out. `prefers-reduced-motion` turns animations and transitions off.

## Component Overrides

- **Buttons:** primary gold / secondary translucent, 44 px min height, 12 px radius, scale 0.98 on press. Large CTA 52 px.
- **Icon buttons:** 44 × 44, 12 px radius, accessible name; count badges also announced as a sentence in a status region.
- **Segmented controls:** a `role="group"` of buttons with `aria-pressed`; 44 px targets with the selected pill drawn inside.
- **Inputs:** 52 px, 17 px text (no iOS zoom), visible label, gold focus border + halo.
- **Popovers:** near-opaque surface (0.97), close on Escape and outside click; full-width under the header on phones.
- **Dialog (expanded history):** native `<dialog>`, full screen on phones, zoomable chart and a table view, Chart/Table toggle with text labels.
- **States:** skeletons that reserve the final size (hero numbers, tiles, chart), "No readings" empty states in the hero and chart, an inline error card with Retry, and a freshness label that says Updated / Delayed / Offline in words.

## Anti-Patterns for This Page

- Status colours used for anything but status, or status shown by colour alone.
- Muted text placed directly on the scene, or a scrim that is not measured against a daytime sky.
- Dual-axis charts; series colours outside the validated set.
- Touch targets under 44 px; hover-only behaviour.
- Anything on the scene canvas that captures touch: it sits under the page's scroll on phones.
