'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

interface DownloadButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
  filename: string;
  label?: string;
}

/**
 * Triggers a real file download. Uses the anchor `download` attribute so the
 * browser saves `/keyboxes/xyz.xml` directly — no backend required.
 */
export function DownloadButton({
  href,
  filename,
  label = 'Download',
  variant = 'default',
  size = 'sm',
  ...rest
}: DownloadButtonProps) {
  const [busy, setBusy] = React.useState(false);

  const handle = React.useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      // Fallback: let the browser handle it.
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusy(false);
    }
  }, [href, filename]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handle}
      disabled={busy}
      {...rest}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      <span>{label}</span>
    </Button>
  );
}
