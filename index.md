---
layout: default
title: Home
---

<section class="hero hero-hue">
  <div class="wrapper hero-grid">
    <div class="hero-copy">
      {% capture hero_md %}{% include home-hero.md %}{% endcapture %}
      {{ hero_md | markdownify }}
    </div>
    <div class="hero-art" aria-hidden="true">
      <svg viewBox="0 0 640 440" fill="none" aria-hidden="true" preserveAspectRatio="xMaxYMax meet">
        <!-- sun (left) -->
        <circle cx="84" cy="64" r="26" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <g stroke="var(--art-line)" stroke-width="3" stroke-linecap="round">
          <line x1="50" y1="64" x2="38" y2="64"/><line x1="130" y1="64" x2="118" y2="64"/>
          <line x1="84" y1="30" x2="84" y2="18"/><line x1="84" y1="98" x2="84" y2="110"/>
          <line x1="60" y1="40" x2="51" y2="31"/><line x1="117" y1="97" x2="108" y2="88"/>
          <line x1="60" y1="88" x2="51" y2="97"/><line x1="117" y1="31" x2="108" y2="40"/>
        </g>
        <!-- pennant string & flags (right) -->
        <path d="M626 34 Q 510 92 388 84" stroke="var(--art-line)" stroke-width="3" fill="none" stroke-linecap="round"/>
        <polygon points="578,53 562,57 574,73" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="528,72 512,74 522,91" fill="var(--art-pop)" stroke="var(--art-line)" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="476,81 460,82 469,99" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="426,84 410,84 418,101" fill="var(--art-pop)" stroke="var(--art-line)" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- ground -->
        <path d="M0 368 C 120 340 260 336 360 352 C 470 370 560 356 640 344 L 640 440 L 0 440 Z" fill="var(--art-fill-2)"/>
        <path d="M0 368 C 120 340 260 336 360 352 C 470 370 560 356 640 344" stroke="var(--art-line)" stroke-width="3" fill="none"/>
        <!-- left rowhouse -->
        <rect x="56" y="250" width="112" height="114" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="48" y="238" width="128" height="14" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="74" y="272" width="32" height="36" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="74" y1="290" x2="106" y2="290" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="90" y1="272" x2="90" y2="308" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="118" y="272" width="32" height="36" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="118" y1="290" x2="150" y2="290" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="134" y1="272" x2="134" y2="308" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="96" y="322" width="32" height="42" fill="var(--art-pop)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <!-- school -->
        <rect x="200" y="196" width="220" height="168" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="190,196 430,196 310,120" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="310" cy="164" r="15" fill="var(--art-clock)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="310" y1="164" x2="310" y2="155" stroke="var(--art-line)" stroke-width="2" stroke-linecap="round"/>
        <line x1="310" y1="164" x2="317" y2="164" stroke="var(--art-line)" stroke-width="2" stroke-linecap="round"/>
        <line x1="310" y1="120" x2="310" y2="72" stroke="var(--art-line)" stroke-width="3" stroke-linecap="round"/>
        <polygon points="310,72 352,81 310,91" fill="var(--art-pop)" stroke="var(--art-line)" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="222" y="222" width="40" height="44" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="222" y1="244" x2="262" y2="244" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="242" y1="222" x2="242" y2="266" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="290" y="222" width="40" height="44" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="290" y1="244" x2="330" y2="244" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="310" y1="222" x2="310" y2="266" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="358" y="222" width="40" height="44" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="358" y1="244" x2="398" y2="244" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="378" y1="222" x2="378" y2="266" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="222" y="290" width="40" height="44" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="222" y1="312" x2="262" y2="312" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="242" y1="290" x2="242" y2="334" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="358" y="290" width="40" height="44" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="358" y1="312" x2="398" y2="312" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="378" y1="290" x2="378" y2="334" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="282" y="270" width="56" height="16" rx="3" fill="var(--art-clock)" stroke="var(--art-line)" stroke-width="2.5"/>
        <text x="310" y="282.5" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--art-line)" style="font-family: var(--font-display);">D65</text>
        <rect x="288" y="296" width="44" height="68" rx="3" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="298" cy="332" r="2.5" fill="var(--art-line)"/>
        <!-- right building -->
        <polygon points="460,262 596,262 528,214" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="468" y="262" width="120" height="100" fill="var(--art-fill)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <rect x="492" y="284" width="32" height="34" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="492" y1="301" x2="524" y2="301" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="508" y1="284" x2="508" y2="318" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="536" y="284" width="32" height="34" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3"/>
        <line x1="536" y1="301" x2="568" y2="301" stroke="var(--art-line)" stroke-width="2"/>
        <line x1="552" y1="284" x2="552" y2="318" stroke="var(--art-line)" stroke-width="2"/>
        <rect x="512" y="322" width="34" height="40" rx="3" fill="var(--art-win)" stroke="var(--art-line)" stroke-width="3" stroke-linejoin="round"/>
        <!-- trees -->
        <rect x="182" y="316" width="10" height="48" fill="var(--art-fill-2)" stroke="var(--art-line)" stroke-width="2.5"/>
        <circle cx="187" cy="298" r="30" fill="var(--art-tree)" stroke="var(--art-line)" stroke-width="3"/>
        <rect x="611" y="328" width="10" height="38" fill="var(--art-fill-2)" stroke="var(--art-line)" stroke-width="2.5"/>
        <circle cx="616" cy="308" r="26" fill="var(--art-tree)" stroke="var(--art-line)" stroke-width="3"/>
      </svg>
    </div>
  </div>
</section>

<div class="wave" style="--wave-above: var(--hero-bg); --wave-below: var(--bg);" aria-hidden="true"></div>

<section id="overview" class="region">
  <div class="wrapper">
    {% capture section_md %}{% include home-overview.md %}{% endcapture %}
    {{ section_md | markdownify }}
  </div>
</section>

<div class="wave" style="--wave-above: var(--bg); --wave-below: var(--band-alt);" aria-hidden="true"></div>

<section id="faq" class="region bg-surface-alt">
  <div class="wrapper">
    {% include faq.html %}
  </div>
</section>

<div class="wave" style="--wave-above: var(--band-alt); --wave-below: var(--hero-bg);" aria-hidden="true"></div>

<section id="signup" class="signup region hero-hue text-center">
  <div class="wrapper">
    {% capture signup_md %}{% include home-signup.md %}{% endcapture %}
    {{ signup_md | markdownify }}

    <div class="signup-embed">
      {% comment %} EmailOctopus embed — submission handled by EO's script; restyled in main.css to match the site. {% endcomment %}
      <script async src="https://eocampaign1.com/form/eb5a6d18-70fd-11f1-8645-112855d77aca.js" data-form="eb5a6d18-70fd-11f1-8645-112855d77aca"></script>
    </div>
    <p class="text-meta text-deemphasized mt-xs">No spam. Unsubscribe anytime. <a href="{{ site.baseurl }}/privacy/">Privacy policy</a></p>
  </div>
</section>

<div class="wave" style="--wave-above: var(--hero-bg); --wave-below: var(--footer-bg);" aria-hidden="true"></div>
