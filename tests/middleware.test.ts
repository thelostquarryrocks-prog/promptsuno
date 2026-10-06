import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClient, getUser } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient }))

import { PRIVATE_CACHE_CONTROL, proxy } from '../src/proxy'

describe('authentication middleware cache and cookie boundaries', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'fixture-user' } }, error: null })
    createServerClient.mockReset().mockReturnValue({ auth: { getUser } })
  })

  it('returns authenticated workspace responses as private and non-cacheable', async () => {
    const response = await proxy(new NextRequest('https://staging.example/workspace', {
      headers: { 'x-forwarded-proto': 'https' },
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(PRIVATE_CACHE_CONTROL)
    expect(createServerClient.mock.calls[0][2].cookieOptions).toMatchObject({
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: true,
    })
  })

  it('keeps the unauthenticated workspace redirect private and unchanged', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await proxy(new NextRequest('https://staging.example/workspace'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://staging.example/login')
    expect(response.headers.get('cache-control')).toBe(PRIVATE_CACHE_CONTROL)
  })

  it('keeps local HTTP cookie writes workable', async () => {
    await proxy(new NextRequest('http://127.0.0.1:3131/login'))

    expect(createServerClient.mock.calls[0][2].cookieOptions.secure).toBe(false)
  })

  it('lets the assistance endpoint own verified authentication and JSON errors', async () => {
    const response = await proxy(new NextRequest('https://staging.example/api/workspace-assist'))
    expect(response.headers.get('cache-control')).toBe(PRIVATE_CACHE_CONTROL)
    expect(createServerClient).not.toHaveBeenCalled()
  })
})
