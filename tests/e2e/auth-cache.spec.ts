import { expect, test } from '@playwright/test'
import { login } from './login'

test.use({ serviceWorkers: 'allow' })

const protectedPath = /^\/(?:workspace(?:\/|$)|login(?:\/|$)|auth(?:\/|$)|api\/generate(?:\/|$))/

test('workspace responses stay private and localhost auth cookies remain usable', async ({ page, context, request }) => {
  await context.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    if (!descriptor?.get || !descriptor.set) return

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => descriptor.get!.call(document),
      set: (serialized: string) => {
        const attributes = serialized.split(';').slice(1).map(attribute => attribute.trim().toLowerCase())
        const metadata = {
          path: attributes.find(attribute => attribute.startsWith('path='))?.slice(5) ?? null,
          sameSite: attributes.find(attribute => attribute.startsWith('samesite='))?.slice(9) ?? null,
          secure: attributes.includes('secure'),
        }
        const previous = JSON.parse(localStorage.getItem('__cookie_attribute_metadata__') ?? '[]')
        localStorage.setItem('__cookie_attribute_metadata__', JSON.stringify([...previous, metadata]))
        descriptor.set!.call(document, serialized)
      },
    })
  })

  const anonymous = await request.get('/workspace')
  expect(anonymous.status()).toBe(200)
  expect(new URL(anonymous.url()).pathname).toBe('/login')
  expect(anonymous.headers()['cache-control']).toBe('private, no-store')

  await login(page)
  const response = await page.reload({ waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  expect(response?.headers()['cache-control']).toBe('private, no-store')

  const authCookies = (await context.cookies()).filter(cookie => cookie.name.startsWith('sb-'))
  expect(authCookies.length).toBeGreaterThan(0)
  expect(authCookies.every(cookie => !cookie.secure && cookie.path === '/')).toBe(true)

  const writeMetadata = await page.evaluate(() => JSON.parse(
    localStorage.getItem('__cookie_attribute_metadata__') ?? '[]',
  ) as Array<{ path: string | null; sameSite: string | null; secure: boolean }>)
  expect(writeMetadata).toContainEqual({ path: '/', sameSite: 'lax', secure: false })
})

test('the service worker never stores protected routes or reveals workspace after logout offline', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Cache Storage inspection is covered in Chromium; WebKit retains the HTTP/auth regression suite.')

  await login(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload({ waitUntil: 'domcontentloaded' })

  const cachedProtectedPaths = await page.evaluate(async source => {
    const pattern = new RegExp(source)
    const cached: string[] = []
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName)
      for (const request of await cache.keys()) {
        const url = new URL(request.url)
        if (pattern.test(url.pathname)) cached.push(url.pathname)
      }
    }
    return cached
  }, protectedPath.source)
  expect(cachedProtectedPaths).toEqual([])

  await page.getByRole('button', { name: 'Sign Out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await context.setOffline(true)
  await page.goto('/workspace', { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => null)
  await expect(page.getByText('Choose nodes without dragging')).toHaveCount(0)
  await context.setOffline(false)
})
