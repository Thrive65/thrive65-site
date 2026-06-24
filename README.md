# Thrive65 site

A Jekyll site for Thrive65, deployed on GitHub Pages. Content for the
Overview and FAQ sections is authored in Google Docs and published with one
click — see `apps-script/SETUP.md` for the full publishing setup.

This is a separate project/repo from the earlier Eleventy + Pages CMS
direction, kept independent so the two can develop without colliding.

## How it fits together

```
Google Doc (author writes/edits)
        |
        |  "🚀 Publish to website" menu item (Apps Script)
        v
Markdown file committed to this repo (via GitHub's Contents API)
        |
        |  push to main
        v
GitHub Actions (.github/workflows/deploy.yml)
        |  bundle exec jekyll build
        v
GitHub Pages (live site)
```

## Local development

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Visit `http://localhost:4000`.

## Project layout

| Path | Purpose |
|---|---|
| `index.md` | Homepage: hero, overview, FAQ, signup |
| `board-minutes.md` | Board Meeting Minutes archive page |
| `_includes/home-overview.md` | Homepage overview copy — overwritten by the "Overview" Doc's publish button |
| `_data/faq.yml` | FAQ questions/answers — overwritten by the "FAQ" Doc's publish button |
| `_data/board-minutes.yml` | Board minutes list — maintained by hand |
| `_posts/` | Op-eds (future) — one file per published post |
| `assets/board-minutes/` | Board minutes PDFs |
| `assets/images/` | Site images |
| `apps-script/Code.gs` | The Apps Script add-on — deployed once as a Workspace Add-on |
| `apps-script/appsscript.json` | Add-on manifest (scopes, URL allowlist, sidebar triggers) |
| `apps-script/SETUP.md` | Full setup instructions for the publishing workflow |
| `.github/workflows/deploy.yml` | Builds and deploys the site on every push to `main` |

## Before launch

- [ ] Set `url` and `signup_form_action` in `_config.yml`
- [ ] Replace placeholder content in `_includes/home-overview.md` and `_data/faq.yml` by publishing the real Docs
- [ ] Add real entries to `_data/board-minutes.yml` and their PDFs
- [ ] Add a real favicon at `assets/images/favicon.svg`
- [ ] Confirm GitHub Pages → Settings → Pages → Source is set to "GitHub Actions"
