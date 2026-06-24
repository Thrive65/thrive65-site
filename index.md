---
layout: default
title: Home
---

<section class="hero">
  <div class="wrap hero__inner">
    {% capture hero_md %}{% include home-hero.md %}{% endcapture %}
    {{ hero_md | markdownify }}
  </div>
</section>

<section id="overview" class="section">
  <div class="wrap">
    <h2 class="section__title">What we're working on</h2>
    <div class="prose">
      {% capture section_md %}{% include home-overview.md %}{% endcapture %}
      {{ section_md | markdownify }}
    </div>
  </div>
</section>

<section id="faq" class="section section--alt">
  <div class="wrap">
    <h2 class="section__title">Frequently asked questions</h2>
    {% include faq.html %}
  </div>
</section>

<section id="signup" class="section section--signup">
  <div class="wrap">
    <h2 class="section__title">Stay in the loop</h2>
    <p>Get occasional updates on board meetings, budget decisions, and ways to get involved.</p>

    {% if site.signup_form_action != "" %}
      <form class="signup-form" action="{{ site.signup_form_action }}" method="post" target="_blank">
        <label for="signup-email" class="visually-hidden">Email address</label>
        <input id="signup-email" name="email" type="email" placeholder="you@example.com" required>
        <button class="button button--primary" type="submit">Sign up</button>
      </form>
    {% else %}
      <p class="signup-form__placeholder">
        Email signup isn't connected yet — set <code>signup_form_action</code> in <code>_config.yml</code>
        once you've picked a mailing list provider (Mailchimp, Buttondown, a Google Form, etc.).
      </p>
    {% endif %}
  </div>
</section>
