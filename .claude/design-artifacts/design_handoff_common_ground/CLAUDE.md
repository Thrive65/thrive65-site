# CLAUDE.md — Common Ground redesign (Thrive65)

You are applying the **Common Ground** brand system to this repo (Jekyll +
CUBE CSS). Read `design_handoff_common_ground/README.md` and
`claude-design/thrive65-redesign-tokens.md` before starting.

## Golden rule
**Structure comes from the OLD design. Every color, the display font, theming,
radii and borders come from the NEW tokens.** Never take color or display type
from the old `main.css`. If a value isn't in the tokens, stop and ask — don't
invent, approximate, or substitute.

## Source of truth
- Tokens: `design_handoff_common_ground/tokens.css` and
  `claude-design/thrive65-redesign-tokens.md` (Section 2).
- Visual target: `design_handoff_common_ground/reference/Redesign Home.dc.html`
  (a design reference — recreate its look in Jekyll templates + `main.css`, do
  not ship the HTML).
- IMPORTANT: Keep the existing CUBE css structure from main.css (@layers reset, base, composition, block, utility). The styles are being applied to .MD files exported from Google Docs. So styles need to be applying to HTML elements without direct classes. Target via parent selector if needed.

## Invariants — do not touch
- The `@layer reset, base, composition, block, utility, exception` structure.
- Composition primitives: `.wrapper`, `.region`, `.flow`, `.cluster`, `.repel`.
- The Utopia `--step-*` type scale and `--space-*` spacing scale (identical in new).
- Body font (Public Sans) and the line-height tokens.
- Accessibility patterns: `.skip-link`, `:focus-visible`, `prefers-reduced-motion`,
  `.visually-hidden`.

## Work in small, reviewable commits — in this order

1. DONE by user!

2. **Tokens layer.** In `assets/css/main.css`, replace the old `:root`
   `--color-*` block with the contents of `tokens.css` (`:root` shared + default
   Lake Teal, `[data-theme="dark"]`, the four `.hue-*` light + dark blocks, the
   optional auto-dark media query). Keep the existing `--step-*`/`--space-*`
   lines (identical values) — don't duplicate. Delete every old `--color-*`.

3. **Fonts.** In `_includes/head.html` swap the Google Fonts link to Archivo +
   Public Sans (link in README). Set `--font-display: "Archivo"` weight 800,
   `letter-spacing: -0.01em`. Remove Fraunces.

4. **Base + theme.** Add the theme-init `<script>` (README) to `<head>` before
   the stylesheet. Update `@layer base` to new token names; set link color
   `--link` / hover `--brand-strong`; focus outline `3px solid var(--focus)`
   offset 2px. Verify light + dark both render.

5. **Blocks.** Rebuild `@layer block` components to match the reference, using
   the framed **2px `--edge`** treatment and the new radii:
   - `.site-header` + wordmark ("65" in `--brand`) + `.nav-cta` pill (accent).
   - `.hero`: `--hero-bg` band, uppercase eyebrow in `--hero-muted`, Archivo
     `--step-5` headline with italic "thrive" in `--hero-em`, one accent pill.
   - `.faq-item`: `--card`, `2px var(--edge)`, `--radius-card`, brand plus/minus.
   - `.site-footer`: `--footer-bg`, "65" in `--accent`.
   - Teal eyebrows in `--secondary` on Overview + FAQ section heads.

6. **Hero illustration.** Port the inline SVG scene from the reference. Fills
   reference `--art-*` (aliases of brand/accent/bloom/edge/card) so it retints
   per hue automatically. Full band height, bleeds to the right edge, sun left /
   flags right.

7. **Hue plumbing.** Put `.hue-lake-teal` on `<body>` in
   `_layouts/default.html` as the default. Add a `page.hue` front-matter hook:
   `class="hue-{{ page.hue | default: 'lake-teal' }}"` so any page can be set to
   `evergreen` / `electric-blue` / `ultraviolet` for review.

## Rules
- `bloom` only for a genuine moment-of-change; never fear headlines, never decoration.
- One accent (Marigold) CTA per view.
- Don't add copy or sections not in the reference without asking.
- After each step, build the site (`bundle exec jekyll build`) and check for errors.
