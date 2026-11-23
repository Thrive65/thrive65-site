# Enrollment page v2 — no-d3 rebuild plan

**Status:** implemented on `feature/enrollment-page-v2` (2026-11-23). Once merged, the code and CLAUDE.md ("Charts") are the source of truth, and this plan becomes **archived**.

**Deviations from the plan, as built:** the summary numbers are in `summary.json` (not `.yml`). The map uses labels in plain `--ink` on a ramp built to keep ink ≥4.5:1, instead of a halo. The heatmap ramp is bounded the same way, so its text never flips color. The dot chart uses `--series-1`/`--series-3`. The Nov. 6 proposal series and the district's own marker use `--series-4`.
**Branch:** `feature/enrollment-page-v2`, cut from `enrollment-page` at `9261f74` (the head of PR Thrive65/thrive65-site#21).
**Goal:** rebuild `/analysis/enrollment/` without d3. Fold in every fix from the PR #21 review. Leave behind a shared chart system that the tax calculator and future pages use.

---

## 0. Principles

1. **Render at build time first.** Numbers in the text, stat tiles, tables, bar charts, dot charts, the heatmap and the maps are all rendered by Liquid from `_data/`. Only line and band charts and the map's measure switch need JavaScript. The page should read completely with JavaScript turned off.
2. **Do the math once, when preparing the data, not in the browser or in Liquid.** Liquid sorts CSV values as text and is awkward at arithmetic. A committed Node script (§2) writes every derived value, sort order, formatted label, 0–1 shade value and map path into `_data/enrollment/`.
3. **One chart system for the whole site.** It is made of the `chart-*` classes in `main.css`, `_includes/chart.html` and `assets/js/charts.js`. No page-only stylesheet, no renamed tokens, no inline styles except data knobs (`--value`, `--t`, `--swatch`).
4. **Every chart is accessible.** Each one is a `<figure>` with a caption, a data table (visible or in a "Show as a table" accordion), keyboard access and theme-aware colors in all five theme blocks.

---

## 1. Content and front matter (review §1)

| Step | Change |
|---|---|
| 1.1 | `git mv analysis/enrollment.md _posts/2026-11-23-district-65-enrollment-forecasts.md` (set the date to the actual publish date). Delete the now-empty `analysis/` folder. |
| 1.2 | Front matter: `title`, `date`, `category: "Analysis"`, `permalink: "/analysis/enrollment/"`, `description`. **Remove** `layout: page`, `eyebrow:` and `wide: true`. The post layout's category eyebrow and the `undated_categories` setting already cover them. |
| 1.3 | Remove the manual "Interactive data" link from `analysis.md`. The `where: "category", "Analysis"` loop lists the post automatically. |
| 1.4 | Add a cross-link to `/analysis/d65-enrollment-and-capacity/` where the November 6 proposal is discussed. |
| 1.5 | PR note: this post is hand-written. A Docs add-on publish to the same filename would overwrite it. |
| 1.6 | Only if the maintainer still wants a wide layout after step 5: add `{% if page.wide %} wide{% endif %}` to `post.html` (mirroring `page.html`) rather than special-casing this post. Default plan: normal width. |

## 2. Data pipeline

The 16 CSVs currently sit under `assets/data/enrollment/` and are fetched by the browser. Each page load also recomputes the derived tables (`dash.calc`).

| Step | Change |
|---|---|
| 2.1 | Move the raw source CSVs to `data-src/enrollment/` and add `data-src` to `exclude:` in `_config.yml`, so they are not published as-is. |
| 2.2 | Add `scripts/enrollment/prepare.mjs`. It is plain Node 20 with **no dependencies** and is run by hand when the data changes (`npm run data:enrollment`). Add `scripts` to `exclude:`. It writes the files below. |
| 2.3 | Commit the generated output under `_data/enrollment/`. Liquid reads it as `site.data.enrollment.*`. These files are **not** add-on files; list them in CLAUDE.md as "generated: edit `data-src/` and rerun the script". |
| 2.4 | Delete every `dash.calc` from the JS. Their logic moves into `prepare.mjs`. |

Outputs of `prepare.mjs` (each replaces a browser calculation or fetch):

| Output | Replaces | Contents |
|---|---|---|
| `summary.yml` | `headline`, the `t-*`/`hl-*` one-line draws, `change_summary`, `cohorts` (the parts still shown), `national_summary`, `nearby_summary`, `cook_rank` | Every number in the text and tiles as **pre-formatted strings** (`"5,408"`, `"−28.6%"`, `"second"`), plus the "behind …" sentence fragment |
| `trend.json`, `rerun.json`, `compare.json`, `national.json`, `school_trend.json`, `school_proj_yearly.json`, `feeder.json` | the line-chart fetches | Chart-ready series: `{x: [...], series: [{key, label, values, band?}]}` with gaps as `null` |
| `nearby_bars.csv` | `nearby-chart` sorting and color logic | Rows **pre-sorted**, `short_name`, `pct_label`, `series` (1–3 or `muted`), `offset` and `size` (0–1 of the axis domain), `is_focus` |
| `k5_dots.csv` | the `k5` dumbbell | Pre-sorted rows with `k_pos`, `g5_pos` (0–1), `k`, `g5`, `pct_label`, `flag` (≤ −20%) |
| `grades_heat.csv` | the `grades` heatmap | One row per grade, one column per year, plus a `t` (0–1) per cell; the domain is recorded in `summary.yml` |
| `tables/*.csv` | the `check-body`, `vol-body`, `cmp-body`, `schoolproj-body`, `density-body` draws | Display-ready cell strings, including the `closes`/`—` cases and the `neg`/`pos` flags |
| `map.json` | `density_map_data`, `d3.geoMercator`, `d3.geoPath` | See §6 |

## 3. Shared chart system (review §2)

### 3.1 Tokens: `main.css`, all **five** theme blocks

- Keep `--series-1…4`. Change the comment from "tax calculator" to "chart series (site-wide)".
- Add `--series-muted`: the background or comparison series, and areas with no data.
- Add `--seq-low` and `--seq-high`: the endpoints of the one-color shading ramp. Light: card → deep blue. Dark: card → light blue. High contrast: `--card` → `--ink`, which flattens to black and white.
- **Check 3:1 contrast against `--card` for any series used as a line.** Measured on white: `#E69F00` (series-3, light) is 2.25:1 and `#CC79A7` (series-2) is 3.06:1. Either use series-3 only for fills and bands, or adjust it everywhere (this changes the tax calculator, so **ask the maintainer first**). The contrast check is in §8.

### 3.2 Blocks: `main.css`, `block` layer

| New block | Replaces (tax calculator) | Replaces (PR #21) |
|---|---|---|
| `.chart` (wrapper, `position: relative`; the SVG fills its width) | `.levy-chart-wrap` | `.chart`, `.mult` SVG sizing |
| `.chart-axis`, `.chart-grid`, `.chart-ref` | `.levy-axis` | `.axis`, `.grid`, `--cds-chart-*` |
| `.chart-legend` (+ `.cluster`), `.chart-key`, `.chart-swatch` | `.levy-legend`, `.levy-key`, `.levy-swatch` | `.legend`, `.sw`, `.box` |
| `.chart-tip`, `.chart-tip-row`, `.chart-tip-total` | `.levy-tip*` | `.tip` |
| `.data-table` (scroll wrapper + figure-table rules) | `.levy-table-wrap` | `.tw` + the table rules |
| `.bar-chart`, `.bar-row`, `.bar` (HTML bars around zero) | — | `nearby-chart` |
| `.dot-chart`, `.dot-row`, `.dot` (HTML dumbbell) | — | `k5` |
| `.heat` (a `<table>` whose cells are shaded from `--t`) | — | `grades` |
| `.choropleth` (static SVG map, see §6) | — | `density-map` |

Utility layer: `.swatch-line`, `.swatch-dashed`, `.swatch-dotted`, `.swatch-band`, `.swatch-dot`.

Things that need no new block, because existing ones cover them:

| PR #21 | Use instead |
|---|---|
| `.tiles` / `.tile` | `.stat-grid` / `.stat.card` / `.stat-value` |
| `.note` | `.hint` / `.text-deemphasized` |
| `.nat-grid`, `.multiples` | `.grid-wide` |
| inline-styled toggles | `.choice-group` / `.choice.compact` |
| the `#sources` accordion | standard `.accordion` markup (`.accordion-icon` + `.accordion-body`) |

Rules for all of the above:
- All sizes come from `--step-*` / `--space-*`, with no `px`.
- Chart text is `font-size: var(--step--1)`.
- Color changes animate with `--transition-*`.
- Phone layouts use `@media (--sm-and-down)`.

### 3.3 Deletions and safelist

- Delete `assets/css/enrollment-dashboard.css` and its `<link>`.
- Rename `levy-*` → `chart-*` in `tax-calculator.md`, `tax-calculator.js` and the PurgeCSS safelist.
- Add the new JS-only classes to the safelist: `chart-tip*`, `chart-key`, `chart-swatch`, `swatch-*`, and the axis and grid classes.

### 3.4 `_includes/chart.html`

Parameters: `id`, `title`, `desc`, `heading` (`h2`/`h3`, default `h3`), `table` (`accordion` | `visible` | `none`), `kind` (`svg` | `html`), plus a captured `body` for HTML charts.

It renders:
- a `<figure class="card flow" aria-labelledby>` with a `<figcaption>` (the heading carries the `id`, so the copy-link anchor works);
- the `.chart-legend` container;
- the chart body (for SVG charts, a `.chart` div with `data-chart="<id>"` and a `<script type="application/json">` holding `{{ site.data.enrollment[...] | jsonify }}`);
- the table, inside an accordion (`role="region" tabindex="0" aria-labelledby`) or shown directly.

### 3.5 `assets/js/charts.js`

Vanilla ES2017, no dependencies, about 250 lines. It is loaded `defer` by `default.html` only when front matter has `charts: true`. The API:

| Function | Purpose |
|---|---|
| `scale(domain, range)`, `pointScale(keys, range)`, `niceTicks(min, max, count)` | Replace `d3.scaleLinear` / `scalePoint` / `.nice()` / `.ticks()` |
| `linePath(points)`, `areaPath(lowPoints, highPoints)` | Replace `d3.line` / `d3.area`; a `null` value breaks the path |
| `axis(svg, scale, {side, ticks, format})`, `grid(...)` | Output `.chart-axis` / `.chart-grid` markup |
| `lineChart(el, spec)` | Covers every line chart on this page. Options: `bands`, `dashed`/`dotted` series, `refLines` (e.g. "this fall"), an end-value `label`, `compact` for small multiples |
| `focusBands(svg, xs, onFocus)` | One `<rect tabindex="0">` per x position. Arrow and Home/End keys move between them; focus, hover or tap shows the tooltip. Replaces `d3.pointer` and the mouse-only overlay |
| `tooltip(chartEl)` | Shared `.chart-tip`, positioned inside the chart |
| `legend(el, items)` | `items: [{label, series, shape}]` → `.chart-key` / `.chart-swatch` + shape utility |
| `table(el, {caption, columns, rows})` | `<th scope="col">`, `<th scope="row">`, `<caption>` |
| `fmt.int`, `fmt.pct`, `fmt.signedPct` | One `Intl.NumberFormat`-based set, replacing the five formatters in PR #21 |
| `onResize(el, draw)` | A `ResizeObserver` per chart. Picks up text-size and dyslexic-font changes; replaces the window `resize` handler |
| `rem()` | The root font size in px, so margins scale with text size instead of using fixed 48/96/150 px |

Auto-init: on `DOMContentLoaded`, every `[data-chart]` reads its JSON and calls the matching renderer. There is **no global state**: no `window.dash` or `window.d65`.

**Tax calculator:** the class rename (3.3) is required in this branch. Moving `renderChart` onto `axis`, `legend`, `tooltip` and `table` is a separate follow-up commit on this branch. It proves the module works on a second chart, and its stacked bars stay hand-built.

## 4. Chart-by-chart conversion

| Section (id) | PR #21 (d3) | v2 | Table alternative |
|---|---|---|---|
| Lede and tiles (`#takeaway`, `#tiles`) | 14 one-line JS draws, "—" until loaded | Liquid from `summary.yml`, `.stat-grid` | n/a |
| `#trend-vs-forecasts` | d3 line + band | `lineChart` | accordion |
| `#rerun-from-2020` (2 panels) | d3 | `lineChart` ×2 in `.grid-wide`, one shared legend | accordion |
| `#kofron-vs-rerun` (2 panels + births toggle) | d3; the toggle rebuilds itself and loses focus | `lineChart` ×2; a static `.choice-group` swaps the series and redraws the SVG only; focus is kept | existing `cmp-table` (Liquid) |
| `#each-school` (13 small multiples) | d3 | `lineChart` `compact` in `.grid-wide` `.card`s | one combined accordion table |
| `#school-projections` (multiples + diamond marker) | d3 | `lineChart` `compact` with a `marker` option | existing `schoolproj-table` (Liquid) |
| `#kofron-by-school` table | JS-built | Liquid `.data-table` | is a table |
| `#k-vs-5th` dumbbell | d3; 96 px / 70 px margins break on phones | **HTML `.dot-chart`** (Liquid); at `--sm-and-down` the school label goes above the row | visually-hidden numbers in each row + accordion |
| `#feeder-patterns` | d3 lines, categorical x | `lineChart` with a categorical x | accordion |
| `#by-grade` heatmap | d3; renders at 0.45 scale on phones, labels about 5 px | **`<table class="heat">`** (Liquid), shaded with `color-mix(... var(--seq-high) calc(var(--t)*100%), var(--seq-low))`; scrolls inside `.data-table` | is a table |
| `#after-covid` tiles | JS | Liquid `.stat-grid` | n/a |
| `#national` (2 panels) | d3 | `lineChart` ×2 | accordion |
| `#nearby-and-peers` bars | d3; 150 px margin leaves 48 px of bar on phones | **HTML `.bar-chart`** (Liquid); the label goes above the bar at `--sm-and-down` | the bar text is the data + accordion |
| `#density` map | d3-geo | **static SVG (§6)** | `density-table` + a new proposal table |
| `#stability` table | JS | Liquid | is a table |
| Dead code: `now-body`, `cohort-legend`, `covid-cohorts` | about 80 lines with no markup | **Deleted** | — |

**Series colors, kept the same across the page:**
- `--series-1`: actual / District 65
- `--series-2`: Kofron
- `--series-3`: Thrive65 rerun / U.S.
- `--series-4`: district projection / Chicago
- `--series-muted`: comparison districts and older classes

Style also tells series apart: solid = actual, dashed = middle forecast, dotted = snapshot, band = low-to-high range. `--bloom` is no longer used as a series color. Feeder lines use series 1–4; King Arts keeps its dashed line.

## 5. Accessibility fixes folded in (review §4)

| Issue | Fix | Where |
|---|---|---|
| Hex series colors and `interpolateBlues` ignore dark and high contrast | `--series-*`, `--series-muted`, `--seq-*` in all five theme blocks | §3.1 |
| `td.pos` 3.42:1, `td.neg` 4.48:1 | Status shown with a sign plus `font-weight`, in `--ink`; no colored small text | `.data-table` |
| Fixed 11 px chart text ignores text size | `var(--step--1)` + rem margins + `ResizeObserver` | §3.5 |
| Heatmap and nearby/K-vs-5th charts break on phones | HTML/table versions that reflow | §4 |
| Toggles lose focus; disabled button uses `title` | Static `.choice-group`; invalid options are not rendered (map) or are explained in visible text | §4, §6 |
| Tooltips mouse-only; most charts have no data alternative | `focusBands` + a table for every figure | §3.4–3.5 |
| Tables: no caption or row headers; scroll wrappers not focusable | `<caption>`, `scope`, `.data-table[role=region][tabindex=0][aria-label]` | §3.2, §4 |
| Sources accordion markup | Standard `.accordion` | §3.2 |
| "—" placeholders; fragmented translation | Numbers rendered in Liquid at build time | §2 |
| d3 is 280 KB, render-blocking, no integrity hash | d3 removed; `charts.js` is deferred, served from the site, and loads only on `charts: true` pages | §3.5 |

## 6. The density map: three static maps

### 6.1 What exists

The density-map data has **three geometry sets**:

| Map | Geometry rows (`area_geometry.csv`) | School dots | Measures available |
|---|---|---|---|
| **A. Middle school areas** | `kind=area, level=MS`: Chute, Haven, Nichols | MS schools | Enrolled students / sq. mi. (fall 2026); Resident children 5–14 / sq. mi. (2020) |
| **B. Elementary areas, 2026-27 boundaries** | `kind=area, level=ES`: 10 areas | ES + King Arts | Enrolled / sq. mi. (fall 2026); Projected / sq. mi. fall 2031, today's boundaries; Resident children 5–14 / sq. mi. (2020) |
| **C. Elementary areas, Nov. 6 proposal** | `kind=area_nov6`: 9 areas incl. a King Arts area | ES + King Arts, minus Dewey and Lincolnwood | Projected / sq. mi. fall 2031, Nov. 6 proposal (King Arts = magnet, no density) |

Today's UI offers 4 measures × 2 levels, then disables combinations that don't exist. It also rescales the map to each set's own extent, so the map jumps when switching. Each measure gets its own color max, so the today-vs-proposal projections can't be compared by eye.

### 6.2 Build-time projection (`prepare.mjs`)

1. Parse the GeoJSON strings in `area_geometry.csv`.
2. Compute **one** projection from the combined bounds of all three sets, so the maps line up exactly when switching. Use equirectangular with x scaled by `cos(mid-latitude)`: at about 8 sq. mi. it is visually identical to Mercator and needs no library. Fit it to a fixed `viewBox` (about `0 0 360 420`, tuned so labels read at phone width; see 6.5).
3. For each area, write the SVG path `d` (coordinates rounded to 1 decimal), a label anchor (the polygon centroid, plus a `label_dx/dy` adjustment table in the script for crowded areas) and the land area.
4. Join the measures from `area_density.csv` and `school_proj.csv`. For each area, write the raw value, a formatted label and `t` (0–1) per measure.
   - **Shared color domain per measure:** "projected 2031" uses one maximum across maps B and C, so today-vs-proposal is directly comparable.
   - Enrolled and children each use one maximum across their maps. A and B may share it or not, but the legend always states its range.
5. Write the school dots as `{map, name, x, y}`.
6. Output `_data/enrollment/map.json`:
   ```json
   { "viewBox": "0 0 360 420",
     "measures": { "enrolled": {"label": "Enrolled students per sq. mi., fall 2026", "max": "1,234"}, "...": {} },
     "maps": [
       { "id": "es-2026", "label": "Elementary areas, 2026-27 boundaries", "default": true,
         "measures": ["enrolled", "projected", "children"],
         "areas": [{ "name": "Dewey", "d": "M…Z", "lx": 0, "ly": 0,
                     "values": { "enrolled": {"t": 0.31, "label": "238"}, "projected": {}, "children": {} } }],
         "schools": [{ "name": "Dewey", "x": 0, "y": 0 }] },
       { "id": "ms", "...": "..." }, { "id": "es-nov6", "...": "..." } ] }
   ```
   The magnet area gets `"empty": "magnet"` instead of values.

### 6.3 Markup: `_includes/enrollment/density-map.html` (Liquid)

```liquid
<figure class="card flow choropleth" aria-labelledby="density-title" data-map>
  <figcaption>…heading + .hint…</figcaption>
  <div class="choice-group compact" role="group" aria-label="Map">           {%- comment -%} 3 maps {%- endcomment -%}
    {% for m in map.maps %}<button type="button" class="choice compact" data-map-id="{{ m.id }}"
       aria-pressed="{% if m.default %}true{% else %}false{% endif %}">{{ m.label }}</button>{% endfor %}
  </div>
  <div class="choice-group compact" role="group" aria-label="Measure">…only the active map's measures…</div>
  <div class="choropleth-stage">
    {% for m in map.maps %}
    <svg viewBox="{{ map.viewBox }}" role="img" aria-labelledby="map-{{ m.id }}-title" data-map-panel="{{ m.id }}"
         {% unless m.default %}class="is-hidden"{% endunless %}>
      <title id="map-{{ m.id }}-title">{{ m.label }}</title>
      {% for a in m.areas %}<path class="choropleth-area{% if a.empty %} is-empty{% endif %}" d="{{ a.d }}"
          style="--t: {{ a.values[m.measures[0]].t }}" data-t-enrolled="…" data-t-projected="…" data-t-children="…"><title>…</title></path>{% endfor %}
      {% for s in m.schools %}<circle class="choropleth-school" cx="{{ s.x }}" cy="{{ s.y }}" r="3"/>{% endfor %}
      {% for a in m.areas %}<text class="choropleth-label" x="…" y="…"><tspan>{{ a.name }}</tspan><tspan x="…" dy="1.2em" data-label-enrolled="…" …>{{ first value label }}</tspan></text>{% endfor %}
    </svg>
    {% endfor %}
  </div>
  <div class="choropleth-legend cluster">…HTML gradient bar (linear-gradient(to right, var(--seq-low), var(--seq-high))) + min/max + measure name + school-dot key…</div>
</figure>
```

### 6.4 CSS (`.choropleth`, block layer)

- `.choropleth-stage { display: grid; }`; every SVG sits in `grid-area: 1 / 1`. `.is-hidden` uses opacity and visibility with a `--transition-base` crossfade.
- `.choropleth-area`:
  - `fill: color-mix(in oklab, var(--seq-high) calc(var(--t) * 100%), var(--seq-low));`
  - `stroke: var(--card)`
  - `transition: fill var(--transition-base) var(--ease)`, so switching measures animates the color.
- `.choropleth-area.is-empty`: `fill: var(--series-muted)` plus an SVG `<pattern>` hatch, so the empty area isn't marked by color alone. Its label reads "magnet".
- `.choropleth-label`: `paint-order: stroke; stroke: var(--card); stroke-width: …; fill: var(--ink)`. The halo keeps labels readable on any shade in every theme, which replaces the hardcoded `#fff`/`#0b0b0b` lightness test.
- `.choropleth-school`: `fill: var(--ink); stroke: var(--card)`.
- `max-inline-size` capped (about `32rem`) and centered, so label size stays readable at both phone and desktop width.

### 6.5 JS (in `charts.js`, about 30 lines, progressive)

- On a **map** button: set `aria-pressed`, toggle `.is-hidden` on the panels, and rebuild the **measure** group, rendering only that map's measures. Map C has one measure, so show it as plain text with no buttons. Then apply the measure.
- On a **measure** button: for each path in the visible panel, `style.setProperty('--t', path.dataset['t' + Measure])`. Swap each value label's text from its `data-label-*`. Update the legend's name and range. Call `announce()` with "Showing {measure}, {map}".
- Focus stays on the button pressed, because nothing is rebuilt except the measure group, and only when the map changes.
- **Without JS:** map B with "enrolled" is shown, the buttons are hidden (`.js`-gated), and the tables carry all the data.

### 6.6 Tables

- Keep `density-table` (maps A and B, all measures), rendered in Liquid.
- Add `density-nov6-table` (map C: area, land, projected 2031 middle and range, per sq. mi.) in the same accordion, so every value on every map is available as text.

## 7. Order of work (one commit per step on `feature/enrollment-page-v2`)

1. **Plan:** this document.
2. **Content and front matter** (§1).
3. **Tokens and blocks** (§3.1–3.3), including the `levy-*` → `chart-*` rename in the tax calculator. Check the tax calculator visually in every mode.
4. **`chart.html` + `charts.js`** (§3.4–3.5) with `lineChart`, `focusBands`, `legend`, `tooltip`, `table`.
5. **`prepare.mjs`** + generated `_data/enrollment/` (§2); move raw CSVs to `data-src/`.
6. **Page rebuild** (§4): Liquid text, tiles and tables first; then HTML charts (bars, dots, heat); then line charts.
7. **Map** (§6).
8. **Clean-up:** delete `enrollment-dashboard.js`/`.css`, the d3 `<script>` and `assets/data/enrollment/`. Update `CLAUDE.md` (chart system, the `data-src` → script → `_data` flow, safelist note) and `postcss.config.cjs`.
9. **Follow-up:** move the tax calculator's `renderChart` onto the `charts.js` helpers.

## 8. Verification (cloud session: no dev server)

- `bundle exec jekyll build --baseurl ""` finishes clean, and `npm ci && npm run build:css` succeeds. Then grep the built `_site/assets/css/main.css` for `chart-tip`, `swatch-dashed`, `choropleth-area` and `heat` to confirm PurgeCSS kept them.
- Serve `_site` with a static server. Use the preinstalled Playwright for screenshots at **375 / 784 / 1280** px in **light, dark, high-contrast light, high-contrast dark, 150% text and dyslexic font**, for every figure. Check that:
  - there is no horizontal page scroll;
  - every chart label is at least `--step--1` on screen;
  - the map switches without jumping and the colors crossfade.
- Keyboard: Tab reaches every toggle, focus band and table region. Arrow keys move the tooltip. Pressing a toggle keeps focus.
- Run axe-core (`@axe-core/playwright`, dev-only, not committed to the site) and fix any serious or critical issues.
- Contrast script: every `--series-*` used as a line is at least 3:1 against `--card`, and every table text color is at least 4.5:1, in all five theme blocks.
- With JavaScript disabled: every number, table, bar, dot row, heatmap cell and the default map render.
- Compare against PR #21: every figure and every number in the text matches (the `prepare.mjs` output against the old `dash.calc` results).

## 9. Decisions (maintainer, 2026-11-23)

1. **Series-3 contrast:** change the shared token everywhere. Light `--series-3` goes from `#E69F00` (2.25:1 on white) to `#B07300` (3.96:1). In deuteranopia, protanopia and tritanopia simulations it stays further from series 1, 2 and 4 than the existing pink/green pair is from each other. The dark and high-contrast values already pass and are unchanged. (§3.1)
2. **PR handling:** open a new PR from this branch. Leave PR #21 as is.
3. **Wide layout:** keep the normal width for now. (§1.6)
4. **Color domains:** share one color scale per measure across every map that shows it (enrolled: A + B; children: A + B; projected 2031: B + C).

## Review-item traceability

Every finding from the PR #21 review maps to a step:
- front matter / auto-listing → §1
- separate unlayered CSS, renamed tokens, duplicate blocks, hardcoded px → §3
- dead code, duplicate helpers, globals, confusing position math, resize → §3.5, §4, step 8
- color modes, contrast → §3.1, §5, §6.4
- phone layout, text size → §4, §5
- focus loss, mouse-only tooltips, missing tables, table semantics, accordion → §3.4–3.5, §5, §6.5
- "—" placeholders / translation → §2
- d3 weight and integrity → §3.5, step 8
