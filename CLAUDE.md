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

**Fluid type & space — Utopia scale (320→1240 px, 16 px/1.2 minor-third → 19 px/1.25 major-third)**

Always use `--step-*` tokens for font sizes and `--space-*` tokens for layout spacing. Never hardcode `px`/`rem` rhythm values.

| Token | Range | Role |
|---|---|---|
| `--step--2` | 0.69→0.76 rem | mastfoot, fine print |
| `--step--1` | 0.83→0.95 rem | eyebrow, footer, nav, meta |
| `--step-0`  | 1→1.19 rem | body, FAQ question |
| `--step-1`  | 1.2→1.48 rem | brand, hero lede, h3 |
| `--step-2`  | 1.44→1.86 rem | h2 |
| `--step-3`  | 1.73→2.32 rem | h1 (page/post title) |
| `--step-5`  | 2.49→3.62 rem | hero h1 |
| `--space-xs…2xl` | 0.75→4.75 rem | layout rhythm |

**Line height** is unitless (so leading stays fluid alongside the fluid type) and tied to size via `--lh-*` tokens — it tightens proportionally as text grows: `--lh-body` 1.6 → `--lh-lead` 1.5 → `--lh-heading` 1.15 → `--lh-display` 1.1. A new text-size utility should set its matching line-height.

**Composition primitives** — use for layout instead of bespoke flex rules:
- `.wrapper` — max-width container with fluid inline padding
- `.region` — section with fluid block padding (`--space-xl`)
- `.flow` — owl-operator spacing between children (`--flow-space` CSS var, overrideable)
- `.cluster` — flex row, wrapping, centered, `--space-s` gap
- `.repel` — cluster + `justify-content: space-between`

**Variations/state** → utility classes (not data-attributes, not BEM modifiers). Keep the utility set focused — only add when a need recurs.

**Published markdown** (home-overview, FAQ, posts) arrives classless → relies on base element styles + contextual block selectors. Do not add classes to published content files.

## Conventions

- Name CSS classes, variables, and data structures for their generic UI role, not for specific content. Example: use `.post-list` not `.minutes-list`.

## Pre-launch checklist (from README)

- Set `url` and `signup_form_action` in `_config.yml`
- Publish real content from Google Docs to replace placeholder content
- Publish the first board meeting recap from Google Docs to replace the sample post in `_posts/`
- Add a real favicon at `assets/images/favicon.svg`
- Confirm GitHub Pages source is set to "GitHub Actions" in repo Settings
