'use client';

import { motion } from 'framer-motion';
import { FILTERS } from '@/lib/constants';
import type { FilterId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterChipsProps {
  active: FilterId;
  onChange: (id: FilterId) => void;
  counts?: Record<FilterId, number>;
}

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter keyboxes"
      className="flex flex-wrap items-center gap-2"
    >
      {FILTERS.map((f) => {
        const isActive = active === f.id;
        const count = counts?.[f.id];
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={isActive}
            title={f.hint}
            onClick={() => onChange(f.id)}
            className={cn(
              'relative rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-brand/60 bg-brand/15 text-brand'
                : 'border-border bg-card/40 text-muted-foreground hover:border-brand/30 hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 -z-10 rounded-full bg-brand/10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="inline-flex items-center gap-1.5">
              {f.label}
              {typeof count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] tabular-nums',
                    isActive
                      ? 'bg-brand/20 text-brand'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
