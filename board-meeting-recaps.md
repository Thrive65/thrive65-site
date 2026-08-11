---
# TEMPORARILY UNPUBLISHED — Board Meeting Recaps are on hold.
# Flip to `true` (or delete this line) to restore the index page. The two
# recap posts in _posts/ carry the same switch and must be restored with it.
published: false
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
      <span class="text-deemphasized nowrap">{{ post.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
