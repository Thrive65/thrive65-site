# Setting up Docs CMS - Google Docs → GitHub publishing

This connects your Google Docs to a "Publish to website" button that exports
content as Markdown and commits it straight to your GitHub repo. GitHub Actions
takes it from there and rebuilds the live site.

The script runs as a **Google Workspace Editor Add-on** — installed once, it
automatically adds the 🌻 Docs CMS menu to every Doc inside your website Drive 
folder. No pasting a script into each Doc, no per-doc authorization.

## Step 1: Create a website folder in Google Drive

Create (or designate) a single Drive folder that will hold all your website
content Docs (Home, About, posts, etc.). You'll need its **folder ID** in
Step 5 — find it in the URL when the folder is open:
`drive.google.com/drive/folders/THIS_PART_IS_THE_ID`

## Step 2: Create a GitHub Personal Access Token

1. On GitHub: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Resource owner: your org/account. Repository access: **Only select
   repositories** → choose your repo only.
3. Permissions: **Contents → Read and write**. Nothing else is needed.
4. Generate it and copy the token — keep this tab open until Step 5 is done
   (you won't see the token again after navigating away).
5. Treat this token like a password: only paste it into the Apps Script prompt
   in Step 5, which stores it in private Script Properties.

## Step 3: Create a standalone Apps Script project

1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Name it "Docs CMS".
3. In the editor, click the **+** next to Files and add a new **Script** file.
   You'll see two tabs: `Code.gs` and the new file. Delete the new file — you
   only need `Code.gs`.
4. Select everything in `Code.gs` and replace it with the full contents of
   `apps-script/Code.gs` from this repo.
5. Click the gear icon (**Project Settings**) → check **Show "appsscript.json"
   manifest file in editor**. An `appsscript.json` tab will appear.
6. Replace its entire contents with `apps-script/appsscript.json` from this repo.
7. Save (`Cmd/Ctrl+S`).

## Step 4: Create a Google Cloud project and link it

Apps Script add-ons require a linked Cloud project for the OAuth consent screen.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create
   a new project. Name it "Docs CMS". (Free tier — no billing needed.)
2. Copy the **Project number** (shown on the project dashboard).
3. Back in the Apps Script editor → **Project Settings** (gear icon) → scroll to
   **Google Cloud Platform (GCP) Project** → click **Change project** → paste
   the project number → click **Set project**.

## Step 5: Configure the OAuth consent screen

1. In the Cloud Console, go to **APIs & Services → OAuth consent screen**.
2. User type: **External**. Click Create.
3. App name: `Docs CMS`. User support email: your Gmail address.
4. Scroll to **Scopes** → Add the following manually if not pre-filled:
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/script.external_request`
   - `https://www.googleapis.com/auth/script.scriptapp`
5. Under **Test users** → add your Gmail address (and any other editors).
6. Save and continue through the remaining screens.

## Step 6: Deploy as an Add-on

1. In the Apps Script editor → **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Add-on**.
3. Description: `v1`. Click **Deploy**.
4. Copy the **Deployment ID** shown — you'll need it in the next step.

## Step 7: Install the Add-on

1. In the Apps Script editor → **Deploy → Test deployments**.
2. Click **Install** next to your deployment. Follow the prompts and grant the
   requested permissions. This is the **one-time authorization** — you won't
   be asked again per-doc.

## Step 8: Run first-time connection setup

1. Open any Google Doc inside your website Drive folder and reload the tab.
2. The **🌻 Docs CMS** menu will appear in the menu bar.
3. Click **🌻 Docs CMS → ⚙️ Set up GitHub connection** and follow
   the five prompts: GitHub token, org/username, repo name, branch, and your
   **Drive folder ID** from Step 1.
4. This only needs to be done **once** — the settings are shared across all Docs.

## Per document: configure Page Properties

Do this once for each Doc you want to publish (takes about 30 seconds):

1. Open the Doc (it must be inside the website folder).
2. Click **🌻 Docs CMS → 📄 Page Properties** and fill in the form.
3. Click Save.

### Filling in Page Properties

Pick a **Content type**; the form then shows only the fields that type needs.

| Content type | What it writes | Extra fields shown |
|---|---|---|
| **Section** | a homepage section include | Target path → `_includes/section-content.md` |
| **FAQ** | the accordion data file | *(none — always writes `_data/faq.yml`)* |
| **Standalone page** | a full page, e.g. `volunteer.md` | Target path + Title / Description / Social image |
| **Op-ed post** | a dated file in `_posts/` | URL slug (optional) + Title / Description / Social image |

- **Title** defaults to the Google Doc's name but is editable; whatever you
  type here is what gets published.
- **Description** and **Social image** feed the page's SEO and link-preview
  tags (via the `jekyll-seo-tag` plugin). They only apply to pages and posts.
- **Social image** can be a repo path (`/assets/images/foo.jpg`) or a full URL.
  Upload the image to `assets/images/` in the repo first.

## Publishing

Click **🌻 Docs CMS → 🚀 Publish to website** whenever the Doc is
ready to go live. Nothing publishes automatically — it only happens on demand.

After publishing, check the **Actions** tab on GitHub — you'll see a build
running, and the live site updates within a minute or two once it finishes.

## A note on the FAQ doc's formatting

The FAQ doc uses a simple convention so the script can turn it into an
accordion automatically:

- Each question is a **Heading 2** in the Doc.
- Everything below it, up to the next Heading 2, becomes that question's
  answer (you can use bold, links, lists, etc. — they'll carry over).

## Known limitations (v1)

- **Docs must be directly inside the website folder** (one level deep). Docs
  in sub-folders won't get the menu. This is easy to extend later if needed.
- **Inline images** pasted into a Doc aren't extracted yet — they'd bloat
  the Markdown file as embedded data. Add images directly to `assets/images/`
  in the repo and reference them with a Markdown image tag in the Doc:
  `![Alt text](/assets/images/photo.jpg)`.
- **Board Meeting Minutes** aren't part of this pipeline — they're official
  PDFs added directly to `assets/board-minutes/` and listed in
  `_data/board-minutes.yml` by hand.
