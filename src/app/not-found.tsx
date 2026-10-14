import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-6xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-xl font-semibold">Keybox not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The keybox you&rsquo;re looking for has been removed from the index or
        never existed.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">
            <Search />
            Browse keyboxes
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">
            <Home />
            Home
          </Link>
        </Button>
      </div>
    </main>
  );
}
