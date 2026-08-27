# Contextual source sidebar — one citation system for the whole site

## Context

Thrive65's central claim is *"five things we believe are true, each traceable to a document you can open yourself."* The citation UI is therefore the credibility mechanism, and today it doesn't work:

- **Markers are dead text.** All 269 `[n]` markers (57 on `/d65-deficit-explained/`, 212 in the homepage FAQ) render as literal bracketed digits. Nothing is clickable; checking a claim means scrolling a 20-minute page and counting.
- **Every outbound link says "[link]".** ~116 of them. A screen-reader link list reads "link, link, link…" — fails WCAG 2.4.9.
- **One number ≠ one document.** 24 entries bundle 2–4 separate documents under a single number.
- **No return path**, and the FAQ's 64-entry source list is stuffed inside a fake accordion item (`- question: "Source List"`), which also pollutes the FAQ's heading outline.
- **Two disconnected systems.** The deficit page and the FAQ each hand-maintain their own list in their own prose, with no shared markup, styling, or behaviour.

**Outcome:** one methodology for source data, design, and interaction on any page. A non-modal sidebar slides in from the right (bottom sheet on mobile) showing only the sources relevant to the marker just clicked, so the reader sees the evidence and the article text at the same time. With JS off, the same markers are plain in-page jumps to a source list with back-links to the section that cited them.

### Decisions already made
| | |
|---|---|
| **Numbering** | Per-page. Each surface keeps its own `1..N` in its own data file. |
| **Bundles** | Split, then full clean renumber. Nothing deep-links `#source-n` today, so there is nothing to break. |
| **Authoring** | Source lists become hand-maintained YAML in the repo. No new Apps Script content type. |
| **Editorial** | Derive title/publisher/date/URL from existing prose automatically; flag the gaps in `TODO.md`. |

### Explicitly out of scope
Tagging, filtering, categorization, provenance tags, archive/Wayback fallbacks. (Direction C from the original brief is dropped; A is the no-JS floor, B's progressive-enhancement idea survives as the sidebar rather than a floating popover.)

---

## Architecture

```
_data/sources/<key>.yml          hand-maintained; one entry = one document
        │
        ├── _plugins/source_refs.rb   rewrites [n] → <a href="#source-n">, tracks sections
        │        │
        │        ├── page/document pre_render hook   (d65-deficit-explained.md, posts)
        │        └── Liquid filter `source_refs`     (_data-driven: _includes/faq.html)
        │
        ├── _includes/sources.html        bottom-of-page <ol id="sources"> + back-links
        └── _includes/source-panel.html   the sidebar; clones <li id="source-N"> at runtime
```

One rendering of the data, one place it lives. The sidebar has **no copy** of the source text — it clones the `<li>` already in the page, so the two can never drift.

---

## 1. Data model — `_data/sources/<key>.yml`

One file per surface: `deficit.yml`, `faq.yml`, `tax-calculator.yml`. The number is **positional** (`items[i]` is source `i+1`) — a stored `n:` and a list position drift the first time anyone reorders.

```yaml
key: deficit
title: "Sources"
items:
  - title: "Analysis and viewpoint: District 65 has 25% fewer students, but 10% more staff. Why?"
    publisher: "Evanston RoundTable"
    date: "March 22, 2026"
    url: "https://evanstonroundtable.com/2026/03/22/analysis-and-viewpoint-…"
    note: "Reports ISBE enrollment data for 2018-19 against district-reported 2025-26."
  - title: "Board minutes, April 20 2026 regular meeting"
    publisher: "District 65"
    date: "approved May 18, 2026"
    # no url: — renders as unlinked text (covers FAQ source 60 and the two ADD_LINK placeholders)
    note: "Records FY27 position reductions: 53.5 cut, 1 added, net 52.5 FTE, $3,565,106."
```

Only `title` is required. No `tags`, `type`, `archived_url`, `accessed` — out of scope, and unused fields rot.

**Back-links are computed, never stored.** The plugin accumulates them into `page.source_citations`; hand-maintaining a `cited_in:` list would go stale on the first edit.

---

## 2. `_plugins/source_refs.rb` — the marker rewriter

New file, and the first `_plugins/` entry in the repo. CI runs `bundle exec jekyll build` (not the `github-pages` gem), so custom plugins are allowed — note this permanently forecloses moving back to that gem, which is already effectively true.

Rejected alternatives: rewriting in `cleanGoogleMarkdown` at publish time (bakes HTML into published markdown, violating the classless-content rule, and can't validate against the YAML); client-side JS (kills the no-JS requirement outright).

### Public surface

```ruby
module Thrive65::SourceRefs
  def self.rewrite(text, source_set, ctx)   # → markdown with markers replaced
  class Context
    def initialize(section: nil)            # non-nil pins every citation (FAQ mode)
    def register(n, section)                # → "cite-<n>-<k>"
    def citations                           # → { 3 => [{cite_id:, section_id:, section_label:}, …] }
  end
end
```

Two entry points:
1. `Jekyll::Hooks.register [:pages, :documents], :pre_render` — mutates `doc.content` before kramdown for whole-file markdown surfaces; writes the map to `doc.data['source_citations']`.
2. Liquid filter `source_refs` — for `_data`-driven content. `_includes/faq.html` becomes `{{ item.answer | source_refs: item.question | markdownify }}`, pinning the section to `{id: "faq-#{slugify(question)}", label: question}` to match the existing `<details id>`.

### Parsing rules, in order

**Step 0 — masking.** Split each line into safe/unsafe segments and only transform safe ones; track fenced-code state across lines.
```ruby
SPLIT = /(`[^`]*`|!?\[[^\]]*\]\([^)]*\)|!?\[[^\]]*\]\[[^\]]*\]|^\s{4,}\S.*$)/
```
This protects `[[link]](url)`, `[Claude.ai](http://Claude.ai)`, code spans, and indented blocks.

**Step 1 — author-written anchors (the convergence path).** Inside link segments, `\[([^\]]*)\]\(#source-(\d{1,3})\)` → the same canonical markup as step 3. This is what makes a Google-Docs-authored `#source-1` link and a bare `[1]` produce identical HTML.

**Step 2 — the FAQ roll-up line.** `\A\s*\*Sources:\s*((?:\[\d{1,3}\])+)\*\s*\z` → a `<p class="source-rollup">` block rather than superscripts. A roll-up marker registers a back-link **only if that number wasn't already cited inline in the same section** — otherwise all 19 roll-ups produce duplicate back-links to answers their inline markers already cover.

**Step 3 — bare marker runs.** Matched as runs so `[9][10][11]` becomes one element:
```ruby
RUN = /(?<![\\\]])((?:\[\d{1,3}\])+)(?!\()/
```
`(?<![\\\]])` kills reference-style `[foo][1]`; `(?!\()` kills real inline links; `\d{1,3}` stops a bracketed year or amount being swallowed. Also skip a run at line-start followed by `:` (a kramdown link-reference definition).

Output — **the run wrapper is load-bearing**, it's how the sidebar detects a group without heuristics:
```html
<sup class="source-ref-group"><a class="source-ref" href="#source-3"
   id="cite-3-2" data-source="3" role="doc-noteref" aria-label="Source 3">3</a><a …>4</a></sup>
```

**Step 4 — validation.** Any `N` outside `1..items.length` raises `Jekyll::Errors::FatalException` with file, line and number: a dangling citation is a build failure, not a broken production link. A source with zero citations emits a build warning.

### Section tracking

- *Scanning mode* (whole-file): match `^(#{1,6})\s+(.+?)\s*#*\s*$` and mimic **kramdown's** `generate_id` — not Jekyll's `slugify`, they differ — including its `-1`/`-2` duplicate-id suffixes, or back-links point nowhere.
- *Pinned mode* (FAQ): the section comes from the filter argument; ids use Jekyll `slugify` because that's what `faq.html` already emits.

Back-links dedupe **by `section_id`, keeping the first cite id** — a source cited five times in one section yields one back-link; cited across three sections, three.

### Classless published content
The `.md`/`.yml` in the repo keep bare `[n]` exactly as the Doc emitted them. Classes exist only in `_site/**/*.html`, which is also what PurgeCSS scans — so `.source-ref`, `.source-ref-group`, `.source-rollup` need no safelist entry.

---

## 3. `_includes/sources.html` — the no-JS baseline

```liquid
<section class="sources" id="sources" aria-labelledby="sources-heading">
  <h2 id="sources-heading">{{ include.heading | default: "Sources" }}</h2>
  <ol class="source-list">
    {% for src in sources %}
      <li class="source" id="source-{{ forloop.index }}" value="{{ forloop.index }}">
        {% if src.url %}<a class="source-title" href="{{ src.url }}" rel="noopener">{{ src.title }}</a>
        {% else %}<span class="source-title">{{ src.title }}</span>{% endif %}
        <p class="source-meta">{{ src.publisher }} · {{ src.date }}</p>
        {% if src.note %}<p class="source-note">{{ src.note }}</p>{% endif %}
        {% include source-backlinks.html n=forloop.index %}
      </li>
    {% endfor %}
  </ol>
</section>
```

- **`value` is emitted unconditionally.** A dropped or reordered entry silently renumbering the whole list is this system's worst failure mode.
- **The link text is the document title** — the single biggest a11y win here, replacing ~116 links that all announce as "link".
- `<section aria-labelledby>`, not `role="doc-bibliography"`: patchy AT support, adds nothing over a labelled landmark. Keep `role="doc-noteref"` on markers (well supported) but **not** `role="doc-endnote"` on the `<li>`, which strips list-item semantics in some AT.

**Back-links** (`_includes/source-backlinks.html`) read `page.source_citations[n]`, cap at 6 with "and N more", and render:
```html
<span class="source-backlinks"><a class="source-backlink" href="#cite-3-1"
   aria-label="Back to citation 3 in Why the deficit grew"><span aria-hidden="true">↩</span>
   {{ label | truncate: 42 }}</a></span>
```
Section *names*, not "§1" — the reader learns which claim they were reading. The `↩` is `aria-hidden` so it isn't read as "left arrow curving up"; visual truncation with full text in `aria-label`.

FAQ back-links point at the coarse `#faq-<slug>` (always works, even no-JS); JS refines the scroll to the precise `#cite-…`. Per CLAUDE.md, `#faq-<slug>` is unstable across question rewording — but href and label are regenerated from the same `_data/faq.yml` every build, so **internal back-links can never break**. Only externally-pasted deep links are affected, which is the already-accepted status quo. Say so in the PR so it isn't re-litigated.

### CSS (`@layer block`)
Hanging-indent list under a `var(--border-bold)` top rule, numbers via `counter(list-item)` in `--secondary` (already re-declared under high contrast, so that's free). `.prose ol { padding-left: 1.25em }` at `main.css:1172` must be overridden.

`:target` styling is a **persistent fill, not a flash** — a flash is gone before anyone scrolls back, and the global `prefers-reduced-motion` guard collapses it to nothing:
```css
.source:target { background: var(--tint); box-shadow: 0 0 0 var(--border-bold) var(--edge); }
[data-contrast="high"] .source:target { background: transparent; outline: var(--border-bold) solid var(--focus); outline-offset: 2px; }
```
The high-contrast override is **load-bearing, not cosmetic**: `--tint` is not in the `[data-contrast="high"]` re-declaration list, so the default would likely fail 7:1.

### Site-wide sticky-header fix
There is **no `scroll-margin` anywhere in this codebase** and `.site-header` is `position: sticky` — every fragment jump on the site currently lands underneath it. That becomes glaring the moment `#source-N` jumps are the primary interaction. Add to `@layer base`:
```css
:where([id]) { scroll-margin-block-start: var(--space-l); }
```
`:where()` keeps specificity at 0. This retroactively fixes `#sources`, `#faq-*`, and every heading anchor — **call it out in the PR**, it's a visible behaviour change that wasn't accidental.

---

## 4. `_includes/source-panel.html` — the sidebar

Included **once** in `_layouts/default.html`, as a sibling *after* `</main>` (not inside it — `main` is the element we transform in §4c).

```html
<aside id="source-panel" class="source-panel" aria-labelledby="source-panel-title">
  <div class="source-panel-head repel">
    <h2 class="source-panel-title" id="source-panel-title" tabindex="-1">Source</h2>
    <button type="button" class="source-panel-close" aria-label="Close sources" data-source-close>
      {% include icons/close.svg %}</button>
  </div>
  <div class="source-panel-body"><ol class="source-panel-list"></ol></div>
  <div class="source-panel-foot"><a class="source-panel-all" href="#sources">All sources on this page</a></div>
</aside>
```

### Non-modal by design — the crux
`<aside>` → `role="complementary"`, a landmark, giving screen-reader users a jump route in. Explicitly **no** `role="dialog"`, **no** `aria-modal`, no focus trap, no `inert`, no scroll lock, no scrim. `aria-modal` tells AT everything outside is unavailable — the exact opposite of the requirement — and NVDA/JAWS switch to forms mode inside a dialog, breaking browse-mode reading of the source text. *Every future reviewer's instinct will be "this should be a dialog with a focus trap"; put that rationale in the file's comment block.*

Closed state is `visibility: hidden` + off-screen transform. That one property buys: not focusable, not in the a11y tree, no stray landmark, no pointer target — and unlike `hidden`, it still transitions.

### Content: clone the `<li>`, don't ship a JSON blob
`document.getElementById("source-" + n).cloneNode(true)` → zero duplicated data, zero drift, zero added page weight (a JSON island would cost ~100–200 bytes × N on both the homepage and the deficit page). On each clone: strip all `id`s (duplicates would break fragment nav and the copy-link anchors), remove `.source-backlinks` (meaningless in the panel), and set `li.value = n` so numbering survives non-contiguous runs like `[4][20]` (`<ol start>` can't).

### Grouping rule: show the whole run, mark the clicked one
`[4][20]` means "these two together support this sentence" — showing only one hides half the evidence. The `*Sources: [1][2][39]*` roll-up falls out of the same rule for free.

Because the plugin wraps each run in `<sup class="source-ref-group">`, detection is `a.closest(".source-ref-group")` — **no sibling-walking heuristic and no fragile glue regex.** This is why §2's wrapper matters.

The clicked entry gets `.is-current` (left rule in `--brand` + `--tint` fill) **plus** `aria-current="true"` and a `visually-hidden` "Selected: " prefix, so the state is never colour-only — which also makes Windows forced-colors mode correct for free. Panel title reflects the run: *"Source 4"* / *"Sources 4 and 20"* / *"Sources 1, 2 and 39"*.

### CSS: always-present + transform, not `hidden` + `@starting-style`
The a11y sheet's `hidden` + `@starting-style` gives an **entry animation only** — the close is an instant snap. Wrong here for three reasons, in order of weight: (1) content changes *while open*, (2) this panel opens and closes dozens of times per reading session and a snap-close reads as a bug, (3) `hidden` is a semantic "not part of the page", not a thing to toggle 50× a session.

```css
.source-panel { visibility: hidden; transform: translateX(calc(100% + var(--space-m)));
  transition: transform var(--transition-slow) var(--ease), visibility 0s linear var(--transition-slow); }
.source-panel.is-open { visibility: visible; transform: translateX(0);
  transition: transform var(--transition-slow) var(--ease), visibility 0s linear 0s; }
html:not(.js) .source-panel { display: none; }
```
`--source-panel-w: min(24rem, 40vw)`. Docked head/foot + `flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain` body — the `.a11y-panel` recipe verbatim. **z-index 25**: above content and the nav backdrop (15), below the nav controls (30) and a11y panel (40) so an open mobile menu wins, and below `.toast` (100) so `announce()` still reads over it.

Mobile, inside the existing `@media (--sm-and-down)` block: bottom sheet mirroring `.a11y-panel` — `inset: auto 0 0 0`, top-rounded, grabber `::before`, `env(safe-area-inset-bottom)`, `translateY(100%)` → `0`. **`max-height: min(60dvh, …)` is what makes this work on a phone** — a full-height sheet would be modal in practice.

### 4c. The overlap problem — shift `main` with a transform
`.wrapper` caps text at `--measure` (41rem). At 1115px that leaves ~162px per side, so an overlay panel covers the article — defeating the entire point. Of the three options: overlay-and-accept fails exactly where it matters; `margin-inline-end` rewraps every paragraph mid-read and re-lays-out on every toggle; **`transform: translateX()` on `main` has no reflow, no rewrap, is GPU-composited, and animates in lockstep with the panel.**

```css
@media (--lg-and-up) {
  :root { --source-shift: min(var(--source-panel-w),
     max(0px, calc(var(--source-panel-w) + var(--space-m) - (100vw - var(--measure)) / 2))); }
  body.source-open > main { transform: translateX(calc(-1 * var(--source-shift))); }
}
```
Three checks, all passing: `.site-header` is a **sibling** of `main`, not a descendant, so sticky is unaffected; `main` has no `position: fixed` descendants today (`.toast` appends to `body`; every nav/a11y surface lives in `<header>`); the shift is leftward, and LTR left-overflow creates no scrollbar — important, because `overflow: clip` on `html`/`body` would break the sticky header.

> ⚠ **A transformed `main` becomes the containing block for any `position: fixed` descendant.** There are none today. This needs a load-bearing CSS comment so nobody later adds one and wonders why it's anchored wrong.

The outer `min()` is the fix for the riskiest interaction in the component: at `data-textsize="150"`, `--measure` grows and the raw shift could push `main`'s left edge off-screen. Test explicitly at 150% × 1115px; if it still clips, gate the shift on a new `@custom-media --xl-and-up (min-width: 1280px)`.

---

## 5. JS — a new `SourcePanel` IIFE in `_includes/head.html`

**Bespoke, not `Disclosure`.** Disclosure's contract is *one persistent trigger owning `aria-expanded`/`aria-controls`*; here the triggers are 40–200 inline links. Putting `aria-expanded` on a citation marker is semantically false and would make every marker announce "collapsed" mid-sentence. Worse, Disclosure's `data-dismiss="outside"` closes on **every article click** — the exact opposite of "keep reading and clicking markers" — and its `data-disclosure` group would make the panel mutually exclusive with nav dropdowns. It also drives `hidden`, which §4 rules out.

Reused instead: the shared `announce()` (never a second live region), the swipe-close body, and Disclosure's *conventions* (delegated listeners, no trap).

| Behaviour | Decision |
|---|---|
| Trigger | Delegated `click` on `a.source-ref`. Ignore matches inside `#source-panel`, and ignore modified clicks (`metaKey/ctrlKey/shiftKey/button !== 0`) so "open in new tab" still works. |
| Repeat click | Repopulate in place. **Never toggle-close** — with 200 markers, toggle semantics makes the panel flicker whenever a reader re-checks a citation. |
| Focus on open | **Pointer: don't move focus** — yanking the reading position is the classic non-modal bug. **Keyboard** (`e.detail === 0`, true for Enter on a link): focus `.source-panel-title[tabindex="-1"]`, otherwise the panel is unreachable since it sits at the end of the document. |
| Close | Close button and Escape → `close(true)`, returning focus to the run's first marker. **No outside-click close.** No close on scroll. |
| Escape ordering | Three handlers now listen (Disclosure, `closeNav`, this). Bail if `[data-disclosure][aria-expanded="true"]` or `.site-header.nav-open` exists, so one press closes one thing, innermost first. |
| Swipe | Generalise the existing bottom-sheet IIFE to `.a11y-panel, .source-panel` and dispatch on the match — one drag implementation, two consumers. |
| URL hash | **Don't touch it.** `pushState` would pollute back-button history with dozens of entries, and on reload the fragment would jump the reader to the bottom list. The footer's "All sources" link is the deliberate route to `#sources`. The panel is not deep-linkable — correct, it's a transient reading aid. |
| Announcement | `announce("Sources 4 and 20. 2 sources shown in the source panel.")` — what changed, then where it went. **No `aria-live` on the panel itself**: it repopulates on every click and would read every source aloud unbidden. |
| Reduced motion | Handled by the global guard; add only `@media (prefers-reduced-motion: reduce) { .source-panel { transition-delay: 0s } }`. On the mobile sheet, `scrollIntoView({block:"center"})` the marker on open (the sheet may cover it), with `behavior` set from the media query. |

**One change to existing JS:** generalise `openHash()` (head.html:563) from "is this a `.faq-item`?" to `el.closest("details")?.open = true` before scrolling. Strictly better, and it's what makes a `#cite-…` back-link landing inside a collapsed FAQ answer work.

### Marker target size (WCAG 2.2 SC 2.5.8)
Bare superscript digits are ~10×12px. Fixed with a transparent centred `::before` overlay sized `max(24px, 100%) × 24px` — the same trick the compact a11y-panel controls already use — on a marker with `line-height: 0`, so **prose line-height is untouched**. Risk: two adjacent markers have overlapping 24px targets; mitigate with `.source-ref + .source-ref { margin-inline-start: 0.15em }` and measure at the 320px root minimum (worst case). The SC 2.5.8 inline-targets exception is the fallback, but only after trying to meet it.

---

## 6. The FAQ's collapsed-`<details>` problem

**Move the source list out of the accordion entirely.** Delete the fake `- question: "Source List"` item (`_data/faq.yml:314`) and render sources as a sibling section after the accordion in `_includes/faq.html`. A no-JS `#source-N` jump into a closed `<details>` simply doesn't work — browsers don't auto-open for an inner fragment target.

Rejected: `<details open>` (a 64-item list permanently expanded above the signup section, and the user can collapse it and break their own links); `hidden="until-found"` (Chromium-only fragment reveal — not a baseline mechanism); a `:has()`-based `:target` reveal (fights the native widget).

This also fixes a real bug for free: "22 FAQ items" is really 21 questions plus a fake one polluting the heading outline and the FAQ schema. And `openHash()` needs no change for it — `#source-N` matches an `<li class="source">`, fails the class check, and falls through harmlessly.

---

## 7. Progressive-enhancement contract

**Server-rendered:** every marker as a real `<a href="#source-N">` (no `href="#"`, no `<button>`); the full `.sources` section with every `<li id="source-N">`, title link and back-links; `:target` arrival styling.

**JS-only:** click interception, the sidebar, `<details>` auto-open, and the precise `#cite-…` scroll for FAQ back-links (coarse `#faq-<slug>` is the server-rendered fallback).

> **Enforceable review rule:** nothing in the source system may be hidden by a selector not gated on `html.js`. The panel is hidden via `html.js`-gated rules — never a bare `.source-panel { display: none }`.

`html.classList.add("js")` is already set at `head.html:43`, in the first inline script before the stylesheet link, and the codebase already uses this exact gate at `main.css:534`. Reuse it; don't invent a flag.

---

## 8. Migration

*(Applies to Phases 2–4. Phase 0 and 1 write no real content — see §9.)*

Scripted extraction + human review, per the "derive automatically, flag the gaps" decision. `script/extract_sources.rb` is a throwaway (deleted after use, **not** a `_plugins/` file): it reads the existing list, joins continuation lines — which absorbs the orphan fragment at `d65-deficit-explained.md:173` back into entry 16 — splits each `[[link]](url)` into its own entry, derives `title`/`publisher`/`date`/`note` from the prose, and emits both the YAML and a `remap.txt` of `old → new`.

**The renumber reaches into the Google Docs.** The prose markers live in Docs-published content, so a repo-only edit is erased by the next publish. Handle it with a one-time `renumberMarkers_(docId, remap)` utility in `apps-script/Code.gs` using `DocumentApp.replaceText`, run in **two passes via a sentinel** (`[7]` → `[§7§]` → `[19]`) so overlapping old/new numbers can't collide. Run once per Doc, then delete the utility.

Counts: deficit 29 entries / 48 URLs / 10 bundles → **~48 entries**; FAQ 64 entries / 68 URLs / 4 bundles → **~69 entries**. Flag to `TODO.md`: the two `http://ADD_LINK` placeholders (`_data/faq.yml:352`, `:380`) and source 60 (~`:431`, no URL at all) — drop the `url:` key entirely so they render as honest unlinked citations. **~4–5 h of editorial review**, dominated by adjudicating the 24 bundle splits and checking derived titles.

> ⚠ **Load-bearing, easy to skip:** the `## Sources` section must be deleted **in the Google Doc**, not just in the repo — otherwise the next publish restores it and the page renders the list twice. Sequence the Doc edit in the same session as the repo commit.

### Only Apps Script change we keep
Authors must be able to link `#source-1` from a Doc, but Docs can't author a relative link — it exports as `https://wethrive65.org/d65-deficit-explained/#source-1`. Add one step to `cleanGoogleMarkdown` (`Code.gs:576`):
```js
function relativizeSiteAnchors_(md) { /* ](https://<SITE_URL>/…#source-12) → ](#source-12) */ }
```
Host from a new `SITE_URL` script property, defaulting to `wethrive65.org`. No new content type, no `SOURCE_SET` page property — sources are repo-side now.

### Opt-in
`_config.yml` `defaults`, placed **after** the existing catch-all block (later matching defaults win in Jekyll):
```yaml
- scope: { path: "d65-deficit-explained.md" }
  values: { sources: "deficit" }
```
`_includes/faq.html` names its set explicitly. A page without the key renders nothing — so **un-migrated pages are byte-identical.**

---

## 9. Rollout — five phases, with a hard stop after each

**No existing content is touched until Phase 2.** Each phase ends at a gate: I stop, you deploy/review/round-trip through Google Docs, and we only continue once that phase is proven. If the Doc export doesn't reproduce what works locally, we adjust the solution before it has touched anything real.

---

### Phase 0 — POC page (nothing live changes)

Build the whole system and render it on **one throwaway page that isn't linked from anywhere**, so the UI can be reviewed on `localhost:4000` before any existing content is edited.

**New files:**
- `sources-poc.md` — top-level page, `layout: page`, `sources: poc`, plus `sitemap: false` and a `noindex` robots meta so it can't be crawled if it ever reaches production. Not added to `_includes/site-nav.md`.
- `_data/sources/poc.yml` — ~10 hand-written entries.
- Everything from the infrastructure list: `_plugins/source_refs.rb`, `_includes/sources.html`, `_includes/source-backlinks.html`, `_includes/source-panel.html`, the CSS block, the `:where([id])` scroll-margin fix, the `openHash()` generalisation, the `postcss.config.cjs` safelist additions.

**The POC content is chosen to exercise every parsing and UI edge case at once** — roughly a page of real prose lifted from the deficit page, with:

| Case | Why |
|---|---|
| Single marker `[1]` | baseline |
| Adjacent pair `[4][7]` | run grouping, and the 24px-target collision risk |
| Triple `[8][9][10]` | run grouping past two, panel title grammar ("1, 2 and 3") |
| Author-written `[the FY27 memo](#source-3)` | the convergence path — must render identically to a bare `[3]` |
| An absolute Docs-style link `https://wethrive65.org/sources-poc/#source-3` | proves `relativizeSiteAnchors_` |
| Roll-up line `*Sources: [1][2]*` | the `.source-rollup` block + the "only if not already cited" back-link rule |
| Same source cited in 3 different `##` sections | back-link dedupe by section, and section-name labels |
| A source cited nowhere | the build warning |
| An entry with no `url:` | the unlinked-citation render |
| Code span `` `[1]` `` and a real link `[text](https://…)` | masking — neither may be rewritten |
| `[[link]](url)` | masking, the exact shape in the current source lists |
| One marker inside a `<details>` | the collapsed-target case, before the FAQ migration |

A deliberately out-of-range `[99]` is tested once by hand (confirm the build fails with a useful message), then removed.

> **Gate 0 — you review.** Run the site locally, click through the panel on desktop and mobile widths (Firefox with `layout.css.custom-media.enabled=true`), toggle the a11y panel modes, disable JS and check the fallback. This is where UI/interaction changes are cheap. Nothing published, nothing live, `git checkout` undoes all of it.

---

### Phase 1 — Google Doc round-trip proof (still nothing live)

The POC proves the system works against *hand-written* markdown. It does **not** prove the Docs exporter produces the same bytes — and that's the risk that would force a redesign, so it gets tested before real content moves.

1. You create a scratch Google Doc, paste in the POC prose, and author the markers the way an author actually would: bare `[n]` typed as text, plus at least one real hyperlink to `…/sources-poc/#source-3`.
2. Publish it as a **Page** to a scratch path (e.g. `sources-poc-doc.md`), with `relativizeSiteAnchors_` added to `cleanGoogleMarkdown`.
3. Diff the exported markdown against the hand-written `sources-poc.md`, and diff the two **built** HTML outputs.

What we're specifically looking for — each of these would change the design:
- Does Google escape the brackets (`\[1\]`)? `cleanGoogleMarkdown` already strips `\[`/`\]`, but confirm it holds for runs like `[4][7]`.
- Does it insert smart quotes, non-breaking spaces, or `\.`/`\!`/`\-` escapes *inside* a marker run?
- Does the absolute `#source-3` link survive as a link at all, and does `relativizeSiteAnchors_` catch its exact URL shape?
- Does a marker adjacent to bold/italic prose get wrapped in emphasis spans that break the `RUN` regex?
- Does the `*Sources: […]*` roll-up survive as a single line?

If any of these break, the fix lands in `cleanGoogleMarkdown` (or the `RUN`/`SPLIT` regexes) here — cheaply, against a scratch page.

> **Gate 1 — you review the diff.** Once the Doc round-trip is byte-compatible, the design is proven end-to-end. Delete both scratch pages.

---

### Phase 2 — `d65-deficit-explained.md`

The smaller surface (57 markers, 29 sources → ~48 after splitting), a plain `layout: page` with no accordion complications.

1. Run `script/extract_sources.rb` → `_data/sources/deficit.yml` + `remap.txt`. Editorial review of the 10 bundle splits and derived titles.
2. Add the `_config.yml` default. Build — the plugin validates all 57 markers resolve.
3. **In the Google Doc:** delete the `## Sources` section, and apply the renumber via `renumberMarkers_`. Republish.
4. Diff the republished markdown against what's in the repo — this is the second round-trip check, now against real content.

> **Gate 2 — deploy and let it sit.** This is the low-risk proving ground for the whole design on a real page.

---

### Phase 3 — `_data/faq.yml` + `_includes/faq.html`

212 markers, 64 sources → ~69, plus removing the fake `- question: "Source List"` item from both the YAML **and** the FAQ Google Doc. Ships separately from Phase 2 — different failure modes, and one diff containing 212 conversions *and* 69 restructured sources *and* an accordion removal is not reviewable.

> **Gate 3 — deploy and verify** the homepage FAQ, especially back-links landing inside collapsed answers.

---

### Phase 4 — `tax-calculator.md`

4 sources, hand-authored, no Docs round-trip. Retire the bespoke `<ol class="src">` and its CSS so there aren't two source-list styles in the codebase.

---

**Cleanup at the end:** delete `sources-poc.md` and `_data/sources/poc.yml` (or keep the POC as a permanent, unlinked regression fixture — worth deciding at Gate 3). Add a note to CLAUDE.md's "Files overwritten by the publishing add-on" section: source lists now live in `_data/sources/`, and the Docs must not reintroduce a `## Sources` section.

---

## 10. Verification

**Build + purge.** Add to `postcss.config.cjs` `safelist.standard`: `"source-open"`, `"is-open"`, `"is-current"`, and `"source-ref"` as cheap insurance. Everything else appears literally in rendered HTML.
```bash
bundle exec jekyll build && npm run build:css          # Node ≥20 per .nvmrc
grep -c "source-backlink\|source-list\|source-panel" _site/assets/css/main.css   # must be > 0
```

**Marker audit** — every marker resolves, nothing orphaned, total is 269:
```bash
grep -o '\[[0-9]\+\]' d65-deficit-explained.md | wc -l    # expect 0 after PR 2
comm -23 <(grep -o 'href="#source-[0-9]*"' _site/d65-deficit-explained/index.html | grep -o '[0-9]*' | sort -un) \
         <(grep -o 'id="source-[0-9]*"'    _site/d65-deficit-explained/index.html | grep -o '[0-9]*' | sort -un)
```
Non-empty = orphaned marker (hard bug). Reverse the arguments for unreferenced sources (soft). Repeat against `_site/index.html`. Same `comm` pattern for `href="#cite-…"` vs `id="cite-…"`.

**Browser** (dev server is already running on `:4000` — don't restart it):
1. **Firefox with `layout.css.custom-media.enabled=true`** in `about:config`. Every `@media (--…)` rule — the bottom sheet, the `--lg-and-up` shift — is **inert on the dev server** otherwise, and any other browser will misreport it.
2. **No-JS** (devtools → Disable JavaScript): click `[5]` → jumps to the source list, row 5 highlighted and **clear of the sticky header**; back-link returns to the marker, also clear. On `/`, a FAQ marker jumps to the list *below* the accordions.
3. **JS on:** clicks open the panel and do *not* scroll the page; the article stays fully visible at ≥1115px. Cold-load `…/#source-12` still lands and highlights (JS must not swallow load-time fragments). `…/#cite-faq-5-1` opens the containing `<details>`.
4. **Keyboard only:** Tab → Enter → focus lands on the panel title → Tab through → Esc returns focus to the marker. Nothing unreachable.
5. **A11y matrix**, all via the panel: light/dark × contrast normal/high, plus dyslexia font and `data-textsize` 150/200%. Watch specifically: `:target` in high contrast (the `--tint` gap); **the `--lg-and-up` shift at 150% × 1115px** (riskiest interaction); hanging-indent number vs title collision at 200%; whether `↩` renders in Atkinson Hyperlegible (if not, add an `_includes/icons/` partial per the icon convention).
6. **Reduced motion:** the `:target` highlight is an end state, so it must still be present; no smooth scroll.

---

## Open risks

- **Google Docs export fidelity is the risk that could force a redesign** — that a hand-written `.md` works locally does not prove the Doc exporter produces the same bytes. Phase 1 exists solely to prove or disprove this against a scratch page, before any real content moves.

- **kramdown id mimicry** copies an upstream algorithm. If `generate_id` changes, back-links silently point nowhere. Accepted — deficit-page headings are stable.
- **`#source-N` is page-scoped.** If a page ever renders two source sets, ids collide. Escape hatch is a per-set id prefix; not building it now.
- **Positional numbering** means inserting mid-list renumbers everything after. Authors append at the end. The validator catches out-of-range but *cannot* catch a marker pointing at the wrong entry — a genuine soft spot; document it.
- **CLAUDE.md correction:** `--measure-wide` is **66rem**, not the 78rem currently documented (`main.css:80`). Fix while in there.
