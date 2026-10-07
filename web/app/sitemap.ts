import type { MetadataRoute } from 'next'
import { posts } from '@/lib/posts'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/posts', '/simulator/custom', '/simulator/withdrawal', '/nasdaq100-holdings']
  return [
    ...pages.map(p => ({ url: `${SITE_URL}${p}`, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.8 })),
    ...posts.map(p => ({ url: `${SITE_URL}/posts/${p.slug}`, lastModified: p.date, priority: p.pinned ? 0.9 : 0.6 })),
  ]
}
