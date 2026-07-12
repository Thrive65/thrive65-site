# Handoff: Common Ground — internal page components

Styles for long-form internal pages (Board Advocacy Guide and similar docs),
extracted from `Board Advocacy Guide.dc.html`. Covers: the opening/page-header
band, colored subheadings, styled tables, callouts, and the checklist.

## Depends on
`tokens.css` from the main `design_handoff_common_ground/` bundle — load it
**before** `internal-pages.css`. This file only adds internal-page component
classes; it does not redefine any token.

## Files
- `internal-pages.css` — the component classes (drop-in, paste into
  `assets/css/main.css` under `@layer block` / `@layer utility`, or keep as its
  own file and `@import` it after the token layer).
- `reference/Board Advocacy Guide.dc.html` — the source page these styles were
  pulled from. Visual reference only, not for direct reuse.

## 1. Opening / page-header band
Full-bleed `--band-alt` strip under the site header; inner column matches the
article's 760px measure.

```html
<section class="page-header">
  <div class="page-header__inner">
    <p class="page-header__eyebrow">Resources</p>
    <h1 class="page-header__title">Board Advocacy Guide</h1>
    <p class="page-header__subtitle">District 65 School Board Advocacy Guide</p>
    <p class="page-header__standfirst">Speak up. Show up. Help D65 Thrive.</p>
  </div>
</section>
```

## 2. Article shell + colored subheadings
Wrap the article body in `.doc` / `.doc__inner`. `h2` = major section head, set
in `--brand` (the color signals "new section"); `h3` = subsection, neutral ink.

```html
<article class="doc">
  <div class="doc__inner">
    <h2>Know Our School Board</h2>
    <h3>How Boards Work</h3>
    <p>…</p>
  </div>
</article>
```

## 3. Styled tables
Two-column "definition" tables (label / value). Wrap the `<table>` in
`.doc-table` for the framed 2px `--edge` card; the styling shades `<th>` cells
**and** the first `<td>` of any row so headless label/value rows work too.

```html
<div class="doc-table">
  <table>
    <tbody>
      <tr><th>Board website</th><td><a href="…">district65.net/board-meetings</a></td></tr>
      <tr><th>Location</th><td>JEH Early Childhood Center, 1500 McDaniel Ave</td></tr>
    </tbody>
  </table>
</div>
```

## 4. Callouts (single-cell notes)
The legacy content used one-cell "tables" as notes (Quick Tip, Dos & Don'ts,
Power Move, Sample Script). Render these as `.callout` cards, not tables.

```html
<div class="callout">
  <p class="callout__label">Quick tip</p>
  <p>Search board meeting archives to see agendas, presentations, and minutes.</p>
</div>

<div class="callout callout--script">
  <p class="callout__label">Sample script</p>
  <p>"Good evening. My name is [Your Name]…"</p>
</div>
```

## 5. Checklist
No bullets — each item gets a brand-colored checkbox glyph (inline SVG, fixed
markup below; swap nothing but the label text per item).

```html
<ul class="checklist">
  <li>
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="18" height="18" rx="4"></rect>
      <path d="M5 10.5 L8.5 14 L15 6.5"></path>
    </svg>
    I know my school board's meeting schedule and how to sign up for public comment
  </li>
</ul>
```

## 6. Closing sign-off line
```html
<p class="doc__closing">Democracy works when communities show up.</p>
```

## Notes for implementation
- All colors/spacing/radii come from tokens — no new hex values introduced.
  `.doc-table` and `.callout` both use the framed **2px `--edge`** border +
  `12px` radius, matching the FAQ accordion cards on the home page.
- `h2` color (`--brand`) is the ONLY per-hue-varying value here — it will
  retint automatically when the page's hue wrapper class changes (see the main
  bundle's `tokens.css` `.hue-*` classes).
- Keep `.doc` measure at 760px — matches the guide page; do not stretch to the
  920px content width used on the home page's Overview/FAQ sections.
