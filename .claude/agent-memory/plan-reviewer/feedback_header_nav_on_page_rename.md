---
name: header-nav-on-page-rename
description: When any page is renamed or its permalink changes, _includes/header.html must be updated — the nav is hardcoded, not data-driven
metadata:
  type: feedback
---

`_includes/header.html` contains hardcoded `href` values and link text for the site's primary navigation. There is no data-driven nav menu — each link is a literal string.

**Why:** Any plan that renames a page, changes a permalink, or adds/removes a top-level section must include an explicit update to `_includes/header.html`. Forgetting this produces a broken link in the primary nav on every page.

**How to apply:** When reviewing plans that touch page files or their `permalink:` front matter, check whether `_includes/header.html` contains a corresponding link. If so, flag the header update as a required step.
