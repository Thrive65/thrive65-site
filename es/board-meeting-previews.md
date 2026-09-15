---
layout: page
title: Adelantos de reuniones de la Junta del D65
permalink: /board-meeting-previews/
---

Adelantos <a href="/#signup"> enviados por correo electrónico</a> de las próximas reuniones de la Junta de Educación del Distrito 65, que destacan los temas clave y las decisiones a discutir. 

<ul class="post-list">
  {% assign previews = site.posts | where: "category", "Board Meeting Previews" | sort: "date" | reverse %}
  {% for post in previews %}
    <li class="repel">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="text-deemphasized nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
