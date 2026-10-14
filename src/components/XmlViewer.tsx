'use client';

import * as React from 'react';
import { highlightXml } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { WrapText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface XmlViewerProps {
  xml: string;
  filename: string;
}

export function XmlViewer({ xml, filename }: XmlViewerProps) {
  const [wrap, setWrap] = React.useState(false);
  const [showLines, setShowLines] = React.useState(true);

  const html = React.useMemo(() => highlightXml(xml), [xml]);
  const lineCount = React.useMemo(() => xml.split('\n').length, [xml]);

  return (
    <div className="kh-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-ok-500/70" />
          </span>
          <span className="ml-1 font-mono text-[11px] text-muted-foreground">
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowLines((v) => !v)}
            aria-label="Toggle line numbers"
            aria-pressed={showLines}
            title="Toggle line numbers"
          >
            <Hash className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setWrap((v) => !v)}
            aria-label="Toggle word wrap"
            aria-pressed={wrap}
            title="Toggle word wrap"
          >
            <WrapText className="h-3.5 w-3.5" />
          </Button>
          <CopyButton
            value={xml}
            label="Copy XML"
            variant="outline"
            className="h-7"
          />
        </div>
      </div>

      <div className="max-h-[62vh] overflow-auto bg-[#0A0E14]">
        <div className="flex min-w-full text-[12.5px] leading-[1.65]">
          {showLines && (
            <pre
              aria-hidden="true"
              className="select-none border-r border-white/5 px-3 py-4 text-right font-mono text-slate-600"
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
            </pre>
          )}
          <pre
            className={cn(
              'kh-code flex-1 px-4 py-4 font-mono text-slate-300',
              wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
