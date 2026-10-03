import type { Metadata } from 'next'

export const NO_INDEX = 'noindex, nofollow, noarchive'

export function isIndexable(pathname: string, environment = process.env.VERCEL_ENV) {
  return environment === 'production' &&
    (pathname === '/' || pathname === '/learn' || pathname.startsWith('/learn/'))
}

export function robotsMetadata(pathname: string): Metadata['robots'] {
  return isIndexable(pathname)
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true }
}
