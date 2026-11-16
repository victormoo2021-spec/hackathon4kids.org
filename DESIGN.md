---
name: Hackathon4Kids
description: An Apple-clean launch page for a free kids' coding class, taught by high-school students.
colors:
  ink: "#1d1d1f"
  ink-soft: "#6e6e73"
  paper: "#ffffff"
  mist: "#f5f5f7"
  hairline: "#e3e3e8"
  accent: "#2448f5"
  accent-strong: "#1d3bf0"
  night: "#0b0b0f"
  night-2: "#16161c"
  ink-dim: "#a1a1a6"
  accent-dark: "#7c8cff"
  hue-code: "#2448f5"
  hue-build: "#7a5af8"
  hue-math: "#0ea47a"
  hue-physics: "#f76b15"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.75rem, 7.2vw, 6.5rem)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 4.6vw, 4rem)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 2.2vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  lede:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.125rem, 1.4vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "2.9cqw"
    lineHeight: 1.75
rounded:
  tile: "1.25rem"
  card: "1.75rem"
  pill: "999px"
spacing:
  gutter-mobile: "1.25rem"
  gutter-desktop: "2rem"
  section-mobile: "6rem"
  section-desktop: "9rem"
  container: "75rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.4rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  button-primary-lg:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "1rem 1.9rem"
    height: "3.5rem"
  button-secondary:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.4rem"
  button-secondary-hover:
    backgroundColor: "{colors.hairline}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  tile:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  dark-band:
    backgroundColor: "{colors.night}"
    textColor: "{colors.paper}"
---

# Design System: Hackathon4Kids

## Overview

**Creative North Star: "The Launch Page"**

A parent skims a free class the way they skim a product launch: a white page, one confident headline, one blue action, and a single scroll-driven demo that shows what a kid actually does (type code, press run, watch a game move, pick a course). References: apple.com for restraint and pacing, stripe.com for soft layered depth, linear.app for crisp type and a dark band. The content is the product; the chrome stays out of the way.

Density is low and the rhythm is generous. Almost everything is white or pale grey, ink-coloured type with tight display tracking, one saturated blue, and exactly one dark section for contrast. Depth comes from soft layered shadows and a few translucent glass surfaces, never from borders or hard edges. The build replaced an earlier "snap-together code blocks" world entirely; nothing of it survives.

**Key Characteristics:**
- White (paper) and mist grey surfaces, ink text, one blue accent; one night band.
- Geist at heavy-but-not-black weights (600-650) with negative tracking; Geist Mono only for code.
- Big radii (20-28px), pill buttons, soft multi-layer shadows.
- One authored motion moment; everything else is a quiet opacity-and-rise.
- One primary action on the whole site.

## Colors

Restrained: neutrals carry the page, a single blue carries action and focus, category hues appear only as small marks.

### Primary
- **Launch Blue** (accent): the only action colour. Primary button fill, focus ring, active nav underline, current-page link in the mobile sheet, `accent-color`, selection tint.
- **Pressed Blue** (accent-strong): primary button hover only.

### Neutral
- **Ink** (ink): headings and body on paper and mist.
- **Soft Ink** (ink-soft): ledes, captions, nav links at rest, footer text.
- **Paper** (paper): page background and card fill.
- **Mist** (mist): footer, final CTA band, secondary button, About cards, tile gradient end.
- **Hairline** (hairline): 1px dividers (FAQ rows, header when scrolled, footer rule) and secondary-button hover.
- **Night** (night) and **Night 2** (night-2): the single dark band. Night 2 is declared but not yet used by a component.
- **Dim Ink** (ink-dim) and **Dark Blue** (accent-dark): secondary text and accent on night.

### Category hues
Code, Build, Math and Physics each own a hue (hue-code, hue-build, hue-math, hue-physics), defined once in `src/app/content/courses.ts` and read everywhere via `courseHue`. They tint mini visuals, dots, tile gradients (9% mix into white) and glows only.

### Verified contrast (AA)
- ink and ink-soft on paper and on mist.
- paper text on accent: 6.3:1.
- On night: white, ink-dim 7.6:1, accent-dark 6.6:1.
- Category hues are not contrast-verified for text on white.

### Named Rules
**The One Blue Rule.** Launch Blue marks action and focus. It never decorates.
**The Hue Is A Mark Rule.** Category hues are never text on white; they are dots, icon fills and gradients.
**The One Night Rule.** Exactly one dark band per page; the rest is light.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui, -apple-system)
**Body Font:** Geist (same stack)
**Label/Mono Font:** Geist Mono, used only for the code editor inside the device

**Character:** Plain, geometric and quiet. Hierarchy comes from scale and tracking, not from a second typeface.

### Hierarchy
- **Display** (650, clamp 2.75rem to 6.5rem, 1.02, -0.045em, `t-display`): page-level statements. The hero h1 uses a slightly smaller bespoke clamp (2.75rem to 6rem) capped at 11ch.
- **Headline** (650, clamp 2.25rem to 4rem, 1.05, -0.04em, `t-headline`): section headings.
- **Title** (600, clamp 1.5rem to 2rem, 1.15, -0.025em, `t-title`): card and tile headings.
- **Lede** (400, clamp 1.125rem to 1.375rem, 1.5, ink-soft, `t-lede`): supporting paragraph; capped at 36rem in page heroes.
- **Body**: Tailwind text-base/text-sm in ink or ink-soft. All h1-h3 get `text-wrap: balance`, paragraphs `text-wrap: pretty`.

### Named Rules
**The Tight Tracking Rule.** Headings track negative (-0.025em to -0.045em); the bigger the size, the tighter.
**The Mono Is Code Rule.** Geist Mono appears only where source code is shown.

## Layout

Single column on mobile, wide centred container (`container-x`: max 75rem, 1.25rem gutters, 2rem from 48rem). Vertical rhythm is `section-y` (6rem, 9rem from 64rem). Subpages open with `page-hero` (top padding clamp 7rem to 9rem to clear the sticky header, 2.5rem bottom, 4rem from 64rem) and separate content with `page-section` (3.5rem, 5.5rem from 64rem). Fixed header, scroll-padding-top 5rem, `overflow-x: clip` on body. Breakpoints in use: 640px (facts grid), 48rem, 64rem, and 900px (the pinned story and hero two-column grid).

## Elevation & Depth

Hybrid: flat white-on-mist tonal layering plus two soft, multi-layer shadows. Depth is atmospheric (Stripe-like), never outlined.

### Shadow Vocabulary
- **Float** (`--shadow-float`: 0 1px 1px rgb(0 0 0/.04), 0 8px 24px -6px rgb(0 0 0/.1), 0 24px 64px -16px rgb(0 0 0/.14)): resting cards, game card, chips.
- **Lift** (`--shadow-lift`: adds a faint blue 0 40px 96px -24px rgb(36 72 245/.22) glow): hovered home tile.
- **Primary glow** (`0 6px 20px -6px rgb(36 72 245/.55)`): under the primary button.
- **Lift hover** (`.lift`: 0 2px 4px / 0 24px 48px -12px rgb(0 0 0/.18) plus 6px rise): hovered About and Programs cards, fine pointers only.

### Named Rules
**The Glass Is Rare Rule.** Glass (white at 72%, saturate 180%, blur 20px) is for the sticky nav and the floating course chips only. Content cards are solid.
**The Static Blur Rule.** Blur lives on static surfaces. Never animate a filter or backdrop-filter.

## Shapes

Generous and soft: tile 1.25rem, card 1.75rem, pill 999px for buttons, chips and the skip link. Focus ring is a 2px accent outline offset 3px with 8px corners. Thin hairlines separate list rows instead of boxes. The hero device mock sizes in `cqw` so it scales as one object.

## Components

### Buttons
- **Shape:** pill (999px), min-height 2.75rem, weight 600, tracking -0.01em; `btn-lg` is 3.5rem at 1.125rem.
- **Primary:** Launch Blue fill, white text, blue glow shadow. Hover to Pressed Blue.
- **Secondary:** mist fill, ink text, hover to hairline.
- **Active:** scale 0.97 over 90ms; release springs back (ease-spring).

### EmailCta (the only primary action)
The single primary action on the site, from `EmailCta.tsx`. Copy is fixed: "Get class dates by email" (nav-compact: "Get class dates"), with an arrow icon, opens the Google Form in a new tab with an sr-only notice, optional "No spam. Unsubscribe anytime." line. Do not reword, and do not add a second primary button.

### Cards and Tiles
- **Card** (`.card`): paper fill, 1.75rem radius, Float shadow.
- **Tile** (home courses): 1.75rem, 160deg gradient from a 9% category hue to white, 3D tilt via `--rx/--ry` (transform only), Lift shadow on hover, mini visual (`tile-visual`) in a 1.25rem rounded box.
- **Course tile** on Programs: same gradient, `course-visual` max 9rem.
- **About card:** mist fill, 1.75rem, `.lift` hover.

### FAQ
Native `<details>/<summary>` (keyboard and no-JS safe), hairline rows, 1.25rem semibold question, plus/minus icon built from two 2px bars. Open state animates `::details-content` block-size and opacity (400ms ease-out-expo) using `interpolate-size: allow-keywords`; reduced motion removes the transition. Facts live in `content/faq.ts`.

### Navigation
Sticky header with glass; when scrolled it gains a hairline bottom and an 86% white fill. Links are ink-soft, ink on hover and current; the current page gets a 2px blue underline that scales in. On mobile a full-height sheet below the 3.5rem header fades and slides in, links stagger by 55ms, current page in accent; Escape closes and returns focus to the toggle. A skip link is the first tab stop. Page changes use a View Transition cross-fade with a 12px rise.

### Footer
Mist background, ink-soft 0.875rem text, 4-column grid from 64rem (2fr 1fr 1fr 1.2fr), links darken and underline on hover, hairline rule above the fine print.

### Dark Band
The one night section ("run by students"): night fill, white headings, large stat-style figures (the figures are descriptive of the model, e.g. who teaches, never invented numbers), soft ribbon and speck glints in accent-dark. Final CTA band is mist with a pre-baked soft gradient ribbon.

### Hero device and story
A laptop mock (CSS, `cqw` sized) with an editor in Geist Mono, a game layer (SVG) and a course fly-in. Detailed behaviour is below.

## Motion

- **Runtime:** GSAP + ScrollTrigger. Lenis loads by dynamic import only when the pointer is fine and reduced motion is off (never on touch), driven by `gsap.ticker`. Rebuilt per route, refreshed after fonts load. `motion-ok` is set on html.
- **The one authored moment:** at 900px and wider with motion allowed, the hero becomes a CSS `position: sticky` stage (height about 100svh + 240svh) that scrubs: code types in the editor, run is pressed, a game scene wipes in, and course chips fly out. Sticky instead of a GSAP pin is deliberate: no wrapper is injected, so layout shift stays at 0.
- **Below 900px or reduced motion:** a static stack (device with finished code, a game card with a calm CSS-only loop, chips, captions). Reduced motion shows the final frame.
- **Reveal:** every `[data-reveal]` fades from opacity 0 and rises 16px (0.7s expo.out, staggered), once. Opacity only, never `visibility: hidden`, so unrevealed content stays focusable. Items already in view at load are set instantly.
- **Easings:** ease-apple (state changes), ease-out-expo (entrances), ease-spring (press and lift).
- **Perf rules:** animate transform and opacity only; no animated filters; glows are pre-baked radial gradients, not blurred layers.

## Content Rules

- No invented stats, student counts, partner logos or testimonials (PRODUCT.md).
- Minors appear as first name plus grade only; no school names; consent before photos.
- Swap the roster in `src/app/about/team.ts` (new headshots in `public/`, ordered array, `hidden: true` to retire, `courses` must exist in `content/courses.ts`).
- Contest announcement is `src/app/content/contest.ts` (`active: false` hides the nav pill and home slot); `MAILING_LIST` lives there too.
- FAQ answers are in `src/app/content/faq.ts`; courses and hues in `src/app/content/courses.ts`.

## Performance and Tests

Budget: Lighthouse mobile at or above 95, CLS 0. Guards in `tests/e2e`: `motion.spec.ts` (story pins without overflow, zero layout shift while scrolling, no pin/Lenis under reduced motion, reveal elements visible), `a11y.spec.ts` (axe, including all FAQ items open), `home.spec.ts` (CTA fully inside first viewport, FAQ keyboard behaviour), `site.spec.ts` (one h1, skip link, no overflow, mobile menu focus).

## Do's and Don'ts

### Do:
- **Do** use EmailCta for the single primary action, with its fixed copy.
- **Do** use `container-x`, `section-y` and the `t-*` utilities rather than ad hoc sizes.
- **Do** read category colours from `content/courses.ts`.
- **Do** use mist for secondary surfaces and hairlines for dividers.
- **Do** add new motion as transform/opacity with a reduced-motion fallback that shows the final state.

### Don't:
- **Don't** add a second primary button, or reword "Get class dates by email".
- **Don't** use category hues as text on white.
- **Don't** animate blur, filter or backdrop-filter; don't put glass on content cards.
- **Don't** hide unrevealed content with `visibility: hidden` or `display: none`.
- **Don't** replace the sticky story with a GSAP pin (CLS).
- **Don't** invent numbers, testimonials or full names of minors.

## Known Gaps (not canonized)

- Hardcoded hex colours in components instead of tokens: `src/app/components/home/ClassSize.tsx:19,22` (#d2d2d7, #1d1d1f), `Formats.tsx:6-25` (#d2d2d8, #f5b800, others), `GameScene.tsx:7-29` (illustration palette), `src/app/not-found.tsx:12-14` (traffic-light dots), `hero.css` device/editor greys and syntax colours, `sections.css:63-64` (#7c8cff/#a98bff instead of accent-dark).
- Fixed font sizes outside the scale: `Faq.tsx:15` (1.25rem), `DarkBand.tsx:65-66` (2.5rem, 0.9375rem, white/62), `Navigation.tsx:56`, `Footer.tsx:35,38` (.8125rem).
- `About/Card.tsx:12` repeats 1.75rem instead of the card radius token.
- `night-2`, `ink-dim`, `accent-dark` tokens are declared but no component uses them; DarkBand uses white alpha instead.
- `opengraph-image.tsx` hardcodes brand hex (unavoidable in ImageResponse).
