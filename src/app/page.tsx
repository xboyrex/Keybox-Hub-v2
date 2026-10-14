import { getIndex } from '@/lib/data';
import { StatsBar } from '@/components/StatsBar';
import { KeyboxExplorer } from '@/components/KeyboxExplorer';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { SITE_TAGLINE } from '@/lib/constants';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-static';

export default function HomePage() {
  const { keyboxes, sources, totalKeyboxes, totalSources, generatedAt } =
    getIndex();

  return (
    <main className="container py-10 sm:py-14">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-5 gap-1.5 py-1">
          <Sparkles className="h-3 w-3 text-brand" />
          Auto-refreshed every 6 hours
        </Badge>

        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Keybox Hub
          <span className="mt-2 block bg-gradient-to-r from-brand via-brand-400 to-ok-500 bg-clip-text text-transparent">
            {SITE_TAGLINE}
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          A fully static index of publicly available{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
            keybox.xml
          </code>{' '}
          files found across GitHub. Search by filename, repository, or
          SHA-256. View, copy, or download in one click — no backend, no
          tracking, no cost.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/sources"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 transition-colors hover:border-brand/40 hover:text-brand"
          >
            Browse {totalSources} sources
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 transition-colors hover:border-brand/40 hover:text-brand"
          >
            How it works
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-10">
        <StatsBar
          totalKeyboxes={totalKeyboxes}
          totalSources={totalSources}
          generatedAt={generatedAt}
        />
      </section>

      {/* Explorer */}
      <section className="mt-10">
        {keyboxes.length === 0 ? (
          <EmptyState />
        ) : (
          <KeyboxExplorer keyboxes={keyboxes} />
        )}
      </section>
    </main>
  );
}
