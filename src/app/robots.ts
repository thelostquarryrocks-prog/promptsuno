import type { MetadataRoute } from 'next'
import { isIndexable } from '@/lib/indexing'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable('/')) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/learn'],
      disallow: ['/workspace', '/login', '/auth', '/api'],
    },
    sitemap: siteUrl('/sitemap.xml'),
  }
}
