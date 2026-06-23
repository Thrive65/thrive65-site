# Setting up Google Docs → GitHub publishing

This connects each content Google Doc to a "Publish to website" button that
exports the doc as Markdown and commits it straight to your GitHub repo.
GitHub Actions (already configured in `.github/workflows/deploy.yml`) takes
it from there and rebuilds the live site.

## One-time: create the repo

1. Create a new GitHub repository (e.g. `thrive65-site`) — this is the "new
   repo to keep both projects separate" you mentioned. Push everything in
   this folder to it as the initial commit, on the `main` branch.
2. In the repo, go to **Settings → Pages** and set Source to **GitHub
   Actions**. The `deploy.yml` workflow will handle builds from then on.
3. Set `url` (and `baseurl` if this isn't a custom domain) in `_config.yml`.

## One-time: create a GitHub Personal Access Token

1. On GitHub: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Resource owner: your org/account. Repository access: **Only select
   repositories** → choose your new repo only.
3. Permissions: **Contents → Read and write**. Nothing else is needed.
4. Generate it and copy the token — you'll paste it into Apps Script in a
   moment (you won't be able to see it again on GitHub after you navigate
   away, so keep the tab open until the next step is done).
5. Treat this token like a password: don't paste it into the Doc itself,
   Slack, email, etc. — only into the Apps Script prompt below, which
   stores it in that script's private Script Properties.

## Per document: attach the publishing script

Do this once for each Google Doc that should publish to the site (e.g. one
for "Overview", one for "FAQ", and later one per op-ed if you want a
dedicated doc per post — or just duplicate a doc whenever you start a new
op-ed).

There is **no code editing per doc** — you paste the same script into every
doc and configure it through a menu. (The old `CONFIG` block is gone; all
per-page settings now live in **Page Properties**, stored privately with
each document.)

1. Open the Google Doc → **Extensions → Apps Script**.
2. Delete any starter code in `Code.gs` and paste in the entire contents of
   `apps-script/Code.gs` from this repo. Don't edit it — just paste.
3. Save the script (the floppy-disk icon, or `Cmd/Ctrl+S`). Give the Apps
   Script project a name like "Thrive65 Publish — Overview" if asked.
4. Go back to the Google Doc and reload the tab. A new menu, **🌻 Thrive65
   Publishing**, appears next to Help.
5. Click **🌻 Thrive65 Publishing → ⚙️ Set up GitHub connection** and follow
   the four prompts (token, GitHub username/org, repo name, branch). This
   only needs to be done once per doc.
6. Click **🌻 Thrive65 Publishing → 📄 Page Properties** and fill in the form
   for this doc (details below). Save.
7. The first time you run **Publish to website**, Google will ask you to
   authorize the script (it needs permission to read the doc and make
   external requests to GitHub). Review and accept — this is a one-time
   step per doc.

### Filling in Page Properties

Pick a **Content type**; the form then shows only the fields that type needs.

| Content type | What it writes | Extra fields shown |
|---|---|---|
| **Overview** | the homepage include | Target path → `_includes/overview-content.md` |
| **FAQ** | the accordion data file | *(none — always writes `_data/faq.yml`)* |
| **Standalone page** | a full page, e.g. `volunteer.md` | Target path + Title / Description / Social image |
| **Op-ed post** | a dated file in `_posts/` | URL slug (optional) + Title / Description / Social image |

- **Title** defaults to the Google Doc's name but is editable; whatever you
  type here is what gets published.
- **Description** and **Social image** feed the page's SEO and link-preview
  tags (via the `jekyll-seo-tag` plugin). They only apply to pages and posts.
- **Social image** can be a repo path (`/assets/images/foo.jpg`) or a full
  URL. Upload the image to `assets/images/` in the repo first.

## Publishing

From now on, whoever is editing that doc just goes to
**🌻 Thrive65 Publishing → 🚀 Publish to website** whenever it's ready to go
live. Nothing publishes automatically while someone is mid-edit — it only
happens when this menu item is clicked.

After publishing, check the **Actions** tab on GitHub — you'll see a build
running, and the live site updates within a minute or two once it finishes.

## A note on the FAQ doc's formatting

The FAQ doc uses a simple convention so the script can turn it into an
accordion automatically:

- Each question is a **Heading 2** in the Doc.
- Everything below it, up to the next Heading 2, becomes that question's
  answer (you can use bold, links, lists, etc. — they'll carry over).

## Known limitations (v1)

- **You still paste the script once per new Doc.** Because it's a
  container-bound script, each new Doc needs `Code.gs` pasted in one time.
  You never *edit* it again (config is all in Page Properties), but the
  initial paste remains. See "Eliminating the paste" below for the path to
  zero-touch.
- **Inline images** pasted into a Doc aren't extracted yet — they'd bloat
  the Markdown file as embedded data. For now, add images directly to
  `assets/images/` in the repo and reference them with a normal Markdown
  image tag in the Doc, e.g. `![Alt text](/assets/images/photo.jpg)`.
- **Board Meeting Minutes** aren't part of this pipeline at all — they're
  official PDFs, so they're added straight to `assets/board-minutes/` and
  listed in `_data/board-minutes.yml` by hand.

These are easy to extend later if you want — just ask.

## Eliminating the paste: publishing as an Editor Add-on (optional, future)

To make the menu appear in *every* Doc automatically — no pasting at all —
this script can be published as a Google Workspace **Editor Add-on**. It's a
bigger, mostly one-time effort and isn't required for the workflow above to
work. The broad steps:

1. **Move the script to a standalone Apps Script project** (not bound to a
   single Doc) and attach it to a **standard Google Cloud project**.
2. **Configure the OAuth consent screen** in that Cloud project, listing the
   scopes the script uses (read the active document, external requests to
   GitHub, Drive export).
3. **Add Editor Add-on deployment metadata** (`appsscript.json` with an
   `addOns` section, a logo, and the `onOpen` homepage/menu trigger).
4. **Distribute it.** For just your team this can stay **unlisted /
   internal** to your Workspace org — no public review needed. Publishing it
   publicly on the Marketplace would require Google's OAuth verification
   (privacy policy, app review), which is why it's deferred.

Once installed for your org, anyone with the add-on enabled gets the 🌻
menu in any Doc with nothing to paste; Page Properties and the GitHub
connection still work exactly as documented above.
