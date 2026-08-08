# TODOs

## Thrive65 Site
------------------------


### PRE SOFT LAUNCH - THIS WEEK
- logo, favicon (`assets/images/favicon.svg`)
- hero art - colorize/tokenize, fix size & overlap

## fast follow, before announcing
- social media images/links ✅ scaffolded — replace PLACEHOLDER assets & set real handles/links:
    - [ ] `assets/images/og-default.png` — real 1200×630 social share image (currently placeholder)
    - [ ] `assets/images/logo.png` — real square brand mark (currently placeholder)
    - [ ] `assets/images/favicon.ico` + `apple-touch-icon.png` — real favicons (currently placeholder)
    - [ ] `_config.yml` → `twitter.username` — set real X/Twitter handle (uncomment)
    - [ ] `_config.yml` → `social.links` — add real profile URLs (Facebook, X, Instagram…)
- [ ] a11y scan 
- [ ] performance scan fixes

### Repo Architecture
- move content .md pages into subfolder
- icons - figure an easier way to adjust size of icons

### Bugs

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
- style h4s (not italic)
- style h6 within FAQ item, for "Sources"
- full sweep of basic element margins & padding. (e.g. ul, ul > li). Reset defaults, convert all spacing to fluid --space vars.
    - more margins. We have defaults (using em, on specific elements) and .flow (lobotomized owl) - need to align these different systems. Use one everywhere, make it fluid, remove the old one.
- Charts! Need JS charts.
- smoll city graphic at footer



## Docs CMS
------------------------

### Functional
- Allow publishing and showing of Docs CMS in docs within subfolders of the configured website folder. (i.e. thrive65-site/posts/)
- Overall review of Code.gs to confirm it is generic. Create Plan to convert to standalone Add-On.

### Design
- Better form subsection labels (see Post type)
- Logo/Icon
