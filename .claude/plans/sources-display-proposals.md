# Thrive65 — Sources & Annotations: three design directions

Brief for a planning agent. Context: `/d65-deficit-explained/`, \~20 min read, 29 numbered sources, \~45 outbound links. Brand tokens per `thrive65-redesign-tokens.md` (Common Ground).

---

## 1\. What's wrong now

The page's own thesis is *"five things we believe are true, each traceable to a document you can open yourself."* The citation UI is therefore the credibility mechanism, not decoration. Right now it undercuts that argument in eight specific ways:

1. **Inline markers are dead ends.** `[1]`, `[9][10]` appear to be plain text, not anchors. (Verify in the Jekyll source — every other link on the page, including in-page ones like `#sources`, resolves; these don't.) A reader who wants to check a claim has to scroll \~20 minutes of copy and count.  
2. **Every outbound link is labelled `[link]`.** Roughly 45 of them. A screen-reader user pulling up the link list hears "link, link, link…" with nothing to distinguish them. Fails WCAG 2.4.9 (Link Purpose, Link Only), marginal on 2.4.4 (Link Purpose in Context).  
3. **One number ≠ one document.** Entries 6, 7, 11, 12, 14, 16, 17, 19, 23 and 24 bundle two to four separate documents. `[14]` covers four different community proposals; a reader verifying the "$2.8M–$5.5M" figure doesn't know which one to open.  
4. **No return path.** Even if markers linked down, nothing brings you back to where you were reading.  
5. **Provenance is invisible at the point of decision.** A board memo, a RoundTable article, a community group's PDF, an Illinois statute, and *Thrive65's own arithmetic* all render as an identical `[n]`. Entries 7 and 10 disclose Thrive65 summing and extrapolating — the most important disclosure on the page, buried where almost nobody reads it.  
6. **Tap targets are tiny.** Bracketed digits are well under the 24×24 CSS px of WCAG 2.5.8 (Target Size Minimum, AA in 2.2). Adjacent clusters like `[22][23]` are worse.  
7. **The Sources section is unscannable.** 29 dense prose paragraphs with no grouping, no dates surfaced, no way to find "the facilities assessment."  
8. **Link rot is unmanaged.** Boardbook GUID URLs, a finalsite CDN path, Google Docs and Drive links, a YouTube timestamp. Nothing carries an accessed date or an archive fallback. In two years a meaningful share of this page's evidence will 404\.

---

## 2\. Requirements common to all three directions

Any option should satisfy these; they're mostly content-model work, not visual work.

- **One number, one document.** Split the bundles. (Tradeoff: full splitting renumbers everything downstream and breaks shared `#source-n` links. Alternative is sub-lettering bundles — `[14a]`–`[14d]` — which preserves existing numbers at the cost of a slightly odd scheme. Pick one deliberately.)  
- **Descriptive link text.** Replace `[link]` with the document's own name, or at minimum "Open the FY27 preliminary budget memo (PDF)".  
- **Markers become real anchors**, `role="doc-noteref"`, `aria-label` carrying publisher and year, minimum 24×24px target, `:target` highlight on arrival.  
- **Back-links** on every source entry, naming each place it's cited when cited more than once ("Cited in §1, §4").  
- **Provenance tag per source**, five values: Board document · News reporting · Community analysis · Law & state data · **Thrive65 calculation**. The last one is a trust asset — surface it, don't hide it.  
- **Format \+ date badges**: PDF / video / webpage, plus publication date and a "checked" date.  
- **Archive fallback** for every URL (Wayback or a self-hosted PDF mirror), stored alongside the live link.  
- **Single source of truth**: `_data/sources.yml` plus a Jekyll include, so numbering, back-links and the endnote list are all generated. Hand-maintaining 29 numbers across a page that updates monthly guarantees drift.  
- **Survives the site's own accessibility panel**: light, dark, high-contrast B\&W with underlined links, Atkinson Hyperlegible, and 200% text. Test all combinations — anything relying on color alone or on fixed-height pills will break at 200%.

Token discipline: numbers and meta in `secondary` (Lakewater Teal), `:target` and hover washes in `tint`, hairline `line` dividers between entries, `2px solid edge` reserved for the section top rule and for any card. **Do not use `bloom`** — it's scoped to moment-of-action CTAs. Focus outline `3px solid edge` / `#8CE7B7` per theme.

---

## 3\. Direction A — Linked endnotes, done properly

Keep the endnote model. Make it actually work. No JavaScript.

**Inline:** superscript number, `brand`\-colored, underlined, padded to a 24px target, with a hair of space between adjacent markers. Clusters collapse to a range: `[9][10]` becomes `9–10`.

**Sources section:** hanging-indent list under a `2px edge` top rule and a numbered eyebrow, matching the brand board's section-header pattern. Number set in Archivo 800 / `secondary`. Each entry runs: document title as the link → publisher · date · type badge → one-line note (why it's cited, or what Thrive65 calculated) → back-links.

**On arrival:** `:target` paints the entry in `tint` with a `2px edge` left rule, so the reader lands on the right row and can see it.

- **Wins:** highest accessibility floor, works with JS off, no focus-management risk, smallest build, degrades perfectly under high-contrast and 200% zoom.  
- **Costs:** still a round trip away from the reading position. Doesn't reduce the friction of checking a claim, just removes the blockage.  
- **Effort:** small. **Risk:** low.

---

## 4\. Direction B — In-place citation preview

Progressive enhancement layered on A. The marker is still an anchor to `#source-7`; JS upgrades it to a disclosure that opens a small framed card in place.

**Card contents:** document title (as the outbound link), publisher · date · type badge, one line on what it supports, and "See in full list." `card` background, `2px solid edge`, no radius, per token rules.

**Behaviour:** click/Enter/Space only — **never hover-only** (WCAG 1.4.13 requires dismissible, hoverable, persistent). Escape closes and returns focus to the marker. `aria-expanded` on the trigger. On narrow viewports it becomes a bottom sheet rather than a floating tooltip. With JS off, the marker behaves exactly as in Direction A.

Implement with the native Popover API \+ CSS anchor positioning where supported, `<details>` or a small script as fallback. Respect `prefers-reduced-motion`.

- **Wins:** preserves reading flow, which matters most on a 20-minute page. Makes checking a claim nearly free, which is precisely the behaviour the page is asking for.  
- **Costs:** the most fiddly to get right for keyboard and screen-reader users. Positioning at 200% zoom and inside the site's dyslexia-font mode needs real testing. Adds verbosity for screen-reader users unless the announced text is kept tight.  
- **Effort:** medium. **Risk:** medium — this is the option most likely to ship subtly broken, so budget QA time, not just build time.

---

## 5\. Direction C — Evidence ledger

Restructure the information, not just the interaction.

**Per-section source strips.** Each of the "Five things," plus the special-ed and what-happens-next sections, ends with a compact strip: the numbers cited in that section with short human labels ("3 · D65 5-year enrollment memo, Nov 2025"). Most readers never need to travel to the bottom at all.

**Sources becomes an index, not a footnote dump.** A scannable list or table with number, document, publisher, date, type, and what it supports, filterable by provenance tag (Board documents / News / Community analysis / Law & state data / Thrive65 calculations) and by page section. With JS off, all rows render — filters are enhancement only. Announce result counts in a live region.

**Optional, wide viewports only:** a margin rail that surfaces the current section's sources alongside the text.

- **Wins:** the highest editorial payoff. It turns the source list into an artifact that *demonstrates* the page's central claim rather than just supporting it — 29 board documents, dated and tagged, is a shareable asset in its own right. Also makes the Thrive65-calculation disclosures structurally visible.  
- **Costs:** the most content work. Every source needs a title, publisher, date, type and a "what it supports" line written before anything renders. Filters and per-section strips need care to stay accessible and to not become clutter.  
- **Effort:** large. **Risk:** low-to-medium, mostly editorial.

---

## 6\. Recommendation

They aren't mutually exclusive. Direction A is the floor and should ship regardless — everything in §2 plus A is the fix for a page that currently makes a promise it doesn't keep. Direction C's content model (per-source metadata in `_data/sources.yml`) is the prerequisite for both B and C, so building it during A costs little extra. Then C's per-section strips, then B last as pure enhancement.

Sequence: **§2 \+ A → C's data model and section strips → C's filterable index → B.**

## 7\. To settle before planning

1. Split bundled sources with a full renumber, or sub-letter them?  
2. Is an archive/mirror strategy in scope, or a later pass?  
3. Should Thrive65's own calculations be visually distinct inline (a different marker treatment), or only tagged in the source entry?  
4. Does the per-section strip replace the bottom Sources section, or supplement it?  
5. Who owns writing the \~29 "what this supports" lines, and by when?

