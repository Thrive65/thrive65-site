/**
 * Docs CMS — Google Docs → GitHub publishing add-on
 * =========================================================================
 * This is a Google Workspace Add-on. It renders a sidebar (built with
 * CardService) inside Google Docs — there is no Extensions menu. Installed
 * once, it is available in every Doc you open.
 *
 * Sidebar flow:
 *   ⚙️ GitHub connection  — token / owner / repo / branch / Drive folder ID
 *   📄 Page Properties     — content type + target path + page metadata
 *   🚀 Publish to website  — export the Doc to Markdown and commit to GitHub
 *
 * Settings storage:
 *   - GitHub connection + Drive folder ID  → Script Properties (shared)
 *   - Per-page content routing + metadata  → Document Properties (per doc)
 *
 * What this does NOT handle yet (by design, to keep v1 simple):
 *   - Inline images pasted into the doc. Upload photos/logos directly to
 *     assets/images/ in the repo and reference them by path instead.
 *
 * Post content type:
 *   Category (required) — human-readable label, e.g. "Board Meeting Recaps" or "Opinion".
 *   Drives the eyebrow label on the post page and the permalink subfolder.
 *   Post date (required) — YYYY-MM-DD. Use the meeting date for recaps.
 *   Based on Date switch — ON (default): /{category}/{year}/{M-D}/
 *                          OFF: /{category}/{slug}/
 * =========================================================================
 */

// Timezone used to timestamp new posts. Same for every doc, so it
// stays here rather than in the per-doc Page Properties form.
const TIMEZONE = "America/Chicago";

/* =========================================================================
 * Homepage — the card shown when the sidebar opens.
 * Wired to addOns.common.homepageTrigger / addOns.docs.homepageTrigger.
 * ========================================================================= */

function onHomepage(e) {
  return buildHomepageCard();
}

function buildHomepageCard() {
  const props = PropertiesService.getScriptProperties();
  const owner = props.getProperty("GITHUB_OWNER");
  const repo = props.getProperty("GITHUB_REPO");
  const connected = !!(props.getProperty("GITHUB_TOKEN") && owner && repo);

  const type = PropertiesService.getDocumentProperties().getProperty("CONTENT_TYPE");

  const connSection = CardService.newCardSection().setHeader("Connection");
  connSection.addWidget(
    CardService.newDecoratedText()
      .setText(connected ? "✓ " + owner + "/" + repo : "Not connected")
      .setBottomLabel(connected ? "GitHub" : "Set up the GitHub connection to publish")
      .setWrapText(true)
  );
  connSection.addWidget(
    CardService.newTextButton()
      .setText(connected ? "Edit connection" : "Set up GitHub connection")
      .setOnClickAction(CardService.newAction().setFunctionName("openConnectionCard"))
  );

  const docSection = CardService.newCardSection().setHeader("This document");
  docSection.addWidget(
    CardService.newDecoratedText()
      .setText(type ? labelForType_(type) : "Not configured")
      .setBottomLabel(type ? "Content type" : "Set page properties before publishing")
      .setWrapText(true)
  );
  docSection.addWidget(
    CardService.newTextButton()
      .setText("📄 Page Properties")
      .setOnClickAction(CardService.newAction().setFunctionName("openPageProperties"))
  );
  docSection.addWidget(
    CardService.newTextButton()
      .setText("🚀 Publish to website")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction().setFunctionName("publishAction"))
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("🌻 Docs CMS"))
    .addSection(connSection)
    .addSection(docSection)
    .build();
}

function labelForType_(t) {
  return { section: "Homepage section", faq: "FAQ item", page: "Page", post: "Post" }[t] || t;
}

/* =========================================================================
 * GitHub connection card.
 * The token/owner/repo/branch + Drive folder ID are the same everywhere you
 * publish, so they live in Script Properties (shared across all docs).
 * ========================================================================= */

function openConnectionCard(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(buildConnectionCard()))
    .build();
}

function buildConnectionCard() {
  const props = PropertiesService.getScriptProperties();
  const hasToken = !!props.getProperty("GITHUB_TOKEN");

  const sec = CardService.newCardSection();
  sec.addWidget(
    CardService.newTextInput()
      .setFieldName("GITHUB_TOKEN")
      .setTitle("GitHub token")
      .setHint(
        hasToken
          ? "A token is already saved. Leave blank to keep it."
          : "Fine-grained PAT scoped to your repo, Contents: Read and write."
      )
  );
  sec.addWidget(
    CardService.newTextInput()
      .setFieldName("GITHUB_OWNER")
      .setTitle("Owner (user or org)")
      .setValue(props.getProperty("GITHUB_OWNER") || "")
  );
  sec.addWidget(
    CardService.newTextInput()
      .setFieldName("GITHUB_REPO")
      .setTitle("Repository")
      .setValue(props.getProperty("GITHUB_REPO") || "")
  );
  sec.addWidget(
    CardService.newTextInput()
      .setFieldName("GITHUB_BRANCH")
      .setTitle("Branch")
      .setValue(props.getProperty("GITHUB_BRANCH") || "main")
  );
  sec.addWidget(
    CardService.newTextInput()
      .setFieldName("DRIVE_FOLDER_ID")
      .setTitle("Drive folder ID")
      .setValue(props.getProperty("DRIVE_FOLDER_ID") || "")
      .setHint("Publishing is limited to docs in this folder. Leave blank to allow all docs.")
  );
  sec.addWidget(
    CardService.newTextButton()
      .setText("Save")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction().setFunctionName("saveConnection"))
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("⚙️ GitHub connection"))
    .addSection(sec)
    .build();
}

function saveConnection(e) {
  const props = PropertiesService.getScriptProperties();

  const token = formVal_(e, "GITHUB_TOKEN").trim();
  if (token) props.setProperty("GITHUB_TOKEN", token); // blank keeps the existing token

  props.setProperty("GITHUB_OWNER", formVal_(e, "GITHUB_OWNER").trim());
  props.setProperty("GITHUB_REPO", formVal_(e, "GITHUB_REPO").trim());
  props.setProperty("GITHUB_BRANCH", formVal_(e, "GITHUB_BRANCH").trim() || "main");

  const folderId = formVal_(e, "DRIVE_FOLDER_ID").trim();
  if (folderId) props.setProperty("DRIVE_FOLDER_ID", folderId);
  else props.deleteProperty("DRIVE_FOLDER_ID");

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("✅ Connection saved."))
    .setNavigation(CardService.newNavigation().popToRoot().updateCard(buildHomepageCard()))
    .build();
}

/* =========================================================================
 * Page Properties card — per-doc content routing + metadata.
 * Stored in Document Properties (scoped to THIS doc). The content-type
 * dropdown rebuilds the card so only the relevant fields are shown.
 * ========================================================================= */

function openPageProperties(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(buildPagePropertiesCard(null, null)))
    .build();
}

// Rebuild the card when the content type changes, preserving entered values.
function onContentTypeChange(e) {
  const type = formVal_(e, "CONTENT_TYPE");
  const values = {
    TARGET_PATH:         formVal_(e, "TARGET_PATH"),
    POST_CATEGORY:       formVal_(e, "POST_CATEGORY"),
    POST_DATE:           formVal_(e, "POST_DATE"),
    POST_DATE_PERMALINK: formVal_(e, "POST_DATE_PERMALINK") === "true" ? "true" : "false",
    POST_SLUG:           formVal_(e, "POST_SLUG"),
    META_TITLE:          formVal_(e, "META_TITLE"),
    META_DESCRIPTION:    formVal_(e, "META_DESCRIPTION"),
    META_IMAGE:          formVal_(e, "META_IMAGE"),
  };
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildPagePropertiesCard(type, values)))
    .build();
}

// Rebuild the card when the date-permalink switch is toggled, preserving entered values.
function onDatePermalinkToggle(e) {
  const values = {
    TARGET_PATH:         formVal_(e, "TARGET_PATH"),
    POST_CATEGORY:       formVal_(e, "POST_CATEGORY"),
    POST_DATE:           formVal_(e, "POST_DATE"),
    POST_DATE_PERMALINK: formVal_(e, "POST_DATE_PERMALINK") === "true" ? "true" : "false",
    POST_SLUG:           formVal_(e, "POST_SLUG"),
    META_TITLE:          formVal_(e, "META_TITLE"),
    META_DESCRIPTION:    formVal_(e, "META_DESCRIPTION"),
    META_IMAGE:          formVal_(e, "META_IMAGE"),
  };
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildPagePropertiesCard("post", values)))
    .build();
}

function buildPagePropertiesCard(type, values) {
  const props = PropertiesService.getDocumentProperties();
  if (type === null || type === undefined) type = props.getProperty("CONTENT_TYPE") || "";
  if (!values) {
    values = {
      TARGET_PATH:         props.getProperty("TARGET_PATH")         || "",
      POST_CATEGORY:       props.getProperty("POST_CATEGORY")       || "",
      POST_DATE:           props.getProperty("POST_DATE")           || "",
      POST_DATE_PERMALINK: props.getProperty("POST_DATE_PERMALINK") !== "false" ? "true" : "false",
      POST_SLUG:           props.getProperty("POST_SLUG")           || "",
      META_TITLE:          props.getProperty("META_TITLE")          || "",
      META_DESCRIPTION:    props.getProperty("META_DESCRIPTION")    || "",
      META_IMAGE:          props.getProperty("META_IMAGE")          || "",
    };
  }
  // Default the title to the doc's name when it hasn't been set yet.
  if (!values.META_TITLE) {
    try { values.META_TITLE = DocumentApp.getActiveDocument().getName(); } catch (err) {}
  }

  const typeInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle("Content type")
    .setFieldName("CONTENT_TYPE")
    .setOnChangeAction(CardService.newAction().setFunctionName("onContentTypeChange"))
    .addItem("", "", type === "")
    .addItem("Homepage section", "section", type === "section")
    .addItem("FAQ item", "faq", type === "faq")
    .addItem("Page", "page", type === "page")
    .addItem("Post", "post", type === "post");

  const sec = CardService.newCardSection();
  sec.addWidget(typeInput);

  if (type === "section" || type === "page") {
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("TARGET_PATH")
        .setTitle("Target path")
        .setValue(values.TARGET_PATH || "")
        .setHint(type === "section" ? "e.g. _includes/section-content.md" : "e.g. volunteer.md")
    );
  }

  if (type === "post") {
    const datePerm = (values.POST_DATE_PERMALINK !== "false");
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("POST_CATEGORY")
        .setTitle("Category*")
        .setValue(values.POST_CATEGORY || "")
        .setHint('e.g. "Board Meeting Recaps" or "Opinion". Sets the eyebrow label and permalink folder.')
    );
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("POST_DATE")
        .setTitle("Post date*")
        .setValue(values.POST_DATE || "")
        .setHint("YYYY-MM-DD. Date of the meeting or publication.")
    );
    sec.addWidget(
      CardService.newDecoratedText()
        .setText("Date URL")
        .setBottomLabel(
          datePerm
            ? "Permalink: /category/YYYY/M-D/"
            : "Permalink: /category/slug-or-title/"
        )
        .setSwitchControl(
          CardService.newSwitch()
            .setFieldName("POST_DATE_PERMALINK")
            .setValue("true")
            .setSelected(datePerm)
            .setOnChangeAction(CardService.newAction().setFunctionName("onDatePermalinkToggle"))
        )
    );
    if (!datePerm) {
      sec.addWidget(
        CardService.newTextInput()
          .setFieldName("POST_SLUG")
          .setTitle("URL slug")
          .setValue(values.POST_SLUG || "")
          .setHint("Auto-generated from the title if left blank.")
      );
    }
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_DESCRIPTION")
        .setTitle("Description")
        .setMultiline(true)
        .setValue(values.META_DESCRIPTION || "")
        .setHint("~160 chars, for search results & social cards.")
    );
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_IMAGE")
        .setTitle("Social image")
        .setValue(values.META_IMAGE || "")
        .setHint("Path or URL, e.g. /assets/images/photo.jpg")
    );
  }

  if (type === "page") {
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_TITLE")
        .setTitle("Title")
        .setValue(values.META_TITLE || "")
    );
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_DESCRIPTION")
        .setTitle("Description")
        .setMultiline(true)
        .setValue(values.META_DESCRIPTION || "")
        .setHint("~160 chars, for search results & social cards.")
    );
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_IMAGE")
        .setTitle("Social image")
        .setValue(values.META_IMAGE || "")
        .setHint("Path or URL, e.g. /assets/images/volunteer.jpg")
    );
  }

  if (type === "faq") {
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_TITLE")
        .setTitle("Title")
        .setValue(values.META_TITLE || "")
        .setHint("Heading shown above the questions. Defaults to the doc name.")
    );
    sec.addWidget(
      CardService.newTextParagraph().setText(
        "FAQ docs write to <b>_data/faq.yml</b>. The Title above becomes the section " +
          "heading; each Heading 2 becomes a question, and the text under it becomes the answer."
      )
    );
  }

  sec.addWidget(
    CardService.newTextButton()
      .setText("Save")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction().setFunctionName("savePageProperties"))
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("📄 Page Properties"))
    .addSection(sec)
    .build();
}

function savePageProperties(e) {
  const type = formVal_(e, "CONTENT_TYPE");
  if (!type) return notify_("Pick a content type first.");

  PropertiesService.getDocumentProperties().setProperties({
    CONTENT_TYPE:        type,
    TARGET_PATH:         formVal_(e, "TARGET_PATH").trim(),
    POST_CATEGORY:       formVal_(e, "POST_CATEGORY").trim(),
    POST_DATE:           formVal_(e, "POST_DATE").trim(),
    POST_DATE_PERMALINK: formVal_(e, "POST_DATE_PERMALINK") === "true" ? "true" : "false",
    POST_SLUG:           formVal_(e, "POST_SLUG").trim(),
    META_TITLE:          formVal_(e, "META_TITLE").trim(),
    META_DESCRIPTION:    formVal_(e, "META_DESCRIPTION").trim(),
    META_IMAGE:          formVal_(e, "META_IMAGE").trim(),
  });

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("✅ Page properties saved."))
    .setNavigation(CardService.newNavigation().popToRoot().updateCard(buildHomepageCard()))
    .build();
}

/* =========================================================================
 * Publish action
 * ========================================================================= */

function publishAction(e) {
  try {
    const targetPath = doPublish_();
    return notify_("🚀 Published to " + targetPath + ". Site rebuilds in ~1–2 min.");
  } catch (err) {
    return notify_("Publish failed: " + (err.message || err));
  }
}

function doPublish_() {
  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();

  if (!isWebsiteDoc_()) {
    throw new Error("This doc isn't inside your configured website folder.");
  }

  const props = PropertiesService.getDocumentProperties();
  const contentType = props.getProperty("CONTENT_TYPE");
  if (!contentType) {
    throw new Error("Not configured yet — open Page Properties and choose a content type first.");
  }

  // Form title wins; falls back to the doc's name. Trimmed because Docs
  // titles routinely carry trailing spaces, which otherwise land in the
  // front matter and render on the page.
  const title = (props.getProperty("META_TITLE") || doc.getName() || "").trim();
  const description = (props.getProperty("META_DESCRIPTION") || "").trim();
  const image = (props.getProperty("META_IMAGE") || "").trim();

  const rawMarkdown = cleanGoogleMarkdown(exportDocAsMarkdown(docId));

  let targetPath, content, commitMessage;

  switch (contentType) {
    case "faq": {
      targetPath = "_data/faq.yml";
      content = faqArrayToYaml(title, parseFaqMarkdown(rawMarkdown));
      commitMessage = `Publish FAQ update from "${title}"`;
      break;
    }

    case "section": {
      targetPath = props.getProperty("TARGET_PATH");
      if (!targetPath) throw new Error('Set a "Target path" in Page Properties for this section doc.');
      content = rawMarkdown.trim() + "\n";
      commitMessage = `Publish section update from "${title}"`;
      break;
    }

    case "page": {
      targetPath = props.getProperty("TARGET_PATH");
      if (!targetPath) throw new Error('Set a "Target path" in Page Properties for this page (e.g. "volunteer.md").');
      const fields = { layout: "page", title: title };
      if (description) fields.description = description;
      if (image) fields.image = image;
      content = buildFrontMatter(fields) + rawMarkdown.trim() + "\n";
      commitMessage = `Publish page update from "${title}"`;
      break;
    }

    case "post": {
      const category = props.getProperty("POST_CATEGORY") || "";
      if (!category) throw new Error('Set a "Category" in Page Properties before publishing.');

      const manualDate = props.getProperty("POST_DATE") || "";
      if (!manualDate || !/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
        throw new Error('Set a valid "Post date" (YYYY-MM-DD) in Page Properties before publishing.');
      }
      const dateStr = manualDate;
      const base = slugify(category);
      const datePerm = (props.getProperty("POST_DATE_PERMALINK") || "true") !== "false";

      let permalink;
      if (datePerm) {
        const parts = dateStr.split("-");
        permalink = `/${base}/${parts[0]}/${parseInt(parts[1])}-${parseInt(parts[2])}/`;
      } else {
        const slug = props.getProperty("POST_SLUG") || slugify(title);
        permalink = `/${base}/${slug}/`;
      }

      targetPath = `_posts/${dateStr}-${slugify(title)}.md`;
      const fields = { layout: "post", title: title, date: dateStr, category: category, permalink: permalink };
      if (description) fields.description = description;
      if (image)       fields.image       = image;
      content = buildFrontMatter(fields) + rawMarkdown.trim() + "\n";
      commitMessage = `Publish post: "${title}"`;
      break;
    }

    default:
      throw new Error('Unknown content type "' + contentType + '". Re-open Page Properties and pick one.');
  }

  commitFileToGithub(targetPath, content, commitMessage);

  // A post's path is derived from its title and date, so editing either one
  // publishes to a *new* file and leaves the old one behind — two posts, same
  // permalink. Remove the previous file once the new one has landed. Only
  // after the commit succeeds, so a failed publish never deletes live content.
  const previousPath = props.getProperty("LAST_PUBLISHED_PATH");
  if (previousPath && previousPath !== targetPath) {
    deleteFileFromGithub_(previousPath, `Remove ${previousPath} (renamed to ${targetPath})`);
  }
  props.setProperty("LAST_PUBLISHED_PATH", targetPath);

  return targetPath;
}

// Returns true if the current document is inside the configured website
// Drive folder. If no folder ID has been configured, returns true (allow all).
// Runs at publish time, where full authorization is available for DriveApp.
function isWebsiteDoc_() {
  const folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!folderId) return true;

  const docId = DocumentApp.getActiveDocument().getId();
  const cache = CacheService.getDocumentCache();
  if (cache) {
    const cached = cache.get("in_website_folder");
    if (cached !== null) return cached === "1";
  }

  let inFolder = false;
  const parents = DriveApp.getFileById(docId).getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) { inFolder = true; break; }
  }
  if (cache) cache.put("in_website_folder", inFolder ? "1" : "0", 3600);
  return inFolder;
}

/* =========================================================================
 * Small CardService helpers
 * ========================================================================= */

// Reads a single form value from the action event, supporting both the
// current (commonEventObject) and legacy (formInput) event shapes.
function formVal_(e, key) {
  try {
    const fi = e && e.commonEventObject && e.commonEventObject.formInputs;
    if (fi && fi[key] && fi[key].stringInputs && fi[key].stringInputs.value && fi[key].stringInputs.value.length) {
      return fi[key].stringInputs.value[0];
    }
  } catch (err) {}
  if (e && e.formInput && e.formInput[key] != null) return e.formInput[key];
  return "";
}

function notify_(text) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(text))
    .build();
}

/* =========================================================================
 * Google Docs -> Markdown
 * ========================================================================= */

function exportDocAsMarkdown(docId) {
  // Referencing DriveApp ensures Apps Script requests the Drive OAuth scope,
  // which is required for the export API call below.
  DriveApp.getFileById(docId);

  // Use the Drive REST API export endpoint (not the browser-facing docs.google.com
  // URL, which requires cookie auth and rejects Bearer tokens).
  const url = `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text%2Fmarkdown`;
  const resp = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error(`Markdown export failed (${resp.getResponseCode()}): ${resp.getContentText()}`);
  }
  return resp.getContentText();
}

// Google's exporter sometimes backslash-escapes characters that don't need
// escaping in normal body text (e.g. "don\'t"). This trims the obvious cases.
// If you notice other formatting artifacts after publishing, check the live
// page and tell Claude — this function is easy to extend.
function cleanGoogleMarkdown(markdown) {
  const unescaped = markdown.replace(/\\([_*\[\]])/g, "$1").trim();
  return singleCellTablesToBlockquotes(relativizeSiteAnchors_(unescaped));
}

/* =========================================================================
 * Relativize on-site source anchors
 *
 * Authors cite sources by linking to an in-page anchor, e.g. `[the FY27
 * memo](#source-3)`. Google Docs cannot author a relative link — it only
 * stores absolute URLs — so that link exports as
 * `[the FY27 memo](https://wethrive65.org/d65-deficit-explained/#source-3)`.
 * Rewrite any link target that points at this site and ends in `#source-N`
 * back down to the bare `#source-N` fragment, so the Jekyll source-refs
 * plugin sees the same shape an author would type by hand.
 *
 * The host comes from the SITE_URL script property (default `wethrive65.org`);
 * set it if the site ever moves. The `_plugins/source_refs.rb` plugin also
 * accepts the absolute shape directly, so this is belt-and-braces — but it
 * keeps the committed markdown clean and portable across pages.
 * ========================================================================= */

function relativizeSiteAnchors_(md) {
  const raw = PropertiesService.getScriptProperties().getProperty("SITE_URL") || "wethrive65.org";
  const host = raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const hostEsc = host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match a Markdown link target that points at this host and ends in
  // `#source-N`: `](https://host/any/path/#source-12)` → `](#source-12)`.
  const re = new RegExp("\\]\\(\\s*https?:\\/\\/" + hostEsc + "\\/[^)\\s]*?(#source-\\d{1,3})\\s*\\)", "g");
  return md.replace(re, "]($1)");
}

/* =========================================================================
 * Single-cell tables → blockquote callouts
 *
 * Google Docs has no blockquote, so authors mark asides (Quick Tip, Power
 * Move, sample scripts) as one-cell tables. A single-cell table is a
 * `| … |` content row (no interior pipe) immediately followed by a
 * one-column separator row (`| :---- |`, `|---|`, …). Rewrite each into a
 * Markdown blockquote so it renders as a callout card.
 *
 * Recovering the label: Google Docs strips bold from a single-cell table (the
 * cell IS the header row) and flattens the cell's internal line breaks into
 * runs of 2+ spaces. So a two-line cell —
 *     Dos & Don'ts
 *     DO: speak calmly…
 * exports as `Dos & Don'ts  DO: speak calmly…`. Split on those runs: if the
 * first line is a short phrase, treat it as the callout's bold label line and
 * the remaining lines as body paragraphs. A surviving `**bold**` opener is
 * honored too. With no short first line, the whole cell is the quote body.
 * ========================================================================= */

function singleCellTablesToBlockquotes(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const cellMatch = lines[i].match(/^\s*\|(.+)\|\s*$/);
    const sepMatch = lines[i + 1] && lines[i + 1].match(/^\s*\|\s*:?-+:?\s*\|\s*$/);
    // One column only: the content row has no interior pipe, and the row
    // below it is a single-column separator.
    if (cellMatch && sepMatch && cellMatch[1].indexOf("|") === -1) {
      out.push.apply(out, cellToBlockquote(cellMatch[1].trim()));
      i++; // consume the separator row
      continue;
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

function cellToBlockquote(cell) {
  // In-cell line breaks arrive as runs of 2+ spaces; split them back into lines.
  let lines = cell.split(/\s{2,}/).map((s) => s.trim()).filter((s) => s.length);
  if (lines.length === 0) return [`> ${cell.trim()}`];

  let label = null;
  const boldOpener = lines[0].match(/^\*\*(.+?)\*\*\s*(.*)$/);
  if (boldOpener) {
    // A surviving bold opener (e.g. from a body-row cell) is the label.
    label = boldOpener[1].trim();
    const rest = boldOpener[2].trim();
    lines = rest ? [rest, ...lines.slice(1)] : lines.slice(1);
  } else if (lines.length >= 2 && lines[0].length <= 40) {
    // A short first line reads as the label; the rest is body.
    label = lines[0];
    lines = lines.slice(1);
  }

  const out = [];
  if (label) out.push(`> **${label}**`);
  lines.forEach((line) => {
    if (out.length) out.push(">");
    out.push(`> ${line}`);
  });
  return out.length ? out : [`> ${cell.trim()}`];
}

/* =========================================================================
 * FAQ-specific parsing: turns "## Question" headings + body text into
 * structured Q&A pairs for _data/faq.yml
 * ========================================================================= */

function parseFaqMarkdown(markdown) {
  const lines = markdown.split("\n");
  const faqs = [];
  let current = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^##\s+(.*)/);
    if (headingMatch) {
      if (current) faqs.push(current);
      current = { question: headingMatch[1].trim(), answer: "" };
    } else if (current) {
      current.answer += line + "\n";
    }
  });
  if (current) faqs.push(current);

  return faqs.map((f) => ({ question: f.question, answer: f.answer.trim() }));
}

function faqArrayToYaml(title, faqs) {
  // The section heading (`title`) comes from the doc's Page Properties title,
  // which falls back to the doc name — so the FAQ heading and its Q&A live in
  // one Google Doc rather than a separate include.
  let yaml = `title: ${yamlScalar(title)}\n`;
  if (faqs.length === 0) {
    return yaml + "items: []\n";
  }
  yaml += "items:\n";
  faqs.forEach((f) => {
    yaml += `  - question: ${yamlScalar(f.question)}\n`;
    yaml += "    answer: |\n";
    f.answer.split("\n").forEach((line) => {
      yaml += `      ${line}\n`;
    });
  });
  return yaml;
}

/* =========================================================================
 * Small helpers
 * ========================================================================= */

function yamlScalar(str) {
  // A JSON-quoted string is also a valid YAML double-quoted scalar, which
  // sidesteps having to hand-roll YAML escaping rules.
  return JSON.stringify(str);
}

function buildFrontMatter(fields) {
  let fm = "---\n";
  Object.keys(fields).forEach((key) => {
    fm += `${key}: ${yamlScalar(String(fields[key]))}\n`;
  });
  fm += "---\n\n";
  return fm;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* =========================================================================
 * GitHub: create-or-update a single file via the Contents API
 * ========================================================================= */

function commitFileToGithub(path, content, commitMessage) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("GITHUB_OWNER");
  const repo = props.getProperty("GITHUB_REPO");
  const branch = props.getProperty("GITHUB_BRANCH") || "main";

  if (!token || !owner || !repo) {
    throw new Error('GitHub isn\'t connected yet. Open "GitHub connection" in the sidebar first.');
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;

  // Look up the file's current SHA (required by GitHub to update an
  // existing file; omitted entirely when creating a new one).
  let sha = null;
  const getResp = UrlFetchApp.fetch(`${apiUrl}?ref=${branch}`, {
    method: "get",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    muteHttpExceptions: true,
  });
  if (getResp.getResponseCode() === 200) {
    sha = JSON.parse(getResp.getContentText()).sha;
  }

  const payload = {
    message: commitMessage,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: branch,
  };
  if (sha) payload.sha = sha;

  const putResp = UrlFetchApp.fetch(apiUrl, {
    method: "put",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = putResp.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error(`GitHub commit failed (${code}): ${putResp.getContentText()}`);
  }
  return JSON.parse(putResp.getContentText());
}

// Delete a file via the Contents API. Used to clean up the old path when a
// doc's target path changes (see doPublish_). Best-effort: a file that's
// already gone, or a delete that fails, must not fail the publish that just
// succeeded — the new content is live either way.
function deleteFileFromGithub_(path, commitMessage) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("GITHUB_OWNER");
  const repo = props.getProperty("GITHUB_REPO");
  const branch = props.getProperty("GITHUB_BRANCH") || "main";

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

  try {
    const getResp = UrlFetchApp.fetch(`${apiUrl}?ref=${branch}`, {
      method: "get",
      headers: headers,
      muteHttpExceptions: true,
    });
    if (getResp.getResponseCode() !== 200) return false; // already gone

    const delResp = UrlFetchApp.fetch(apiUrl, {
      method: "delete",
      headers: headers,
      contentType: "application/json",
      payload: JSON.stringify({
        message: commitMessage,
        sha: JSON.parse(getResp.getContentText()).sha,
        branch: branch,
      }),
      muteHttpExceptions: true,
    });
    return delResp.getResponseCode() === 200;
  } catch (err) {
    console.warn("Could not remove old file " + path + ": " + (err.message || err));
    return false;
  }
}

/* =========================================================================
 * ONE-TIME MIGRATION — renumber deficit-page citation markers
 *
 * Phase 2 of the contextual-source-sidebar work split the deficit page's
 * former 29-entry hand-written "## Sources" list into a 45-entry repo-side
 * source set (_data/sources/deficit.yml) — a mechanical 48-way split, then
 * two editorial merges (the FY27 Preliminary Budget memo, cited from three
 * spots, collapses to [11]; the Apr 20 2026 SDRP Phase 3 item collapses to
 * [35]). Bundled citations that pointed at a single old number must now
 * point at the RUN of their split children — e.g. old [6] (Capacity
 * worksheet + SDRP Hub tables) becomes [6][7]; and a merged source can
 * appear across several runs (old [9]/[11]/[16] all include [11]).
 *
 * HOW TO RUN (once, on the deficit-explainer Google Doc):
 *   1. Open that Doc.
 *   2. Extensions → Apps Script (or the add-on's script project) → select
 *      `renumberMarkersDeficit_` in the function dropdown → Run.
 *   3. Approve the one-time authorization prompt if shown.
 *   4. Read the execution log for the replacement summary.
 *   5. Manually delete the Doc's own "## Sources" heading + list (the list
 *      now lives in the repo; leaving it in the Doc would render it twice).
 *   6. Publish as normal.
 *
 * Two-pass so freshly-written digits are never re-matched: pass 1 turns each
 * old [n] into a collision-proof sentinel [§n§]; pass 2 turns each sentinel
 * into its final run. Safe to leave in the file after use; it does nothing
 * unless explicitly run. Delete once Gate 2 passes.
 *
 * The map is the committed source of truth in migration-remap-deficit.txt.
 * ========================================================================= */

var DEFICIT_MARKER_REMAP_ = {
  1: "[1]", 2: "[2]", 3: "[3]", 4: "[4]", 5: "[5]",
  6: "[6][7]", 7: "[8][9]", 8: "[10]", 9: "[11]", 10: "[12]",
  11: "[11][13][14][15]", 12: "[16][17]", 13: "[18]",
  14: "[19][20][21][22]", 15: "[23]", 16: "[11][24]",
  17: "[25][26][27][28]", 18: "[29]", 19: "[30][31][32]",
  20: "[33]", 21: "[34]", 22: "[35]", 23: "[35][36][37]",
  24: "[38][39][40]", 25: "[41]", 26: "[42]", 27: "[43]",
  28: "[44]", 29: "[45]",
};

function renumberMarkersDeficit_() {
  var doc = DocumentApp.getActiveDocument();
  if (!doc) {
    throw new Error("Open the deficit-explainer Doc, then run this from its Apps Script editor.");
  }
  var body = doc.getBody();

  // Pass 1: [n] -> [§n§]  (exact-match each; the closing bracket stops [1]
  // from matching inside [15], and sentinels are never re-matched in pass 2).
  Object.keys(DEFICIT_MARKER_REMAP_).forEach(function (n) {
    body.replaceText("\\[" + n + "\\]", "[\u00A7" + n + "\u00A7]");
  });

  // Pass 2: [§n§] -> final run.
  var summary = [];
  Object.keys(DEFICIT_MARKER_REMAP_).forEach(function (n) {
    var to = DEFICIT_MARKER_REMAP_[n];
    // Escape regex metacharacters in the replacement's brackets is not needed
    // for replaceText's replacement arg (it is a literal string).
    body.replaceText("\\[\u00A7" + n + "\u00A7\\]", to);
    summary.push("[" + n + "] -> " + to);
  });

  Logger.log("renumberMarkersDeficit_ complete:\n" + summary.join("\n"));
  Logger.log("Now delete the Doc's own '## Sources' section, then Publish.");
}

/* =========================================================================
 * FAQ MARKER REMAP (Phase 3 migration) — one-time renumber for the FAQ Doc.
 *
 * The live FAQ Doc still carries the ORIGINAL 1-64 markers against a single
 * "Source List" that bundled 2-3 documents under some numbers. The migration
 * (a) split every bundle so each entry cites exactly one document, then
 * (b) merged the two exact-duplicate entries, leaving a sequential 1-67 list
 * in _data/sources/faq.yml. This map takes the Doc's original numbers straight
 * to that final 1-67 space, so markers 1-19 stay put and 20-64 shift/expand:
 *   [20] -> [51][56]     (Capacity worksheet = final 51; SDRP Hub baseline = 56)
 *   [40] -> [39][64]     (Ad Hoc Budget Committee report + Patch 2018 budget)
 *   [41] -> [40][65][66] (2015 referendum + 2010 budget + 2013 budget)
 *   [46] -> [45][67]     (admin-growth + org-chart-creep)
 *   all other 21-64 shift down by one (a single dropped duplicate before them).
 * 1-19 are unchanged, so they are omitted (left literal). Every number 20-64
 * IS listed so pass 1 sentinelizes it before pass 2 writes any final digits.
 *
 * HOW TO RUN (once, on the FAQ Google Doc): identical to the deficit steps
 * above — select `renumberMarkersFaq_` in the function dropdown → Run, then
 * delete the Doc's own "Source List" section (it now lives in
 * _data/sources/faq.yml; leaving it in the Doc renders it twice) and Publish.
 * Two-pass sentinel so freshly-written digits are never re-matched.
 * ========================================================================= */

var FAQ_MARKER_REMAP_ = {
  20: "[51][56]",
  21: "[20]",
  22: "[21]",
  23: "[22]",
  24: "[23]",
  25: "[24]",
  26: "[25]",
  27: "[26]",
  28: "[27]",
  29: "[28]",
  30: "[29]",
  31: "[30]",
  32: "[31]",
  33: "[32]",
  34: "[33]",
  35: "[34]",
  36: "[35]",
  37: "[36]",
  38: "[37]",
  39: "[38]",
  40: "[39][64]",
  41: "[40][65][66]",
  42: "[41]",
  43: "[42]",
  44: "[43]",
  45: "[44]",
  46: "[45][67]",
  47: "[46]",
  48: "[47]",
  49: "[48]",
  50: "[49]",
  51: "[50]",
  52: "[51]",
  53: "[52]",
  54: "[53]",
  55: "[54]",
  56: "[55]",
  57: "[56]",
  58: "[57]",
  59: "[58]",
  60: "[59]",
  61: "[60]",
  62: "[61]",
  63: "[62]",
  64: "[63]",
};

function renumberMarkersFaq_() {
  var doc = DocumentApp.getActiveDocument();
  if (!doc) {
    throw new Error("Open the FAQ Doc, then run this from its Apps Script editor.");
  }
  var body = doc.getBody();

  // Pass 1: [n] -> [§n§] for every mapped original number.
  Object.keys(FAQ_MARKER_REMAP_).forEach(function (n) {
    body.replaceText("\\[" + n + "\\]", "[\u00A7" + n + "\u00A7]");
  });

  // Pass 2: [§n§] -> final run.
  var summary = [];
  Object.keys(FAQ_MARKER_REMAP_).forEach(function (n) {
    body.replaceText("\\[\u00A7" + n + "\u00A7\\]", FAQ_MARKER_REMAP_[n]);
    summary.push("[" + n + "] -> " + FAQ_MARKER_REMAP_[n]);
  });

  Logger.log("renumberMarkersFaq_ complete:\n" + summary.join("\n"));
  Logger.log("Now delete the Doc's own 'Source List' section, then Publish.");
}
