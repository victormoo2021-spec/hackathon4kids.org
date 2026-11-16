---
name: Hackathon4Kids
description: Free coding classes for grades 3-8, taught by high-school students. Deep night, painted with light.
colors:
  yellow: "#ffd60a"
  purple: "#7c5cff"
  purple-soft: "#a78bff"
  page: "#0a0710"
  card: "#15101f"
  raised: "#2a1d47"
  editor: "#0d0916"
  text: "#f6f4fb"
  text-body: "#e4dff0"
  text-lede: "#cfc9de"
  text-dim: "#b9b2cc"
  line: "rgb(255 255 255 / 0.12)"
  line-strong: "rgb(255 255 255 / 0.24)"
typography:
  hero:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3rem, 7.2vw, 6.5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 6.2vw, 6.25rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 5.5rem)"
    fontWeight: 680
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  lede:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.1875rem, 1.5vw, 1.375rem)"
    fontWeight: 450
    lineHeight: 1.45
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  code:
    fontFamily: "ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "3.1cqw"
    lineHeight: 1.55
rounded:
  focus: "8px"
  card: "1.5rem"
  pill: "999px"
spacing:
  gutter-mobile: "1.25rem"
  gutter: "2rem"
  container: "76rem"
  section: "clamp(5rem, 9vw, 8rem)"
  page-section: "3.5rem"
  page-section-lg: "5.5rem"
  tap-min: "2.75rem"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.4rem"
    height: "2.75rem"
  button-primary-lg:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 1.75rem"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "#ffe14d"
    textColor: "{colors.page}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.4rem"
  nav-cta:
    textColor: "{colors.yellow}"
    rounded: "{rounded.pill}"
    padding: "0 0.875rem"
    height: "2.125rem"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "1.75rem"
  link:
    textColor: "{colors.yellow}"
  chip:
    textColor: "{colors.text-body}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
---

# Design System: Hackathon4Kids

## Overview

**Creative North Star: "Painting with Light at Night"**

A deep-night page where a kid's six lines of code visibly paint the light behind it. The hero laptop types `paint.py`; each line that lands changes a glass prism ring and a light field that live behind every page. Everything else stays quiet: dark surfaces, hairlines, a single yellow, very few words.

Density is low and copy is minimal: one claim per section, set huge (hero, Courses, "One instructor. Up to 20 kids.", "Run by high-school students since 2018.", Formats, FAQ, "Get the next class dates."). Depth comes from light behind glass, not from boxes stacked on boxes.

**Key Characteristics:**
- All dark (`color-scheme: dark`); no light theme exists.
- Yellow is the eye path: the one action, the highlighted words, the program's values, the guiding streak.
- Purple and violet are the light itself (glows, ring, caret, secondary links), never body text on cards below 7:1.
- Live WebGL is decoration only: content, CTA and headings work with no JS, no GPU and reduced motion.

## Colors

One saturated accent (yellow) on a violet-black ground, with purple as the colour of light rather than of UI.

### Primary
- **Signal Yellow** (yellow): the primary button, highlighted words in display type (`.hl`), focus rings, text selection, `accent-color`, numeric/boolean values in the editor, the FAQ open bar and summary hover, the yellow text link. Page ink on yellow is 14.2:1.

### Secondary
- **Prism Purple** (purple): glows, ring tint, editor active-line wash (10%) and Run pill tint (14%). 4.3:1 on card, so large text or non-text only.
- **Soft Lavender** (purple-soft): the editor caret and prompt, "Read more" style secondary links. At least 7:1 on page and card.

### Neutral
- **Night** (page): `html` background and the fallback colour of every canvas.
- **Ink Card** (card): cards, editor title bar. **Raised** (raised): scrollbar thumb, small decorative dots. **Editor** (editor): code window and laptop screen.
- **Moon White** (text): headings and emphasised text. **Body** (text-body): paragraphs, nav links. **Lede** (text-lede): ledes and the hero sub-line. **Dim** (text-dim): course blurbs, footer column labels, the dimmed second line of a statement. All four are at least 7:1 on page and card.
- **Hairline** (line) and **Hairline Strong** (line-strong): every divider, card border, secondary-button ring, hover border.

### Named Rules
**The Eye Path Rule.** Yellow marks only what the eye should travel to: the one action, the one or two highlighted words of a heading, the program's values, the guiding streak. If a screen has two yellow things competing, one of them is wrong.

**The Light Is Not Ink Rule.** Purple is light (glow, tint, caret). Body text is never set in `purple`; use `purple-soft` when a lavender text link is needed.

## Typography

**Display / Body Font:** the platform system stack (SF Pro on Apple) as shipped. The display role is provisional, not a rule: a dedicated display face may replace it; the scale, weights and tracking below are the system. **Mono:** `ui-monospace` stack, used only inside the editor window.

**Character:** big, tight, heavy display (700, -0.04em) against calm 1.125rem body; the contrast is size and weight, not family.

### Hierarchy
- **Hero** (700, clamp 3rem–6.5rem, 0.98; 6vw and 0.96 from 1100px; max 11–12ch): the home h1 only, split per word for the entrance.
- **Display** (700, clamp 2.25rem–6.25rem, 0.98): one-line statements and the final CTA heading, up to two lines.
- **Headline** (680, clamp 2.5rem–5.5rem, 1.02): section titles (Courses, FAQ, page sections).
- **Title** (650, clamp 1.5rem–2.25rem, 1.15): category names, format names, card names.
- **Lede** (450, clamp 1.1875rem–1.375rem, 1.45, text-lede): one sentence under a page title, max 36rem.
- **Body** (400, 1.0625rem mobile / 1.125rem from 48rem, 1.55): `text-wrap: pretty`, FAQ answers at max-prose.
- **Label** (500–600, 0.875rem): nav, nav CTA, footer column labels (sentence case, normal tracking).

### Named Rules
**The Two Words Rule.** A heading carries at most one yellow phrase ("Free … grades 3-8.", "Courses", "20", "high-school", "class dates"). Highlight is meaning, not decoration.

**The Balanced Heading Rule.** h1–h3 use `text-wrap: balance` and negative tracking; never letter-space display type open.

## Layout

Single centred column, `container-x`: max 76rem, inline padding 1.25rem (2rem from 48rem). Home sections breathe on `section-y` (clamp 5rem–8rem); inner pages use `page-hero` (top clamp 7rem–9rem) and `page-section` (3.5rem, 5.5rem from 64rem). Hero is one viewport (min `max(100svh, 40rem)`), copy left and laptop right from 900px (1fr / 1.25fr, laptop at 120% width bleeding left), stacked below. Lists are rows split by hairlines, not card grids: Courses is a 1fr/2fr spec table, Formats two columns split by a vertical rule, FAQ a 5fr/7fr split with a sticky heading. Cards appear only on inner pages (instructor grid: 1/2/3 columns). Footer grid is 1.6fr 1fr 1.4fr 1.2fr from 64rem. Every tap target is at least 2.75rem tall.

## Elevation & Depth

Depth is a three-layer stack fixed behind the document, then flat content on top:

1. **Prism canvas** (`z-index: -2`, fixed): WebGL2 (three.js) ring of up to 8 glass bars refracting a warping purple-to-gold gradient, with bloom. In the hero it frames the laptop; past the hero it rides the right gutter (dims and slides off-edge rather than crossing copy; phones keep only the glow); at the final CTA it docks as one ring around heading and button and fires `fx:arrive`, which reveals the button.
2. **Fluid canvas** (`z-index: -1`, fixed): stable-fluids sim, pale gold ink with violet edges, stirred by pointer and lightly by scroll. Clamped to low luminance behind any text block (shield of `p, li, h1–h4, a, button, summary, [data-spectral]…`).
3. **Content**: hairline cards (`card`) with a top-edge inner highlight and a deep neutral drop; sticky header on 88–92% night glass with `saturate(180%) blur(20–28px)`.

**Laptop 3D:** a CSS space-black laptop renders first (no CLS, no WebGL needed); on a real GPU a lazy R3F laptop fades over it (300ms) once its first frame lands, with the screen DOM pinned by a CSS `matrix3d` homography so the code stays crisp text. It yaws toward the pointer, gently until `follow_mouse = True` lands.

**Sketch → fx mapping** (each completed line acts at once; before line 2 the field rests as a faint violet single ribbon at 0.4 intensity):
- `# paint with light`: comment, no change.
- `glow = "purple"`: hue/brightness pulse (450ms) to purple + gold accent; intensity to 1.
- `streaks = 5`: ring grows to 5 bars (about a 400ms under-damped spring each).
- `speed = 2`: spin kick (600ms) and faster flow.
- `sparkle = True`: glints on the bars plus a bloom pop (500–600ms).
- `follow_mouse = True`: bars and laptop tilt toward the pointer.
Scrolling away early finishes the sketch instantly (`FX_FINAL`).

**Slit-glass headings:** any `[data-spectral]` heading the pointer stirs is handed to the fluid canvas: DOM glyphs fade to transparent (150ms, class `is-prism`) and the canvas draws them through fine vertical reeds (ribs a tenth of an em) with six-band dispersion, bent only near the pointer's path; when the bend dies the DOM glyphs fade back first and the canvas copy leaves after. Text stays in the DOM, selectable and read by assistive tech; at most 4 headings at once.

### Shadow Vocabulary
- **Card** (`0 1px 0 rgb(255 255 255 / 0.10) inset, 0 30px 80px -30px rgb(0 0 0 / 0.8)`): every card.
- **Yellow edge** (`0 1px 0 rgb(255 255 255 / 0.5) inset`): primary button at rest.
- **Heading halo** (`text-shadow: 0 0 28px rgb(10 7 16 / 0.9)`): `h2[data-spectral]` and hero sub-line (24px, 0.85), for legibility over light.
- **Contact shadow**: a radial black ellipse under the laptop.

### Named Rules
**The Behind-Glass Rule.** Light lives behind the page (negative z), never above content. No coloured glows on cards; card depth is neutral black.

**The Zero-Cost-When-Idle Rule.** Effects load after `load` + idle (phones: after first touch/scroll or 4s), probe the GPU once (`gpuTier`), run at display rate only while something changes, 30fps for the steady spin, and stop drawing when nothing moves. Fluid loads on first interaction only.

**The Honest Fallback Rule.** Software GL (SwiftShader, llvmpipe) or no WebGL2: Prism becomes a static CSS radial purple glow on night, the fluid never starts, the CSS laptop stays. The CTA still appears by scroll trigger.

Measured budgets (M3, shipped build): Lighthouse mobile 98 / desktop 100; frame p95 16.7–16.8ms. New effects must hold these.

## Shapes

Pills for every action and chip (999px); soft 1.5rem cards; 8px focus-ring corners; round avatars with a 1px white/12% ring. The laptop and editor use container-query units (`cqw`) so the device scales without layout shift. Dividers are 1px hairlines that scale in from an edge (`--rule`). The FAQ plus rotates 45° into an ×.

## Components

### Buttons
- **Shape:** full pill (999px), min height 2.75rem; `btn-lg` 3.25rem and 1.0625rem.
- **Primary (EmailCta):** yellow on night, label fixed as "Get class dates by email" + arrow (compact: "Get class dates"); opens the mailing list in a new tab with an sr-only notice. The only primary action on the site.
- **Hover / Active:** rise 1px, background `#ffe14d`; press scales to 0.97 (100ms). Distances multiply by `--m`.
- **Secondary:** transparent, inset 1px line-strong ring (40% white on hover).

### Navigation
Sticky header over night glass (60% at top, opaque-ish once scrolled), 0.875rem/500 links with a 1px underline that wipes in from the left; current page in white. Right side: outlined yellow pill "Get class dates". Mobile: full-height night sheet, 2rem/680 links staggered 55ms each, contact line at the bottom; menu icon cross-rotates 90°.

### Links
Yellow text with a 1px underline that wipes left-to-right on hover/focus (300ms); arrow links nudge their arrow 4px. Reduced motion: a plain 40% underline that goes solid.

### Cards / Chips
Cards: card background, hairline border, card shadow, padding 1.5–1.75rem; `lift` raises 2px and strengthens the border on fine-pointer hover only. Chips: pill, 0.875rem, hairline border or 6% white fill.

### FAQ
Native `<details>`: rows split by hairlines, 1.25rem/600 summary at least 72px tall; open/hover indents 1rem, turns yellow, and grows a 2px yellow bar down the left edge; content height animates via `::details-content`.

### Editor (signature)
`paint.py` window in the laptop: title bar with a file tab and a purple Run pill, numbered lines (active line on a 10% purple wash, blinking lavender caret), syntax colours comment/`=` `#a9a2c0`, strings `#e9d5ff`, numbers/booleans yellow; a terminal row echoes the last line (`glow → purple`). Visual is `aria-hidden`; an sr-only paragraph and the full sketch describe it.

### Motion
Easing: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) for movement, `--ease-apple` cubic-bezier(0.25, 0.1, 0.25, 1) for colour/opacity. `--m` is 1, or 0 under reduced motion; every CSS distance is multiplied by it, so calm mode is opacity only. Hero entrance is pure CSS (words rise 800ms, staggered 50ms; sub-line 380ms; CTA 480ms). Section reveals (GSAP, once): rise 16px/700ms, fade 800ms, clip 800ms expo, rules 900ms; statement lines slide up out of a mask (900ms, 120ms stagger). Unrevealed content is opacity-0, never hidden, so it stays focusable; without JS everything is visible. Native scrolling, no smooth-scroll library. Page transitions: 180ms out, 400ms rise in.

## Do's and Don'ts

### Do:
- **Do** keep one yellow action per view and one yellow phrase per heading (The Eye Path Rule).
- **Do** keep every text pair at the recorded contrast: text, body, lede, dim, purple-soft all at least 7:1 on page and card.
- **Do** mark new large headings `data-spectral` so they join the slit-glass layer, and keep their DOM text real.
- **Do** multiply every motion distance by `--m` and give each GSAP effect a calm branch (fade only, shorter).
- **Do** keep the 2px yellow focus ring (3px offset) and 2.75rem tap targets; external links carry "(opens in a new tab)" for screen readers.
- **Do** ship a working no-GPU and no-JS state for any new effect, and check it against the measured budgets.
- **Do** keep copy minimal and factual: no invented stats or outcomes; instructors appear as first name + grade/role only; roster and contest details are updated separately by the owner, so do not hard-code or reword them.

### Don't:
- **Don't** put effects above content or let a prism bar cross body copy or a button.
- **Don't** set body text in `purple` (4.3:1).
- **Don't** add coloured glows to cards or surfaces; depth is neutral.
- **Don't** reword the EmailCta label or add a second primary action.
- **Don't** add a smooth-scroll library or scroll-scrubbed headline masks (a parked half-mask reads as clipped text).
- **Don't** add a light theme section; the world is dark end to end.
