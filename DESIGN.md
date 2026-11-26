---
name: Hackathon4Kids
description: Free STEM and coding classes for grades 3-8, taught by high-school students. Phosphor: light on blue-black, yellow signal, logo-blue afterglow.
colors:
  bg: "#05070C"
  s1: "#0A0E19"
  s2: "#111626"
  s3: "#192035"
  line: "#222B45"
  line-2: "#505D82"
  text: "#F3F5FA"
  text-2: "#AAB2C5"
  text-3: "#8089A0"
  accent: "#FFD60A"
  accent-hi: "#FFE55C"
  glow: "#2A3CFF"
typography:
  h1: { fontFamily: "Archivo", fontSize: "clamp(4rem, 2.1rem + 8.4vw, 10.5rem)", fontWeight: 900, lineHeight: 0.84, letterSpacing: "-0.035em" }
  h2: { fontFamily: "Archivo", fontSize: "clamp(2.5rem, 1.25rem + 5.6vw, 6.5rem)", fontWeight: 900, lineHeight: 0.88, letterSpacing: "-0.03em" }
  fact: { fontFamily: "Archivo", fontSize: "clamp(4.5rem, 2rem + 11vw, 12rem)", fontWeight: 900, lineHeight: 0.82 }
  stmt: { fontFamily: "Archivo", fontSize: "clamp(2rem, 1.1rem + 4.2vw, 5rem)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.025em" }
  body: { fontFamily: "Archivo", fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)", fontWeight: 450, lineHeight: 1.5 }
  mono: { fontFamily: "IBM Plex Mono", fontSize: "0.75rem", fontWeight: 500, lineHeight: 1.3, letterSpacing: "0.02em" }
rounded: { chip: 8px, tile: 20px, pill: 999px }
spacing: { gutter: "16/20/24px", margin: "20/32/48/112/160px", pad-y: "clamp(64px, 9vw, 128px)" }
---

# Design System: Hackathon4Kids ("Phosphor")

Recorded from the shipped build (origin/phosphor bc3a7ac). Where this differs from the planning notes, the code wins. Sources of truth: `src/app/press/tokens.css`, `src/app/press/ink.ts`, `src/app/press/gl/*`, `src/app/motion/*`, `src/app/components/spot/*`, `scripts/gate/*`.

## 1. Overview

Product: free STEM and coding classes for Bay Area kids in grades 3-8, taught by high-school students; parents join a mailing list for class dates. Mode: persuade, one main action ("get class dates by email").

World: a physics lab with the lights off. A strobe photograph of a pendulum, a trace on a tube, the afterglow that lags the bright point. Light is added to black; nothing is printed on paper.

Signature: light lags. A bright thing (yellow, white) leaves a dimmer logo-blue afterglow that arrives a little late and settles: the pendulum trail, the ghost plate behind headlines and proofs, the blue floor halftone. Two moments get richness: the hero pendulum writing its own strobe trail, and the class-size crowd (twenty white dots and one yellow one) filling in on scroll. Everything else is flat, quiet, and typographic.

Palette strategy: restrained, one accent. Navy-tinted near-black neutrals; yellow is the single accent; blue is depth only.

## 2. Colour

Token names are stable; only the hexes carry the theme. Every hex in `.ts/.tsx` lives in `ink.ts` (mirrors tokens.css).

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#05070C` | page and canvas ground; the only text colour on accent |
| `--s1` | `#0A0E19` | raised band (FAQ), mobile sheet |
| `--s2` | `#111626` | tile ground, cards, chips |
| `--s3` | `#192035` | hover step for rows |
| `--line` | `#222B45` | 1px hairline, decorative |
| `--line-2` | `#505D82` | control borders, rules (about 3:1 on bg) |
| `--text` | `#F3F5FA` | primary text, the white beam, kids in the crowd, focus ring |
| `--text-2` | `#AAB2C5` | body copy |
| `--text-3` | `#8089A0` | mono readouts, fine print |
| `--accent` | `#FFD60A` | primary button, join band, instructor dot, live trace, one highlighted word per section |
| `--accent-hi` | `#FFE55C` | primary button hover only |
| `--glow` | `#2A3CFF` | logo ultramarine lifted until it reads on black: afterglow, floor halftone, ghost plate, Physics tile paper |
| `--on-accent` | `= --bg` | text and icons on yellow |
| `--focus` | `= --text` | 2px ring, 3px offset |

Rules (named):
- **Yellow acts, blue trails, white is the beam.** Yellow = "now / act"; blue = "trace / depth"; white = type and the present moment.
- **Bg on yellow, text on blue.** `--text` on `--accent` fails (about 1.3:1); `--text-2`/`--text-3` on `--glow` fail. Only `--bg` goes on yellow, only `--text` on blue paper.
- **Blue is never text on dark.** `--glow` (about 3.1:1 on bg) is for fills, marks and large ghost copies.
- **One accent per viewport.** One filled yellow element (the CTA) plus at most one yellow word or numeral. The join band is the exception: yellow is the ground and everything on it is `--bg`.
- **Light adds.** On canvases, layers combine by screen blend over `--bg`; overlap is brighter, never darker, and no canvas pixel drops more than 3/255 under bg (gate 10).

Tile inks `[paper, ink, ghost]`, colour carries category: Code `[s2, accent, glow]`, Build `[accent, bg, glow]`, Math `[s2, text, glow]`, Physics `[glow, text, accent]`. Crowd: paper bg, kids `text`, instructor `accent`.
Scheme: `color-scheme: dark`, `::selection` yellow on bg.

## 3. Typography

Archivo (variable, wdth 62-125, wght 100-900) for everything; IBM Plex Mono for readouts only. Both subset and preloaded; mono is limited to the hero readout, category chips and /code.org step numerals.

| Role | Setting | Use |
|---|---|---|
| `.t-h1` | 900, wdth 100 (125 from 48rem), uppercase, lh .84, -.035em | hero headline |
| `.t-h2` | 900, same stretch rule, uppercase, lh .88 | section heads (`[data-plate]` ghost copy in blue) |
| `.t-fact` | 900, wdth 62, uppercase, lh .82 | the one big number per band |
| `.t-slab` | 800, wdth 112, uppercase | "Grades 3-8" in yellow, no box |
| `.t-stmt` | 700, wdth 100, sentence case, max 20ch | statement scrub |
| `.t-h3` | 650, 1-1.25rem | tile and course titles |
| `.t-body` | 450, lh 1.5, max 60ch | paragraphs (`--text-2`; lead paragraphs `--text`) |
| `.t-mono` | Plex 500, .75rem | readouts |

Hierarchy comes from a steep ratio: wide black uppercase display against calm 17-19px body. All sizes are fluid `clamp()`.

## 4. Layout and shape

- Grid `.grid-x`: 4 / 8 / 12 columns at base / 48rem / 64rem; gutter 16/20/24; margin 20/32/48, 112 at 90rem, 160 at 120rem; content max 76rem (88rem at 120rem).
- Breakpoints: 48rem (tablet, wide display stretch), 64rem (desktop nav, 12 cols, `--rule` 3px), 90rem and 120rem (margins). Motion conditions reuse 48rem/64rem plus `(hover:hover) and (pointer:fine)`.
- Vertical rhythm: `--pad-y: clamp(64px, 9vw, 128px)` between bands. Bands are full bleed, radius 0, alternating bg and s1.
- Radii only `--r-chip 8px` (chips, category tag, skip link), `--r-tile 20px` (tiles, cards, FAQ details), `--r-pill` (buttons, nav CTA).
- Elevation is a surface step (bg, s1, s2, s3) plus a 1px `--line`. No box-shadow, text-shadow blur, gradient or `filter` in the DOM; no `mix-blend-mode`.
- Buttons: `.btn` pill, min-height 48 (`.btn-lg` 56), `:active` scale .97 on pointer-down. Primary = yellow fill, bg text, `--accent-hi` on hover (fine pointers only). Targets at least 44px.

## 5. Glass

`backdrop-filter` exists on exactly one node: `.site-header::before` (blur 20px saturate 1.4, from 48rem). Its opacity is 0 at the top of the page and 1 past 96px scroll; solid under `prefers-reduced-transparency` and below 768px. The nav CTA is hidden while the hero CTA is on screen.

## 6. The press (WebGL)

- One WebGL2 context per route, shared by sheets (hero, roller, ten proofs, crowd, join), render-on-dirty at a 15Hz strobe (`--tick: 70ms`). Strobe stays inside canvases; the DOM never steps.
- Shader colours (`riso.glsl.ts`) are pre-compensated so a solid screen-blend over bg lands on the token. Layers in order: bloom (blue, masked under yellow), afterglow (blue), accent (yellow), beam (white). Tube grain plus dead cells replace paper texture. Halftone dot radius .66.
- Hero: strobe pendulum with a grabbable bob; the yellow trail leads, the blue plate lags and tears with scroll velocity.
- **Fallbacks are the contract.** `Poster` (frame 0, static) is always in the markup and steps aside only after GL has drawn. Software GL (SwiftShader, llvmpipe, headless Lighthouse) is detected by a worker probe and keeps the Poster. Reduced motion paints frame 0 through the 2D path (`paint2d.ts`). JS off and WebGL off must both leave a complete page.
- Slip: scroll velocity becomes `--slip` (max 10px, decay x0.6, 0 within 3 ticks of stopping). Consumed by GL sheets, `[data-plate]` headings and `.btn-primary`.
- The only DOM afterglow is a hard, unblurred offset copy in `--glow` (`.plate::before`) and the 404 numeral's offset.

## 7. Motion (GSAP, lazy)

- GSAP and ScrollTrigger exist only in `src/app/motion/kit.ts`, a deferred async chunk (lint-enforced; gate 5 caps it at 56KB gz and keeps it out of first-load). `index.ts` is type-only on gsap. The chunk loads at idle (2s timeout) or on first scroll/pointer/key; never under `prefers-reduced-motion` or save-data.
- **SSR state is the rest state.** Nothing depends on CSS hiding content; if the chunk fails the static page is complete. `takeover` eases a scene already on screen from rest to its true position (zero layout shift).
- `scene()` uses `gsap.matchMedia` with conditions `motion, mid, wide, fine`; reduced motion registers nothing, leaving only CSS opacity/colour changes of at most 240ms.
- Scenes (`scenes.ts`): hero exit (scrub .4), statement words (opacity .55 to 1 plus rise, scrub), heading reveals, per-row tile timelines (scrub .5, `back.out(1.6)` settle), batch rise (once, 0.48s power3, stagger .06), magnetic primary CTA (fine pointers only). Scrubs reverse; nothing is pinned (only header, FAQ heading, skip link, mobile sheet and the Impression canvas may be sticky).
- CSS motion tokens: `--t1` 100 press, `--t2` 160 colour, `--t3` 240 small move, `--t4` 480 entrance, `--t5` 720 hero line; `--spring` (critically damped, default for anything that moves), `--bounce` only where momentum precedes it (stamp, instructor dot), `--ease-out`, `--ease-io`.

## 8. Scenes (home, in order)

1. **Hero**: wide-900 H1, one yellow CTA with a no-spam note, facts row, pendulum sheet behind; Poster fallback. CTA inside the first screen at five sizes.
2. **Statement**: `.t-stmt` sentence; words scrub from .55 to full opacity.
3. **Courses**: Code, Build, Math, Physics tiles, each with a live proof canvas (ten proofs, at most two animating at once) linking to `/programs#slug`.
4. **Class size**: the crowd; end state is 20 `--text` discs plus 1 yellow disc and numeral "20" (reads "0" before the scene).
5. **FAQ**: s1 band, native `<details>`, `--line-2` rules, s3 hover.
6. **Join**: full-bleed yellow band, roller sheet rolls once, then the stamp; the only full flood. The Impression canvas follows.

Home is at most 8 screens. Inner pages (`/about`, `/programs`, `/code.org`) use `pages.css` with the same tokens and prose layouts.

## 9. Budgets and gate

- First-load JS at most 115KB gzip on home (`scripts/perf.mjs`); Lighthouse mobile 100; scroll p95 frame at most 16.7ms at 1440 and 390, at most 20ms at 390 / 4x CPU; zero app rAF when no animated sheet is visible; layout shift 0.
- Gate: `node scripts/gate/run.mjs --url <base> --out <dir> [--only n,m] [--lh]`, 30 items in `scripts/gate/checks.mjs`. Families: first-screen CTA and facts (1-3); computed styles use only token hexes, no gradient/filter/blend, allowed radii (4); one GL context and bundle limits (5); hero GL vs Poster, strobe fan (6-7); blend invariant (10); load sequence, slip, proofs, stamp (11-14); reduced motion, JS off, GL off (16-17); frames and Lighthouse (19-20); focus ring at least 2px and 3:1 on bg, s1, s2, accent (21); contrast sampled mid-scrub (22); type roles (23); composition (24); no pinned scenes (26); scrub reversibility, takeover, nav, crowd (27-30).

## 10. Do and don't

Do: keep one accent; put `--bg` on yellow; keep light in canvases; ship every canvas with a static fallback; add motion only through the lazy kit; keep copy factual.
Don't: add green or purple; set yellow text on blue; blur or glow anything in the DOM; add a second glass surface; import gsap outside `kit.ts`; pin scenes; add mascots, illustrations, emoji or hype.

## 11. Not canonized

- `shell.css` still uses `rgb(5 8 6 / .72)` for the translucent nav, a leftover of the retired green palette; the token `#05070C` is the rule.
