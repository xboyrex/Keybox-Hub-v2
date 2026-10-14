import type { Metadata } from 'next';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { getIndex } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { REFRESH_INTERVAL_HOURS } from '@/lib/constants';
import { formatBytes, formatDateTime, timeAgo } from '@/lib/utils';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Status',
  description: 'Live index status for Keybox Hub — totals, hashes, sizes.'
};

export default function ApiStatusPage() {
  const { keyboxes, sources, generatedAt, totalKeyboxes, totalSources } =
    getIndex();

  const totalBytes = keyboxes.reduce((sum, k) => sum + (k.size || 0), 0);
  const verifiedCount = keyboxes.filter((k) => k.verified).length;
  const uniqueHashes = new Set(keyboxes.map((k) => k.sha256)).size;
  const duplicateCount = keyboxes.length - uniqueHashes;

  const ageMs = Date.now() - new Date(generatedAt).getTime();
  const staleAfter = REFRESH_INTERVAL_HOURS * 2 * 3600 * 1000;
  const healthy = Number.isFinite(ageMs) && ageMs < staleAfter;

  const cards = [
    {
      icon: Database,
      label: 'Total keyboxes',
      value: totalKeyboxes.toLocaleString()
    },
    {
      icon: GitBranch,
      label: 'Source repositories',
      value: totalSources.toLocaleString()
    },
    {
      icon: HardDrive,
      label: 'Total payload',
      value: formatBytes(totalBytes)
    },
    {
      icon: Activity,
      label: 'Unique SHA-256',
      value: uniqueHashes.toLocaleString()
    },
    {
      icon: CheckCircle2,
      label: 'Structurally verified',
      value: `${verifiedCount.toLocaleString()} / ${totalKeyboxes.toLocaleString()}`
    },
    {
      icon: RefreshCw,
      label: 'Duplicate contents',
      value: duplicateCount.toLocaleString()
    }
  ];

  return (
    <main className="container py-10 sm:py-14">
      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Index status
          </h1>
          <Badge variant={healthy ? 'success' : 'warning'}>
            <span
              className={
                healthy
                  ? 'h-1.5 w-1.5 rounded-full bg-ok-500 animate-pulse-dot'
                  : 'h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-dot'
              }
            />
            {healthy ? 'healthy' : 'stale'}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated {formatDateTime(generatedAt)} · {timeAgo(generatedAt)}
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="kh-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="h-3.5 w-3.5 text-brand" />
              <span className="text-[11px] font-medium uppercase tracking-wider">
                {c.label}
              </span>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums">
              {c.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 kh-card p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-brand" />
          Update pipeline
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          {[
            'GitHub Actions cron fires every 6 hours (0 */6 * * *).',
            'scripts/fetch-keyboxes.ts queries the GitHub Search API for repositories and code.',
            'Matching keybox XML files are downloaded and hashed with SHA-256.',
            'public/keyboxes/*.xml and public/data/manifest.json are refreshed.',
            'scripts/generate-index.ts rebuilds public/data/index.json.',
            'Changes are committed and Cloudflare Pages rebuilds the static site.'
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 kh-card p-6">
        <h2 className="text-base font-semibold">Source coverage</h2>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No sources indexed yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {sources.map((s) => (
              <li
                key={s.repo}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-xs"
              >
                <span className="truncate font-mono text-muted-foreground">
                  {s.repo}
                </span>
                <Badge variant="mono">{s.keyboxCount}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
