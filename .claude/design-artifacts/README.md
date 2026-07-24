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

### `hue-archive.css` — retired alternate hue colorsets
The evergreen / electric-blue / ultraviolet `.hue-*` token blocks (light +
dark) removed from `assets/css/main.css` when the hue system collapsed to a
single `.hue-default` (lake-teal). Paste a block back into main.css to
re-instate a hue for review.
