import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 4521 -> "4.4 KB" */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** Short sha for display: 9f2c1a4b3e0d */
export function shortSha(sha: string, len = 12): string {
  return sha.slice(0, len);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return '—';
  const diff = Date.now() - d;
  if (diff < 0) return 'just now';

  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function isWithin(iso: string, windowMs: number): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= windowMs;
}

/** Escape a string for safe insertion into HTML text nodes. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tiny zero-dependency XML highlighter.
 * Tokenizes on the raw string first, then escapes each captured group —
 * this avoids the classic "highlight the highlight" bug.
 */
export function highlightXml(xml: string): string {
  const TAG =
    /(<!--[\s\S]*?-->)|(<\?[\s\S]*?\?>)|(<!\[CDATA\[[\s\S]*?\]\]>)|(<\/?)([A-Za-z_][\w:.\-]*)((?:\s+[A-Za-z_][\w:.\-]*\s*=\s*"[^"]*")*)(\s*\/?>)/g;

  const attrs = (raw: string): string =>
    raw.replace(
      /(\s+)([A-Za-z_][\w:.\-]*)(\s*=\s*)("[^"]*")/g,
      (_m, sp, name, eq, val) =>
        `${sp}<span class="text-amber-300">${escapeHtml(name)}</span>${escapeHtml(
          eq
        )}<span class="text-emerald-400">${escapeHtml(val)}</span>`
    );

  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = TAG.exec(xml)) !== null) {
    out += escapeHtml(xml.slice(last, m.index));

    if (m[1]) {
      out += `<span class="text-muted-foreground italic">${escapeHtml(m[1])}</span>`;
    } else if (m[2]) {
      out += `<span class="text-fuchsia-400">${escapeHtml(m[2])}</span>`;
    } else if (m[3]) {
      out += `<span class="text-muted-foreground">${escapeHtml(m[3])}</span>`;
    } else {
      out += `<span class="text-slate-500">${escapeHtml(m[4])}</span>`;
      out += `<span class="text-brand">${escapeHtml(m[5])}</span>`;
      out += attrs(m[6] ?? '');
      out += `<span class="text-slate-500">${escapeHtml(m[7] ?? '')}</span>`;
    }

    last = m.index + m[0].length;
  }

  out += escapeHtml(xml.slice(last));
  return out;
}

/** Deterministic id from sha256. */
export function idFromSha(sha256: string): string {
  return sha256.slice(0, 12);
}

/** Safe filename for the local public/keyboxes directory. */
export function safeLocalName(
  repo: string,
  sha256: string,
  filePath: string
): string {
  const base = filePath.split('/').pop() ?? 'keybox.xml';
  const slug = repo.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const clean = base.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${slug}-${sha256.slice(0, 8)}-${clean}`;
}

/** GitHub blob url for a file. */
export function githubBlobUrl(repo: string, branch: string, path: string) {
  return `https://github.com/${repo}/blob/${branch}/${path}`;
}

/** GitHub raw url for a file. */
export function githubRawUrl(repo: string, branch: string, path: string) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${repo}/${branch}/${encoded}`;
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
