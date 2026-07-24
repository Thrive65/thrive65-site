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
        |  npm run build:css   (PostCSS: PurgeCSS + preset-env + cssnano)
        v
GitHub Pages (live site)
```

## Local development

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Visit `http://localhost:4000`.

**CSS in dev vs production:** locally, Jekyll serves the authored
`assets/css/main.css` as-is (comments and all). Minification only happens in
CI: the deploy workflow runs PostCSS *after* the Jekyll build, rewriting
`_site/assets/css/main.css` in place — PurgeCSS strips selectors unused by any
rendered page (safelist in `postcss.config.cjs`), `postcss-preset-env` adds
older-browser fallbacks per `.browserslistrc`, and cssnano minifies. To
reproduce the production CSS locally (Node ≥ 20, see `.nvmrc`):

```bash
npm ci
bundle exec jekyll build && npm run build:css
```

Files kept out of the built site (Gemfile, README, CLAUDE.md, the Node
toolchain files, etc.) are listed under `exclude:` in `_config.yml`.

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
| `package.json` / `postcss.config.cjs` / `.browserslistrc` | CSS post-processing (minify, treeshake, fallbacks) run by CI on the built `_site` output |
