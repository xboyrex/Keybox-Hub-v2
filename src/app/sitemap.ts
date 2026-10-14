import type { MetadataRoute } from 'next';
import { getIndex } from '@/lib/data';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const { keyboxes } = getIndex();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/sources/`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/api-status/`, lastModified: now, changeFrequency: 'hourly', priority: 0.5 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 }
  ];

  const keyboxRoutes: MetadataRoute.Sitemap = keyboxes.map((kb) => ({
    url: `${SITE_URL}/keybox/${kb.id}/`,
    lastModified: new Date(kb.lastCommit),
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  return [...staticRoutes, ...keyboxRoutes];
}
