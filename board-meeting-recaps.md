---
layout: page
title: Board Meeting Recaps
permalink: /board-meeting-recaps/
---

Recaps of District 65 Board of Education meetings, highlighting key topics discussed and decisions. Observations from Thrive65 clearly noted.

<ul class="post-list">
  {% assign recaps = site.posts | where: "category", "Board Meeting Recaps" | sort: "date" | reverse %}
  {% for post in recaps %}
    <li class="repel">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="text-deemphasized nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
