# TODOs

## Thrive65 Site
------------------------

- Lang menu: 
  - make selected checkmark bigger
  - bg highlight when selected

- a11y menu
  - internal scroll when too tall
  - additional font sizes (smaller than 100%, as big as 200%)
  - remove sub-label text (e.g. "Black & white, underlined links"). Add question mark icon superscripted to label. Show the removed text within the title "tooltip" of those options. (Default browser Title functionality OK. No custom tooltip component needed)
  - add letter spacing ticker & tokens
  - does colorblind pallete cover main brand colors (ultraviolet example is still purple)

### Architecture
- organize/clean up CSS & JS, add minification/build step
- move content pages into subfolder
- components?

### Bugs

### Functional
- [ ] Handling images in posts/pages
- Highlighting text shows Medium-style share tooltip

### Design
- style h6 within FAQ item, for "Sources"
- Charts! Need JS charts.
- full sweep of basic element margins & padding. (e.g. ul, ul > li). Reset defaults, convert all spacing to fluid --space vars.
    - more margins. We have defaults (using em, on specific elements) and .flow (lobotomized owl) - need to align these different systems. Use one everywhere, make it fluid, remove the old one.
- pick theme/hue
- logo, favicon (`assets/images/favicon.svg`)
- hero art - colorize/tokenize
- make borders consistent (buttons in nav, dropdowns, nav border bottom itself)
- remove nav drop shadow

## pre launch
------------------------
- social media images/links ✅ scaffolded — replace PLACEHOLDER assets & set real handles/links:
    - [ ] `assets/images/og-default.png` — real 1200×630 social share image (currently placeholder)
    - [ ] `assets/images/logo.png` — real square brand mark (currently placeholder)
    - [ ] `assets/images/favicon.ico` + `apple-touch-icon.png` — real favicons (currently placeholder)
    - [ ] `_config.yml` → `twitter.username` — set real X/Twitter handle (uncomment)
    - [ ] `_config.yml` → `social.links` — add real profile URLs (Facebook, X, Instagram…)
- [ ] Google Search Console verification → `_config.yml` `webmaster_verifications: { google: <token> }`
- [ ] `theme-color` meta tag (mobile browser chrome tint) in `_includes/head.html`
- a11y scan
- Google analytics
- Domain

## Docs CMS
------------------------

### Functional
- Allow publishing and showing of Docs CMS in docs within subfolders of the configured website folder. (i.e. thrive65-site/posts/)
- Overall review of Code.gs to confirm it is generic. Create Plan to convert to standalone Add-On.

### Design
- Better form subsection labels (see Post type)
- Logo/Icon
