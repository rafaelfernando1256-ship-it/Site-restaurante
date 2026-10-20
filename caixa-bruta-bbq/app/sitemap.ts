import type { MetadataRoute } from 'next';

import { negocio } from '@/content/negocio';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${negocio.url}/`, changeFrequency: 'weekly', priority: 1 }];
}
