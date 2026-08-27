---
layout: page
title: "Sources component — proof of concept"
description: "Internal test page. Not linked from anywhere, not in the sitemap, not indexed."
sources: poc
sitemap: false
noindex: true
---

This page exists to exercise every parsing and UI case in the citation system at
once, before any real content is touched. It is not linked from the nav and is
excluded from the sitemap. Delete it (and `_data/sources/poc.yml`) when the
design is proven.

Text before the first heading cites a source [1], so the "no heading yet"
fallback collapses into a single back-link rather than one per marker.

## Why the deficit grew

District 65 has roughly 25% fewer students than it did in 2018-19, but about 10%
more staff [1]. The enrollment side of that comparison comes from the state's own
report card [2].

The FY27 preliminary budget puts the structural gap at $13.2M [4][7] — an
adjacent pair, which is the case where two 24px tap targets can start to
overlap. Three separate analyses land in roughly the same range [8][9][10].

Authors can also link straight to an entry from a Google Doc: see
[the FY27 budget memo](#source-3) for the position-reduction detail, or the same
target written the way Google Docs actually exports it,
[as an absolute URL](https://wethrive65.org/sources-poc/#source-3).

Not every citation has a link behind it. The April minutes [5] are a board record
we have a copy of but no stable public URL for, so the entry renders as plain
text rather than a dead link.

## What the board has already cut

The board approved a net reduction of 52.5 FTE in April [5]. The same RoundTable
analysis [1] is cited again here — a second section, so it earns a second
back-link, while repeat citations inside one section do not.

Older source lists wrote every citation as [[link]](https://www.district65.net/),
which is why the masking rules exist: that shape must survive untouched, and so
must a normal inline link like [the district's budget page](https://www.district65.net/).

A literal marker inside a code span — `[1]` — must not be rewritten either.

<details class="poc-details">
  <summary>Enrollment projections (collapsed on load)</summary>
  <p>The five-year projection memo [9] is cited from inside a collapsed
  <code>&lt;details&gt;</code>, which is the case that breaks a plain
  <code>#source-N</code> jump with JavaScript off.</p>
</details>

## What happens next

The board meets again in June [1]. The full recording of the April meeting is
online [10], and the statutory framework for the budget timeline is fixed [7].

*Sources: [1][2]*
