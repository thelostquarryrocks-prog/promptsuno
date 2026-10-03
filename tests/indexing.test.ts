import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { isIndexable, NO_INDEX, robotsMetadata } from '../src/lib/indexing'
import robots from '../src/app/robots'
import sitemap from '../src/app/sitemap'
import { learnPages } from '../src/content/learn/pages'
import { SITE_URL } from '../src/lib/site'

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}))
import { proxy } from '../src/proxy'

afterEach(() => vi.unstubAllEnvs())

const publicPaths = ['/', '/learn', '/learn/', '/learn/style-prompts', '/learn/nested/topic']
const privatePaths = ['/workspace', '/workspace/nested', '/login', '/auth', '/auth/callback', '/api', '/api/generate', '/api/other', '/unknown', '/learning', '/learn-other', '/robots.txt', '/sitemap.xml', '/_next/static/app.js', '/favicon.ico']

describe('environment and route indexing boundary', () => {
  it.each(['production', 'preview', 'development', '', 'Production'])('fails closed outside public production routes (%s)', async environment => {
    vi.stubEnv('VERCEL_ENV', environment)
    for (const pathname of [...publicPaths, ...privatePaths]) {
      const allowed = environment === 'production' && publicPaths.includes(pathname)
      expect(isIndexable(pathname), pathname).toBe(allowed)
      expect(robotsMetadata(pathname)).toEqual(allowed
        ? { index: true, follow: true }
        : { index: false, follow: false, noarchive: true })
      const response = await proxy(new NextRequest(new URL(pathname, 'https://fixture.invalid')))
      expect(response.headers.get('x-robots-tag'), pathname).toBe(allowed ? null : NO_INDEX)
      if (pathname.startsWith('/workspace')) {
        expect(response.status).toBe(307)
        expect(response.headers.get('cache-control')).toBe('private, no-store')
      }
    }
  })

  it('does not treat a local production build as Vercel production', () => {
    vi.stubEnv('VERCEL_ENV', undefined)
    expect(isIndexable('/')).toBe(false)
    expect(robotsMetadata('/learn')).toEqual({ index: false, follow: false, noarchive: true })
  })
})

describe('robots.txt', () => {
  it.each(['preview', 'development', undefined])('disallows all outside production (%s)', environment => {
    vi.stubEnv('VERCEL_ENV', environment)
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })

  it('allows public content and disallows private routes in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: ['/', '/learn'], disallow: ['/workspace', '/login', '/auth', '/api'] },
      sitemap: new URL('/sitemap.xml', SITE_URL).href,
    })
  })
})

describe('sitemap', () => {
  it('lists exactly the homepage, hub and all five lessons from the content source', () => {
    const urls = sitemap().map(entry => entry.url)
    expect(urls).toEqual(['/', '/learn', ...learnPages.map(page => `/learn/${page.slug}`)].map(path => new URL(path, SITE_URL).href))
    expect(urls).toHaveLength(7)
    expect(new Set(urls).size).toBe(7)
    expect(urls.every(url => new URL(url).protocol === 'https:')).toBe(true)
    expect(urls.some(url => /workspace|login|auth|api/.test(new URL(url).pathname))).toBe(false)
  })
})
