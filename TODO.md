# TODOs

## Thrive65 Site
------------------------

## Priority
- hero art - finish trace, colorize/tokenize
- social media links 
    - [ ] `_config.yml` → `twitter.username` — set real X/Twitter handle (uncomment)
    - [ ] `_config.yml` → `social.links` — add real profile URLs (Facebook, X, Instagram…)
- [ ] a11y scan 
- [ ] performance scan fixes

### Repo Architecture
- move content .md pages into subfolder
- icons - figure an easier way to adjust size of icons

### Bugs
- [ ] `@custom-media` breakpoints are inert in dev (authored CSS is served unprocessed; no browser ships it on by default). Dev workaround: Firefox `about:config` → `layout.css.custom-media.enabled = true`. Acceptable while solo — revisit (dev-time PostCSS pass, or literal queries) if another dev joins or Firefox stops being the dev browser.

### Features
- source citations: hover shows tooltip w/ inline links, or clicking opens flyout menu with all sources
- scrollspy bar, showing length of page
- a11y menu
  - [ ] make colorblind hue the default 
  - [ ] add letter spacing ticker & tokens
  - low pri: change a11y-segmented items to a radio group, slightly more specific semantically.
- [ ] Hover anchor icon should only attach to H2s and FAQ items(?) or all h2 & h3s
- [ ] Handling images in posts/pages
- [ ] Highlighting text shows Medium-style share tooltip

### Design
- [ ] off-palette leftovers from the retired teal/rose brand — move to Okabe–Ito:
    - `--focus: #D42A56` (light, `main.css` ~line 130) is the rose the colorblind-safe palette exists to avoid, and its `/* bloom on light */` comment is stale (`--bloom` is now `#C4560A`)
    - `--focus: #8CE7B7` (dark) is leftover Lake Teal mint
    - now that Okabe–Ito is the default for everyone, the focus ring should come from it too — sweep for any other stragglers while in there
- style h4s (not italic)
- style h6 within FAQ item, for "Sources"
- full sweep of basic element margins & padding. (e.g. ul, ul > li). Reset defaults, convert all spacing to fluid --space vars.
    - more margins. We have defaults (using em, on specific elements) and .flow (lobotomized owl) - need to align these different systems. Use one everywhere, make it fluid, remove the old one.
- Charts! Need JS charts.
- smoll city graphic at footer



## Docs CMS
------------------------

### Bug
- if you publish a page, then change the name of the page and publish again, the original page is not deleted.

### Functional
- Allow publishing and showing of Docs CMS in docs within subfolders of the configured website folder. (i.e. thrive65-site/posts/)
- Overall review of Code.gs to confirm it is generic. Create Plan to convert to standalone Add-On.

### Design
- Better form subsection labels (see Post type)
- Logo/Icon

## Citation sources — Phase 2 editorial review (d65-deficit-explained)

`_data/sources/deficit.yml` was split from the page's former 29-entry list into
48 one-doc entries, then reduced to **45** by two editorial merges (resolved):

- **FY27 Preliminary Budget memo (merged → entry 11)** — the same document cited
  from three prose sites (old sources 9, 11, 16) is now one entry; old markers
  9/11/16 all include [11] in their runs.
- **Meeting 740748 (merged → entry 35)** — the Apr 20 2026 SDRP Phase 3 item is
  now one entry linking the board **presentation**
  (`meetings.boardbook.org/Documents/WebViewer/1247?file=6407288`), not the
  agenda/minutes views. NOTE: that file id is short vs. other BoardBook links —
  verify it resolves before publishing.
- **Entry 23 (WestEd special-ed audit)** — ⚠️ OPEN: the linked URL is Evanston
  RoundTable coverage; RoundTable's link to the actual audit document is
  currently **broken**. Find the real audit URL and swap it in later.
- **Entry 28 (IASB governance principles)** — resolved: belongs with the
  ELEVATE/SIPI/merger group (grouped there now).
- Spot-check derived titles/publishers/dates against the prose for all 45.

Marker remap (old → new run) lives in the `DEFICIT_MARKER_REMAP_` map inside
`apps-script/Code.gs`; `renumberMarkersDeficit_` applies it to the Doc. Gate 2
passed via a manual export of a *copy* Doc, so the local `d65-deficit-explained.md`
is correct now. The **real** deficit Doc still has the old 1–29 markers — run
`renumberMarkersDeficit_` on it (and delete its in-Doc `## Sources`) before the
final republish, or the add-on will overwrite the migrated markers with old ones.
Delete the function + map only after that real-Doc republish. (Throwaway
`migration-remap-deficit.txt` already removed.)

## Citation sources — Phase 3 editorial review (homepage FAQ)

`_data/sources/faq.yml` was migrated from the former fake `- question: "Source
List"` accordion item (removed from `_data/faq.yml`), split so each entry cites
one document, then the two exact-duplicate entries were **merged** (old 20→52,
old 68→57) and the whole list renumbered to a sequential **1-67**. The citing
markers in `_data/faq.yml` were remapped to match (the redundant
`[20][52][68][57]` rollup now reads `[51][56]`).
Result: **67 entries, 230 markers**, clean build (no uncited/out-of-range).

Open editorial items:
- Spot-check derived `title`/`publisher`/`date`/`note` for all 67 against the
  prose (metadata was semi-auto-derived from the old citation strings).

**Doc-side steps before the coordinated republish** (FAQ Google Doc): run
`renumberMarkersFaq_` (takes the Doc's original 1-64 markers straight to the
final 1-67 space, expanding the four bundles), delete the Doc's own
"Source List" section, then Publish. Until then the real FAQ Doc still has the
old un-split markers + the Source List section — republishing before those two
steps would overwrite the migrated `_data/faq.yml`. Delete `FAQ_MARKER_REMAP_` +
`renumberMarkersFaq_` from `apps-script/Code.gs` only after that republish.

### Design issue with Sources appended at bottom
- [x] spacing of numbered sources — `.source::before` now right-aligns the
  number in a `--source-num-width` (2.75ch) gutter with a constant `--space-xs`
  gap, so wide numbers grow leftward instead of crowding the text.
- [x] backlink offset — verified already handled by the shared
  `:where([id]) { scroll-margin-block-start: var(--space-2xl) }` rule: a real
  backlink click lands the cite ~33px below the sticky header (deficit page,
  native `#cite-N-M` nav) and opens + offsets the FAQ item on the homepage. No
  change needed.
- backlink numbers have escaped periods, e.g. "↩ 1\. There are meaningfully fewer childr..." - ok to ignore for now. test again once content is generated from actual google doc. 
- [x] long sources list — wrapped in the new **shared `.collapsible` pattern**
  (CSS block layer + activation IIFE in `head.html`): clips to `--collapsible-max`
  (18rem) with a fade mask and a JS-injected `Show all / Show fewer` toggle when
  the content overflows; degrades to fully visible with no JS. Reusable on any
  long section via `data-collapsible` + `data-collapsible-label`. Toggle is
  instant (animating the ~11000px list's height janks/freezes the page).
