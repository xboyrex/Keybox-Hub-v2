'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, List, SearchX } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { FilterChips } from './FilterChips';
import { KeyboxCard } from './KeyboxCard';
import { KeyboxTable } from './KeyboxTable';
import { Button } from '@/components/ui/button';
import type { FilterId, KeyboxMeta } from '@/lib/types';
import {
  NEW_WINDOW_MS,
  UPDATED_WINDOW_MS
} from '@/lib/constants';
import { cn, isWithin } from '@/lib/utils';

type View = 'grid' | 'list';

interface KeyboxExplorerProps {
  keyboxes: KeyboxMeta[];
}

export function KeyboxExplorer({ keyboxes }: KeyboxExplorerProps) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<FilterId>('all');
  const [view, setView] = React.useState<View>('grid');
  const [limit, setLimit] = React.useState(48);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('keybox-hub-view');
      if (stored === 'grid' || stored === 'list') setView(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const changeView = (v: View) => {
    setView(v);
    try {
      window.localStorage.setItem('keybox-hub-view', v);
    } catch {
      /* ignore */
    }
  };

  const counts = React.useMemo<Record<FilterId, number>>(
    () => ({
      all: keyboxes.length,
      new: keyboxes.filter((k) => isWithin(k.discoveredAt, NEW_WINDOW_MS)).length,
      updated: keyboxes.filter((k) => isWithin(k.lastCommit, UPDATED_WINDOW_MS))
        .length,
      verified: keyboxes.filter((k) => k.verified).length
    }),
    [keyboxes]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return keyboxes.filter((kb) => {
      if (filter === 'new' && !isWithin(kb.discoveredAt, NEW_WINDOW_MS))
        return false;
      if (filter === 'updated' && !isWithin(kb.lastCommit, UPDATED_WINDOW_MS))
        return false;
      if (filter === 'verified' && !kb.verified) return false;

      if (!q) return true;

      return (
        kb.filename.toLowerCase().includes(q) ||
        kb.path.toLowerCase().includes(q) ||
        kb.sourceRepo.toLowerCase().includes(q) ||
        kb.sha256.toLowerCase().includes(q) ||
        kb.id.toLowerCase().includes(q)
      );
    });
  }, [keyboxes, filter, query]);

  React.useEffect(() => {
    setLimit(48);
  }, [query, filter]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          resultCount={filtered.length}
          totalCount={keyboxes.length}
        />

        <div className="flex items-center gap-2">
          <FilterChips active={filter} onChange={setFilter} counts={counts} />

          <div className="ml-auto flex items-center rounded-lg border border-border p-0.5 lg:ml-0">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => changeView('grid')}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => changeView('list')}
              aria-label="List view"
              aria-pressed={view === 'list'}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="kh-card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No keyboxes match</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different search term or reset the filter. The index refreshes
            automatically every 6 hours.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : view === 'grid' ? (
        <motion.div
          layout
          className={cn(
            'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
          )}
        >
          <AnimatePresence mode="popLayout">
            {visible.map((kb, i) => (
              <KeyboxCard key={kb.id} keybox={kb} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <KeyboxTable keyboxes={visible} />
      )}

      {filtered.length > limit && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setLimit((l) => l + 48)}>
            Load {Math.min(48, filtered.length - limit)} more
            <span className="text-muted-foreground">
              ({filtered.length - limit} remaining)
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
