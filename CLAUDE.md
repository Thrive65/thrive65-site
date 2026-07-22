# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Jekyll 4 site for Thrive65 (community advocacy for District 65 schools), deployed to GitHub Pages via GitHub Actions. Content for the homepage overview and FAQ sections is authored in Google Docs and published via a custom Google Workspace Add-on (`apps-script/Code.gs`), not edited by hand.

## Design artifacts

Cross-agent handoffs, design specs, and reusable prompts live in `.claude/design-artifacts/` (see its `README.md` for the index). The active brand system is the **Common Ground** redesign under `design_handoff_common_ground/` — read its `CLAUDE.md` for the ordered work plan and token source of truth.

## Local development

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Visit `http://localhost:4000`. The `--baseurl ""` override is needed locally because `_config.yml` sets `baseurl: "/thrive65-site"` for the GitHub Pages project-page URL.

**A dev server is always running on `http://localhost:4000/` — assume it's live.** Just reload the page to verify a change (Jekyll `--watch` rebuilds automatically); don't start, kill, or rebuild the server to check your work. If a change genuinely needs a full rebuild, run it but leave the server serving on `:4000` afterward.

## How content flows

```
Google Doc → "🚀 Publish" sidebar button (Apps Script add-on)
           → commits Markdown to this repo via GitHub Contents API
           → GitHub Actions runs `bundle exec jekyll build`
           → GitHub Pages serves _site/
```

Files overwritten by the publishing add-on (do not edit by hand):
- `_includes/home-overview.md` — Overview section copy (content type: "Homepage section")
- `_data/faq.yml` — FAQ accordion data (content type: "FAQ item")

Files published from Google Docs via the add-on (content type "Post"):
- `_posts/YYYY-MM-DD-slug.md` — Board meeting recaps and other posts. In Page Properties, set **Category** (e.g. `Board Meeting Recaps`, `Opinion`), **Post date** (YYYY-MM-DD), and the **Based on Date** permalink switch (on = `/{category}/{year}/{M-D}/`, off = `/{category}/{slug}/`). The eyebrow label on the post page is the category value.

Files edited by hand:
- `_includes/home-hero.md` — Hero section
- `_includes/home-signup.md` — Signup section
- `_includes/footer-content.md` — Footer copy
- `_config.yml` — Site-wide settings (URL, `signup_form_action`, etc.)

## Architecture

**Layouts:** `_layouts/default.html` wraps everything (head/header/main/footer). `page.html` and `post.html` extend it.

**Homepage (`index.md`):** Uses `layout: default` and manually assembles four `<section>` blocks — hero, overview, FAQ, signup. Each section's copy is pulled in via `{% include %}` and passed through `| markdownify`. The FAQ section uses `_includes/faq.html` which loops over `_data/faq.yml` and renders `<details>`/`<summary>` accordions.

**FAQ data format (`_data/faq.yml`):** Top-level `title:` (section heading) plus an `items:` list of `{question:, answer:}` pairs. The `answer` field is a block-scalar YAML string containing Markdown, rendered through `| markdownify` in the template.

**Apps Script add-on (`apps-script/Code.gs`):** Runs as a Google Workspace Add-on (sidebar UI, not Extensions menu). Settings are split between Script Properties (GitHub token/owner/repo/branch, Drive folder ID — shared across docs) and Document Properties (content type, target path, metadata — per-doc). The `doPublish_()` function exports the Doc as Markdown via the Drive REST API, then commits to GitHub. FAQ docs are parsed by `parseFaqMarkdown()` into `faqArrayToYaml()`. See `apps-script/SETUP.md` for the full one-time setup.

**Heading copy-link anchors (`_includes/head.html` IIFE):** Content headings get a GitHub-style hover-revealed chain icon that copies an absolute deep link and shows a `.toast` ("Link copied"). It's a progressive-enhancement IIFE (styles in the CSS `block` layer):
- **Prose headings** — on `DOMContentLoaded` the JS injects an `<a class="heading-anchor">` into every `main :is(h2, h3, h4)[id]` (kramdown emits the `id`s), skipping `.page-header` titles. So any new content heading is covered automatically — but only if it's an `h2`/`h3`/`h4` *with an id*. Don't use a heading element for decorative eyebrow/kicker text (use a `<p>`); an `id`'d heading there would wrongly get an anchor, and it breaks the document outline besides.
- **FAQ items** — `_includes/faq.html` gives each `<details>` an `id="faq-{{ question | slugify }}"` and server-renders a `.faq-anchor` inside the `<summary>`. The shared click handler copies the link (and calls `stopPropagation()` so it doesn't toggle the accordion); a separate open-on-hash routine expands and scrolls to a `.faq-item` whose id matches `location.hash`, on load and on `hashchange`.
  - **Caveat — FAQ deep links are not stable:** `#faq-<slug>` is derived from the question text via Jekyll's `slugify`, so **rewording a question (re-published from Google Docs) changes its link** and old links 404 to that item. Acceptable for now; revisit only if stable FAQ permalinks become a requirement (would need an explicit per-item id in the Doc/YAML instead of a text-derived slug).

## CSS & HTML methodology (CUBE CSS)

`assets/css/main.css` is organized with native cascade layers: `@layer reset, base, composition, block, utility, exception`.

**Layer guide:**
- **reset** — box-sizing, text-size-adjust, img block
- **base** — global element styles (`body`, `h1–h3`, `p`, `a`, `:focus-visible`, `.skip-link`). Style HTML elements directly; reach for a class only when an element/contextual selector won't do.
- **composition** — content-agnostic layout primitives with no color or decoration: `.wrapper`, `.region`, `.flow`, `.cluster`, `.repel`
- **block** — components with short role names, no BEM `__`/`--` (`.site-header`, `.hero`, `.button`, `.faq-item`, `.site-footer`, `.post`, `.page`, `.post-list`). Children styled via scoped element selectors or applied composition/utility classes.
- **utility** — single-purpose, function-named helpers. Names are **semantic, not literal**: colors are `.bg-surface` / `.bg-surface-alt` / `.bg-brand` / `.bg-accent` / `.text-base` / `.text-deemphasized` / `.text-brand` (role, not `.bg-marigold`); type is `.text-meta` / `.text-eyebrow`; plus `.text-center`, `.nowrap`, `.flow-space-*`, `.mt-*`, `.visually-hidden`. Utilities beat blocks because the utility layer comes last (before exception).
- **exception** — third-party override block (EmailOctopus under `.signup`) where `!important` is the only option.

**Global heading scale.** Headings are sized once, globally: `h1` → `--step-3`, `h2` → `--step-2`, `h3` → `--step-1`. Don't re-declare a heading size that already matches the global value; the **hero** is the only context that overrides it (`h1` → `--step-5`, eyebrow `h3` → `--step--1`).

**Fully fluid type & space — root knobs + proportional rem + rlh**

The **only** `clamp()` lives on `:root`'s `font-size`, driven by four plain-number knobs (think px): `--root-min: 16`, `--root-max: 24`, `--screen-min: 320`, `--screen-max: 2560`. The slope is *derived* from all four, so changing any knob reshapes the whole ramp (px at width w ≈ root-min + (root-max − root-min) × (w − screen-min)/(screen-max − screen-min); defaults give ~19.3 px @1240, ~21.3 px @1800). Everything else is proportional: `--step-*` tokens are plain rem at a fixed 1.2 minor-third ratio, and `--space-*` tokens are `rlh` line-counts (`:root` line-height is 1.5, so 1rlh = 1.5 × root size = 24 px at the 320 px minimum).

**Measure & gutter.** `.wrapper` is capped for readability by `inline-size: min(100% - 2 · var(--gutter), var(--measure))`. `--measure` is `41rem` (≈ 68ch of body text, the 50–75ch sweet spot). It's deliberately in **rem, not ch**: rem tracks the root font size so the cap is identical in every context, whereas a `ch` cap resolves against each element's own font size and would make the smaller-type footer narrower than the body. rem still rides the fluid root, so the character count stays constant across viewports. Below the cap (~660 px) the `100% - 2·gutter` term wins and `--gutter` (`--space-s`, one line) reads as side padding; above it, `--measure` wins and the leftover space becomes centring auto-margins — so no breakpoint gutter steps are needed. Multi-column layouts that need more room (the hero) opt up to `--measure-wide` (`78rem`) via a `.hero-grid.wrapper` override in the block layer.

Always use `--step-*` tokens for font sizes and `--space-*` tokens for layout spacing — this includes icon/graphic sizing (`width`/`height` on SVGs, decorative marks), not just text. Never hardcode `px` rhythm values or add new per-token clamps. Prefer a fixed `--step-*` token over a bare `1em` when an element should **not** inherit and scale with its parent's font size (e.g. a gutter icon inside a heading): `1em` couples the size to whatever context it lands in and can blow out on large headings or narrow viewports. Size it with an explicit step and let `1em` resolve against that.

**Motion.** Every property change that's perceivable (opacity, transform, color reveals) should animate smoothly — never snap between states. Drive all transitions with the motion tokens, never hardcoded timing: durations are `--transition-fast` (150ms), `--transition-base` (200ms), `--transition-slow` (300ms), and easing is `--ease`. Write transitions as `<prop> var(--transition-*) var(--ease)`. If a new interaction needs a duration outside this set, round to the nearest existing token rather than introducing a new literal `ms`/`s` value.

| Token | Value | Role |
|---|---|---|
| `--step--2` | 0.694 rem | mastfoot, fine print |
| `--step--1` | 0.833 rem | eyebrow, footer, nav, meta |
| `--step-0`  | 1 rem | body, FAQ question |
| `--step-1`  | 1.2 rem | brand, hero lede, h3 |
| `--step-2`  | 1.44 rem | h2 |
| `--step-3`  | 1.728 rem | h1 (page/post title) |
| `--step-5`  | 2.488 rem | hero h1 |
| `--space-2xs…4xl` | ¼, ½, 1, 1½, 2, 3, 4, 6, 8 rlh | layout rhythm in lines of text; doubles every two steps |

**Line height** is unitless (so leading stays fluid alongside the fluid type) and tied to size via `--lh-*` tokens — it tightens proportionally as text grows: `--lh-body` 1.6 → `--lh-lead` 1.5 → `--lh-heading` 1.15 → `--lh-display` 1.1. A new text-size utility should set its matching line-height.

**Composition primitives** — use for layout instead of bespoke flex rules:
- `.wrapper` — centred container capped at `--measure` (readable line length) with `--gutter` side spacing below the cap; folded into one `inline-size: min(100% - 2·var(--gutter), var(--measure))`
- `.region` — section with fluid block padding (`--space-xl`)
- `.flow` — owl-operator spacing between children (`--flow-space` CSS var, overrideable)
- `.cluster` — flex row, wrapping, centered, `--space-s` gap
- `.repel` — cluster + `justify-content: space-between`

**Variations/state** → utility classes (not data-attributes, not BEM modifiers). Keep the utility set focused — only add when a need recurs.

**Published markdown** (home-overview, FAQ, posts) arrives classless → relies on base element styles + contextual block selectors. Do not add classes to published content files.

## Conventions

- Name CSS classes, variables, and data structures for their generic UI role, not for specific content. Example: use `.post-list` not `.minutes-list`.
- **Icons live in `_includes/icons/` as single-line `.svg` partials, never inline-duplicated.** Any SVG icon used in markup goes in its own file (e.g. `_includes/icons/link.svg`) and is pulled in with `{% include icons/<name>.svg %}`. Never paste the same SVG markup in two places. If the icon is also needed in a JS string (e.g. for client-side injection), capture the include and emit it safely rather than re-typing it: `{% capture icon %}{% include icons/<name>.svg %}{% endcapture %}` then `var ICON = {{ icon | strip | jsonify }};` — `jsonify` escapes quotes/whitespace into a valid JS string literal from the one source file.

## Pre-launch checklist (from README)

- Set `url` and `signup_form_action` in `_config.yml`
- Publish real content from Google Docs to replace placeholder content
- Publish the first board meeting recap from Google Docs to replace the sample post in `_posts/`
- Add a real favicon at `assets/images/favicon.svg`
- Confirm GitHub Pages source is set to "GitHub Actions" in repo Settings
