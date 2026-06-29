# Setting up Docs CMS - Google Docs → GitHub publishing

This connects your Google Docs to a "Publish to website" button that exports
content as Markdown and commits it straight to your GitHub repo. GitHub Actions
takes it from there and rebuilds the live site.

The script runs as a **Google Workspace Add-on** — installed once, it appears as
a sidebar (the Docs CMS icon in the right-hand panel) in every Google Doc you
open. No pasting a script into each Doc, no per-doc authorization. The UI is a
sidebar built with CardService, not an Extensions menu.

## Step 1: Create a website folder in Google Drive

Create (or designate) a single Drive folder that will hold all your website
content Docs (Home, About, posts, etc.). You'll need its **folder ID** in
Step 9 — find it in the URL when the folder is open:
`drive.google.com/drive/folders/THIS_PART_IS_THE_ID`

(Publishing is restricted to docs in this folder; the sidebar itself appears in
all docs.)

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
   (This manifest includes a `urlFetchWhitelist` — required for any Workspace
   add-on that makes external requests, here GitHub's API and the Drive export
   endpoint. Deployment fails without it.)
7. Save (`Cmd/Ctrl+S`).

## Step 4: Create a Google Cloud project and link it

Apps Script add-ons require a linked Cloud project for the OAuth consent screen.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create
   a new project. Name it "Docs CMS". (Free tier — no billing needed.)
2. Copy the **Project number** (shown on the project dashboard).
3. Back in the Apps Script editor → **Project Settings** (gear icon) → scroll to
   **Google Cloud Platform (GCP) Project** → click **Change project** → paste
   the project number → click **Set project**.

## Step 5: Enable the Google Drive API

The add-on exports your Doc as Markdown through the Drive API, so that API must
be **enabled in the Cloud project**. End-users can't enable it themselves, so
you (the project owner) must do this once — otherwise publishing fails with
`Permission denied while enabling APIs: drive`.

1. In the Cloud Console (same project), go to **APIs & Services → Library**.
2. Search for **Google Drive API** → click it → **Enable**.

## Step 6: Configure the OAuth consent screen

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

## Step 7: Deploy as an Add-on

1. In the Apps Script editor → **Deploy → Test deployments**.
2. Make sure the type shows **Google Workspace Add-on** (it reads this from the
   `addOns` block in the manifest).
3. Click **Install** → **Done**. Test deployments run the latest saved code, so
   you never need to re-deploy after editing — just reload the Doc.

## Step 8: Open the sidebar and authorize

1. Open any Google Doc and look at the **right-hand side panel** — click the
   **Docs CMS** icon (the add-on logo) to open the sidebar.
2. Authorization happens the first time the add-on needs a sensitive scope —
   in practice, the first time you **Publish** (that's the first action that
   touches Drive). Review and accept the "unverified app" consent. This is the
   one-time authorization — you won't be asked again per-doc.

## Step 9: Run first-time connection setup

1. In the sidebar, click **Set up GitHub connection**.
2. Fill in: GitHub token, owner (user/org), repository, branch, and your
   **Drive folder ID** from Step 1. Click **Save**.
3. This only needs to be done **once** — these settings are shared across all Docs.

## Adding more editors

To let another person both **run the add-on** and **edit the content Docs**,
grant two separate things:

**1. Permission to use the add-on**

1. **Add them as a test user.** Cloud Console → **APIs & Services → OAuth
   consent screen → Test users → Add users** → their Google address. (While the
   consent screen is in "Testing", only listed test users can run the add-on.)
2. **Give them the add-on.** Share the Apps Script project with them (open the
   project → **Share**, like any Drive file), then have them open it and go to
   **Deploy → Test deployments → Install**. They'll click through the same
   "unverified app" consent on first publish.
   - They do **not** re-enter the GitHub connection — token/owner/repo/folder
     live in shared Script Properties, so your setup carries over to them.
   - They do **not** need access to the Cloud project; the Drive API is already
     enabled on it at the project level.

**2. Permission to edit the Drive files**

- Share the **website Drive folder** with them as **Editor** (right-click the
  folder → **Share** → add their address → Editor). That covers every Doc inside
  it, and keeps them in the folder that publishing is scoped to.

> **Note:** sharing the Apps Script project lets a collaborator view the saved
> GitHub token in Script Properties. That's fine for a trusted teammate. If you'd
> rather not expose it — or you're adding many people — publish the add-on
> privately/unlisted through the Google Workspace Marketplace SDK instead, which
> lets people install without any access to the script. That's a larger one-time
> setup; ask if you want to go that route.

## Per document: configure Page Properties

Do this once for each Doc you want to publish (takes about 30 seconds):

1. Open the Doc and open the **Docs CMS** sidebar.
2. Click **📄 Page Properties** and fill in the form.
3. Click **Save**.

### Filling in Page Properties

Pick a **Content type**; the form then shows only the fields that type needs
(the sidebar refreshes when you change the dropdown).

| Content type | What it writes | Extra fields shown |
|---|---|---|
| **Homepage section** | a homepage section include | Target path → `_includes/section-content.md` |
| **FAQ item** | the accordion data file (`_data/faq.yml`) | Title (the section heading) |
| **Page** | a full page, e.g. `volunteer.md` | Target path + Title / Description / Social image |
| **Post** | a dated file in `_posts/` | URL slug (optional) + Title / Description / Social image |

- **Title** defaults to the Google Doc's name but is editable; whatever you
  type here is what gets published. For an **FAQ doc**, the Title becomes the
  heading shown above the questions.
- **Description** and **Social image** feed the page's SEO and link-preview
  tags (via the `jekyll-seo-tag` plugin). They only apply to pages and posts.
- **Social image** can be a repo path (`/assets/images/foo.jpg`) or a full URL.
  Upload the image to `assets/images/` in the repo first.

## Publishing

In the sidebar, click **🚀 Publish to website** whenever the Doc is ready to go
live. Publishing only works for docs inside your website folder. Nothing
publishes automatically — it only happens on demand.

After publishing, check the **Actions** tab on GitHub — you'll see a build
running, and the live site updates within a minute or two once it finishes.

## A note on the FAQ doc's formatting

The FAQ doc uses a simple convention so the script can turn it into an
accordion automatically:

- The **Title** (in Page Properties) becomes the section heading above the questions.
- Each question is a **Heading 2** in the Doc.
- Everything below it, up to the next Heading 2, becomes that question's
  answer (you can use bold, links, lists, etc. — they'll carry over).

## Known limitations (v1)

- **The sidebar appears in all your Docs**, but publishing is restricted to
  docs **directly inside the website folder** (one level deep). Docs in
  sub-folders are blocked from publishing. This is easy to extend later.
- **Unverified-app warning:** because the add-on uses sensitive scopes (Drive,
  Docs) and isn't submitted for Google verification, you'll click through an
  "unverified app" screen at first authorization. That's expected for a
  test-deployment add-on used by its developer/test users.
- **Inline images** pasted into a Doc aren't extracted yet — they'd bloat
  the Markdown file as embedded data. Add images directly to `assets/images/`
  in the repo and reference them with a Markdown image tag in the Doc:
  `![Alt text](/assets/images/photo.jpg)`.
- **Board Meeting Minutes** aren't part of this pipeline — they're official
  PDFs added directly to `assets/board-minutes/` and listed in
  `_data/board-minutes.yml` by hand.
