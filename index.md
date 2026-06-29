---
layout: default
title: Home
---

<section class="hero">
  <div class="wrapper">
    {% capture hero_md %}{% include home-hero.md %}{% endcapture %}
    {{ hero_md | markdownify }}
  </div>
</section>

<section id="overview" class="region">
  <div class="wrapper">
    {% capture section_md %}{% include home-overview.md %}{% endcapture %}
    {{ section_md | markdownify }}
  </div>
</section>

<section id="faq" class="region bg-surface-alt">
  <div class="wrapper">
    {% include faq.html %}
  </div>
</section>

<section id="signup" class="signup region text-center">
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
