# Tax calculator UX audit — 2026-11-14

**Status: canonical** until its recommendations land in `tax-calculator.md` /
`assets/js/tax-calculator.js`; then mark archived.

Audit of the live page https://wethrive65.org/tax-calculator/ covering layout and
hierarchy (UI Design Review `ui-review`), WCAG 2.1 AA (`design:accessibility-review`)
and copy (`design:ux-copy`), with recommendations for six maintainer-raised focus areas.

- `audit.html` — the full report (also published privately at
  https://claude.ai/artifact/HDL4dWfxRBs83bd6GWAhm8). Standalone page; it's a
  reference, not site code, so don't ship it.

## Key measurements (live, 1440px desktop / 390px phone)

- Picker → headline result: 2,640px on desktop, about four phone screens (786 → 4,048px).
- `#finTable` content is 1,233px wide inside 707px (desktop) and 264px (phone). On a phone
  only the label column shows. `#chartTable` is 1,288px inside 703px, even on desktop.
- Clicking **Edit** on a `#stackSummary` row: the page switches mode, focus drops to
  `<body>`, the scroll position stays put, and the headline goes from $1,157 to $138 with
  only the eyebrow label to say why.
- Contrast passes everywhere measured (lowest: marigold eyebrow on teal, 4.76:1).
  Compact buttons have 44px `::before` hit areas.

## The six focus areas, condensed

1. **Picker cards act as tabs but don't look or behave like them.** Recommended: retire the
   five-way picker. "All together" becomes the page, and one piece on its own is a filter
   (only that piece included, with the result label naming it). Interim option: a real
   `role="tablist"` attached to the top of the "Your numbers" card.
2. **Edit jumps away.** Recommended: each `#stackSummary` row becomes an in-place
   disclosure (`.accordion`; optionally `<details name="piece">` so only one is open at a
   time). "Your numbers" stays always visible. Piece-specific notes, assumptions and the
   "needs a vote" text move into each panel. Each row's value column shows that piece's
   amount for the spotlight year.
   - Catch: HLS and Capital share `#borrowBlock`, swapped by `saveBond()`/`loadBond()`.
     Give each bond piece its own fieldset with prefixed ids.
   - Catch: `renderStackSummary()` rebuilds the list's `innerHTML` on every render, which
     would destroy inputs inside it. Rows must become static markup, with JS updating only
     each row's note and amount text.
3. **Include toggles.** Replace `#stackPieces` with a real checkbox per row, placed
   *outside* `<summary>`. An excluded row says "Not included", shows an outlined swatch
   and a dash for its amount, and its settings stay editable.
4. **Scenario.** Replace the button with a `<select>` built from `SCEN`, plus "Custom",
   which is auto-selected when `scenarioMatch()` fails. Move the note to `SCEN[k].note`
   and show it only for the selected scenario.
5. **Docked result.** Dock only the year and month figures plus the spotlight-year
   control: a sticky right column at `--measure-wide` (`--md-and-up`), and a slim sticky
   bottom bar on phones. Hide the bar while the full result card is on screen. Turn
   docking off for short viewports and large text sizes, and add `scroll-padding-bottom`.
   Don't add a second live region.
6. **Wide tables.** Shrink before breaking out. `#chartTable`: short headers with
   swatches, tabular numbers, a sticky first column on phones. `#finTable`: stack each
   borrowing as a `.steps`-style block at `--sm-and-down`, and shorten the headers.
   Either way: `tabindex="0"` + `role="region"` + `aria-label` on `.levy-table-wrap`,
   `<th scope="row">` for row headers, and a `<caption>`.

## Suggested order

1. Quick fixes: table a11y, short chart-table headers, unique Edit labels with focus
   moved into the form, and the copy changes (see the copy table in `audit.html`).
2. The scenario `<select>` (issue 4).
3. The restructure (issues 1–3 together).
4. The docked result (issue 5).
5. A stacked borrowing table on phones (issue 6), if still needed.

Not tested: a real screen reader, Spanish (`?lang=es-MX`), dark mode or high contrast,
200% zoom, a physical phone.
