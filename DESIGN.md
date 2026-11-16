---
name: Hackathon4Kids
description: Free kids' coding classes, built as snap-together code blocks on a dot-grid stage.
colors:
  ink: "#1b1a2b"
  ink-soft: "#4a4760"
  stage: "#ffffff"
  grid: "#e7e5f0"
  events: "#ffc21a"
  control: "#ff8a1f"
  operators: "#2bb673"
  looks: "#6f3fe8"
  motion: "#2563eb"
  sensing: "#14a3a3"
  pen: "#e8457a"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem to 2.25rem"
    fontWeight: 800
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Atkinson Hyperlegible, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
rounded:
  block: "8px"
  hat: "28px 28px 8px 8px"
  slot: "999px"
spacing:
  block-x: "24px"
  block-y: "16px"
  page-gutter: "16px / 24px / 40px"
components:
  block-yellow: { backgroundColor: "{colors.events}", textColor: "{colors.ink}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-orange: { backgroundColor: "{colors.control}", textColor: "{colors.ink}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-green: { backgroundColor: "{colors.operators}", textColor: "{colors.ink}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-teal: { backgroundColor: "{colors.sensing}", textColor: "{colors.ink}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-pink: { backgroundColor: "{colors.pen}", textColor: "{colors.ink}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-purple: { backgroundColor: "{colors.looks}", textColor: "{colors.stage}", rounded: "{rounded.block}", padding: "16px 24px" }
  block-blue: { backgroundColor: "{colors.motion}", textColor: "{colors.stage}", rounded: "{rounded.block}", padding: "16px 24px" }
  slot: { backgroundColor: "{colors.stage}", textColor: "{colors.ink}", rounded: "{rounded.slot}", padding: "0.05em 0.6em" }
---

# Design System: Hackathon4Kids

## 1. Overview

**Creative North Star: "The Script You Can Run"**

The site is a block-coding editor a parent happens to be reading. Every section is a snap-together code block on a bright white stage with a faint dot grid. Blocks are flat saturated color with real notch and tab joins, white inset slots for values, and chunky rounded display type. It refuses the gradient-hero-plus-clipart edtech page.

Color is a language, not decoration: each hue is a block category and keeps its meaning across pages. Text on blocks is always ink or white by an AA rule, never tinted.

**Key Characteristics:**
- White stage, dot grid (22px, 1.2px dots in grid color) on body.
- Flat blocks with an inset bottom edge and a soft drop shadow; no gradients.
- Block grammar: hat starts a script, stack continues, cap ends it, slots hold values.
- One signature motion: the hero script snaps together once.
- Content width max-w-7xl with gutters 16 / 24 / 40px (base / sm / lg).

## 2. Colors

Full palette, each role deliberate. Neutrals are an indigo-tinted ink and a pale lavender grid.

### Primary
- **Go Green** (#2bb673, operators): the primary action. The mailing-list CTA is the only green action block; text is ink.

### Secondary
- **Hat Yellow** (#ffc21a, events): hat blocks, events, announcements, text selection, current-page nav underline, focus glow.
- **Looks Purple** (#6f3fe8, looks): statements ("say") and the Code course category. Also accent-color and scrollbar. White text.
- **Link Blue** (#2563eb, motion): links, navigation, focus outline, contest card, Build course category. White text.

### Tertiary
- **Loop Orange** (#ff8a1f, control): loops, programs, "repeat" rows. Ink text.
- **Info Teal** (#14a3a3, sensing): info rows ("quick facts"), Physics category. Ink text.
- **Highlight Pink** (#e8457a, pen): highlight; defined, used sparingly. Ink text.

### Neutral
- **Ink** (#1b1a2b): body text, text on light blocks, skip link.
- **Soft Ink** (#4a4760): secondary paragraphs, helper notes.
- **Stage White** (#ffffff): page and slot background.
- **Grid Lavender** (#e7e5f0): dot grid and default borders.

### Course category colors (src/app/content/courses.ts is the single source)
Code = purple (Python, Git + GitHub, AP CSA); Build = blue (Robotics, Game Development); Math = green (Intro to Algebra, AMC 8, AMC 10); Physics = teal (Intro to Physics, AP Physics 1). Every page reads `courseColor`; never hand-pick a course color.

### Named Rules
**The AA Text Rule.** Ink text on yellow, orange, green, teal, pink. White text on purple and blue. Set once in `.cb-*` via `--cb-fg`; never override per block.

**The Meaning Rule.** Yellow = hats, events, announcements. Green = the primary action. Purple/blue/green/teal = Code/Build/Math/Physics categories on course surfaces. A color used outside its meaning needs a reason.

## 3. Typography

**Display Font:** Bricolage Grotesque (ui-sans-serif fallback), loaded via next/font as `--font-bricolage`; applied to h1-h3 in base layer.
**Body Font:** Atkinson Hyperlegible 400/700, `--font-atkinson`, default on body.

**Character:** Bricolage is chunky and a little quirky for headings; Atkinson is engineered for legibility, which suits parents and young readers.

### Hierarchy (as built)
- **Display** (800, text-4xl / sm 5xl / lg 6xl on home; text-5xl / sm 6xl on Programs and About, leading 1.02-1.1): page h1, inside the purple "say" block on home.
- **Headline** (800, text-3xl / sm 4xl on home; text-4xl fixed on Programs/About): section h2.
- **Title** (800, text-2xl): contest card h2, card titles.
- **Body** (400, text-lg, ink-soft for lead paragraphs): max-w 50-65ch.
- **Label** (display 700-800, text-lg to xl): hat and button block labels. Not uppercase, no tracking.

### Named Rules
**The Op Word Rule.** Op words ("when", "say", "repeat", "quick facts") are inline grammar inside a block, via the `Op` helper or aria-hidden span. They are never standalone eyebrow or kicker labels above a heading.

## 4. Elevation

Hybrid but flat at rest: depth comes from the block's inset bottom edge and a tight drop shadow, and from lift on interaction. Shadows are structural (they make a block read as a physical piece), not ambient.

### Shadow Vocabulary
- **Block rest** (`filter: drop-shadow(0 2px 2px rgb(27 26 43 / 0.14))`, plus `inset 0 -4px 0 rgb(0 0 0 / 0.14)` on body): every block. Filter, not box-shadow, so notch and tab are shadowed.
- **Block lift** (`drop-shadow(0 10px 14px rgb(27 26 43 / 0.22))`, translate(-2px,-3px) rotate(-0.6deg)): interactive blocks on hover, only under `@media (hover: hover)`.
- **Block press** (`drop-shadow(0 1px 1px ...)`, translate(0,2px), 70ms): active.
- **Focus glow** (double yellow drop-shadow 3px/6px plus inset 3px ink ring on body): focus-visible on block links and buttons, reading as Scratch block selection. Plain elements get a 3px blue outline, 3px offset.
- **Slot well** (`inset 0 1px 2px rgb(0 0 0 / 0.18)`): value slots.

### Named Rules
**The Dragged-Block Rule.** Only blocks that are links or buttons (`a.cb`, `button.cb`, `.cb-lift`) lift. Static blocks never move on hover.

## 5. Components

### Block (`components/Block.tsx`, `.cb`)
Props: `color` (yellow, orange, green, purple, blue, teal, pink), `shape` (stack, hat, cap), `href`, `external`, `bodyClassName` (default `px-5 py-3`). Renders a Next Link, an external `<a>` (noopener), or a div. Radius 8px; top notch (36x9 mask at 18px offset) and bottom tab join stacked blocks. Hat: 28px top radius, no notch. Cap: no bottom tab. Vertical padding is hand-tuned per use (extra top padding compensates for the notch).

### Slot (`.slot`)
Pill (999px) white inset well with ink text, holds a value: "Free", "grades 3-8", course names, quick facts.

### Primary CTA
Green cap block, display 800 text-xl, label "Get class dates by email" plus arrow icon, links to `MAILING_LIST`. Followed by "No spam. Unsubscribe anytime." in soft ink. The copy is fixed; do not reword to "Join" or "Sign up".

### Contest card
Blue cap block with a pin that wobbles once on hover, white inner pill link (hover yellow). Driven by `content/contest.ts`.

### Navigation
`.nav-link`: ink text, no underline; a blue 3px bar slides in from the left on hover or focus; current page holds a 4px yellow bar. Mobile menu items snap in staggered (50ms). Skip link slides in on focus.

### Hero snap-in (`.snap-in`)
Each child of the hero stack animates from translate(-24px,-10px) rotate(-2deg) with an overshoot ease (`cubic-bezier(0.22, 1.25, 0.36, 1)`), 620ms, delayed 110ms per `--i` plus 120ms. Once, on load. The only choreographed moment.

### Motion
Hover lift, press, nav bar and robot nudge are state feedback only. Under `prefers-reduced-motion: reduce` the snap-in is not applied, nav, robot and block transitions are off, pin wobble and mobile-menu animation are off. Body uses `overflow-x: clip` so animations never cause sideways scroll.

### Layout and rhythm (as implemented)
Wrapper `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10`. Home hero is two columns: script stack left, contest right. Course list rows are a grid of a 9rem category column plus content. Section vertical rhythm is set per page, not by a token.

## 6. Do's and Don'ts

### Do:
- **Do** read course colors from `content/courses.ts`.
- **Do** keep the AA Text Rule: ink on yellow/orange/green/teal/pink, white on purple/blue.
- **Do** use hat to start, stack to continue, cap to end a script; put values in slots.
- **Do** gate hover lift behind `@media (hover: hover)` and honor reduced motion.
- **Do** keep copy factual: no invented stats, testimonials, or counts. Unknown facts (safety, FAQ) wait for owner answers.
- **Do** list minors as first name plus grade only; never school names; get student and parent consent before publishing a photo. Roster lives in `src/app/about/team.ts` (replace entries, order is display order, `hidden: true` suppresses, `courses` must exist in courses.ts). Contest lives in `src/app/content/contest.ts` (`active: false` hides the nav pill and home card; edit title, blurb, href, ctaLabel, navLabel).

### Don't:
- **Don't** build the generic edtech page: gradient hero plus clipart, stock-photo kids, mascots.
- **Don't** use op words as eyebrow or kicker labels above headings.
- **Don't** use white text on yellow, orange, green, teal, or pink.
- **Don't** add a second signature animation or loop motion.
- **Don't** hardcode new hexes or rgb shadows in components; use `@theme` tokens.

### Known gaps (build carries these; fix later, do not inherit as rules)
- Heading sizes differ per page (h1 text-4/5/6xl home vs 5/6xl Programs and About; h2 text-3/4xl home vs 4xl elsewhere) and section rhythm is untokenized. Needs shared heading utilities.
- Block padding recipes vary by use; a `size` prop is proposed.
- The CTA pair is duplicated (home hero and join section); extract a shared component.
- `#f3f0fb` is hardcoded in `about/Card.tsx` (as `--cb-bg`) and `mdx-components.tsx` (inline code), and raw `rgb()` shadows appear in globals.css and the contest pill; tokenize.
- Programs and About heroes use less block grammar than home.
- Safety and FAQ sections are pending owner facts.
