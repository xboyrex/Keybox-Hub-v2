import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, Star, GitFork, FileCode2, ExternalLink } from 'lucide-react';
import { getIndex } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, timeAgo } from '@/lib/utils';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Sources',
  description:
    'Every public GitHub repository that Keybox Hub indexes keybox.xml files from.'
};

export default function SourcesPage() {
  const { sources, generatedAt } = getIndex();
  const sorted = [...sources].sort((a, b) => b.keyboxCount - a.keyboxCount);

  return (
    <main className="container py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Source repositories
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keybox Hub discovers repositories via the GitHub Search API
          (<code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            filename:keybox.xml
          </code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            keybox in:name,description
          </code>
          ), ranks them by stars then recency, and indexes the top 20. Last
          scan: {timeAgo(generatedAt)}.
        </p>
      </header>

      <section className="mt-8">
        {sorted.length === 0 ? (
          <div className="kh-card px-6 py-16 text-center text-sm text-muted-foreground">
            No sources indexed yet. Run{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              npm run fetch
            </code>
            .
          </div>
        ) : (
          <div className="kh-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden sm:table-cell">Stars</TableHead>
                  <TableHead className="hidden md:table-cell">Forks</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last updated
                  </TableHead>
                  <TableHead>Keyboxes</TableHead>
                  <TableHead className="text-right">Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((s) => (
                  <TableRow key={s.repo}>
                    <TableCell>
                      <div className="flex flex-col">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-mono text-[13px] font-medium transition-colors hover:text-brand"
                        >
                          {s.repo}
                        </a>
                        {s.description && (
                          <span className="mt-0.5 line-clamp-1 max-w-[420px] text-[11px] text-muted-foreground">
                            {s.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-400" />
                        {s.stars.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                        <GitFork className="h-3 w-3" />
                        {s.forks.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell
                      className="hidden text-xs text-muted-foreground lg:table-cell"
                      title={formatDate(s.lastUpdated)}
                    >
                      {timeAgo(s.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <FileCode2 className="h-3 w-3" />
                        {s.keyboxCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/?q=${encodeURIComponent(s.repo)}`}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          Browse
                        </Link>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Open ${s.repo} on GitHub`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="mt-10 kh-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Github className="h-4 w-4 text-brand" />
          Add your own source
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sources are discovered automatically, but you can also seed a
          repository manually by adding it to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            scripts/sources.json
          </code>{' '}
          and opening a pull request.
        </p>
      </section>
    </main>
  );
}
