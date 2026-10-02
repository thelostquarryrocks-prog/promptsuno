import { describe, expect, it } from 'vitest'
import { getSupabaseCookieOptions, usesSecureCookies } from '../src/lib/supabase/cookie-options'

describe('Supabase cookie policy', () => {
  it.each([
    { protocol: 'https:', expected: true },
    { forwardedProtocol: 'https', protocol: 'http:', expected: true },
    { protocol: 'http:', hostname: 'localhost', expected: false },
    { protocol: 'http:', hostname: '127.0.0.1', expected: false },
  ])('resolves the request security context without breaking local HTTP', context => {
    expect(usesSecureCookies(context)).toBe(context.expected)
  })

  it('keeps the established cookie attributes while leaving expiration to Supabase SSR', () => {
    expect(getSupabaseCookieOptions(true)).toEqual({
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: true,
    })
    expect(getSupabaseCookieOptions(true)).not.toHaveProperty('maxAge')
    expect(getSupabaseCookieOptions(false).secure).toBe(false)
  })
})
