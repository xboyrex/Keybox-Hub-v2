import type { Metadata } from 'next';
import {
  ShieldCheck,
  Scale,
  Server,
  RefreshCw,
  FileSearch,
  AlertTriangle,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LICENSE, REFRESH_INTERVAL_HOURS, REPO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Keybox Hub indexes only publicly available keybox.xml files. MIT licensed. Not affiliated with Google or any OEM.'
};

const FACTS = [
  {
    icon: FileSearch,
    title: 'Public sources only',
    body: 'Every file listed here was already published in a public GitHub repository. Keybox Hub does not host, generate, or leak anything private — it simply mirrors and indexes what is already public.'
  },
  {
    icon: Server,
    title: 'Fully static',
    body: 'There is no backend, no database, and no server runtime. The whole site is pre-rendered HTML, CSS, JS and raw XML files served from a CDN.'
  },
  {
    icon: RefreshCw,
    title: `Refreshed every ${REFRESH_INTERVAL_HOURS} hours`,
    body: 'A scheduled GitHub Actions workflow re-scans the GitHub Search API, downloads new or changed keybox files, recomputes SHA-256 hashes, and commits the updated index.'
  },
  {
    icon: ShieldCheck,
    title: 'Hash verified',
    body: 'Every keybox carries its full SHA-256 digest. You can verify a download matches the index without trusting this website.'
  },
  {
    icon: Scale,
    title: `Licensed ${LICENSE}`,
    body: 'The Keybox Hub source code is MIT licensed. Indexed files remain under the license of their original repositories.'
  },
  {
    icon: AlertTriangle,
    title: 'No warranty',
    body: 'The index is provided "as is". Files may be outdated, revoked, or non-functional. Verify against your own trust model before use.'
  }
];

export default function AboutPage() {
  return (
    <main className="container py-10 sm:py-14">
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          About Keybox Hub
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          An open-source, zero-cost aggregator for publicly available{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
            keybox.xml
          </code>{' '}
          files.
        </p>
      </header>

      <section className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.title} className="kh-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <fact.icon className="h-4 w-4" />
            </div>
            <h2 className="mt-3 text-sm font-semibold">{fact.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {fact.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-3xl kh-card p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Disclaimer
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">
              Keybox Hub is not affiliated with, endorsed by, or connected to
              Google, Alphabet, or any device manufacturer (OEM).
            </strong>{' '}
            &ldquo;Android&rdquo;, &ldquo;Google Play&rdquo;, and related marks
            are trademarks of their respective owners.
          </p>
          <p>
            This site does not circumvent, break, or bypass any technical
            protection measure. It indexes files that repository owners have
            already made publicly available on GitHub. If you are a rights
            holder and want a repository de-indexed, open an issue in the
            project repository and it will be handled promptly.
          </p>
          <p>
            Keybox Hub provides no guarantee of correctness, freshness, or
            fitness for any purpose. Use at your own risk and in compliance
            with all applicable laws in your jurisdiction.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-3xl kh-card p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Github className="h-4 w-4 text-brand" />
          Contribute
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Keybox Hub is MIT-licensed and community maintained. Add sources,
          improve discovery, or suggest UI changes via a pull request.
        </p>
        <div className="mt-4">
          <Button asChild>
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
              <Github />
              View on GitHub
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
