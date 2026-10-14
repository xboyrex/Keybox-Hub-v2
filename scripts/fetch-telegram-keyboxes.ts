#!/usr/bin/env tsx
/**
 * Keybox Hub — Telegram + Live Source Aggregator
 * Fetches keyboxes from:
 *   - Yuri Telegram channel (t.me/yuriiroot)
 *   - Yuri GitHub (Yurii0307/yurikey)
 *   - MeowDump (MeowDump/MeowDump)
 *   - Tricky Addon (KOWX712)
 *   - Total Keybox API (keybox.kowx712.cc)
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const KEYBOX_DIR = path.join(PUBLIC_DIR, 'keyboxes');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const LIVE_INDEX = path.join(DATA_DIR, 'live-sources.json');

// ─── HTTP with retries ──────────────────────────────────────
async function fetchWithRetry(url: string, retries = 3, timeoutMs = 20000): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KeyboxHub/1.0)',
          Accept: '*/*',
        },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e as Error;
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw lastErr ?? new Error(`Failed to fetch ${url}`);
}

// ─── Decoders ───────────────────────────────────────────────
function b64(s: string): Buffer {
  const cleaned = s.replace(/\s+/g, '');
  return Buffer.from(cleaned, 'base64');
}
function hexBuf(buf: Buffer): Buffer {
  const s = buf.toString('utf-8').trim().replace(/[^0-9a-fA-F]/g, '');
  if (s.length % 2 !== 0) throw new Error('odd hex length');
  return Buffer.from(s, 'hex');
}
function rot13(buf: Buffer): Buffer {
  const s = buf.toString('utf-8');
  const out = s.replace(/[A-Za-z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  return Buffer.from(out, 'utf-8');
}
function looksLikeXml(s: string): boolean {
  return /<Keybox[\s>]/i.test(s) && /<Key[\s>]/i.test(s);
}

// ─── Source 1: Yuri Telegram (t.me/yuriiroot) ────────────────
async function fetchYuriTelegram() {
  console.log('📡 Scraping Yuri Telegram channel...');
  const res = await fetchWithRetry('https://t.me/s/yuriiroot');
  const html = await res.text();

  // Find all .xml file links in the HTML
  const xmlLinks: string[] = [];
  const regex = /href="(https?:\/\/[^"]*\.xml[^"]*)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    xmlLinks.push(match[1]);
  }

  // Also look for t.me links to files
  const tmeRegex = /href="(https?:\/\/t\.me\/[^"]*\/(\d+))"/gi;
  while ((match = tmeRegex.exec(html)) !== null) {
    // Try to resolve the actual file
    try {
      const fileRes = await fetchWithRetry(match[1]);
      const fileHtml = await fileRes.text();
      const innerRegex = /href="(https?:\/\/[^"]*\.xml[^"]*)"/gi;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(fileHtml)) !== null) {
        xmlLinks.push(innerMatch[1]);
      }
    } catch (e) {
      // Skip if can't resolve
    }
  }

  if (xmlLinks.length === 0) {
    // Fallback: try known Yuri archives
    console.log('⚠️ No direct XML found, trying archives...');
    return fetchYuriGitHub();
  }

  // Download the most recent XML
  const latestUrl = xmlLinks[xmlLinks.length - 1];
  console.log(`📥 Downloading: ${latestUrl}`);
  const xmlRes = await fetchWithRetry(latestUrl);
  const xml = await xmlRes.text();

  if (!looksLikeXml(xml)) {
    throw new Error('Yuri Telegram: not a valid keybox');
  }

  return {
    name: 'YuriKey (Telegram)',
    xml,
    repo: 'Yurii0307/yurikey',
    sourceUrl: 'https://t.me/yuriiroot',
    rawUrl: latestUrl,
  };
}

// ─── Source 2: Yuri GitHub ──────────────────────────────────
async function fetchYuriGitHub() {
  const res = await fetchWithRetry(
    'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key'
  );
  const raw = await res.text();
  const decoded = b64(raw);
  const xml = decoded.toString('utf-8');
  if (!looksLikeXml(xml)) throw new Error('YuriKey: not a valid keybox');
  return {
    name: 'YuriKey (GitHub)',
    xml,
    repo: 'Yurii0307/yurikey',
    sourceUrl: 'https://github.com/Yurii0307/yurikey',
    rawUrl: 'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key',
  };
}

// ─── Source 3: MeowDump ─────────────────────────────────────
async function fetchMeowDump() {
  const res = await fetchWithRetry(
    'https://raw.githubusercontent.com/MeowDump/MeowDump/main/Megatron'
  );
  let buf = Buffer.from(await res.arrayBuffer());

  // 10x base64 unwrap
  for (let i = 0; i < 10; i++) {
    const s = buf.toString('utf-8').trim();
    if (!/^[A-Za-z0-9+/=\s]+$/.test(s)) break;
    try {
      buf = b64(s);
    } catch {
      break;
    }
  }

  buf = hexBuf(buf);
  buf = rot13(buf);

  const xml = buf.toString('utf-8');
  if (!looksLikeXml(xml)) throw new Error('MeowDump: not a valid keybox');
  return {
    name: 'MeowDump',
    xml,
    repo: 'MeowDump/MeowDump',
    sourceUrl: 'https://github.com/MeowDump/MeowDump',
    rawUrl: 'https://raw.githubusercontent.com/MeowDump/MeowDump/main/Megatron',
  };
}

// ─── Source 4: Tricky Addon ─────────────────────────────────
async function fetchTrickyAddon() {
  // Primary: .extra file
  try {
    const res = await fetchWithRetry(
      'https://raw.githubusercontent.com/KOWX712/Tricky-Addon-Update-Target-List/keybox/.extra'
    );
    const raw = Buffer.from(await res.arrayBuffer());
    if (raw.length > 16) {
      const hexDecoded = hexBuf(raw);
      const base64Decoded = b64(hexDecoded.toString('utf-8'));
      const xml = base64Decoded.toString('utf-8');
      if (looksLikeXml(xml)) {
        return {
          name: 'Tricky Addon',
          xml,
          repo: 'KOWX712/Tricky-Addon-Update-Target-List',
          sourceUrl: 'https://github.com/KOWX712/Tricky-Addon-Update-Target-List',
          rawUrl: 'https://raw.githubusercontent.com/KOWX712/Tricky-Addon-Update-Target-List/keybox/.extra',
        };
      }
    }
  } catch (e) {
    console.warn(`[Tricky Addon] .extra failed: ${(e as Error).message}`);
  }

  // Fallback: API - find latest valid hardware keybox
  console.log('[Tricky Addon] trying API fallback…');
  const apiRes = await fetchWithRetry('https://keybox.kowx712.cc/api/keyboxes');
  const data = (await apiRes.json()) as any;
  const list = data.keyboxes ?? [];
  const valid = list
    .filter((k: any) => k.status === 'valid' && k.root_type === 'hardware')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!valid) throw new Error('Tricky Addon API: no valid keybox');

  // Try to find the actual download URL
  const downloadUrl = `https://keybox.kowx712.cc/api/keyboxes/${valid.id}/download`;
  try {
    const kbRes = await fetchWithRetry(downloadUrl);
    const xml = await kbRes.text();
    if (looksLikeXml(xml)) {
      return {
        name: 'Tricky Addon (API)',
        xml,
        repo: 'KOWX712/Tricky-Addon-Update-Target-List',
        sourceUrl: 'https://keybox.kowx712.cc',
        rawUrl: downloadUrl,
      };
    }
  } catch (e) {
    console.warn(`[Tricky Addon] download failed: ${(e as Error).message}`);
  }

  // Fallback: use the raw data from API if it contains XML
  if (valid.xml) {
    return {
      name: 'Tricky Addon (API)',
      xml: valid.xml,
      repo: 'KOWX712/Tricky-Addon-Update-Target-List',
      sourceUrl: 'https://keybox.kowx712.cc',
      rawUrl: 'https://keybox.kowx712.cc/api/keyboxes',
    };
  }

  throw new Error('Tricky Addon: could not extract keybox');
}

// ─── Main ───────────────────────────────────────────────────
interface LiveRecord {
  id: string;
  name: string;
  filename: string;
  localPath: string;
  sha256: string;
  size: number;
  sourceRepo: string;
  sourceUrl: string;
  rawUrl: string;
  downloadedAt: string;
  verified: boolean;
}

async function main() {
  await mkdir(KEYBOX_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  // Delete old live keyboxes to keep only latest
  try {
    const fs = await import('node:fs/promises');
    const existing = await fs.readdir(KEYBOX_DIR);
    for (const f of existing) {
      if (f.includes('yurikey-') || f.includes('meow-') || f.includes('tricky-')) {
        await fs.unlink(path.join(KEYBOX_DIR, f));
      }
    }
  } catch (e) {
    // Ignore
  }

  const fetchers = [
    { key: 'yuri-telegram', fn: fetchYuriTelegram },
    { key: 'yuri-github', fn: fetchYuriGitHub },
    { key: 'meow', fn: fetchMeowDump },
    { key: 'tricky', fn: fetchTrickyAddon },
  ];

  const records: LiveRecord[] = [];

  for (const f of fetchers) {
    try {
      console.log(`\n📡 Fetching ${f.key}…`);
      const r = await f.fn();
      const sha256 = createHash('sha256').update(r.xml, 'utf-8').digest('hex');
      const id = sha256.slice(0, 12);
      const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `${slug}-${id}.xml`;
      const localPath = `/keyboxes/${filename}`;

      await writeFile(path.join(KEYBOX_DIR, filename), r.xml, 'utf-8');

      records.push({
        id,
        name: r.name,
        filename,
        localPath,
        sha256,
        size: Buffer.byteLength(r.xml, 'utf-8'),
        sourceRepo: r.repo,
        sourceUrl: r.sourceUrl,
        rawUrl: r.rawUrl,
        downloadedAt: new Date().toISOString(),
        verified: looksLikeXml(r.xml),
      });

      console.log(`✅ ${r.name}: ${r.xml.length} bytes, sha256=${id}`);
    } catch (e) {
      console.error(`❌ ${f.key} failed: ${(e as Error).message}`);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    totalSources: records.length,
    sources: records,
  };

  await writeFile(LIVE_INDEX, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n🎉 Aggregated ${records.length} live keyboxes → ${LIVE_INDEX}`);
}

main().catch((e) => {
  console.error('[fetch-live] fatal:', e);
  process.exit(0);
});
