import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Calendar,
  Fingerprint,
  FileCode2,
  Clock
} from 'lucide-react';
import { getIndex, getKeyboxXml } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/CopyButton';
import { DownloadButton } from '@/components/DownloadButton';
import { XmlViewer } from '@/components/XmlViewer';
import {
  formatBytes,
  formatDateTime,
  shortSha,
  timeAgo
} from '@/lib/utils';

export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  const { keyboxes } = getIndex();
  return keyboxes.map((kb) => ({ id: kb.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { keyboxes } = getIndex();
  const kb = keyboxes.find((k) => k.id === params.id);
  if (!kb) return { title: 'Keybox not found' };

  return {
    title: `${kb.filename} · ${kb.sourceRepo}`,
    description: `Download or view ${kb.filename} from ${kb.sourceRepo}. SHA-256 ${kb.sha256}. Size ${formatBytes(
      kb.size
    )}.`,
    openGraph: {
      title: `${kb.filename} — Keybox Hub`,
      description: `Sourced from ${kb.sourceRepo} · ${formatBytes(kb.size)}`
    }
  };
}

export default function KeyboxDetailPage({ params }: PageProps) {
  const { keyboxes } = getIndex();
  const kb = keyboxes.find((k) => k.id === params.id);

  if (!kb) notFound();

  const xml = getKeyboxXml(kb.localPath);

  const metaRows: Array<{
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
  }> = [
    {
      icon: FileCode2,
      label: 'Filename',
      value: kb.filename,
      mono: true
    },
    {
      icon: Github,
      label: 'Source repository',
      value: (
        <a
          href={`https://github.com/${kb.sourceRepo}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-brand hover:underline"
        >
          {kb.sourceRepo}
        </a>
      ),
      mono: true
    },
    {
      icon: FileCode2,
      label: 'Path in repo',
      value: kb.path,
      mono: true
    },
    {
      icon: HardDrive,
      label: 'Size',
      value: `${formatBytes(kb.size)} (${kb.size.toLocaleString()} bytes)`
    },
    {
      icon: Fingerprint,
      label: 'SHA-256',
      value: (
        <span className="break-all font-mono text-[11px]">{kb.sha256}</span>
      )
    },
    {
      icon: Calendar,
      label: 'Last commit',
      value: `${formatDateTime(kb.lastCommit)} · ${timeAgo(kb.lastCommit)}`
    },
    {
      icon: Clock,
      label: 'Discovered',
      value: `${formatDateTime(kb.discoveredAt)} · ${timeAgo(kb.discoveredAt)}`
    },
    {
      icon: kb.verified ? ShieldCheck : ShieldAlert,
      label: 'Validation',
      value: kb.verified
        ? 'Structurally valid keybox XML'
        : 'Missing expected Keybox structure'
    }
  ];

  return (
    <main className="container py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all keyboxes
      </Link>

      {/* Title */}
      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {kb.filename}
            </h1>
            {kb.verified ? (
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                verified
              </Badge>
            ) : (
              <Badge variant="warning">
                <ShieldAlert className="h-3 w-3" />
                unverified
              </Badge>
            )}
            <Badge variant="mono" title={kb.sha256}>
              {shortSha(kb.sha256, 12)}
            </Badge>
          </div>
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            {kb.sourceRepo} · {kb.path}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={kb.sourceUrl} target="_blank" rel="noreferrer noopener">
              <Github />
              Open in GitHub
            </a>
          </Button>
          <CopyButton
            value={kb.rawUrl}
            label="Copy raw URL"
            variant="outline"
          />
          <DownloadButton
            href={kb.localPath}
            filename={kb.filename}
            label="Download"
          />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* XML preview */}
        <section className="min-w-0">
          {xml ? (
            <XmlViewer xml={xml} filename={kb.filename} />
          ) : (
            <div className="kh-card flex flex-col items-center gap-2 px-6 py-16 text-center">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
              <p className="text-sm font-medium">Preview unavailable</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                The file exists in the index but could not be read from the
                local static bundle. You can still open it directly on GitHub.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <a
                  href={kb.rawUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink />
                  Open raw file
                </a>
              </Button>
            </div>
          )}
        </section>

        {/* Metadata */}
        <aside className="space-y-4">
          <div className="kh-card overflow-hidden">
            <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metadata
              </h2>
            </div>
            <dl className="divide-y divide-border/70">
              {metaRows.map((row) => (
                <div key={row.label} className="flex gap-3 px-4 py-3">
                  <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd
                      className={
                        row.mono
                          ? 'mt-0.5 break-words font-mono text-[12px]'
                          : 'mt-0.5 break-words text-[13px]'
                      }
                    >
                      {row.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="kh-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Direct links
            </h2>
            <div className="mt-3 space-y-2">
              <CopyButton
                value={kb.rawUrl}
                label="Copy raw.githubusercontent URL"
                className="w-full justify-start"
              />
              <CopyButton
                value={kb.sha256}
                label="Copy SHA-256"
                className="w-full justify-start"
              />
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <a
                  href={kb.rawUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink />
                  Open raw file
                </a>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
