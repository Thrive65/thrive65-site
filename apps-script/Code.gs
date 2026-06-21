/**
 * THRIVE65 — Google Docs → GitHub publishing script
 * =========================================================================
 * Paste this ENTIRE file into every Google Doc that should publish to the
 * website (Extensions > Apps Script > paste over Code.gs > Save).
 *
 * Then edit the CONFIG block below for that specific doc, and run
 * "Set up GitHub connection" once from the new menu that appears the next
 * time you open the doc.
 *
 * What this does NOT handle yet (by design, to keep v1 simple):
 *   - Inline images pasted into the doc. Upload photos/logos directly to
 *     assets/images/ in the repo and reference them by path instead.
 *   - Board Meeting Minutes — those are official PDFs, not Doc content,
 *     so they're added directly to assets/board-minutes/ and listed in
 *     _data/board-minutes.yml.
 * =========================================================================
 */

const CONFIG = {
  // One of: 'overview' | 'faq' | 'page' | 'post'
  //   overview -> writes into an "include" file that index.md pulls in
  //   faq      -> parses the doc into Q&A pairs and writes _data/faq.yml
  //   page     -> a standalone page (front matter added automatically)
  //   post     -> a future op-ed; written to _posts/ with date-based filename
  CONTENT_TYPE: "overview",

  // Used by 'overview' and 'page' types. Ignored for 'faq' and 'post'.
  //   Overview doc example: "_includes/overview-content.md"
  //   A new standalone page example: "volunteer.md"
  TARGET_PATH: "_includes/overview-content.md",

  // Only used for 'post'. Leave blank to auto-generate a URL slug from the
  // doc's title (e.g. "Why Funding Matters" -> "why-funding-matters").
  POST_SLUG: "",

  // Used to timestamp new op-ed posts.
  TIMEZONE: "America/Chicago",
};

/* =========================================================================
 * Menu
 * ========================================================================= */

function onOpen() {
  DocumentApp.getUi()
    .createMenu("🌻 Thrive65 Publishing")
    .addItem("🚀 Publish to website", "publishToWebsite")
    .addSeparator()
    .addItem("⚙️ Set up GitHub connection", "setupGithubCredentials")
    .addToUi();
}

/* =========================================================================
 * One-time setup: store GitHub details in this script's Script Properties.
 * These are private to the script project and are never shown in the
 * document itself.
 * ========================================================================= */

function setupGithubCredentials() {
  const ui = DocumentApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const tokenResp = ui.prompt(
    "GitHub setup (1/4)",
    "Paste your GitHub Personal Access Token.\n\n" +
      "Use a fine-grained token scoped ONLY to your Thrive65 repo, with " +
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
    'GitHub username or organization that owns the repo (e.g. "thrive65"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (ownerResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_OWNER", ownerResp.getResponseText().trim());

  const repoResp = ui.prompt(
    "GitHub setup (3/4)",
    'Repository name (e.g. "thrive65-site"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (repoResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_REPO", repoResp.getResponseText().trim());

  const branchResp = ui.prompt(
    "GitHub setup (4/4)",
    'Branch to publish to (just click OK to use "main"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (branchResp.getSelectedButton() !== ui.Button.OK) return;
  props.setProperty("GITHUB_BRANCH", branchResp.getResponseText().trim() || "main");

  ui.alert("✅ Connected. You can now use \"Publish to website.\"");
}

/* =========================================================================
 * Main publish flow
 * ========================================================================= */

function publishToWebsite() {
  const ui = DocumentApp.getUi();
  try {
    const doc = DocumentApp.getActiveDocument();
    const docId = doc.getId();
    const title = doc.getName();

    const rawMarkdown = cleanGoogleMarkdown(exportDocAsMarkdown(docId));

    let targetPath, content, commitMessage;

    switch (CONFIG.CONTENT_TYPE) {
      case "faq": {
        targetPath = "_data/faq.yml";
        content = faqArrayToYaml(parseFaqMarkdown(rawMarkdown));
        commitMessage = `Publish FAQ update from "${title}"`;
        break;
      }

      case "overview": {
        targetPath = CONFIG.TARGET_PATH;
        content = rawMarkdown.trim() + "\n";
        commitMessage = `Publish overview update from "${title}"`;
        break;
      }

      case "page": {
        targetPath = CONFIG.TARGET_PATH;
        content = buildFrontMatter({ layout: "page", title: title }) + rawMarkdown.trim() + "\n";
        commitMessage = `Publish page update from "${title}"`;
        break;
      }

      case "post": {
        const slug = CONFIG.POST_SLUG || slugify(title);
        const dateStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
        targetPath = `_posts/${dateStr}-${slug}.md`;
        content =
          buildFrontMatter({ layout: "post", title: title, date: dateStr }) +
          rawMarkdown.trim() +
          "\n";
        commitMessage = `Publish op-ed: "${title}"`;
        break;
      }

      default:
        throw new Error('CONFIG.CONTENT_TYPE must be "overview", "faq", "page", or "post".');
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
  // Google Docs supports native Markdown export (the same format you get
  // from File > Download > Markdown in the Docs UI).
  const blob = DriveApp.getFileById(docId).getAs("text/markdown");
  return blob.getDataAsString("UTF-8");
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
