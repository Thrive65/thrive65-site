# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Jekyll 4 site for Thrive65 (community advocacy for District 65 schools), deployed to GitHub Pages via GitHub Actions. Content for the homepage overview and FAQ sections is authored in Google Docs and published via a custom Google Workspace Add-on (`apps-script/Code.gs`), not edited by hand.

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

Files edited by hand:
- `_includes/home-hero.md` — Hero section
- `_includes/home-signup.md` — Signup section
- `_includes/footer-content.md` — Footer copy
- `_data/board-minutes.yml` — Board minutes list (PDFs go in `assets/board-minutes/`)
- `_config.yml` — Site-wide settings (URL, `signup_form_action`, etc.)

## Architecture

**Layouts:** `_layouts/default.html` wraps everything (head/header/main/footer). `page.html` and `post.html` extend it.

**Homepage (`index.md`):** Uses `layout: default` and manually assembles four `<section>` blocks — hero, overview, FAQ, signup. Each section's copy is pulled in via `{% include %}` and passed through `| markdownify`. The FAQ section uses `_includes/faq.html` which loops over `_data/faq.yml` and renders `<details>`/`<summary>` accordions.

**FAQ data format (`_data/faq.yml`):** Top-level `title:` (section heading) plus an `items:` list of `{question:, answer:}` pairs. The `answer` field is a block-scalar YAML string containing Markdown, rendered through `| markdownify` in the template.

**Apps Script add-on (`apps-script/Code.gs`):** Runs as a Google Workspace Add-on (sidebar UI, not Extensions menu). Settings are split between Script Properties (GitHub token/owner/repo/branch, Drive folder ID — shared across docs) and Document Properties (content type, target path, metadata — per-doc). The `doPublish_()` function exports the Doc as Markdown via the Drive REST API, then commits to GitHub. FAQ docs are parsed by `parseFaqMarkdown()` into `faqArrayToYaml()`. See `apps-script/SETUP.md` for the full one-time setup.

## Pre-launch checklist (from README)

- Set `url` and `signup_form_action` in `_config.yml`
- Publish real content from Google Docs to replace placeholder content
- Add real entries to `_data/board-minutes.yml` and their PDFs
- Add a real favicon at `assets/images/favicon.svg`
- Confirm GitHub Pages source is set to "GitHub Actions" in repo Settings
