'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Github, Menu, X } from 'lucide-react';
import * as React from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import { REPO_URL, SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Keyboxes' },
  { href: '/sources', label: 'Sources' },
  { href: '/api-status', label: 'Status' },
  { href: '/about', label: 'About' }
];

export function Header() {
  const pathname = usePathname();
  const { theme, toggle, mounted } = useTheme();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Logo />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight">
              {SITE_NAME}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Every keybox. Always fresh.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="GitHub repository"
          >
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
              <Github />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun /> : <Moon />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/70 bg-background md:hidden">
          <div className="container flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
