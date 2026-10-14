#!/usr/bin/env tsx
/**
 * Keybox Hub — keybox fetcher
 * ---------------------------
 * 1. Discovers public GitHub repositories that host keybox.xml files
 *    (Search API: repositories + code, merged with scripts/sources.json seeds).
 * 2. Walks each repo's git tree and downloads every matching XML file.
 * 3. Computes SHA-256, validates structure, writes files into public/keyboxes.
 * 4. Writes public/data/manifest.json for generate-index.ts to consume.
 *
 * Runs on Node 20+ with zero runtime dependencies (native fetch).
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────
// Paths & config
// ─────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const KEYBOX_DIR = path.join(PUBLIC_DIR, 'keyboxes');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const SOURCES_PATH = path.join(ROOT, 'scripts', 'sources.json');

const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';
const API = 'https://api.github.com';

const FILE_RE = /(^|\/)([^/]*keybox[^/]*\.xml)$/i;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RepoRef {
  fullName: string;
  stars: number;
  forks: number;
  pushedAt: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  discoveredVia: 'search-repo' | 'search-code' | 'seed' | 'api';
}

interface KeyboxMeta {
  id: string;
  filename: string;
  path: string;
  sourceRepo: string;
  sourceUrl: string;
  rawUrl: string;
  localPath: string;
  sha256: string;
  size: number;
  lastCommit: string;
  discoveredAt: string;
  verified: boolean;
  xmlValid: boolean;
}

interface SourcesConfig {
  seeds: string[];
  search: {
    repositories: string[];
    code: string[];
    maxSources: number;
  };
  limits: {
    maxFilesPerRepo: number;
    maxTotalFiles: number;
    maxCommitLookups: number;
  };
}

interface Manifest {
  generatedAt: string;
  keyboxes: KeyboxMeta[];
}

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[fetch] ${msg}`);
}

function warn(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(`[fetch] ⚠ ${msg}`);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────
// GitHub API client with retry / rate-limit handling
// ─────────────────────────────────────────────────────────────

async function gh<T = any>(
  url: string,
  attempt = 0
): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'keybox-hub-fetcher'
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    if (attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return gh<T>(url, attempt + 1);
    }
    warn(`network error for ${url}: ${(err as Error).message}`);
    return null;
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (attempt < 3) {
      const retryAfter = Number(res.headers.get('retry-after') ?? '0');
      const wait = retryAfter > 0 ? retryAfter * 1000 : 4000 * (attempt + 1);
      warn(
        `rate limited (${res.status}, remaining=${remaining}) — waiting ${Math.round(
          wait / 1000
        )}s`
      );
      await sleep(wait);
      return gh<T>(url, attempt + 1);
    }
    warn(`giving up on ${url} after rate limiting`);
    return null;
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    warn(`HTTP ${res.status} ${res.statusText} — ${url}`);
    return null;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function rawText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'keybox-hub-fetcher' }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function looksLikeKeybox(xml: string): boolean {
  if (!xml || xml.length < 80) return false;
  return /<Keybox[\s>]/i.test(xml) && /<Key[\s>]/i.test(xml);
}

function isStructurallyVerified(xml: string): boolean {
  return (
    looksLikeKeybox(xml) &&
    /<DeviceID>/i.test(xml) &&
    /<\/Keybox>/i.test(xml) &&
    /<Key\b[^>]*>/i.test(xml)
  );
}

/** Very light well-formedness check: balanced open/close tags. */
function isBalancedXml(xml: string): boolean {
  const stack: string[] = [];
  const re = /<\/?([A-Za-z_][\w:.\-]*)[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  let count = 0;

  while ((m = re.exec(xml)) !== null) {
    count++;
    const name = m[1];
    const closing = m[0].startsWith('</');
    const selfClosing = m[2] === '/' || m[0].startsWith('<?') || m[0].startsWith('<!');

    if (selfClosing) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else {
      stack.push(name);
    }
  }
  return count > 0 && stack.length === 0;
}

// ─────────────────────────────────────────────────────────────
// Discovery
// ─────────────────────────────────────────────────────────────

function repoRefFromApi(item: any, via: RepoRef['discoveredVia']): RepoRef {
  return {
    fullName: item.full_name,
    stars: item.stargazers_count ?? 0,
    forks: item.forks_count ?? 0,
    pushedAt: item.pushed_at ?? item.updated_at ?? new Date().toISOString(),
    description: item.description ?? null,
    htmlUrl: item.html_url ?? `https://github.com/${item.full_name}`,
    defaultBranch: item.default_branch ?? 'main',
    discoveredVia: via
  };
}

async function discoverRepos(config: SourcesConfig): Promise<RepoRef[]> {
  const byName = new Map<string, RepoRef>();

  const add = (ref: RepoRef) => {
    const existing = byName.get(ref.fullName);
    if (!existing) {
      byName.set(ref.fullName, ref);
      return;
    }
    // Prefer the record with the most metadata.
    byName.set(ref.fullName, {
      ...existing,
      ...ref,
      stars: Math.max(existing.stars, ref.stars),
      forks: Math.max(existing.forks, ref.forks)
    });
  };

  // 1. Repository search
  for (const q of config.search.repositories) {
    for (let page = 1; page <= 2; page++) {
      const url = `${API}/search/repositories?q=${encodeURIComponent(
        q
      )}&sort=stars&order=desc&per_page=100&page=${page}`;
      const data = await gh<{ items?: any[] }>(url);
      const items = data?.items ?? [];
      items.forEach((item) => add(repoRefFromApi(item, 'search-repo')));
      log(`repo search "${q}" page ${page}: +${items.length}`);
      if (items.length < 100) break;
      await sleep(700);
    }
  }

  // 2. Code search (requires auth — the public endpoint is heavily throttled)
  if (TOKEN) {
    for (const q of config.search.code) {
      const url = `${API}/search/code?q=${encodeURIComponent(q)}&per_page=100`;
      const data = await gh<{ items?: any[] }>(url);
      const items = data?.items ?? [];
      items.forEach((item) => {
        if (item.repository) {
          add(repoRefFromApi(item.repository, 'search-code'));
        }
      });
      log(`code search "${q}": +${items.length}`);
      await sleep(1200);
    }
  } else {
    warn(
      'GITHUB_TOKEN is not set — skipping code search (which requires auth).'
    );
  }

  // 3. Seeds
  for (const seed of config.seeds) {
    if (byName.has(seed)) continue;
    const data = await gh<any>(`${API}/repos/${seed}`);
    if (!data) {
      // Seed may not exist — skip silently, this is expected for a seed list.
      continue;
    }
    add(repoRefFromApi(data, 'seed'));
    await sleep(120);
  }

  // Rank: stars desc, then pushedAt desc
  const ranked = [...byName.values()].sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
  });

  return ranked.slice(0, config.search.maxSources);
}

// ─────────────────────────────────────────────────────────────
// Tree walking + download
// ─────────────────────────────────────────────────────────────

interface TreeEntry {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

async function listKeyboxFiles(repo: RepoRef): Promise<TreeEntry[]> {
  // Refresh default branch (search results don't always include it reliably)
  const info = await gh<any>(`${API}/repos/${repo.fullName}`);
  if (info) {
    repo.defaultBranch = info.default_branch ?? repo.defaultBranch;
    repo.stars = info.stargazers_count ?? repo.stars;
    repo.forks = info.forks_count ?? repo.forks;
    repo.description = info.description ?? repo.description;
    repo.pushedAt = info.pushed_at ?? repo.pushedAt;
    repo.htmlUrl = info.html_url ?? repo.htmlUrl;
  }

  const tree = await gh<{ tree?: TreeEntry[]; truncated?: boolean }>(
    `${API}/repos/${repo.fullName}/git/trees/${encodeURIComponent(
      repo.defaultBranch
    )}?recursive=1`
  );

  if (!tree?.tree) return [];

  return tree.tree.filter(
    (entry) => entry.type === 'blob' && FILE_RE.test(entry.path)
  );
}

function encodePath(p: string): string {
  return p.split('/').map(encodeURIComponent).join('/');
}

async function lastCommitFor(
  repo: RepoRef,
  filePath: string,
  budget: { remaining: number }
): Promise<string> {
  if (budget.remaining <= 0) return repo.pushedAt;
  budget.remaining -= 1;

  const data = await gh<any[]>(
    `${API}/repos/${repo.fullName}/commits?path=${encodeURIComponent(
      filePath
    )}&per_page=1`
  );
  const iso = data?.[0]?.commit?.committer?.date;
  return iso ?? repo.pushedAt;
}

function safeLocalName(
  repoFullName: string,
  sha256: string,
  filePath: string
): string {
  const base = filePath.split('/').pop() ?? 'keybox.xml';
  const slug = repoFullName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const clean = base.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${slug}-${sha256.slice(0, 8)}-${clean}`;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const startedAt = Date.now();
  log(`starting — token ${TOKEN ? 'present' : 'MISSING'}`);

  await mkdir(KEYBOX_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  const defaultConfig: SourcesConfig = {
    seeds: [],
    search: {
      repositories: ['keybox in:name,description'],
      code: ['filename:keybox.xml'],
      maxSources: 20
    },
    limits: {
      maxFilesPerRepo: 40,
      maxTotalFiles: 600,
      maxCommitLookups: 400
    }
  };

  const config = await readJson<SourcesConfig>(SOURCES_PATH, defaultConfig);
  const limits = { ...defaultConfig.limits, ...(config.limits ?? {}) };
  const search = { ...defaultConfig.search, ...(config.search ?? {}) };
  config.seeds = config.seeds ?? [];
  config.search = search;
  config.limits = limits;

  const previousManifest = await readJson<Manifest>(MANIFEST_PATH, {
    generatedAt: new Date(0).toISOString(),
    keyboxes: []
  });
  const previousBySha = new Map(
    previousManifest.keyboxes.map((k) => [k.sha256, k])
  );

  log('discovering repositories…');
  const repos = await discoverRepos(config);
  log(`selected ${repos.length} repositories`);

  if (repos.length === 0) {
    warn('no repositories discovered — keeping existing manifest untouched');
    if (!existsSync(MANIFEST_PATH)) {
      await writeFile(
        MANIFEST_PATH,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), keyboxes: [] },
          null,
          2
        )
      );
    }
    return;
  }

  const commitBudget = { remaining: limits.maxCommitLookups };
  const seenSha = new Set<string>();
  const results: KeyboxMeta[] = [];
  const writtenFiles = new Set<string>();
  const now = new Date().toISOString();

  for (const repo of repos) {
    if (results.length >= limits.maxTotalFiles) {
      log('reached maxTotalFiles — stopping');
      break;
    }

    log(`→ ${repo.fullName} (★${repo.stars})`);
    const files = await listKeyboxFiles(repo);

    if (files.length === 0) {
      log(`  no keybox files`);
      continue;
    }

    const slice = files.slice(0, limits.maxFilesPerRepo);
    log(`  found ${files.length} file(s), processing ${slice.length}`);

    for (const entry of slice) {
      if (results.length >= limits.maxTotalFiles) break;

      const rawUrl = `https://raw.githubusercontent.com/${repo.fullName}/${repo.defaultBranch}/${encodePath(
        entry.path
      )}`;

      const xml = await rawText(rawUrl);
      if (!xml || xml.trim().length === 0) {
        warn(`  could not download ${entry.path}`);
        continue;
      }

      if (!looksLikeKeybox(xml)) {
        // Not a real keybox — skip to keep the index clean.
        continue;
      }

      const sha256 = createHash('sha256').update(xml, 'utf-8').digest('hex');
      const size = Buffer.byteLength(xml, 'utf-8');
      const id = sha256.slice(0, 12);

      if (seenSha.has(sha256)) {
        continue;
      }
      seenSha.add(sha256);

      const localName = safeLocalName(repo.fullName, sha256, entry.path);
      const localPath = `/keyboxes/${localName}`;

      await writeFile(path.join(KEYBOX_DIR, localName), xml, 'utf-8');
      writtenFiles.add(localName);

      const prior = previousBySha.get(sha256);
      const lastCommit = prior
        ? prior.lastCommit
        : await lastCommitFor(repo, entry.path, commitBudget);

      results.push({
        id,
        filename: entry.path.split('/').pop() ?? 'keybox.xml',
        path: entry.path,
        sourceRepo: repo.fullName,
        sourceUrl: `https://github.com/${repo.fullName}/blob/${repo.defaultBranch}/${encodePath(
          entry.path
        )}`,
        rawUrl,
        localPath,
        sha256,
        size,
        lastCommit,
        discoveredAt: prior?.discoveredAt ?? now,
        verified: isStructurallyVerified(xml),
        xmlValid: isBalancedXml(xml)
      });
    }

    await sleep(400); // be polite
  }

  // Prune files that are no longer referenced
  try {
    const onDisk = await readdir(KEYBOX_DIR);
    let removed = 0;
    for (const f of onDisk) {
      if (!f.endsWith('.xml')) continue;
      if (!writtenFiles.has(f)) {
        await unlink(path.join(KEYBOX_DIR, f));
        removed++;
      }
    }
    if (removed > 0) log(`pruned ${removed} stale file(s)`);
  } catch (err) {
    warn(`prune step failed: ${(err as Error).message}`);
  }

  // Sort: verified first, then newest commit, then repo name
  results.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const d =
      new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime();
    if (d !== 0) return d;
    return a.sourceRepo.localeCompare(b.sourceRepo);
  });

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    keyboxes: results
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  log(
    `done — ${results.length} keybox(es) from ${repos.length} repo(s) in ${Math.round(
      (Date.now() - startedAt) / 1000
    )}s`
  );
}

main().catch(async (err) => {
  console.error('[fetch] fatal:', err);
  // Never break the build because of a network hiccup.
  try {
    await mkdir(DATA_DIR, { recursive: true });
    if (!existsSync(MANIFEST_PATH)) {
      await writeFile(
        MANIFEST_PATH,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), keyboxes: [] },
          null,
          2
        )
      );
    }
  } catch {
    /* ignore */
  }
  process.exit(0);
});
