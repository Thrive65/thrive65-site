---
layout: page
title: Analysis
permalink: /analysis/
---

A closer look at the issues behind District 65's budget decisions: what the research says, what the district's own data shows, and what's at stake for students. Every claim is sourced, and Thrive65's views are clearly marked.

<ul class="post-list">
  {% assign analysis = site.posts | where: "category", "Analysis" | sort: "date" | reverse %}
  {% for post in analysis %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
