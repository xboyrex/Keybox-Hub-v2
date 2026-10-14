#!/usr/bin/env tsx
/**
 * Keybox Hub — Live Source Aggregator
 * Fetches keyboxes from Yuri, MeowDump, Tricky Addon sources,
 * decodes them, and stores locally.
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

// ─── Source: YuriKey ────────────────────────────────────────
async function fetchYuriKey() {
  const res = await fetchWithRetry(
    'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key'
  );
  const raw = await res.text();
  const decoded = b64(raw);
  const xml = decoded.toString('utf-8');
  if (!looksLikeXml(xml)) throw new Error('YuriKey: not a valid keybox');
  return {
    name: 'YuriKey',
    xml,
    repo: 'Yurii0307/yurikey',
    sourceUrl: 'https://github.com/Yurii0307/yurikey',
    rawUrl: 'https://raw.githubusercontent.com/Yurii0307/yurikey/main/key',
  };
}

// ─── Source: MeowDump ───────────────────────────────────────
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

  // hex decode
  buf = hexBuf(buf);
  // rot13
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

// ─── Source: Tricky Addon ───────────────────────────────────
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

  // Fallback: API
  console.log('[Tricky Addon] trying API fallback…');
  const apiRes = await fetchWithRetry('https://keybox.kowx712.cc/api/keyboxes');
  const data = (await apiRes.json()) as any[];
  const list = Array.isArray(data) ? data : (data as any).keyboxes ?? [];
  const valid = list.find((k: any) => (k.valid ?? k.status) !== 'invalid');
  if (!valid) throw new Error('Tricky Addon API: no valid keybox');

  const id = valid.id ?? valid.sha256 ?? valid.name;
  const kbRes = await fetchWithRetry(
    `https://keybox.kowx712.cc/api/keyboxes/${encodeURIComponent(id)}/download`
  );
  const xml = await kbRes.text();
  if (!looksLikeXml(xml)) throw new Error('Tricky Addon API: not a valid keybox');
  return {
    name: 'Tricky Addon (API)',
    xml,
    repo: 'KOWX712/Tricky-Addon-Update-Target-List',
    sourceUrl: 'https://keybox.kowx712.cc',
    rawUrl: 'https://keybox.kowx712.cc/api/keyboxes',
  };
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

  const fetchers = [
    { key: 'yuri', fn: fetchYuriKey },
    { key: 'meow', fn: fetchMeowDump },
    { key: 'tricky', fn: fetchTrickyAddon },
  ];

  const records: LiveRecord[] = [];

  for (const f of fetchers) {
    try {
      console.log(`📡 Fetching ${f.key}…`);
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
