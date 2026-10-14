import Link from 'next/link';
import { Inbox, RefreshCw, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REPO_URL } from '@/lib/constants';

export function EmptyState() {
  return (
    <div className="kh-card flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Inbox className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">No keyboxes indexed yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The index is empty. Run{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run fetch
        </code>{' '}
        followed by{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run build-index
        </code>
        , or trigger the <strong>Update Keyboxes</strong> workflow on GitHub.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/sources">
            <RefreshCw />
            View sources
          </Link>
        </Button>
        <Button asChild size="sm">
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            <Github />
            Open repository
          </a>
        </Button>
      </div>
    </div>
  );
}
