# Handoff: Accessibility & Language Controls (Thrive65)

## Overview
Add a site-wide **Display & accessibility** settings control and a **language dropdown** to the Thrive65 header. Settings: Theme (Light/Dark), High contrast, Colorblind-friendly colors, Dyslexia-friendly font, Text size. Language (EN/ES) is a separate globe dropdown; translation itself is handled by Elfsight.

Target codebase: `thrive65/thrive65-site` (Jekyll).

## ⚠️ About the Design File — read this first
`A11y Controls Options.dc.html` is a **visual reference only** (frames 5a, 5b, 5c). It was built in a prototyping environment with its own scaffolding.

**Do NOT reuse any of its markup, class names (`t65a-*`, `dv-*`), or CSS.** Rebuild everything using the repo's existing patterns and standards:

- **CUBE CSS layers** — new component styles go in the appropriate `@layer` in `assets/css/main.css`, using existing tokens (`--card`, `--edge`, `--line`, `--ink`, `--brand`, `--radius-*`, `--border-*`, `--space-*`, `--step-*`, `--toggle-size`, `--transition-*`) rather than literal values.
- **Attribute-driven theming** — new modes follow the `data-theme` convention: attributes on `<html>`, CSS-variable override blocks, one localStorage key each, restored before paint in the existing head-script IIFE.
- **Disclosure controller** (in `_includes/head.html`) — open/close for the settings panel and language menu should be wired with `aria-controls` + `aria-expanded` + `data-disclosure` + `data-dismiss`, not new bespoke JS. Use the same exclusive group as the nav dropdowns so only one is open at a time.
- **Existing components** — the accessibility trigger is a `.theme-toggle`-family button (same class or a sibling of it); the language menu matches the nav dropdown panel treatment; markup lives in `_includes/header.html` alongside the current toggle.
- **Naming, formatting, and comment style** — match what's already in the files you touch.

Where this README gives measurements or colors, treat them as **design intent** to express through the repo's token system — not as a stylesheet to paste.

## Fidelity
**High-fidelity** for look and behavior: match the reference frames closely (geometry, spacing, states). Implementation details (class names, selectors, file organization) belong to the repo, not the prototype.

## Screens / Views

### 5a — Desktop header
- Nav order (existing `.cluster` nav): links (`About / FAQ / Analysis / Resources ▾`) → **language dropdown** → **accessibility button** → `Join us` CTA.
- **Language dropdown trigger**: a framed pill in the `.theme-toggle` family (≥44px via the toggle-size token, thin `--line` border, card background), containing: globe icon (16px, currentColor) + current language code ("EN"/"ES") + the same 10×7 chevron the nav dropdowns use (rotates 180° when open, fast transition token). Hover: brand border + text, like the theme toggle today.
- **Language menu**: right-aligned dropdown below the trigger (≈10px gap), ~11rem min-width, card surface with the bold-edge frame, small radius, prominent soft shadow, small type step. Items are **full language names** ("English", "Español"), semibold, comfortable padding, tint background on hover; the active item shows a ✓ in brand color on the right. **Selecting a language closes the menu** and updates the trigger label.
- **Accessibility button**: replaces the current sun/moon toggle — identical geometry (44px framed pill), icon swapped to a universal-access glyph (person in circle, stroke style matching the sun/moon icons). Label: "Display and accessibility settings".
- **Settings panel**: right-aligned dropdown below the button, ~21rem wide, card surface, bold-edge frame, card radius, soft shadow, small type step. Panel and language menu are mutually exclusive; the language menu stacks above the panel if both would overlap.

Panel contents, top to bottom (rows separated by hairline dividers):
1. Header row: title **"Display & accessibility"** (display font, heavy weight, base step) + small round ✕ close button.
2. **Theme** — segmented control `Light | Dark` (pill group with bold edge; selected segment inverts to ink-on-card).
3. **High contrast** — switch. Sublabel: "Black & white, underlined links".
4. **Colorblind-friendly colors** — switch. Sublabel: "Okabe–Ito safe palette".
5. **Dyslexia-friendly font** — switch. Sublabel: "Atkinson Hyperlegible".
6. **Text size** — `A−` / `100%` / `A+` stepper (round bold-edge buttons; tabular-nums value; steps 100 → 112 → 125%).
7. Footer row: "Reset all" (link-style) + microcopy "Saved on this device" (muted, small).

Switch appearance: pill track with bold edge; off = page-background track, ink knob at left; on = brand track, white knob at right; knob slides with the fast transition token. `role="switch"` + `aria-checked`.

### 5b — Mobile header, menu closed
- Header row: wordmark → compact globe dropdown → hamburger. All targets ≥44px.
- Language menu behaves as on desktop, opening over the hero.
- **No floating button** — accessibility settings are reached through the hamburger menu (5c).

### 5c — Mobile, hamburger menu open
- Inside the slide-in nav panel, an **"Accessibility"** button (universal-access icon + visible text label, same pill treatment as the language trigger) sits **exactly where the theme toggle is positioned today** (top of panel, left of the ✕, the existing absolute placement). The sun/moon toggle is removed from this spot — Theme moves into the settings sheet.
- Tapping it opens the settings as a **bottom sheet**: same rows as desktop, plus a "Done" pill (ink background, card text, bold edge) replacing the footer microcopy. Sheet is fixed to the viewport bottom, full-width, rounded top corners only, with a small centered grabber bar.

## Interactions & Behavior
- **Disclosure everywhere**: Escape closes and returns focus to the trigger; outside click closes (the existing controller already provides both).
- **Language select**: set language → close menu → update trigger label and ✓. Hand off to Elfsight for the actual translation (invoke its language switch programmatically, or restyle its widget trigger to this spec — whichever its embed supports).
- **Settings are independent** and compose: high contrast, colorblind colors, dyslexia font, and text size each toggle separately and must all work in both light and dark (all theme × contrast combinations).
- **Reset all**: clears the four a11y settings (prototype also resets theme to light; either is acceptable — be consistent).
- Every change applies instantly (attribute flip), persists, and fires a polite `aria-live` announcement (e.g. "High contrast on").
- No animation on theme/contrast swaps; reuse existing motion tokens for chevron and switch knob only.

## State Management
Attributes on `<html>` (the `data-theme` pattern), one localStorage key each, restored before paint by extending the existing theme IIFE:

| Setting | Attribute | Values | localStorage key |
|---|---|---|---|
| Theme (existing) | `data-theme` | `light` / `dark` | `theme` |
| High contrast | `data-contrast` | absent / `high` | `a11y-contrast` |
| Colorblind colors | `data-cvd` | absent / `on` | `a11y-cvd` |
| Dyslexia font | `data-dyslexic` | absent / `on` | `a11y-dyslexic` |
| Text size | `data-textsize` | absent / `112` / `125` | `a11y-textsize` |
| Language | — | Elfsight-managed | (Elfsight's own persistence) |

(Attribute names/values are suggestions — follow whatever naming the repo prefers, consistently.)

Progressive enhancement: auto-enable high contrast when `prefers-contrast: more` matches and the user hasn't chosen, mirroring the `theme: auto` approach.

## Design intent — mode values
Express these as CSS-variable override blocks in the token section of `main.css`, following the structure of the existing `[data-theme="dark"]` and hue blocks. **Ordering matters: high-contrast overrides must win over colorblind overrides when both are active.**

**Colorblind-friendly (Okabe–Ito):** replaces the green brand/link family and the pink "bloom" accent.
- Light: brand `#0072B2`, brand-strong `#004E7C`, link `#0072B2`, secondary `#005A82`, bloom `#C4560A`
- Dark: brand `#56B4E9`, brand-strong `#8CCBF0`, link `#56B4E9`, secondary `#7EC8E3`, bloom `#E69F00`
- Marigold CTA accent is unchanged (already CVD-safe).

**High contrast:** flattens surfaces to pure black/white (this intentionally overrides the hue system, incl. the hero band), forces all links underlined, upgrades key hairlines to 2px edge (header bottom, hero bottom).
- Light: all surfaces `#FFFFFF`; ink/muted/line/edge/focus `#000000`; brand/link `#005C31` (≥7:1 on white), brand-strong `#00411F`, secondary `#00323C`, hero-em `#7A4C00`
- Dark: all surfaces `#000000`; ink/muted/line/edge `#FFFFFF`; focus `#FFFF00`; brand/link `#4DFFA6`, brand-strong `#90FFC8`, secondary `#9BE8FF`, hero-em `#FFD34D`; accent `#FFD34D` / hover `#FFE58A` with black label text

**Dyslexia font:** body and display fonts both become `"Atkinson Hyperlegible", sans-serif`; display weight drops to 700; letter-spacing to 0; body line-height up to 1.7.

**Text size:** scale the fluid-root knobs — `--root-min`/`--root-max` × 1.125 (→ 18/27) and × 1.25 (→ 20/30). Do **not** use `zoom` (the prototype's approximation).

## Typography
Add Atkinson Hyperlegible 400 + 700 to the Google Fonts request in `_includes/head.html`.

## Assets
No raster assets. Three inline SVGs (draw to match the existing icon stroke style, currentColor):
- **Universal access**: circle outline; filled head dot; arms/body/legs strokes.
- **Globe**: circle outline; vertical ellipse; horizontal equator line.
- **Chevron**: reuse the existing nav-dropdown polyline.

## Accessibility acceptance checklist
- All triggers/switches keyboard operable; `role="switch"` + `aria-checked`; segmented buttons `aria-pressed`; language menu `role="menu"` / `menuitemradio`.
- Focus-visible uses the existing global rule (`3px solid var(--focus)`), which HC mode recolors.
- Panel/menu close on Escape and outside click; focus returns to trigger.
- Contrast ≥7:1 in high-contrast mode, ≥4.5:1 elsewhere, in every theme × setting combination.
- Hit targets ≥44×44px.
- Setting changes announced via `aria-live="polite"`.

## Files
- `A11y Controls Options.dc.html` — visual reference: the approved direction as frames **5a** (desktop), **5b** (mobile, menu closed, language dropdown open), **5c** (mobile, hamburger menu open). Reference only — see the warning at the top.
