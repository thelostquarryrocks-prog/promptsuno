import { describe, expect, it } from 'vitest'
import { isProtectedPwaRequest, pwaOptions } from '../next.config'
import { isProtectedPathname } from '../src/proxy'

const pwaMatch = (pathname: string, sameOrigin = true) => isProtectedPwaRequest({
  sameOrigin,
  url: new URL(pathname, 'https://staging.example'),
})

describe('protected cache policy', () => {
  it.each([
    '/workspace',
    '/workspace/project',
    '/login',
    '/auth/callback',
    '/api/generate',
  ])('keeps %s inside both HTTP and PWA protection boundaries', pathname => {
    expect(isProtectedPathname(pathname)).toBe(true)
    expect(pwaMatch(pathname)).toBe(true)
  })

  it.each(['/', '/learn', '/learn/prompting', '/file.svg'])('preserves normal PWA handling for public path %s', pathname => {
    expect(isProtectedPathname(pathname)).toBe(false)
    expect(pwaMatch(pathname)).toBe(false)
  })

  it('does not match cross-origin requests and registers NetworkOnly before default caching', () => {
    expect(pwaMatch('/workspace', false)).toBe(false)
    expect(pwaOptions.cacheOnFrontEndNav).toBe(false)
    expect(pwaOptions.aggressiveFrontEndNavCaching).toBe(false)
    expect(pwaOptions.extendDefaultRuntimeCaching).toBe(true)
    expect(pwaOptions.workboxOptions.runtimeCaching).toEqual([
      expect.objectContaining({ handler: 'NetworkOnly', method: 'GET' }),
    ])
  })
})
