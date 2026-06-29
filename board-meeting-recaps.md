---
layout: page
title: Board Meeting Recaps
permalink: /board-meeting-recaps/
---

Community-written recaps of District 65 Board of Education meetings, highlighting public comments and key decisions.

<ul class="post-list">
  {% assign recaps = site.posts | where: "category", "Board Meeting Recaps" | sort: "date" | reverse %}
  {% for post in recaps %}
    <li class="repel">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="text-slate nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
