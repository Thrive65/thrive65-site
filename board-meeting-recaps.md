---
layout: page
title: Board Meeting Recaps
permalink: /board-meeting-recaps/
---

Community-written recaps of District 65 Board of Education meetings, highlighting public comments and key decisions for those unable to attend.

<ul class="post-list">
  {% assign recaps = site.posts | where: "category", "Board Meeting Recaps" | sort: "date" | reverse %}
  {% for post in recaps %}
    <li class="post-list__item">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="post-list__date">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
