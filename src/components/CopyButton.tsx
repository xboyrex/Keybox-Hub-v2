'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  className,
  variant = 'outline',
  size = 'sm',
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onCopy = React.useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [value]);

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? 'icon' : size}
      onClick={onCopy}
      className={cn(iconOnly && 'h-8 w-8', className)}
      aria-live="polite"
      {...rest}
    >
      {copied ? (
        <Check className="text-ok-500" />
      ) : (
        <Copy />
      )}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
