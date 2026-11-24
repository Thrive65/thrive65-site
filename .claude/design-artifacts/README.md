# Design artifacts

Durable, versioned handoffs, specs, and prompts meant to be read by future
agents (and humans) — not application code. Commit these; they are shared
context, not machine-local state.

Each artifact is either **canonical** (still authoritative) or **archived**
(historical record; superseded by the code it produced). When an artifact's
values land in the codebase, the code becomes the source of truth and the
artifact should be marked archived to avoid drift.

## Naming convention

New handoffs: `YYYY-MM-DD_<topic>_handoff/` (or a clearly-named bundle dir).
Keep each handoff self-contained (its own README, specs, references).

Every handoff README starts with a **`Base:` line**, the `main` commit it was
written against (`Base: main@<sha>`, from `git rev-parse --short origin/main`).
It names no long-lived branch: say "a new branch from current `main`". The
agent that implements it diffs `main` since that commit for every file the
handoff names before starting, because files may have been rebuilt, moved or
deleted since (CLAUDE.md, "Stay on current main"). A handoff that names a
branch whose PR was closed is stale by definition.

## Index

### `design_handoff_common_ground/` — Common Ground brand system
The redesign handoff bundle: finalized design tokens, hue-swapping
architecture, and a home-page reference prototype. Applied to the repo in the
steps listed in its own `CLAUDE.md`.
- `tokens.css` — **canonical.** Portable snapshot of the token block; the live
  copy lives in `assets/css/main.css` (source of truth after conversion).
- `thrive65-redesign-tokens.md` — Sections 1–3 (old→new migration) are
  **archival** once conversion lands; Sections 4 (design direction) and 5
  (prompt template for generating new comps) are **canonical / reusable**.
  Planned: extract 4–5 into a living `design-system.md` after the conversion.
- `README.md`, `CLAUDE.md` — the handoff's own overview and ordered work plan.
- `reference/*.dc.html` — design-reference prototypes (recreate in Jekyll +
  CUBE CSS; do **not** ship the HTML).

### `2026-11-14_tax-calculator-ux-audit/` — tax calculator UX audit
**Canonical** until its fixes land. UX, WCAG 2.1 AA and copy audit of
`/tax-calculator/`, with recommendations for six focus areas (picker vs tabs,
in-place piece editing, include checkboxes, scenario select, docked result,
wide tables), implementation notes and a suggested order. `README.md` is the
condensed version for agents; `audit.html` is the full report.

### `2026-11-23_enrollment-page-v2/` — enrollment page no-d3 rebuild plan
**Canonical** until it lands on `feature/enrollment-page-v2`. Plan to rebuild
`/analysis/enrollment/` (PR #21) without d3: post front matter, build-time data
via `prepare.mjs` → `_data/enrollment/`, a site-wide `chart-*` system
(`_includes/chart.html`, `assets/js/charts.js`) shared with the tax calculator,
HTML/table versions of the bar, dot and heatmap charts, three pre-projected
static density maps, and every accessibility fix from the PR #21 review.

### `hue-archive.css` — retired alternate hue colorsets
The evergreen / electric-blue / ultraviolet `.hue-*` token blocks (light +
dark) removed from `assets/css/main.css` when the hue system collapsed to a
single `.hue-default` (lake-teal). Paste a block back into main.css to
re-instate a hue for review.
