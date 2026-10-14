'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Github,
  Eye,
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from './CopyButton';
import { DownloadButton } from './DownloadButton';
import type { KeyboxMeta } from '@/lib/types';
import {
  cn,
  formatBytes,
  formatDate,
  shortSha,
  timeAgo
} from '@/lib/utils';

interface KeyboxCardProps {
  keybox: KeyboxMeta;
  index: number;
}

export function KeyboxCard({ keybox, index }: KeyboxCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.025, 0.3)
      }}
      className="kh-card group flex flex-col p-4 hover:shadow-lg hover:shadow-brand/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="truncate text-sm font-semibold leading-tight"
              title={keybox.path}
            >
              {keybox.filename}
            </h3>
            <p
              className="truncate text-[11px] text-muted-foreground"
              title={keybox.path}
            >
              {keybox.path}
            </p>
          </div>
        </div>

        {keybox.verified ? (
          <Badge variant="success" title="Structurally valid keybox XML">
            <ShieldCheck className="h-3 w-3" />
            verified
          </Badge>
        ) : (
          <Badge variant="warning" title="Missing expected Keybox structure">
            <ShieldAlert className="h-3 w-3" />
            unverified
          </Badge>
        )}
      </div>

      <a
        href={keybox.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
      >
        <Github className="h-3 w-3" />
        <span className="max-w-[200px] truncate">{keybox.sourceRepo}</span>
      </a>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          {formatBytes(keybox.size)}
        </span>
        <span className="inline-flex items-center gap-1" title={formatDate(keybox.lastCommit)}>
          <Calendar className="h-3 w-3" />
          {timeAgo(keybox.lastCommit)}
        </span>
        <span
          className="font-mono text-[10px] tracking-tight"
          title={keybox.sha256}
        >
          {shortSha(keybox.sha256, 10)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border/70">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/keybox/${keybox.id}/`}>
            <Eye />
            View
          </Link>
        </Button>

        <CopyButton
          value={keybox.rawUrl}
          label="Copy"
          copiedLabel="Copied"
          title="Copy raw GitHub URL"
        />

        <DownloadButton
          href={keybox.localPath}
          filename={keybox.filename}
          className={cn('ml-auto')}
        />
      </div>
    </motion.article>
  );
}
