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

1. Open the Google Doc → **Extensions → Apps Script**.
2. Delete any starter code in `Code.gs` and paste in the entire contents of
   `apps-script/Code.gs` from this repo.
3. At the top of the file, edit the `CONFIG` block for this specific doc:

   | Doc | `CONTENT_TYPE` | `TARGET_PATH` |
   |---|---|---|
   | Overview | `"overview"` | `"_includes/overview-content.md"` |
   | FAQ | `"faq"` | *(ignored — always writes `_data/faq.yml`)* |
   | A new standalone page, e.g. "Volunteer" | `"page"` | `"volunteer.md"` |
   | An op-ed | `"post"` | *(ignored — auto-generates a dated filename)* |

4. Save the script (the floppy-disk icon, or `Cmd/Ctrl+S`). Give the Apps
   Script project a name like "Thrive65 Publish — Overview" if asked.
5. Go back to the Google Doc and reload the tab. A new menu, **🌻 Thrive65
   Publishing**, appears next to Help.
6. Click **🌻 Thrive65 Publishing → ⚙️ Set up GitHub connection** and follow
   the four prompts (token, GitHub username/org, repo name, branch). This
   only needs to be done once per doc.
7. The first time you run **Publish to website**, Google will ask you to
   authorize the script (it needs permission to read the doc and make
   external requests to GitHub). Review and accept — this is a one-time
   step per doc.

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

- **Inline images** pasted into a Doc aren't extracted yet — they'd bloat
  the Markdown file as embedded data. For now, add images directly to
  `assets/images/` in the repo and reference them with a normal Markdown
  image tag in the Doc, e.g. `![Alt text](/assets/images/photo.jpg)`.
- **Board Meeting Minutes** aren't part of this pipeline at all — they're
  official PDFs, so they're added straight to `assets/board-minutes/` and
  listed in `_data/board-minutes.yml` by hand.

Both are easy to add later if you want — just ask.
