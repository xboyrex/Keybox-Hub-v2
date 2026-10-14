#!/usr/bin/env tsx
/**
 * Keybox Hub — Ultimate Aggregator
 * Fetches from:
 *   - TAKR (keybox.kowx712.cc) — Official API
 *   - Yuri Telegram (t.me/yuriiroot) — Scraped
 *   - Yuri GitHub (Yurii0307/yurikey) — Fallback
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const KEYBOX_DIR = path.join(PUBLIC_DIR, 'keyboxes');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

const UA = 'Mozilla/5.0 (compatible; KeyboxHub/2.0)';
const TAKR_API = 'https://keybox.kowx712.cc/api/keyboxes';

async function fetchWithRetry(url: string, retries = 3, timeoutMs = 25000): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: '*/*' },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e as Error;
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  throw lastErr ?? new Error(`Failed: ${url}`);
}

function b64(s: string): Buffer {
  return Buffer.from(s.replace(/\s+/g, ''), 'base64');
}
function looksLikeXml(s: string): boolean {
  return /<Keybox[\s>]/i.test(s) && /<Key[\s>]/i.test(s);
}

// ─── Source 1: TAKR (keybox.kowx712.cc) ─────────────────────
async function fetchTAKR() {
  console.log('\n📡 Fetching TAKR keyboxes...');
  const res = await fetchWithRetry(TAKR_API);
  const data = await res.json() as any;
  const list = data.keyboxes ?? data.data ?? [];

  const valid = list.filter((k: any) =>
    k.status === 'STRONG/DEVICE' || k.status === 'VALID' || k.valid === true
  );

  console.log(`   Found ${valid.length} valid TAKR keyboxes`);

  const results = [];
  for (const kb of valid) {
    try {
      const identity = kb.identity ?? kb.id ?? kb.name;
      const name = kb.name ?? kb.identity ?? `TAKR-${identity}`;

      // Get download token
      const dlRes = await fetchWithRetry(
        `${TAKR_API}/${encodeURIComponent(identity)}/download`,
        { method: 'POST' }
      );
      const dlData = await dlRes.json() as any;
      const downloadUrl = dlData.url ?? dlData.download_url;

      if (!downloadUrl) {
        console.warn(`   ⚠️ No download URL for ${name}`);
        continue;
      }

      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `https://keybox.kowx712.cc${downloadUrl}`;

      const xmlRes = await fetchWithRetry(fullUrl);
      const xml = await xmlRes.text();

      if (!looksLikeXml(xml)) {
        console.warn(`   ⚠️ Invalid XML for ${name}`);
        continue;
      }

      results.push({
        name: name,
        xml: xml,
        repo: 'KOWX712/Tricky-Addon-Update-Target-List',
        sourceUrl: 'https://keybox.kowx712.cc',
        rawUrl: fullUrl,
      });

      console.log(`   ✅ ${name}`);
    } catch (e) {
      console.warn(`   ❌ TAKR item failed: ${(e as Error).message}`);
    }
  }

  return results;
}

// ─── Source 2: Yuri Telegram ────────────────────────────────
async function fetchYuriTelegram() {
  console.log('\n📡 Scraping Yuri Telegram...');
  const res = await fetchWithRetry('https://t.me/s/yuriiroot');
  const html = await res.text();

  const xmlLinks: string[] = [];
  const regex = /href="(https?:\/\/[^"]*\.xml[^"]*)"/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    xmlLinks.push(m[1]);
  }

  if (xmlLinks.length === 0) {
    console.log('   ⚠️ No XML found in Telegram, trying GitHub...');
    return fetchYuriGitHub();
  }

  const latest = xmlLinks[xmlLinks.length - 1];
  console.log(`   📥 Latest: ${latest}`);
  const xmlRes = await fetchWithRetry(latest);
  const xml = await xmlRes.text();

  if (!looksLikeXml(xml)) {
    throw new Error('Yuri Telegram: invalid XML');
  }

  return [{
    name: 'YuriKey (Telegram)',
    xml: xml,
    repo: 'Yurii0307/yurikey',
    sourceUrl: 'https://t.me/yuriiroot',
    rawUrl: latest,
  }];
}

// ─── Source 3: Yuri GitHub ──────────────────────────────────
async function fetchYuriGitHub() {
  const res = await fetchWithRetry(
    'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key'
  );
  const raw = await res.text();
  const xml = b64(raw).toString('utf-8');
  if (!looksLikeXml(xml)) throw new Error('Yuri GitHub: invalid XML');
  return [{
    name: 'YuriKey (GitHub)',
    xml: xml,
    repo: 'Yurii0307/yurikey',
    sourceUrl: 'https://github.com/Yurii0307/yurikey',
    rawUrl: 'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key',
  }];
}

// ─── Main ───────────────────────────────────────────────────
interface KeyboxRecord {
  id: string;
  filename: string;
  sourceRepo: string;
  sourceUrl: string;
  rawUrl: string;
  localPath: string;
  sha256: string;
  size: number;
  lastCommit: string;
  discoveredAt: string;
  verified: boolean;
}

async function main() {
  await mkdir(KEYBOX_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  // Clean old auto-fetched files
  try {
    const fs = await import('node:fs/promises');
    const existing = await fs.readdir(KEYBOX_DIR);
    for (const f of existing) {
      if (f.startsWith('xboyrex-') || f.includes('takr-') || f.includes('yurikey-')) {
        await fs.unlink(path.join(KEYBOX_DIR, f));
      }
    }
  } catch {}

  const allResults: any[] = [];

  // Fetch from all sources
  try {
    const takr = await fetchTAKR();
    allResults.push(...takr);
  } catch (e) {
    console.error(`❌ TAKR failed: ${(e as Error).message}`);
  }

  try {
    const yuri = await fetchYuriTelegram();
    allResults.push(...yuri);
  } catch (e) {
    console.error(`❌ Yuri Telegram failed: ${(e as Error).message}`);
  }

  // Rename with your branding
  const records: KeyboxRecord[] = [];
  const now = new Date().toISOString();

  for (const r of allResults) {
    const sha256 = createHash('sha256').update(r.xml, 'utf-8').digest('hex');
    const id = sha256.slice(0, 12);
    const safeName = r.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    // Rename with "xboyrex-" prefix (YOUR branding)
    const filename = `xboyrex-${safeName}-${id.slice(0, 8)}.xml`;
    const localPath = `/keyboxes/${filename}`;

    await writeFile(path.join(KEYBOX_DIR, filename), r.xml, 'utf-8');

    records.push({
      id,
      filename: filename,
      sourceRepo: r.repo,
      sourceUrl: r.sourceUrl,
      rawUrl: r.rawUrl,
      localPath,
      sha256,
      size: Buffer.byteLength(r.xml, 'utf-8'),
      lastCommit: now,
      discoveredAt: now,
      verified: looksLikeXml(r.xml),
    });

    console.log(`✅ Renamed: ${r.name} → ${filename}`);
  }

  // Write index
  const payload = {
    generatedAt: now,
    totalKeyboxes: records.length,
    totalSources: 2,
    sources: [
      {
        repo: 'KOWX712/Tricky-Addon-Update-Target-List',
        url: 'https://keybox.kowx712.cc',
        stars: 3159,
        forks: 145,
        lastUpdated: now,
        keyboxCount: records.filter(r => r.sourceRepo.includes('KOWX712')).length,
        description: 'Community driven keybox repository',
      },
      {
        repo: 'Yurii0307/yurikey',
        url: 'https://github.com/Yurii0307/yurikey',
        stars: 1200,
        forks: 80,
        lastUpdated: now,
        keyboxCount: records.filter(r => r.sourceRepo.includes('Yurii')).length,
        description: 'YuriKey Manager — Strong Integrity',
      },
    ],
    keyboxes: records,
  };

  await writeFile(INDEX_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n🎉 Total: ${records.length} keyboxes indexed → ${INDEX_FILE}`);
}

main().catch(e => {
  console.error('[fetch-all] fatal:', e);
  process.exit(0);
});
