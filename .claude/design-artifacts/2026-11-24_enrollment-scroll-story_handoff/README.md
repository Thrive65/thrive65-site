# Handoff: rebuild `/analysis/enrollment/` as a scroll story

**Status:** canonical until it lands. After it lands, mark it archived in `../README.md`; from then on the page is the source of truth.
**Branch:** `enrollment-page` (open a PR into `main`; never push to `main`).
**Files in this folder:**
- `README.md`: this plan.
- `copy.md`: the approved text for every chapter, word for word.
- `reference-charts.js`: drawing code for the charts that don't exist on the site yet, already adapted to the site's `dash`/`d65` shim.

## What this is

Kelly (Thrive65) rewrote the enrollment analysis as a scroll story in a Claude dashboard. Each chapter has text on the left and a chart on the right that stays in place as you scroll; the chapter in view is highlighted. That version has been reviewed and edited and is the approved version. The site page `analysis/enrollment.md` is the older long-form version. Rebuild the site page to match the scroll story.

The reader we're writing for wants to know three things: why enrollment is down, whether it will keep going down, and whether the district can realistically stop it. Many readers believe COVID policies, the former superintendent or private schools caused the decline. The chapter order answers them in turn.

Follow the repo `CLAUDE.md` throughout: CUBE CSS layers and tokens, `--step-*` / `--space-*` only (no new px rhythm), `@custom-media` breakpoints, motion tokens, `announce()` for live messages, icons as partials. Read the "Contributing from Claude Code on the web" section if you're in a cloud session.

## Chapter order (top of page to bottom)

| # | id | Heading | Chart (data-draw) | Status on site today |
|---|---|---|---|---|
| — | lede | page title + lede | none | rewrite |
| 1 | `ch-drop` | A steady decline since 2016 | `c-k8` K-8 actual each fall | **new chart** (reference-charts.js) |
| 2 | `ch-nation` | Steeper than the nation and Chicago | indexed K-8, D65 / U.S. / CPS | exists as `nat-k8`; reuse, one chart only |
| 3 | `ch-peers` | Most nearby districts are shrinking too, though less | `nearby-chart` | exists; this chapter is "tall" (chart not sticky) |
| 4 | `ch-private` | Private schools gained some students during the pandemic, but don't explain our decline in enrollment | `private-chart` | exists |
| 5 | `ch-eths` | More District 65 8th graders now stay for ETHS | `eths-chart` | exists |
| 6 | `ch-classes` | Today's classes started smaller | `c-classes` each grade now vs. its kindergarten size | **new chart** |
| 7 | `ch-births` | Fewer children were born here | `births-chart` with the post-2023 range | exists and already updated (commit `cccf30a`) |
| 8 | `ch-forecast` | The district's own study saw this coming | K-8 actual vs. Kofron (band) and McKibben, 2018-19 on | adapt `trend` or use `c-fcst` in reference-charts.js |
| 9 | `ch-ahead` | What comes next | forecasts to 2031-32 + Thrive65 band + two capacity lines | **changed**: see "Capacity" below; `c-ahead` in reference-charts.js |
| 10 | `ch-levers` | What the district can change, and how far that goes | `c-levers` horizontal bars | **new chart** |
| — | foot | How the decline is felt across the district | reference section, not sticky | mostly exists, reorder |

Foot section, in this order: each-school small multiples (`schools`), Kofron-by-school table (`check-body`), school projections chart + table (`schoolproj`, `schoolproj-body`), stability table (`vol-body`, sortable headers already built), density map + table, **K-5 and 6-8 forecast comparison (`cmp`, moved here from the forecasts section)**, forecast accuracy table (`cmp-body`), then the sources `<details>` accordion.

### Remove from the site page
- The stat tiles (`#tiles`, `#covid-tiles`) and the `#studies` paragraph block at the top. The Kofron/McKibben introduction now lives in chapter 8's text and the sources list.
- The kindergarten panel `nat-k` (chapter 2 uses the K-8 chart only).
- The grade heatmap `grades`, the `#cmp-table`, the `#mckibben-note` paragraph and the separate `#thrive65-view` section (its content is now chapter 10).
- Any leftover drawers that no element references (`k5`, `feeder`, `ms-future`, `rerun`, `covid-cohorts`, `now-body`): delete their code if nothing uses them, and drop unused entries from `FILES`.

## Layout

- Each chapter is `<section class="step" id="ch-…">` holding a text column and a figure column. Desktop (`--md-and-up`): two columns, text about 2fr and figure 3fr, figure `position: sticky` below the site header, each step at least most of a viewport tall with generous top/bottom padding on the text so one chapter is read at a time. `--sm-and-down`: one column, figure after its text, nothing sticky, no dimming.
- Text of chapters not in view is dimmed (opacity around .55) and the active one is full strength. An IntersectionObserver with `rootMargin: '-40% 0px -40% 0px'` toggles `is-active` on each `.step` (see the last block of reference-charts.js). Also mark all steps active on `beforeprint`, and if IntersectionObserver is missing.
  - Use a motion token for the opacity transition. The global reduced-motion guard already handles `prefers-reduced-motion`.
  - **Dimming must not drop text below AA contrast.** Check `--muted`-on-`--surface` at .55 in light, dark and high-contrast modes. If it fails, dim only the figure, or skip dimming under `data-contrast="high"`.
- Chapter 3 (`ch-peers`) is a "tall" step: chart not sticky, text above or beside it at normal padding, because the chart is taller than the viewport.
- The figure sits in a `.card` (raised surface) with a short title line above the chart. Each chapter ends its text with a small source line (`.text-meta`/muted).
- Page width: this layout needs `wide: true` (already set in the front matter). The text column itself should stay readable; don't let paragraphs run past roughly `--measure`.
- `enrollment-dashboard.css` is loaded only by this page and sits outside the PurgeCSS pass, so classes added by JS there (`is-active`) don't need the safelist. If you move any of this into `main.css`, add JS-only classes to the safelist in `postcss.config.cjs`.
- Map any new colors through the variables already defined at the top of `enrollment-dashboard.css` (`--color-fg-muted`, `--cds-chart-muted`, etc.). No hardcoded colors beyond the existing Okabe–Ito chart set in `dash.colors`.

## Data

Everything needed is already in `assets/data/enrollment/`. No new CSV is required.

- `births.csv` already has the range columns `birth_pace` and `birth_kofron_slope` (kindergarten classes 2028-2031) and the chart uses them.
- **Capacity** (new, used by chapters 9 and 10). From the district's Nov. 6, 2026 utilization table (https://resources.finalsite.net/images/v1793999411/district65net/jvpg6fw1yuufwph9z6h5/UtilizationNov6.pdf): **7,212 K-8 seats** with Dewey and Lincolnwood closed. Today's buildings add Dewey **556** and Lincolnwood **about 384**. Both are Thrive65 estimates using the district's method (see the project doc `D65_Enrollment_and_Capacity.md`), for **about 8,150** in all. King Arts (636) is included in both totals. Keep these as named constants in one place in the JS with a comment citing the table. They replace the old "about 7,500" figure everywhere. Search the page and JS for `7,500` / `7500` and remove every use.
- Empty seats in 2031-32 = capacity − `district_trend` `t65_mid` for `2031-32` (4,326): about 3,800 (today's buildings, 53% full) and about 2,900 (after closures, 60% full). Compute these from the data. Don't hardcode the results.
- "About 150 students who left in 2020-21 and are still K-8 age" is a fixed figure (about 150 of the 444; the rest are in high school or graduated). Keep it as a commented constant.
- The 444 itself: grades 1-8 each fall compared with the grade below the year before, summed for fall 2020 (−209) and fall 2021 (−235). It is a net figure for any reason students left. The site's existing `change_summary` calc produces it.

## Copy

Use `copy.md` word for word. Values in `{braces}` are filled by drawers. The table at the end of `copy.md` lists each one and how it's computed, and most already exist on the site under other names. The text has been checked for accuracy and for Kelly's style rules: no em dashes, no "not X, it's Y" constructions, no "real/genuine" intensifiers, no stacked lists of three, and acronyms spelled out on first use. Don't rephrase it. If something must change to fit the layout, flag it in the PR.

## Steps

1. Read `analysis/enrollment.md`, `assets/js/enrollment-dashboard.js` and `assets/css/enrollment-dashboard.css`.
2. Restructure the markup in `analysis/enrollment.md` into the chapters above, using `copy.md`. Keep `markdown="0"` on the root and the existing `data-data-base`.
3. Add the drawers from `reference-charts.js` into `enrollment-dashboard.js` as a new IIFE block, plus the step observer. Reuse existing drawers where the table above says so, and adjust their element ids if needed.
4. Add the step layout CSS to `enrollment-dashboard.css` using site tokens and `@custom-media`.
5. Remove the sections and dead code listed above.
6. Build: `bundle exec jekyll build --baseurl ""` with no errors. On the maintainer's machine, check `http://localhost:4000/analysis/enrollment/` in Firefox with `layout.css.custom-media.enabled` set to `true`, or responsive rules won't apply in dev.
7. Check every chart:
   - Each chart renders.
   - Every `{value}` shows a number, never "—".
   - The births chart shows the shaded range and the 578 / 531 / 482 labels.
   - The levers chart shows four bars with "Buildings about 53% full" and "about 60% full" inside the gray bars.
   - The forecast chart shows two capacity lines labeled about 8,150 and about 7,200.
8. Check the page in all display modes:
   - Dark mode, high contrast and 150% text size.
   - A narrow viewport.
   - Print preview: steps stack, nothing is dimmed and each chapter starts on a new page.
9. Open the PR with the repo template: plain-English summary, URL path `/analysis/enrollment/`, the checklist, and anything you couldn't verify.

## Known caveats to keep in the copy or sources

- Kofron's birth data and the county birth records differ by about 8%. Never compute a change across the two sources.
- Report Card grade counts run about 20 to 35 students above the district's own counts.
- Private school counts are schools inside the boundary: they include some non-residents and miss residents at Baker School in Wilmette and other outside schools.
- The district's capacity count leaves out STEP and RISE (self-contained special education) classrooms and their students. The projection includes those students, so empty seats may run about 100 high.
- The Thrive65 projection holds births flat after 2023. The births chapter explains what falling births would do: about 85 fewer K-5 students in 2031-32 at the recent pace, and about 165 fewer at Kofron's pace.
