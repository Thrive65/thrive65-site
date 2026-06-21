---
layout: page
title: Board Meeting Minutes
permalink: /board-minutes/
---

A running archive of District 65 Board of Education meeting minutes, for reference and accountability.

<ul class="minutes-list">
  {% assign minutes = site.data['board-minutes'] | sort: "date" | reverse %}
  {% for item in minutes %}
    <li class="minutes-list__item">
      <a href="{{ '/assets/board-minutes/' | append: item.pdf | relative_url }}">{{ item.title }}</a>
      <span class="minutes-list__date">{{ item.date | date: "%B %-d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
