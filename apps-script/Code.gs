/**
 * Docs CMS — Google Docs → GitHub publishing script
 * =========================================================================
 * This is a Google Workspace Editor Add-on. It is installed once from 
 * script.google.com and then the 🌻 menu appears automatically in any Doc 
 * inside the designated website Drive folder.
 *
 * One-time setup (see apps-script/SETUP.md for detailed instructions):
 *   1. Create a standalone Apps Script project at script.google.com.
 *   2. Paste Code.gs and appsscript.json into the editor. Save.
 *   3. Link a Google Cloud project and configure the OAuth consent screen.
 *   4. Deploy → New deployment → Add-on. Install via the test-deployment link.
 *   5. Open any Doc in your website Drive folder → reload → run
 *      🌻 Docs CMS → ⚙️ Set up GitHub connection  (once ever)
 *   6. 🌻 Docs CMS → 📄 Page Properties           (once per doc)
 *   7. 🌻 Docs CMS → 🚀 Publish to website        (any time)
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
 * Menu
 * ========================================================================= */

function onOpen(e) {
  // Only add the menu when the Doc lives inside the configured website folder.
  // Docs outside that folder open normally with no menu added.
  if (!isWebsiteDoc_()) return;
  DocumentApp.getUi()
    .createMenu("🌻 Docs CMS")
    .addItem("🚀 Publish to website", "publishToWebsite")
    .addSeparator()
    .addItem("📄 Page Properties", "showPageProperties")
    .addItem("⚙️ Set up GitHub connection", "setupGithubCredentials")
    .addToUi();
}

// Returns true if the current document is inside the configured website
// Drive folder. If no folder ID has been configured yet, returns true so the
// menu is visible during initial setup.
function isWebsiteDoc_() {
  const folderId = PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID");
  if (!folderId) return true;
  const docId = DocumentApp.getActiveDocument().getId();
  // Cache per-document so the Drive API call only happens once per session.
  const cache = CacheService.getDocumentCache();
  const cached = cache.get("in_website_folder");
  if (cached !== null) return cached === "1";
  const parents = DriveApp.getFileById(docId).getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) {
      cache.put("in_website_folder", "1", 3600);
      return true;
    }
  }
  cache.put("in_website_folder", "0", 3600);
  return false;
}

/* =========================================================================
 * One-time setup: store GitHub details in this script's Script Properties.
 * The GitHub connection (token/owner/repo/branch) is the same wherever you
 * publish, so it lives in Script Properties — separate from the per-page
 * config in Page Properties below.
 * ========================================================================= */

function setupGithubCredentials() {
  const ui = DocumentApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const tokenResp = ui.prompt(
    "GitHub setup (1/4)",
    "Paste your GitHub Personal Access Token.\n\n" +
      "Use a fine-grained token scoped ONLY to your repo, with " +
      "'Contents: Read and write' permission. It's stored in this script's " +
      "properties, not in the document text.",
    ui.ButtonSet.OK_CANCEL
  );
  if (tokenResp.getSelectedButton() !== ui.Button.OK) return;
  const token = tokenResp.getResponseText().trim();
  if (!token) { ui.alert("No token entered — setup cancelled."); return; }
  props.setProperty("GITHUB_TOKEN", token);

  const ownerResp = ui.prompt(
    "GitHub setup (2/4)",
    'GitHub username or organization that owns the repo (e.g. "my-org"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (ownerResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_OWNER", ownerResp.getResponseText().trim());

  const repoResp = ui.prompt(
    "GitHub setup (3/4)",
    'Repository name (e.g. "my-org-site"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (repoResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_REPO", repoResp.getResponseText().trim());

  const branchResp = ui.prompt(
    "GitHub setup (4/5)",
    'Branch to publish to (just click OK to use "main"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (branchResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_BRANCH", branchResp.getResponseText().trim() || "main");

  const folderResp = ui.prompt(
    "GitHub setup (5/5)",
    "Drive folder ID for your website Docs (the menu will only appear in Docs inside this folder).\n\n" +
      "Find it in the folder's URL: drive.google.com/drive/folders/FOLDER_ID_IS_HERE\n\n" +
      "Leave blank to show the menu in all Docs:",
    ui.ButtonSet.OK_CANCEL
  );
  if (folderResp.getSelectedButton() !== ui.Button.OK) return;
  const folderId = folderResp.getResponseText().trim();
  if (folderId) props.setProperty("DRIVE_FOLDER_ID", folderId);

  ui.alert("✅ Connected. You can now use \"Publish to website\" in any Doc inside your website folder.");
}

/* =========================================================================
 * Page Properties: per-doc content routing + page metadata.
 *
 * Stored in DocumentProperties (scoped to THIS doc) so the same script can
 * serve every page without code edits. Read back by publishToWebsite().
 * ========================================================================= */

function showPageProperties() {
  const html = HtmlService.createHtmlOutput(pagePropertiesHtml_())
    .setWidth(460)
    .setHeight(600);
  DocumentApp.getUi().showModalDialog(html, "📄 Page Properties");
}

// Called by the form to pre-populate fields. Returns current saved values
// plus the doc name, which the form uses as the default title.
function getPageProperties() {
  const props = PropertiesService.getDocumentProperties();
  return {
    CONTENT_TYPE: props.getProperty("CONTENT_TYPE") || "",
    TARGET_PATH: props.getProperty("TARGET_PATH") || "",
    POST_SLUG: props.getProperty("POST_SLUG") || "",
    META_TITLE: props.getProperty("META_TITLE") || "",
    META_DESCRIPTION: props.getProperty("META_DESCRIPTION") || "",
    META_IMAGE: props.getProperty("META_IMAGE") || "",
    docName: DocumentApp.getActiveDocument().getName(),
  };
}

// Called by the form on Save.
function savePageProperties(form) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperties({
    CONTENT_TYPE: (form.CONTENT_TYPE || "").trim(),
    TARGET_PATH: (form.TARGET_PATH || "").trim(),
    POST_SLUG: (form.POST_SLUG || "").trim(),
    META_TITLE: (form.META_TITLE || "").trim(),
    META_DESCRIPTION: (form.META_DESCRIPTION || "").trim(),
    META_IMAGE: (form.META_IMAGE || "").trim(),
  });
  return true;
}

/* =========================================================================
 * Main publish flow
 * ========================================================================= */

function publishToWebsite() {
  const ui = DocumentApp.getUi();
  try {
    const doc = DocumentApp.getActiveDocument();
    const docId = doc.getId();
    const props = PropertiesService.getDocumentProperties();

    const contentType = props.getProperty("CONTENT_TYPE");
    if (!contentType) {
      throw new Error(
        'This doc isn\'t configured yet. Open "📄 Page Properties" from the ' +
          "menu, choose a content type, and Save before publishing."
      );
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
        content = faqArrayToYaml(parseFaqMarkdown(rawMarkdown));
        commitMessage = `Publish FAQ update from "${title}"`;
        break;
      }

      case "section": {
        targetPath = props.getProperty("TARGET_PATH");
        if (!targetPath) {
          throw new Error('Set a "Target path" in Page Properties for this section doc.');
        }
        content = rawMarkdown.trim() + "\n";
        commitMessage = `Publish section update from "${title}"`;
        break;
      }

      case "page": {
        targetPath = props.getProperty("TARGET_PATH");
        if (!targetPath) {
          throw new Error('Set a "Target path" in Page Properties for this page (e.g. "volunteer.md").');
        }
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

    ui.alert(
      "🚀 Published!",
      `"${title}" was pushed to ${targetPath}.\n\nThe site will rebuild automatically in a minute or two (check the Actions tab in GitHub for progress).`,
      ui.ButtonSet.OK
    );
  } catch (err) {
    DocumentApp.getUi().alert("Publish failed", String(err.message || err), DocumentApp.getUi().ButtonSet.OK);
  }
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

function faqArrayToYaml(faqs) {
  if (faqs.length === 0) {
    return "[]\n";
  }
  let yaml = "";
  faqs.forEach((f) => {
    yaml += `- question: ${yamlScalar(f.question)}\n`;
    yaml += "  answer: |\n";
    f.answer.split("\n").forEach((line) => {
      yaml += `    ${line}\n`;
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
    throw new Error('GitHub isn\'t connected yet. Run "Set up GitHub connection" from the menu first.');
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

/* =========================================================================
 * Page Properties form (HTML for the modal dialog).
 *
 * Inlined here as a string so the whole tool stays a single file to paste.
 * The form pre-populates from getPageProperties() and saves through
 * savePageProperties(). Fields show/hide based on the chosen content type:
 *
 *   section  -> Target path
 *   faq      -> (no extra fields; always writes _data/faq.yml)
 *   page     -> Target path + Title/Description/Social image
 *   post     -> URL slug (optional) + Title/Description/Social image
 * ========================================================================= */

function pagePropertiesHtml_() {
  return `
<!DOCTYPE html>
<html>
<head>
<base target="_top">
<style>
  body { font-family: "Public Sans", Arial, sans-serif; color: #20251f; margin: 0; padding: 16px; font-size: 14px; }
  h2 { margin: 0 0 4px; font-size: 16px; }
  p.sub { margin: 0 0 16px; color: #5b5a52; font-size: 12px; }
  label { display: block; font-weight: 600; margin: 14px 0 4px; }
  .hint { font-weight: 400; color: #5b5a52; font-size: 12px; }
  select, input[type=text], textarea {
    width: 100%; box-sizing: border-box; padding: 8px 10px;
    border: 1px solid #cdc6b4; border-radius: 8px; font: inherit;
  }
  textarea { resize: vertical; min-height: 60px; }
  .field { display: none; }
  .field.show { display: block; }
  .actions { margin-top: 22px; display: flex; gap: 10px; align-items: center; }
  button {
    font: inherit; font-weight: 600; padding: 9px 18px; border-radius: 999px;
    border: none; cursor: pointer; background: #2e7d52; color: #fff;
  }
  button.secondary { background: #ece6d5; color: #20251f; }
  #status { font-size: 12px; color: #2e7d52; }
</style>
</head>
<body>
  <h2>Page Properties</h2>
  <p class="sub">Stored privately with this document.</p>

  <label for="CONTENT_TYPE">Content type</label>
  <select id="CONTENT_TYPE" onchange="syncFields()">
    <option value="">— choose —</option>
    <option value="section">Homepage section</option>
    <option value="faq">FAQ item</option>
    <option value="page">Page</option>
    <option value="post">Post</option>
  </select>

  <div class="field" id="f_target">
    <label for="TARGET_PATH">Target path <span class="hint" id="target_hint"></span></label>
    <input type="text" id="TARGET_PATH" placeholder="volunteer.md">
  </div>

  <div class="field" id="f_slug">
    <label for="POST_SLUG">URL slug <span class="hint">optional — auto-generated from the title if blank</span></label>
    <input type="text" id="POST_SLUG" placeholder="why-funding-matters">
  </div>

  <div class="field" id="f_meta">
    <label for="META_TITLE">Title <span class="hint">used for the page title &amp; link previews</span></label>
    <input type="text" id="META_TITLE">

    <label for="META_DESCRIPTION">Description <span class="hint">~160 chars, for search results &amp; social cards</span></label>
    <textarea id="META_DESCRIPTION"></textarea>

    <label for="META_IMAGE">Social image <span class="hint">path or URL, e.g. /assets/images/volunteer.jpg</span></label>
    <input type="text" id="META_IMAGE" placeholder="/assets/images/...">
  </div>

  <div class="actions">
    <button onclick="save()">Save</button>
    <button class="secondary" onclick="google.script.host.close()">Cancel</button>
    <span id="status"></span>
  </div>

<script>
  var DOC_NAME = "";

  function syncFields() {
    var type = document.getElementById("CONTENT_TYPE").value;
    show("f_target", type === "section" || type === "page");
    show("f_slug", type === "post");
    show("f_meta", type === "page" || type === "post");

    var hint = document.getElementById("target_hint");
    if (type === "section") {
      hint.textContent = "e.g. _includes/home-overview.md";
    } else if (type === "page") {
      hint.textContent = "e.g. volunteer.md";
    } else {
      hint.textContent = "";
    }

    // Default the title to the doc name when metadata is shown but empty.
    var titleEl = document.getElementById("META_TITLE");
    if ((type === "page" || type === "post") && !titleEl.value) {
      titleEl.value = DOC_NAME;
    }
  }

  function show(id, on) {
    document.getElementById(id).className = "field" + (on ? " show" : "");
  }

  function save() {
    var form = {
      CONTENT_TYPE: document.getElementById("CONTENT_TYPE").value,
      TARGET_PATH: document.getElementById("TARGET_PATH").value,
      POST_SLUG: document.getElementById("POST_SLUG").value,
      META_TITLE: document.getElementById("META_TITLE").value,
      META_DESCRIPTION: document.getElementById("META_DESCRIPTION").value,
      META_IMAGE: document.getElementById("META_IMAGE").value
    };
    if (!form.CONTENT_TYPE) { setStatus("Pick a content type first.", true); return; }
    setStatus("Saving…", false);
    google.script.run
      .withSuccessHandler(function() { google.script.host.close(); })
      .withFailureHandler(function(e) { setStatus(e.message || String(e), true); })
      .savePageProperties(form);
  }

  function setStatus(msg, isError) {
    var el = document.getElementById("status");
    el.textContent = msg;
    el.style.color = isError ? "#b3261e" : "#2e7d52";
  }

  // Load existing values on open.
  google.script.run.withSuccessHandler(function(p) {
    DOC_NAME = p.docName || "";
    document.getElementById("CONTENT_TYPE").value = p.CONTENT_TYPE;
    document.getElementById("TARGET_PATH").value = p.TARGET_PATH;
    document.getElementById("POST_SLUG").value = p.POST_SLUG;
    document.getElementById("META_TITLE").value = p.META_TITLE;
    document.getElementById("META_DESCRIPTION").value = p.META_DESCRIPTION;
    document.getElementById("META_IMAGE").value = p.META_IMAGE;
    syncFields();
  }).getPageProperties();
</script>
</body>
</html>
`;
}
