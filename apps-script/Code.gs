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
 *   - Board Meeting Minutes — those are official PDFs, not Doc content,
 *     so they're added directly to assets/board-minutes/ and listed in
 *     _data/board-minutes.yml.
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
    TARGET_PATH: formVal_(e, "TARGET_PATH"),
    POST_SLUG: formVal_(e, "POST_SLUG"),
    META_TITLE: formVal_(e, "META_TITLE"),
    META_DESCRIPTION: formVal_(e, "META_DESCRIPTION"),
    META_IMAGE: formVal_(e, "META_IMAGE"),
  };
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildPagePropertiesCard(type, values)))
    .build();
}

function buildPagePropertiesCard(type, values) {
  const props = PropertiesService.getDocumentProperties();
  if (type === null || type === undefined) type = props.getProperty("CONTENT_TYPE") || "";
  if (!values) {
    values = {
      TARGET_PATH: props.getProperty("TARGET_PATH") || "",
      POST_SLUG: props.getProperty("POST_SLUG") || "",
      META_TITLE: props.getProperty("META_TITLE") || "",
      META_DESCRIPTION: props.getProperty("META_DESCRIPTION") || "",
      META_IMAGE: props.getProperty("META_IMAGE") || "",
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
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("POST_SLUG")
        .setTitle("URL slug (optional)")
        .setValue(values.POST_SLUG || "")
        .setHint("Auto-generated from the title if left blank.")
    );
  }

  if (type === "page" || type === "post" || type === "faq") {
    sec.addWidget(
      CardService.newTextInput()
        .setFieldName("META_TITLE")
        .setTitle("Title")
        .setValue(values.META_TITLE || "")
        .setHint(type === "faq" ? "Heading shown above the questions. Defaults to the doc name." : "")
    );
  }

  if (type === "page" || type === "post") {
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
    CONTENT_TYPE: type,
    TARGET_PATH: formVal_(e, "TARGET_PATH").trim(),
    POST_SLUG: formVal_(e, "POST_SLUG").trim(),
    META_TITLE: formVal_(e, "META_TITLE").trim(),
    META_DESCRIPTION: formVal_(e, "META_DESCRIPTION").trim(),
    META_IMAGE: formVal_(e, "META_IMAGE").trim(),
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

  // Form title wins; falls back to the doc's name.
  const title = props.getProperty("META_TITLE") || doc.getName();
  const description = props.getProperty("META_DESCRIPTION") || "";
  const image = props.getProperty("META_IMAGE") || "";

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
      const slug = props.getProperty("POST_SLUG") || slugify(title);
      const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
      targetPath = `_posts/${dateStr}-${slug}.md`;
      const fields = { layout: "post", title: title, date: dateStr };
      if (description) fields.description = description;
      if (image) fields.image = image;
      content = buildFrontMatter(fields) + rawMarkdown.trim() + "\n";
      commitMessage = `Publish op-ed: "${title}"`;
      break;
    }

    default:
      throw new Error('Unknown content type "' + contentType + '". Re-open Page Properties and pick one.');
  }

  commitFileToGithub(targetPath, content, commitMessage);
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
  return markdown.replace(/\\([_*\[\]])/g, "$1").trim();
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
