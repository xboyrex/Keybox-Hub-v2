import fs from 'node:fs';
import path from 'node:path';
import type { KeyboxIndex } from './types';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const INDEX_PATH = path.join(PUBLIC_DIR, 'data', 'index.json');

const EMPTY: KeyboxIndex = {
  generatedAt: new Date(0).toISOString(),
  totalKeyboxes: 0,
  totalSources: 0,
  keyboxes: [],
  sources: []
};

let cache: KeyboxIndex | null = null;

/** Read the generated index at build time. Never runs on the client. */
export function getIndex(): KeyboxIndex {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as KeyboxIndex;
    cache = {
      generatedAt: parsed.generatedAt ?? EMPTY.generatedAt,
      totalKeyboxes: parsed.totalKeyboxes ?? parsed.keyboxes?.length ?? 0,
      totalSources: parsed.totalSources ?? parsed.sources?.length ?? 0,
      keyboxes: Array.isArray(parsed.keyboxes) ? parsed.keyboxes : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : []
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

/** Read the raw XML for a keybox given its local path (`/keyboxes/x.xml`). */
export function getKeyboxXml(localPath: string): string | null {
  try {
    const rel = localPath.replace(/^\//, '');
    const abs = path.join(PUBLIC_DIR, rel);
    // Guard against traversal
    if (!abs.startsWith(PUBLIC_DIR)) return null;
    return fs.readFileSync(abs, 'utf-8');
  } catch {
    return null;
  }
}
