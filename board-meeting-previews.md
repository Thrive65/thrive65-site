---
layout: page
title: D65 Board Meeting Previews
permalink: /board-meeting-previews/
---

Previews <a href="/#signup"> sent via email</a> of upcoming District 65 Board of Education meetings, highlighting key topics and decisions for discussion. 

<ul class="post-list">
  {% assign previews = site.posts | where: "category", "Board Meeting Previews" | sort: "date" | reverse %}
  {% for post in previews %}
    <li class="repel">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="text-deemphasized nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
