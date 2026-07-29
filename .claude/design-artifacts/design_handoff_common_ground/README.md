# Handoff: Common Ground — Thrive65 redesign tokens & home page

## Overview
This bundle applies the **Common Ground** brand system to the Thrive65 site (the
Jekyll + CUBE CSS repo). It contains the finalized **design tokens**, a hue-
swapping architecture for testing brand-color options, and a home-page reference
prototype. Tone: "civic optimism, built to last" — framed, print-poster
aesthetic in prairie green / lake teal / marigold, with light + dark themes.

## About the design files
The `.dc.html` files under `reference/` are **design references** — HTML
prototypes showing the intended look and behavior. They are **not** production
code to copy directly. The task is to **recreate them in the repo's existing
environment**: Jekyll templates (`_includes` / `_layouts`) styled through the
CUBE CSS in `assets/css/main.css`. `tokens.css` in this bundle *is* meant to be
used directly — it replaces the old `:root` token block.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii and border weights are
final and exact. Recreate pixel-faithfully using the repo's own primitives
(`.wrapper`, `.region`, `.flow`, the `@layer` cascade). The one *illustrative*
piece is the hue swap — see "Hue architecture" below; **Lake Teal is the live
shipping brand**, the other three hues are exploration options.

---

## What carries over vs. what changes

| Aspect | Old (`main.css`) | New (Common Ground) | Verdict |
|---|---|---|---|
| Cascade layers `reset→…→exception` | ✓ | ✓ | **Keep** |
| Composition primitives (`.wrapper/.region/.flow/.cluster/.repel`) | ✓ | ✓ | **Keep** |
| Utopia type scale (`--step-*`) | ✓ | identical | **Keep** |
| Utopia spacing (`--space-*`) | ✓ | identical | **Keep** |
| Line-height tokens | ✓ | identical | **Keep** |
| Body font | Public Sans | Public Sans | **Keep** |
| Display font | **Fraunces** serif 600 | **Archivo** 800, −0.01em | **Change** |
| Palette | warm cream/marigold/leaf | green/teal + marigold, hue-swappable | **Change** |
| Theme | light only | **light + dark** | **Change** |
| Borders | 1px `--color-line` | **2px `--edge` framed look** | **Change** |
| Radii | single `14px` | 12 / 10 / 8 / pill / callout | **Change** |
| Spot illustration | none | line-art scene, colors = tokens | **New** |

### Token rename map (old → new)
Old `--color-*` names are retired. Replace usages:

| Old | New | Notes |
|---|---|---|
| `--color-ink` | `--ink` | |
| `--color-paper` | `--bg` | |
| `--color-paper-alt` | `--band-alt` (or `--tint` for washes) | pick by role |
| `--color-slate` | `--muted` | |
| `--color-line` | `--line` | hairlines; use `--edge` for the 2px frame |
| `--color-leaf` | `--brand` | |
| `--color-leaf-dark` | `--brand-strong` | |
| `--color-marigold` | `--accent` | CTA fill / highlights |
| `--color-sun` | `--accent-hover` | hover state |
| (none) | `--secondary` | teal eyebrows / 2nd headings |
| (none) | `--bloom` | moment-of-change accent only |
| (none) | `--edge`, `--focus`, `--hero-*`, `--footer-*` | new roles |

---

## Design tokens
All values live in **`tokens.css`** (this bundle) and in
`thrive65-redesign-tokens.md` Section 2 (reconciled copy included here). Highlights:

**Shared — light / dark**
- bg `#F7F5EC` / `#0B1410` · card `#FFFFFF` / `#17251C` · tint `hsla(150,30%,91%)` / `#123122`
- line `hsla(150,20%,83%)` / `#283A2E` · ink `#14231B` / `#E9F2EA` · muted `hsla(150,16%,30%)` / `#A9BBAD`
- edge `#0B0B0B` (both) · on-accent `#221B05` (both) · focus `#D42A56` / `#8CE7B7`
- secondary `hsla(189,65%,22%)` / `hsla(189,65%,60%)`
- accent `#FFB01A` (both, constant) · accent-hover `#FFC44F` (both) · bloom `#D42A56` / `#FF5D7B`
- footer-bg `#070E0A` · footer-head `#EDF5EE` · footer-ink `#B7CCBD` (all shared)

**Hue families** (only these 8 tokens change per hue — brand, brand-strong, link, hero-bg, hero-ink, hero-muted, hero-em, band-alt). Full values in `tokens.css`.

**Borders & radii:** thin `1px`; bold `2px` in `--edge`. Radii — card `12px`, inner link `10px`, small `8px`, pill `999px`, callout `0 12px 12px 0`.

**Type:** Archivo 800 (`-0.01em`) display; Public Sans 400/500/600/700 body, 17px / 1.6.

---

## Hue architecture (test brand options per page)
`tokens.css` puts hue-varying tokens on **wrapper classes**, independent of the
light/dark theme:

- `.hue-lake-teal` (live brand · default), `.hue-evergreen`, `.hue-electric-blue`, `.hue-ultraviolet`

**Whole-page swap** — put the class on `<body>`:
```html
<body class="hue-ultraviolet"> … </body>
```
**Section-level comparison** — put it on any wrapper:
```html
<section class="hue-evergreen"> … </section>
<section class="hue-electric-blue"> … </section>
```
Everything downstream (buttons, links, hero, illustration) retints automatically
because components reference `var(--brand)` / `var(--hero-bg)` etc. No component
edits needed to swap hues.

**Theme × hue are orthogonal:**
```html
<html data-theme="dark"><body class="hue-evergreen"> … </body></html>
```

**Theme init** (put in `<head>` before the stylesheet so "auto" resolves with no flash):
```html
<script>
  (function () {
    var t = localStorage.getItem("theme") || "auto";
    var dark = t === "dark" ||
      (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  })();
</script>
```
For a Jekyll-wide hue default, set `--brand` etc. via the `.hue-lake-teal` class
on `<body>` in `_layouts/default.html`, and override per page with front matter
(e.g. a `hue:` key → `class="hue-{{ page.hue }}"`).

---

## Screens / views — Home page
Structure mirrors the current site; only color/type/theme/borders change.

### Header (sticky)
- `--bg` background, `1px var(--line)` bottom border, sticky top.
- Wordmark: Archivo 800, "Thrive" in `--ink` + "65" in `--brand`; schoolhouse mark
  (accent roof/door, brand body, `--edge` strokes).
- Nav links `--ink`, hover `--brand`. "Join us" pill: `--accent` fill, `--on-accent`
  label, `2px var(--edge)` border, `--radius-pill`, hover `--accent-hover`.
- Theme toggle (sun/moon), Resources dropdown (`--card` menu, `1px var(--line)`).

### Hero (full-bleed band)
- Background `--hero-bg`, text `--hero-ink`.
- Eyebrow: Public Sans 700, `+0.14em`, uppercase, `--hero-muted`.
- Headline: Archivo 800, `--step-5`, `max-width: 16ch`; "thrive" set italic in `--hero-em`.
- Subhead `--hero-muted`; primary CTA = Marigold pill (as header). One accent CTA per view.
- **Illustration:** line-art neighborhood scene, full height of the band, bleeding
  to the right edge (grass anchored bottom-right). Sun sits left, pennant flags trail
  off the right edge. All fills use `--art-*` (which alias brand/accent/bloom/edge/card),
  so it retints with the hue automatically.

### Overview
- Teal eyebrow ("The coalition") in `--secondary`; `--step-3` H1; `--step-2` H2s.
- Pillar sub-headings (`--step-1`) in `--brand`. Body `--ink`, `max-width` ~64ch.

### FAQ (alternating band)
- Section background `--band-alt`; teal eyebrow ("Questions") in `--secondary`.
- Accordion items: `--card`, `2px var(--edge)` frame, `--radius-card`; native
  `<details>`/`<summary>` with a CSS plus/minus toggle in `--brand`.

### Signup (hero band)
- `--hero-bg` background; eyebrow ("Get involved") in `--hero-muted`.
- Framed email input + Marigold "Subscribe" button, joined pill (`2px var(--edge)`).

### Footer
- `--footer-bg`; wordmark with "65" in `--accent`; body `--footer-ink`, heads `--footer-head`.

Section transitions use SVG curve/wave dividers filled with the adjacent band color.

---

## Interactions & behavior
- **Links:** body `--ink` text with a `--link` underline (2px, 0.2em offset); on hover the text goes `--link` and the underline `--brand-strong`.
- **Buttons:** hover swaps background per type (accent→accent-hover; secondary→10–12% edge/white wash; bloom→10–12% bloom wash). Pressed leans on `--brand-strong`.
- **Focus:** visible outline everywhere — `3px solid var(--focus)`, offset 2px (bloom on light, `#8CE7B7` on dark). Keep the skip link.
- **Bloom:** reserved strictly for "the one thing that changed and needs you now" — never headlines of fear, never decorative.
- **Motion:** honor `prefers-reduced-motion`.
- **Theme toggle:** persist to `localStorage.theme` (`auto|light|dark`); reflect on `<html data-theme>`.

## Accessibility
Every text/background pairing verified ≥ 4.5:1 in both themes. Marigold on hero is
large type & UI only (4.18:1 light · 4.92:1 dark). Visible focus outlines + skip
link + reduced-motion support.

## Assets
No images or icon fonts. Fonts: **Archivo** + **Public Sans** via Google Fonts:
`https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,700;0,800;1,800&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`
The schoolhouse logo and hero scene are inline SVG (see `reference/Redesign Home.dc.html`).

## Files in this bundle
- `tokens.css` — paste into the CUBE CSS token layer (replaces old `:root` colors).
- `thrive65-redesign-tokens.md` — reconciled source-of-truth (drop into `claude-design/`, replacing the old one).
- `CLAUDE.md` — staged prompts + golden rule for Claude Code.
- `reference/Redesign Home.dc.html` (+ `support.js`) — the home-page prototype. Open in a browser to see the target.

## How to run this in the repo (summary)
1. Replace `claude-design/thrive65-redesign-tokens.md` with the copy here.
2. Merge `tokens.css` into `assets/css/main.css` `:root` (+ dark + `.hue-*` blocks); delete old `--color-*`.
3. Swap the Google Fonts link (Fraunces → Archivo) in `_includes/head.html`; set `--font-display: "Archivo"`.
4. Update `@layer base`/`block`/`utility` rules to the new token names + framed 2px-edge borders + radii; add the dark theme + theme-init script.
5. Rebuild each block (`.hero`, `.button`, `.faq-item`, header/footer) to match `reference/Redesign Home.dc.html`.
6. Set a default `.hue-lake-teal` on `<body>`; wire a `page.hue` front-matter override for testing other hues.
