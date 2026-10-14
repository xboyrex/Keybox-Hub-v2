#!/usr/bin/env tsx
/**
 * Keybox Hub — index builder
 * --------------------------
 * Reads public/data/manifest.json (produced by fetch-keyboxes.ts),
 * re-verifies every file on disk, aggregates source-repository stats,
 * and writes public/data/index.json — the single artifact the static
 * Next.js site reads at build time.
 */

import { createHash } from 'node:crypto';
import {
  readFile,
  writeFile,
  readdir,
  stat,
  mkdir,
  unlink
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const KEYBOX_DIR = path.join(PUBLIC_DIR, 'keyboxes');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const SOURCES_PATH = path.join(ROOT, 'scripts', 'sources.json');

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

interface SourceRepo {
  repo: string;
  url: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  keyboxCount: number;
  description: string | null;
}

interface KeyboxIndex {
  generatedAt: string;
  totalKeyboxes: number;
  totalSources: number;
  keyboxes: KeyboxMeta[];
  sources: SourceRepo[];
}

interface Manifest {
  generatedAt: string;
  keyboxes: KeyboxMeta[];
}

interface RepoMetaCache {
  [repo: string]: {
    stars: number;
    forks: number;
    pushedAt: string;
    description: string | null;
    htmlUrl: string;
  };
}

const log = (m: string) => console.log(`[index] ${m}`);
const warn = (m: string) => console.warn(`[index] ⚠ ${m}`);

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

async function sha256Of(file: string): Promise<string> {
  const buf = await readFile(file);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Resolve repo-level metadata. We reuse anything already present in
 * public/data/repos.json (written opportunistically by the fetcher or
 * by a previous run) and fall back to the GitHub API when a token is
 * available. Missing metadata never blocks the build.
 */
async function resolveRepoMeta(
  repos: string[],
  token: string
): Promise<RepoMetaCache> {
  const cachePath = path.join(DATA_DIR, 'repos.json');
  const cache = await readJson<RepoMetaCache>(cachePath, {});
  const missing = repos.filter((r) => !cache[r]);

  if (missing.length === 0 || !token) {
    return cache;
  }

  for (const repo of missing) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'keybox-hub-indexer',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) continue;
      const data: any = await res.json();
      cache[repo] = {
        stars: data.stargazers_count ?? 0,
        forks: data.forks_count ?? 0,
        pushedAt: data.pushed_at ?? new Date().toISOString(),
        description: data.description ?? null,
        htmlUrl: data.html_url ?? `https://github.com/${repo}`
      };
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    /* ignore */
  }

  return cache;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const manifest = await readJson<Manifest>(MANIFEST_PATH, {
    generatedAt: new Date(0).toISOString(),
    keyboxes: []
  });

  log(`manifest has ${manifest.keyboxes.length} entr(ies)`);

  // ── Re-verify every file on disk ──────────────────────────
  const verified: KeyboxMeta[] = [];
  let mismatches = 0;
  let missing = 0;

  for (const kb of manifest.keyboxes) {
    const rel = kb.localPath.replace(/^\//, '');
    const abs = path.join(PUBLIC_DIR, rel);

    if (!abs.startsWith(PUBLIC_DIR) || !existsSync(abs)) {
      missing++;
      continue;
    }

    try {
      const info = await stat(abs);
      const hash = await sha256Of(abs);

      if (hash !== kb.sha256) {
        mismatches++;
        warn(`hash mismatch for ${kb.localPath} — dropping`);
        continue;
      }

      verified.push({
        ...kb,
        size: info.size,
        id: kb.id || hash.slice(0, 12)
      });
    } catch (err) {
      warn(`could not read ${kb.localPath}: ${(err as Error).message}`);
    }
  }

  if (missing > 0) log(`skipped ${missing} missing file(s)`);
  if (mismatches > 0) log(`dropped ${mismatches} mismatched file(s)`);

  // ── Remove orphaned .xml files not in the manifest ────────
  try {
    const referenced = new Set(
      verified.map((k) => k.localPath.replace('/keyboxes/', ''))
    );
    const onDisk = await readdir(KEYBOX_DIR);
    let orphans = 0;
    for (const f of onDisk) {
      if (!f.endsWith('.xml')) continue;
      if (!referenced.has(f)) {
        await unlink(path.join(KEYBOX_DIR, f));
        orphans++;
      }
    }
    if (orphans > 0) log(`removed ${orphans} orphan file(s)`);
  } catch {
    /* directory may not exist yet */
  }

  // ── Aggregate sources ─────────────────────────────────────
  const counts = new Map<string, number>();
  for (const kb of verified) {
    counts.set(kb.sourceRepo, (counts.get(kb.sourceRepo) ?? 0) + 1);
  }

  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';
  const repoMeta = await resolveRepoMeta([...counts.keys()], token);

  const sources: SourceRepo[] = [...counts.entries()]
    .map(([repo, keyboxCount]) => {
      const meta = repoMeta[repo];
      return {
        repo,
        url: meta?.htmlUrl ?? `https://github.com/${repo}`,
        stars: meta?.stars ?? 0,
        forks: meta?.forks ?? 0,
        lastUpdated:
          meta?.pushedAt ??
          verified
            .filter((k) => k.sourceRepo === repo)
            .map((k) => k.lastCommit)
            .sort()
            .reverse()[0] ??
          manifest.generatedAt,
        keyboxCount,
        description: meta?.description ?? null
      };
    })
    .sort((a, b) => {
      if (b.keyboxCount !== a.keyboxCount) return b.keyboxCount - a.keyboxCount;
      return b.stars - a.stars;
    });

  // ── Final ordering ────────────────────────────────────────
  verified.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const d =
      new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime();
    if (d !== 0) return d;
    return a.sourceRepo.localeCompare(b.sourceRepo);
  });

  const index: KeyboxIndex = {
    generatedAt: new Date().toISOString(),
    totalKeyboxes: verified.length,
    totalSources: sources.length,
    keyboxes: verified,
    sources
  };

  await writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');

  log(
    `wrote index.json — ${index.totalKeyboxes} keybox(es) across ${index.totalSources} source(s)`
  );
}

main().catch(async (err) => {
  console.error('[index] fatal:', err);
  // Guarantee the build has *something* to read.
  try {
    await mkdir(DATA_DIR, { recursive: true });
    if (!existsSync(INDEX_PATH)) {
      const empty: KeyboxIndex = {
        generatedAt: new Date().toISOString(),
        totalKeyboxes: 0,
        totalSources: 0,
        keyboxes: [],
        sources: []
      };
      await writeFile(INDEX_PATH, JSON.stringify(empty, null, 2), 'utf-8');
    }
  } catch {
    /* ignore */
  }
  process.exit(0);
});
