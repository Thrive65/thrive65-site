---
layout: page
title: Resúmenes de reuniones de la Junta
permalink: /board-meeting-recaps/
---

Resúmenes de las reuniones de la Junta de Educación del Distrito 65, que destacan los temas clave discutidos y las decisiones tomadas. Las observaciones de Thrive65 se señalan claramente.

<ul class="post-list">
  {% assign recaps = site.posts | where: "category", "Board Meeting Recaps" | sort: "date" | reverse %}
  {% for post in recaps %}
    <li class="repel">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="text-deemphasized nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
