# Thrive65 Redesign — Source of Truth (Common Ground)

> **How to use:** keep this file in the redesign **Project knowledge base** so
> every chat / Claude Code session reads the same real values. This file is the
> source of truth, not any canvas.
>
> **Golden rule:** structure comes from the OLD design (Section 1); every color,
> the display font, theming, radii and borders come from the NEW tokens
> (Section 2). Never take color or display type from Section 1.
>
> **Status: FINAL.** The palette is **Common Ground** — green/teal + marigold,
> light + dark, with four hue variants for exploration. **Lake Teal is the live
> shipping brand.** Machine-readable values also live in
> `design_handoff_common_ground/tokens.css`.

---

## 1. OLD design — `main.css` (STRUCTURE REFERENCE ONLY)

Use this section only for **layout, architecture, and component structure**. Its
colors and display font are being **replaced** — do not carry them into the redesign.

### Architecture (carries over)
- **CUBE CSS** with explicit cascade layers: `reset → base → composition → block → utility → exception`.
- **Composition primitives:** `.wrapper` (max-width + inline padding), `.region` (block padding), `.flow` (lobotomised-owl spacing via `--flow-space`), `.cluster`, `.repel`.
- **Component inventory:** sticky `.site-header`, `.brand` + `.brand-mark`, `.nav-cta` pill, `.hero`, `.button`, `.faq-item` (native `<details>/<summary>` accordion, CSS plus/minus, no JS), `.post` / `.page` prose rhythm, `.post-list`, `.site-footer`.
- **Heading scale (global):** `h1 = step-3`, `h2 = step-2`, `h3 = step-1`; hero `h1` overrides to `step-5`.
- **Accessibility patterns to preserve:** `.skip-link`, `:focus-visible` outline, `prefers-reduced-motion`, `.visually-hidden`.
- **Exception layer:** EmailOctopus signup embed restyle, scoped under `.signup`.

### Type & spacing systems (carry over UNCHANGED — identical in the new design)
- Utopia fluid type scale, 16px→19px (exact steps in Section 2).
- Utopia fluid spacing scale (Section 2).
- Line-height tokens: body `1.6`, lead `1.5`, heading `1.15`, display `1.1`.
- Body font: **Public Sans**.

### RETIRED — do NOT use these in the redesign
| Retired | Old value |
|---|---|
| Display font | **Fraunces** (serif), weight 600 |
| marigold | `#f2a900` |
| sun | `#ffd166` |
| leaf | `#2e7d52` |
| leaf-dark | `#1f5538` |
| ink | `#20251f` |
| paper (bg) | `#fffaf0` |
| paper-alt | `#fff1d6` |
| slate | `#5b5a52` |
| line | `#e8ddc4` |
| radius | single `14px` |
| theme | light only |
| *(interim)* `district` blue palette | superseded by Common Ground |
| *(interim)* `art` sub-palette | superseded — illustration now aliases core tokens |

---

## 2. NEW design — Common Ground tokens (FINAL)

**Use these exact values.** Ships **light + dark**. Only the *hue family* (brand,
brandStrong, link, hero-bg, hero-ink, hero-muted, hero-em, band-alt) changes per
hue; everything else is constant. **Marigold `accent` is the constant flame.**

### Shared — surfaces, ink, edge
| Role | Light | Dark |
|---|---|---|
| bg | `#F7F5EC` | `#0B1410` |
| card | `#FFFFFF` | `#17251C` |
| tint | `hsla(150,30%,91%,1)` | `#123122` |
| line | `hsla(150,20%,83%,1)` | `#283A2E` |
| ink | `#14231B` | `#E9F2EA` |
| muted | `hsla(150,16%,30%,1)` | `#A9BBAD` |
| edge | `#0B0B0B` | `#0B0B0B` (shared) |
| onAccent | `#221B05` | `#221B05` (shared) |
| focus | `#0B0B0B` (edge) | `#8CE7B7` |

### Shared — accents (constant across all hues)
| Role | Light | Dark |
|---|---|---|
| secondary (Lakewater Teal) | `hsla(189,65%,22%,1)` | `hsla(189,65%,60%,1)` |
| accent (Marigold) | `#FFB01A` | `#FFB01A` |
| accentHover | `#FFC44F` | `#FFC44F` |
| bloom | `#D42A56` | `#FF5D7B` |

### Shared — footer (shared across themes)
footerBg `#070E0A` · footerHead `#EDF5EE` · footerInk `#B7CCBD`

### Hue families (only these 8 tokens change per hue; link = brand)
| Hue | brand L / D | brandStrong L / D | heroBg L / D | heroInk L / D | heroMuted L / D | heroEm L / D | bandAlt L / D |
|---|---|---|---|---|---|---|---|
| **Lake Teal** *(live)* | `#0F7A45` / `#3FD9C0` | `#0A5C34` / `#74E8D6` | `hsla(189,65%,46%,1)` / `#1C7687` | `hsla(189,65%,9%,1)` / `#E6F3EF` | `hsla(189,65%,13%,1)` / `#F0F9F5` | `→accent` / `#FFC44F` | `hsla(189,30%,92%,1)` / `hsla(189,50%,9%,1)` |
| Evergreen | `#0F7A45` / `#4ED991` | `#0A5C34` / `#7BE8AE` | `#1CA05C` / `#16854F` | `#0B2417` / `#E9F2E6` | `#082A18` / `#A9CDB6` | `→accent` / `→accent` | `hsla(150,34%,93%,1)` / `hsla(150,70%,10%,1)` |
| Electric Blue | `hsla(227,90%,42%,1)` / `#7E9DFF` | `hsla(227,90%,30%,1)` / `#A9BEFF` | `hsla(227,100%,68%,1)` / `#0033EB` | `hsla(227,90%,17%,1)` / `#F2F5FF` | `hsla(227,90%,17%,1)` / `#BFCCFF` | `#FFFFFF` / `→accent` | `#E7ECFF` / `hsla(227,90%,14%,1)` |
| Ultraviolet | `#7A18D4` / `#BE8CFF` | `#57109C` / `#D3B4FF` | `#A75DEC` / `#5B16C4` | `#1B0E42` / `#F6EEFF` | `#1B0E42` / `#DCC0FF` | `#FFFFFF` / `→accent` | `#F1E6FF` / `#1B0E42` |

### Illustration
No separate `art` palette. The line-art scene aliases core tokens so it retints
per hue/theme automatically: line `→edge` · fill `→brand` · fill2 `→brandStrong`
· window `→accent` · pop `→bloom` · tree `→brand` · clock `→card`.

### Typography
- **Display:** **Archivo**, `sans-serif`, weight **800**, `letter-spacing -0.01em`.
- **Body:** **Public Sans**, weights `400 / 500 / 600 / 700`.
- **Line height:** body `1.6` · lead `1.5` · heading `1.15` · display `1.1`.
- **Fluid type scale** (Utopia, 320→1240px):
  - `step--2` `clamp(0.694rem, 0.672rem + 0.114vw, 0.760rem)`
  - `step--1` `clamp(0.833rem, 0.792rem + 0.203vw, 0.950rem)`
  - `step-0`  `clamp(1rem, 0.935rem + 0.326vw, 1.1875rem)`
  - `step-1`  `clamp(1.2rem, 1.101rem + 0.495vw, 1.4844rem)`
  - `step-2`  `clamp(1.44rem, 1.295rem + 0.723vw, 1.8555rem)`
  - `step-3`  `clamp(1.728rem, 1.523rem + 1.028vw, 2.3194rem)`
  - `step-4`  `clamp(2.074rem, 1.787rem + 1.436vw, 2.8992rem)`
  - `step-5`  `clamp(2.488rem, 2.093rem + 1.975vw, 3.6238rem)`

### Spacing (Utopia, 320→1240px)
`2xs` `clamp(0.500rem,0.467rem+0.163vw,0.594rem)` · `xs` `clamp(0.750rem,0.701rem+0.245vw,0.891rem)` · `s` `clamp(1rem,0.935rem+0.326vw,1.1875rem)` · `m` `clamp(1.5rem,1.402rem+0.489vw,1.7813rem)` · `l` `clamp(2rem,1.870rem+0.652vw,2.375rem)` · `xl` `clamp(3rem,2.804rem+0.978vw,3.5625rem)` · `2xl` `clamp(4rem,3.739rem+1.304vw,4.750rem)`

### Borders & radii
- **Borders:** thin `1px`; **bold `2px` in `edge` (`#0B0B0B`)** — used on buttons, FAQ items, cards, info-cards, checklist boxes. (New vs old.)
- **Radii:** card `12px` · card inner link `10px` · pill `999px` · small `8px` · callout `0 12px 12px 0`.

### Layout
- Wrap width: **920px** (content) / **1040px** (header & footer).
- Max measure: `~64ch` (body), `16ch` (hero heading).

---

## 3. What carries over vs. what changes

| Aspect | Old | New | Verdict |
|---|---|---|---|
| Type scale / spacing / line-heights | Utopia | identical | **Keep** |
| Body font | Public Sans | Public Sans | **Keep** |
| Architecture / primitives | CUBE CSS | reuse | **Keep** |
| Display font | Fraunces serif 600 | **Archivo 800, −0.01em** | **Change** |
| Palette | warm cream/marigold/leaf | **green/teal + marigold, hue-swappable** | **Change** |
| Theme | light only | **light + dark** | **Change** |
| Borders | 1px lines | **2px `edge` framed look** | **Change** |
| Radii | single 14px | 12 / 10 / 8 / pill / callout | **Change** |
| Spot illustration | none | line-art scene (colors = tokens) | **New** |

---

## 4. Design direction
- Framed, print-poster confidence: heavy Archivo display, 2px `edge` frames, marigold as the one warm constant.
- **Lake Teal is the live brand.** Evergreen, Electric Blue and Ultraviolet are
  exploration hues, swappable via wrapper class (`.hue-*`) without touching
  components — see `tokens.css` and the handoff README.
- Hold constant while exploring hue: neutrals, `accent`, `secondary`, `bloom`,
  typography, spacing, borders, radii, layout. Swap only the 8 hue tokens.
- `bloom` is reserved strictly for "the one thing that changed and needs you
  now" — never headlines of fear, never decorative.

---

## 5. Prompt template (fill the brackets)

```
Create a [hero comp / full-page mockup / component sheet] for the Thrive65
redesign.

COLOR & TYPE — use ONLY the Common Ground tokens from Section 2 above. Exact hex
values, Archivo 800 (−0.01em) display, Public Sans body, exact spacing / radii /
border values. Do NOT invent, approximate, or substitute. If a value isn't
listed, stop and ask.

THEME: [light | dark].
HUE: [Lake Teal (live) | Evergreen | Electric Blue | Ultraviolet] — swap only the
8 hue tokens; keep neutrals, accent, secondary, bloom, type, spacing, borders,
radii constant.

STRUCTURE: follow the OLD design's layout and components (Section 1). Reference
old only for structure, never for color or display type.

BORDERS: 2px `edge` (#0B0B0B) frames on buttons, cards, FAQ items.

DELIVERABLE: [size / format / exact elements].
```
