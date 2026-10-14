'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadButton } from './DownloadButton';
import type { KeyboxMeta } from '@/lib/types';
import { formatBytes, formatDate, shortSha } from '@/lib/utils';
import { Eye } from 'lucide-react';

export function KeyboxTable({ keyboxes }: { keyboxes: KeyboxMeta[] }) {
  return (
    <div className="kh-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>File</TableHead>
            <TableHead className="hidden md:table-cell">Source</TableHead>
            <TableHead className="hidden sm:table-cell">Size</TableHead>
            <TableHead className="hidden lg:table-cell">Last commit</TableHead>
            <TableHead className="hidden xl:table-cell">SHA-256</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keyboxes.map((kb) => (
            <TableRow key={kb.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{kb.filename}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {kb.path}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <a
                  href={kb.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-muted-foreground transition-colors hover:text-brand"
                >
                  {kb.sourceRepo}
                </a>
              </TableCell>
              <TableCell className="hidden text-xs tabular-nums text-muted-foreground sm:table-cell">
                {formatBytes(kb.size)}
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                {formatDate(kb.lastCommit)}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Badge variant="mono" title={kb.sha256}>
                  {shortSha(kb.sha256, 12)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/keybox/${kb.id}/`}>
                      <Eye />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </Button>
                  <DownloadButton
                    href={kb.localPath}
                    filename={kb.filename}
                    label=""
                    className="px-2.5"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
