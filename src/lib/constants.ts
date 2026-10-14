import type { FilterOption } from './types';

export const SITE_NAME = 'Keybox Hub';
export const SITE_TAGLINE = 'Every keybox. Always fresh.';
export const SITE_DESCRIPTION =
  'Keybox Hub indexes and serves publicly available keybox.xml files from GitHub — searchable, hash-verified, and refreshed every 6 hours.';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://keybox-hub.pages.dev';

export const REFRESH_INTERVAL_HOURS = 6;

export const REPO_URL = 'https://github.com/keybox-hub/keybox-hub';
export const LICENSE = 'MIT';

export const FILTERS: FilterOption[] = [
  { id: 'all', label: 'All', hint: 'Every indexed keybox' },
  { id: 'new', label: 'New', hint: 'Discovered in the last 24 hours' },
  { id: 'updated', label: 'Updated', hint: 'Source commit within 7 days' },
  { id: 'verified', label: 'Verified', hint: 'Structurally valid keybox XML' }
];

export const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;
export const UPDATED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const BRAND = {
  blue: '#0EA5E9',
  green: '#22C55E',
  black: '#05070A'
} as const;
