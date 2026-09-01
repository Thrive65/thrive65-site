/**
 * PostCSS pipeline for the *built* CSS in _site (not the authored source).
 * Runs after `bundle exec jekyll build`, so every rendered page in
 * _site/**\/*.html is available as the exact content set to treeshake against.
 *
 * Plugin order matters:
 *   1. PurgeCSS        — remove selectors unused by any rendered page
 *   2. postcss-custom-media — resolve @custom-media breakpoint vars (Level 5)
 *   3. postcss-preset-env — older-browser fallbacks + autoprefixing (.browserslistrc)
 *   4. cssnano         — strip comments, collapse whitespace, merge rules
 */
const purgecss = require("@fullhuman/postcss-purgecss").default;

module.exports = {
  plugins: [
    purgecss({
      content: ["_site/**/*.html", "_site/**/*.js"],
      // CUBE class names are simple kebab-case, but we also use a few
      // Tailwind-style responsive utilities (`sm:hidden`, `md:hidden`) whose
      // `:` must be kept so the whole token survives — otherwise the extractor
      // would split `sm:hidden` into `sm` + `hidden` and purge the real
      // selector. Trailing `:` (e.g. a stray `foo:`) is trimmed so pseudo
      // syntax doesn't leak in. Also catches classes inside JS string literals
      // in head.html's inline scripts (which are part of the HTML).
      defaultExtractor: (content) =>
        (content.match(/[A-Za-z0-9_:-]+/g) || []).map((t) =>
          t.replace(/:+$/, "")
        ),
      safelist: {
        // JS-injected or JS-toggled classes that never appear as static
        // class="" attributes in the rendered HTML.
        standard: [
          "js",
          "toast",
          "is-visible",
          "nav-open",
          "nav-dropdown-toggle",
          "heading-anchor",
          "faq-anchor",
          "hidden",
          "visible",
          // tax calculator: preset buttons and the derivation rows are built
          // as JS strings (assets/js/tax-calculator.js), so these classes never
          // appear as static class="" attributes in the built HTML.
          "choice",
          "compact",
          "step",
          "step-n",
          "step-label",
          "step-note",
          "step-value",
          "total",
          "stripe-bloom",
        ],
        // Attribute/state-driven selectors: a11y modes set data-* on <html> at
        // runtime; ARIA states are toggled by JS; EmailOctopus injects its own
        // form markup client-side, so none of its classes exist at build time.
        greedy: [
          /data-theme/,
          /data-contrast/,
          /data-dyslexic/,
          /data-textsize/,
          /aria-expanded/,
          /aria-checked/,
          /aria-current/,
          /aria-pressed/,
          /aria-hidden/,
          /^emailoctopus/,
          /^main-form/,
          /^form-control/,
          /^mastfoot/,
          /^inline-container/,
          /^w-100/,
          /^wave/, // :nth-of-type silhouette variants
        ],
      },
    }),
    // Resolve @custom-media (--sm-and-down, --md-and-up) into real media
    // conditions before preset-env/cssnano see them.
    require("postcss-custom-media"),
    require("postcss-preset-env")({
      stage: 2,
      // @layer, :has(), @starting-style intentionally degrade — the source
      // already treats them as progressive enhancement. Don't polyfill layers.
      features: { "cascade-layers": false },
    }),
    require("cssnano")({ preset: "default" }),
  ],
};
