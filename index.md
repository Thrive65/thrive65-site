---
layout: default
title: Thrive65 | Community advocacy for District 65 schools
---

<section class="hero hero-hue">
  <div class="wide wrapper hero-grid">
    <div class="hero-copy prose">
      {% capture hero_md %}{% include home-hero.md %}{% endcapture %}
      {{ hero_md | markdownify }}
    </div>
    <div class="hero-art sm:hidden" aria-hidden="true">
      {% comment %} {% include hero-art.svg %} {% endcomment %}
    </div>
  </div>
</section>

{% comment %}
removed until final art completed 
<div class="wave" style="--wave-above: var(--hero-bg); --wave-below: var(--bg);" aria-hidden="true"></div>
{% endcomment %}

<section id="overview" class="region">
  <div class="wrapper prose">
    {% capture section_md %}{% include home-overview.md %}{% endcapture %}
    {{ section_md | markdownify }}
  </div>
</section>

<div class="wave" style="--wave-above: var(--bg); --wave-below: var(--band-alt);" aria-hidden="true"></div>

<section id="the-current-situation" class="region bg-surface-alt">
  <div class="wide wrapper prose">
    {% capture situation_md %}{% include home-current-situation.md %}{% endcapture %}
    {{ situation_md | markdownify }}
  </div>
</section>

<div class="wave" style="--wave-above: var(--band-alt); --wave-below: var(--bg);" aria-hidden="true"></div>

<section id="what-we-believe" class="region">
  <div class="wide wrapper prose">
    {% capture believe_md %}{% include home-what-we-believe.md %}{% endcapture %}
    {{ believe_md | markdownify }}
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
  <div class="wrapper prose">
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
