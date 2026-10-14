import Link from 'next/link';
import { Github, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LICENSE, REPO_URL, SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border/70 bg-card/30">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-semibold tracking-tight">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {SITE_TAGLINE} Keybox Hub indexes only publicly available files
            that are already published on GitHub. We host nothing private.
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-ok-500" />
            Licensed under {LICENSE} · Not affiliated with Google or any OEM.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Browse
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                All keyboxes
              </Link>
            </li>
            <li>
              <Link
                href="/sources"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Source repositories
              </Link>
            </li>
            <li>
              <Link
                href="/api-status"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Index status
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                About &amp; disclaimer
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
                Source code
              </a>
            </li>
            <li>
              <a
                href={`${REPO_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                MIT License
              </a>
            </li>
            <li>
              <a
                href={`${REPO_URL}/blob/main/CHANGELOG.md`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Changelog
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {SITE_NAME}. Static, open source, zero cost.
          </p>
          <p>
            Built with Next.js · Deployed on Cloudflare Pages
          </p>
        </div>
      </div>
    </footer>
  );
}
