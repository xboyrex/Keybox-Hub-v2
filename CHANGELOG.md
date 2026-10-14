# Changelog

All notable changes to Keybox Hub are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2025-01-01

### Added
- Initial public release of **Keybox Hub**.
- Fully static Next.js 14 App Router site with `output: 'export'`.
- Automatic discovery of keybox repositories via the GitHub Search API
  (`filename:keybox.xml`, `keybox in:name,description,readme`).
- `scripts/fetch-keyboxes.ts` — walks repository trees, mirrors every
  matching XML file into `public/keyboxes/`, computes SHA-256, and writes
  `public/data/manifest.json`.
- `scripts/generate-index.ts` — re-verifies every file on disk, aggregates
  source-repository stats, and emits `public/data/index.json`.
- Home page with hero, live stats bar, search, filter chips
  (All / New / Updated / Verified), grid + list views, and animated cards.
- Detail page `/keybox/[id]` with syntax-highlighted XML viewer, metadata
  table, download, copy, and "Open in GitHub".
- `/sources` — table of every indexed repository with stars, forks, last
  update, and keybox count.
- `/api-status` — index health dashboard.
- `/about` — methodology, MIT licensing, and disclaimer.
- Dark-mode-first theming with a persisted light-mode toggle.
- `Update Keyboxes` workflow (cron every 6 hours + manual dispatch).
- `Deploy to Cloudflare Pages` workflow with `workflow_run` chaining.
- `CI` workflow (typecheck, lint, static export assertion).
- `Lighthouse` workflow with desktop performance budgets.
- Cloudflare `_headers` with per-route caching and security headers.
- `robots.txt` and `sitemap.xml` generated at build time.

### Notes
- Zero paid services required.
- No server-side runtime — the entire site is pre-rendered HTML.

[1.0.0]: https://github.com/keybox-hub/keybox-hub/releases/tag/v1.0.0
