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
  lilac: "#f3f0fb"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem / 3rem / 3.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem / 2.25rem"
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
  panel: "16px"
  media: "12px"
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
- **Hero** (`.h-hero`, 2.25 / 3 / 3.75rem at base / sm / lg, leading 1.1): the home h1 only, inside the purple "say" block.
- **Page** (`.h-page`, 3 / 3.75rem, leading 1.02): h1 on Programs, About and MDX pages. Programs and About set it in a purple hat block.
- **Section** (`.h-section`, 1.875 / 2.25rem, leading 1.15): every section h2.
- **Card** (`.h-card`, 1.5rem, leading 1.2): contest card, script and person titles, MDX h2 block.
All four are display 800; sizes come from `--text-hero/page/section/card` in `@theme`. Never size a heading ad hoc.
- **Body** (400, text-lg, ink-soft for lead paragraphs): max-w 50-65ch.
- **Label** (display 700-800, text-lg to xl): hat and button block labels. Not uppercase, no tracking.

### Named Rules
**The Op Word Rule.** Op words ("when", "say", "repeat", "quick facts") are inline grammar inside a block, via the `Op` helper or aria-hidden span. They are never standalone eyebrow or kicker labels above a heading.

## 4. Elevation

Hybrid but flat at rest: depth comes from the block's inset bottom edge and a tight drop shadow, and from lift on interaction. Shadows are structural (they make a block read as a physical piece), not ambient.

### Shadow Vocabulary
- **Block rest** (`filter: drop-shadow(0 2px 2px)` in ink at 14% via color-mix, plus `inset 0 -4px 0 var(--cb-edge)` (black 14%) on body): every block. Filter, not box-shadow, so notch and tab are shadowed.
- **Block lift** (`drop-shadow(0 10px 14px rgb(27 26 43 / 0.22))`, translate(-2px,-3px) rotate(-0.6deg)): interactive blocks on hover, only under `@media (hover: hover)`.
- **Block press** (`drop-shadow(0 1px 1px ...)`, translate(0,2px), 70ms): active.
- **Focus glow** (double yellow drop-shadow 3px/6px plus inset 3px ink ring on body): focus-visible on block links and buttons, reading as Scratch block selection. Plain elements get a 3px blue outline, 3px offset.
- **Slot well** (`inset 0 1px 2px rgb(0 0 0 / 0.18)`): value slots.

### Named Rules
**The Dragged-Block Rule.** Only blocks that are links or buttons (`a.cb`, `button.cb`, `.cb-lift`) lift. Static blocks never move on hover.

### Tokens (`@theme`)
Radius: `--radius-block` 8px, `--radius-panel` 16px (bordered panels, portraits), `--radius-media` 12px (images). Shadows: `--shadow-soft` (media), `--shadow-pill`. Fill: `--color-lilac` (bio card, inline code).

## 5. Components

### Block (`components/Block.tsx`, `.cb`)
Props: `color` (yellow, orange, green, purple, blue, teal, pink), `shape` (stack, hat, cap), `href`, `external`, `size` (`sm` px-3 pt-2 pb-1.5, `md` default px-5 pt-4 pb-3, `lg` px-6 pt-5 pb-4; hats get 0.25rem more top), `bodyClassName` (layout and type extras only, never padding). Renders a Next Link, an external `<a>` (noopener), or a div. Radius 8px; top notch (36x9 mask at 18px offset) and bottom tab join stacked blocks. Hat: 28px top radius, no notch. Cap: no bottom tab. The bottom tab uses the same `--cb-edge` darkening as the body inset edge, so the join is seamless.

### Slot (`.slot`)
Pill (999px) white inset well with ink text, holds a value: "Free", "grades 3-8", course names, quick facts.

### Op (`components/Op.tsx`)
Inline op word ("repeat", "quick facts", "at a glance") inside a block.

### Primary CTA and CtaPair (`components/CtaPair.tsx`)
`CtaPrimary` is the single source of the copy (`hero` gives the large arrow version). `CtaPair secondary={{label, href}}` is the green primary plus a blue secondary, used at the end of About, Programs and MDX pages.
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
Every page uses `.wrap` (max-w-7xl, gutters 16 / 24 / 40px) with `.page-top` (2.5rem, 4rem from md) and `.page-bottom` (5rem). Sections are separated by `.section` (6rem, 7rem from md) only. Home hero is two columns: script stack left, contest right. Course list rows are a grid of a 9rem category column plus content.

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
- Safety and FAQ sections are pending owner facts.
