# 🔑 Keybox Hub

> **Every keybox. Always fresh.**

An open-source, fully static aggregator for publicly available `keybox.xml`
files hosted on GitHub. Keybox Hub discovers repositories with the GitHub
Search API, mirrors every matching XML file, computes a SHA-256 for each one,
and serves the result as a pre-rendered static site.

**Zero backend. Zero cost. Zero maintenance.**

---

## ✨ Features

| | |
|---|---|
| 🔍 **Search** | Filter by filename, repo path, source repo, or SHA-256 |
| 🏷️ **Tags** | Source repo · commit date · size · SHA-256 · verified flag |
| ⬇️ **One-click download** | Direct `.xml` download, no redirects |
| 📄 **In-browser preview** | Syntax-highlighted, scrollable XML viewer |
| 🔄 **Auto-updating** | GitHub Actions cron every 6 hours |
| 🧮 **Hash verified** | Every file's SHA-256 is recomputed at index time |
| 🌗 **Dark by default** | Light mode toggle, persisted in `localStorage` |
| 📱 **Responsive** | Mobile-first grid + list views |
| ⚡ **Static** | `output: 'export'` — deploy anywhere that serves files |

---

## 🧱 Tech stack

- **Next.js 14** (App Router) with `output: 'export'`
- **TypeScript**
- **TailwindCSS** + shadcn/ui-style components
- **Framer Motion** for subtle animation
- **lucide-react** icons
- **GitHub Actions** for scheduled data fetching
- **Cloudflare Pages** for hosting

---

## 🚀 Local development

```bash
# 1. Clone
git clone https://github.com/keybox-hub/keybox-hub.git
cd keybox-hub

# 2. Install
npm install

# 3. (Optional) set a token so `npm run fetch` can use code search
cp .env.example .env
#   → put a GitHub PAT with `public_repo` scope in GITHUB_TOKEN

# 4. Populate the index (writes public/keyboxes/*.xml + public/data/*.json)
npm run fetch
npm run build-index

# 5. Run the dev server
npm run dev
#   → http://localhost:3000
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Static export into `out/` |
| `npm run fetch` | Discover + download keybox files → `public/keyboxes/` |
| `npm run build-index` | Rebuild `public/data/index.json` |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run deploy` | fetch + build-index + build |

`npm run fetch` degrades gracefully. If GitHub is unreachable or rate
limits are hit, it keeps the existing manifest and exits 0 so builds
never break.

---

## 🔎 How discovery works

1. **Repository search** — `keybox in:name,description,readme` (top 200 by stars).
2. **Code search** — `filename:keybox.xml` (requires `GITHUB_TOKEN`).
3. **Seeds** — every repo listed in `scripts/sources.json` under `seeds`
   is added to the candidate pool (missing seeds are skipped silently).
4. **Ranking** — stars desc, then `pushed_at` desc.
5. Top 20 unique repos are kept.
6. Each repo's git tree is walked recursively; every path matching
   `/(^|\/)[^/]*keybox[^/]*\.xml$/i` is downloaded.
7. Files are de-duplicated by SHA-256, validated, and written to
   `public/keyboxes/`.

### Add a new source repo

Edit `scripts/sources.json`:

```json
{
  "seeds": [
    "your-org/your-repo"
  ]
}
```

…then open a PR. The next scheduled run will index it. You can also just
trigger **Actions → Update Keyboxes → Run workflow**.

---

## ☁️ Deploy to Cloudflare Pages

### Option A — Git integration

1. Push this repository to GitHub.
2. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Configure:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
   - Environment variable: `NODE_VERSION=20`
   - Environment variable: `NEXT_PUBLIC_SITE_URL=https://<your-project>.pages.dev`
4. Click Save and Deploy.

### Option B — GitHub Actions (`deploy.yml`)

1. Create a Cloudflare API token with **Cloudflare Pages — Edit** permission.
2. Find your Account ID.
3. In GitHub: Settings → Secrets and variables → Actions
   - Secret `CLOUDFLARE_API_TOKEN`
   - Secret `CLOUDFLARE_ACCOUNT_ID`
   - Variable `CF_PAGES_PROJECT` = `keybox-hub` (optional)
   - Variable `SITE_URL` = your production URL (optional)
4. Push to `main`. The workflow builds and publishes automatically.

---

## 🤖 Automation

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `update-keyboxes.yml` | cron `0 */6 * * *` + manual | Fetches, hashes, commits |
| `deploy.yml` | push to main, workflow_run, manual | Builds + deploys to CF Pages |
| `ci.yml` | push / PR | Typecheck, lint, static build assertion |
| `lighthouse.yml` | push to main, manual | Performance budgets |

---

## ⚖️ Disclaimer

Keybox Hub is **not affiliated with, endorsed by, or connected to Google,
Alphabet, or any device manufacturer (OEM)**.

This project indexes only files that are already publicly available in
public GitHub repositories. It does not host, generate, leak, or circumvent
anything. Indexed files remain under the license of their original
repositories. Rights holders can request de-indexing by opening an issue.

Provided "as is", without warranty of any kind.

---

## 📄 License

MIT © Keybox Hub contributors
