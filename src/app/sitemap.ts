import type { MetadataRoute } from 'next'
import { learnPages } from '@/content/learn/pages'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/learn', ...learnPages.map(page => `/learn/${page.slug}`)]
    .map(pathname => ({ url: siteUrl(pathname) }))
}
