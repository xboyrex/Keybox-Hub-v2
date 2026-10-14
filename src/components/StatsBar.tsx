'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Database, GitBranch, RefreshCw, Clock } from 'lucide-react';
import { REFRESH_INTERVAL_HOURS } from '@/lib/constants';
import { formatDateTime, timeAgo } from '@/lib/utils';

interface StatsBarProps {
  totalKeyboxes: number;
  totalSources: number;
  generatedAt: string;
}

function nextRefreshIn(generatedAt: string): string {
  const base = new Date(generatedAt).getTime();
  if (!Number.isFinite(base)) return '—';
  const next = base + REFRESH_INTERVAL_HOURS * 3600 * 1000;
  const diff = next - Date.now();
  if (diff <= 0) return 'any moment now';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours <= 0) return `in ${mins}m`;
  return `in ${hours}h ${mins}m`;
}

export function StatsBar({
  totalKeyboxes,
  totalSources,
  generatedAt
}: StatsBarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const items = [
    {
      icon: Database,
      label: 'Keyboxes indexed',
      value: totalKeyboxes.toLocaleString(),
      accent: 'text-brand'
    },
    {
      icon: GitBranch,
      label: 'Source repos',
      value: totalSources.toLocaleString(),
      accent: 'text-ok-500'
    },
    {
      icon: RefreshCw,
      label: 'Last update',
      value: mounted ? timeAgo(generatedAt) : '—',
      accent: 'text-brand',
      title: formatDateTime(generatedAt)
    },
    {
      icon: Clock,
      label: 'Next refresh',
      value: mounted ? nextRefreshIn(generatedAt) : '—',
      accent: 'text-ok-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className="kh-card p-4"
          title={item.title}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <item.icon className={`h-3.5 w-3.5 ${item.accent}`} />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {item.label}
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">
            {item.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
