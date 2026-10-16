import type { MetadataRoute } from 'next';

import { site } from '@/content/site';

// A exportação estática (SITE_ESTATICO=1) precisa saber que esta rota
// é fixa e pode virar arquivo. No build normal da Vercel isto não
// muda nada: ela já era estática.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.seo.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
