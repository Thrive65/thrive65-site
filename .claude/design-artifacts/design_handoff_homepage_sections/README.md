# Handoff: Homepage — Two New Sections (`#what-we-believe`, `#the-current-situation`)

## Overview
Adds two standalone sections to the Thrive65 homepage, splitting content that currently lives inside `#overview`:

1. **What We Believe** — the three pillars, simplified to a three-column card layout. Comes directly after `#overview`.
2. **The current situation** — the bullet list recast as a grid of open stat columns (big labeled figure + one-sentence support), with a "Read more" CTA at the bottom. Comes after `#what-we-believe`.

Each section sits on its own background band with wave transitions, following the site's existing band/wave pattern. Everything else on the homepage is unchanged.

## About the Design Files
`Homepage – New Sections.dc.html` is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code to copy directly. The task is to recreate the two new sections in the **existing Jekyll codebase** (`thrive65-site`), using its established patterns: `index.md` section blocks, `_includes/*.md` content files, and the CUBE CSS layers in `assets/css/main.css`. All other markup in the prototype is a faithful recreation of the current live homepage and needs no work.

## Fidelity
**High-fidelity.** Built entirely from the site's own `main.css`, design tokens, fonts, and section patterns. Recreate 1:1.

## Target codebase changes (summary)
- `index.md` — insert two new `<section>` blocks + two extra `.wave` dividers between `#overview` and `#faq` (see markup below). Background sequence becomes: hero (`--hero-bg`) → overview (`--bg`) → what-we-believe (`--band-alt`) → current-situation (`--bg`) → FAQ (`--band-alt`) → signup (`--hero-bg`). Update each wave's `--wave-above`/`--wave-below` accordingly.
- `_includes/home-overview.md` — remove "The current situation" and pillar content; keep only the "The Coalition / Who we are" eyebrow, heading, and its two paragraphs. NOTE: this file is overwritten by the Google-Docs publish flow — coordinate the content split with that workflow (the new sections likely should NOT live in the publish-managed file, or need their own Docs).
- `assets/css/main.css` — add two small blocks to `@layer block` (classes below). No new tokens needed; everything uses existing custom properties.

## Screens / Views

### Section 1: What We Believe (`id="what-we-believe"`)
- **Purpose**: communicate the three pillars at a glance.
- **Section**: `<section id="what-we-believe" class="region bg-surface-alt">` (background `var(--band-alt)`, block padding `var(--space-xl)` from `.region`).
- **Wrapper**: `.wide.wrapper` (66rem cap — the three columns need the wide cap, not the default 41rem measure).
- **Eyebrow + heading**: classless pattern already in main.css — first `<p>` "Our Pillars" followed by `<h2>What We Believe</h2>` (eyebrow auto-styles: Public Sans 700, `--step--1`, 0.14em tracking, uppercase, `--secondary`).
- **Grid**: `display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-s); margin-block-start: var(--space-m);`
- **Pillar card** (×3): framed-card treatment matching `.faq-item` / blockquote callouts:
  - `background: var(--card); border: var(--border-bold) solid var(--edge); border-radius: var(--radius-card); padding: var(--space-m);`
  - `display: flex; flex-direction: column; gap: var(--space-xs);`
  - `<h3>` — global scale (Archivo 800, `--step-1`), `margin: 0`.
  - Body `<p>` — `--step-0`, ink, `margin: 0`.
  - Takeaway `<p><strong>` — pinned to the card bottom with `margin-block-start: auto` so takeaways align across columns.

**Copy (exact):**
| Heading | Body | Takeaway (bold) |
|---|---|---|
| Equitable Excellence | Every student deserves an equitable, excellent education. Equity and excellence are not competing goals — they are mutually supportive commitments, built on great teaching, strong programs, and the whole-child development of every student. | The core purpose of District 65 is to help students thrive. |
| Financial Responsibility | A thriving district needs maintained facilities, a strategically aligned budget, and stable reserves. A budget is only truly balanced when its fixes repeat every year — not one-time influxes, and not deferred maintenance. | Financial health is a foundation for thriving students. |
| Valuing Our Educators | Uncertainty has a cost, and our educators have carried it alongside us for years. Any real plan must treat teachers, support staff, administrators, and school employees with clarity, respect, and fairness — and support their growth. | Empowered and equipped educators are a foundation for thriving students. |

### Section 2: The current situation (`id="the-current-situation"`)
- **Purpose**: make the district's numbers land at a glance; replaces the bullet list.
- **Section**: `<section id="the-current-situation" class="region">` (background `var(--bg)`).
- **Wrapper**: `.wide.wrapper`.
- **Eyebrow + heading**: `<p>By the numbers</p>` + `<h2>The current situation</h2>` (same classless pattern).
- **Grid**: `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: var(--space-s); margin-block-start: var(--space-m);`
  - `18rem` min ⇒ 3 per row at the 66rem cap (the chosen default). A 4-per-row variant uses `13rem` — implement as the default only if the team prefers denser.
- **Stat column** (×9, open style — no card frame, no background, no padding box):
  - `display: flex; flex-direction: column; gap: var(--space-2xs);`
  - **Figure/label** `<span>`: Archivo (`--font-display`) 800, `font-size: var(--step-3)`, `line-height: 1.1`, `letter-spacing: -0.01em`, `color: var(--brand)`, `text-wrap: balance`.
  - **Support** `<p>`: `font-size: var(--step--1)`, ink, `margin: 0`.
- **CTA**: centered below the grid (`text-align: center; margin-block-start: var(--space-l)`), styled identically to the hero CTA pill: `display: inline-block; font-weight: 700; text-decoration: none; padding: 0.8em 1.7em; border: var(--border-bold) solid var(--edge); border-radius: var(--radius-pill); background: var(--accent); color: var(--on-accent);` hover `background: var(--accent-hover)`. Label: **Read more**. `href` → the in-depth explainer page (URL TBD — prototype uses `#`).

**Copy (exact — figures + support sentences, minimally edited from the current bullets):**
1. **−25% Enrollment** — Enrollment is down since 2018 — a steeper drop than any nearby district.
2. **Under 70% Full** — Projected utilization at our elementary schools this year.
3. **$410M in Repairs** — In repairs coming due on aging buildings by 2037 — against a maintenance budget of $2.4 million a year.
4. **$10M More Cuts** — In additional operating cuts still to be found by 2030, on top of what's already been done.
5. **90 Days of Cash** — Cash reserves near the district's own floor — bottom 5% of school districts statewide.
6. **5% Revenue Cap** — Property tax revenue is capped at the lesser of 5% or inflation, and grows more slowly than the district's costs — especially benefits, building maintenance, and contractual obligations.
7. **4 Leadership Exits** — Departures from District leadership in 2026 — including the superintendent, CFO, Assistant Superintendent of Instructional Leadership, and Director of Schools Management.
8. **Interim Ends Dec 2026** — New interim superintendent and CFO started in July — and the interim superintendent is only here through December 2026.
9. **6-Month Leadership Gap** — A leadership gap in early 2027, between the interim's departure on December 31, 2026 and the permanent hire's targeted July 1, 2027 start. The next year's budget gets built during that window.

## Suggested index.md markup

```html
<div class="wave" style="--wave-above: var(--bg); --wave-below: var(--band-alt);" aria-hidden="true"></div>

<section id="what-we-believe" class="region bg-surface-alt">
  <div class="wide wrapper">
    <p>Our Pillars</p>
    <h2>What We Believe</h2>
    <div class="pillar-grid">
      <div class="pillar-card">
        <h3>Equitable Excellence</h3>
        <p>…body…</p>
        <p class="pillar-takeaway"><strong>…takeaway…</strong></p>
      </div>
      <!-- ×3 -->
    </div>
  </div>
</section>

<div class="wave" style="--wave-above: var(--band-alt); --wave-below: var(--bg);" aria-hidden="true"></div>

<section id="the-current-situation" class="region">
  <div class="wide wrapper">
    <p>By the numbers</p>
    <h2>The current situation</h2>
    <div class="stat-grid">
      <div class="stat">
        <span class="stat-figure">−25% Enrollment</span>
        <p>…support…</p>
      </div>
      <!-- ×9 -->
    </div>
    <div class="text-center stat-cta">
      <a class="cta-pill" href="/explainer/">Read more</a>
    </div>
  </div>
</section>

<div class="wave" style="--wave-above: var(--bg); --wave-below: var(--band-alt);" aria-hidden="true"></div>
```

Then update the existing `#faq` wave above it (currently `--wave-above: var(--bg)`) — with the new sections it becomes the third wave shown above, and the original overview→faq wave is replaced by overview→what-we-believe. The `.wave:nth-of-type(3n…)` silhouette cycling handles shape variety automatically; no changes needed there.

## Suggested CSS additions (`@layer block` in main.css)

```css
/* ─ Pillar cards (What We Believe) ─ */
.pillar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-s);
  margin-block-start: var(--space-m);
}
.pillar-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  background: var(--card);
  border: var(--border-bold) solid var(--edge);
  border-radius: var(--radius-card);
  padding: var(--space-m);
}
.pillar-card h3, .pillar-card p { margin: 0; }
.pillar-takeaway { margin-block-start: auto !important; }

/* ─ Stat columns (The current situation) ─ */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-s);
  margin-block-start: var(--space-m);
}
.stat { display: flex; flex-direction: column; gap: var(--space-2xs); }
.stat p { margin: 0; font-size: var(--step--1); }
.stat-figure {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--step-3);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--brand);
  text-wrap: balance;
}
.stat-cta { margin-block-start: var(--space-l); }
.cta-pill {
  display: inline-block;
  font-weight: 700;
  text-decoration: none;
  padding: 0.8em 1.7em;
  border: var(--border-bold) solid var(--edge);
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--on-accent);
}
.cta-pill:hover { background: var(--accent-hover); }
```

Note: PurgeCSS runs on the built site in CI — the new classes appear in rendered pages so they survive, but if any are added conditionally, check the safelist in `postcss.config.cjs`.

## Interactions & Behavior
- No JS. Both sections are static.
- Grids collapse naturally on mobile via `auto-fit`/`minmax` (single column below ~18rem available width; `min(100%, 18rem)` prevents overflow on very narrow screens).
- "Read more" CTA: standard link navigation to the explainer page; hover swaps `--accent` → `--accent-hover` (200ms ease, matching site convention).
- All colors are tokens, so dark theme, high-contrast, colorblind palette, dyslexia font, and text-size settings work with zero extra effort. Verify stat-figure contrast in dark mode (`--brand` becomes `#3FD9C0` — fine on `--bg` dark).

## State Management
None.

## Design Tokens
All from the existing `assets/css/main.css` — no new values:
- Backgrounds: `--bg #F7F5EC`, `--band-alt hsla(189,30%,92%,1)`, `--card #FFFFFF` (light theme; dark variants already defined)
- Text: `--ink #14231B`, figure color `--brand #0F7A45`
- Frame: `--border-bold 2px` + `--edge #0B0B0B`, `--radius-card 12px`, `--radius-pill 999px`
- CTA: `--accent #FFB01A`, `--accent-hover #FFC44F`, `--on-accent #221B05`
- Type: Archivo 800 (`--font-display`) at `--step-1` (pillar h3) / `--step-3` (stat figures); Public Sans at `--step-0` / `--step--1`
- Spacing: `--space-2xs/xs/s/m/l/xl` (rlh-based scale)

## Assets
None new. Waves, fonts, and tokens are already in the codebase.

## Files
- `Homepage – New Sections.dc.html` — full-page prototype (open in a browser; the two new sections are `#what-we-believe` and `#the-current-situation`). Header/hero/overview/FAQ/signup/footer in it are recreations of the current live site for context only.
- `main.css` — copy of the site's stylesheet the prototype references (unmodified).
- `hero-art.svg` — hero illustration copy (unmodified, context only).
