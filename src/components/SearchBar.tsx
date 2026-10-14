'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by filename, repo, or SHA-256…',
  resultCount,
  totalCount
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search keyboxes"
        className="h-11 pl-9 pr-24"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {typeof resultCount === 'number' && typeof totalCount === 'number' && (
          <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:block">
            {resultCount}/{totalCount}
          </span>
        )}
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:block">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
