import { test, expect } from './test'
import { login } from './login'
import { STARTER_INTENT_STORAGE_KEY, STARTER_INTENT_TTL_MS } from '../../src/lib/starter-intent'

const text = '  Piano leads.\nLeave room for the vocal.  '
const notes = `${text}\n\nExample directions: Cinematic, Warm vocals, Indie soul`

test.afterEach(async ({ page }) => {
  await page.goto('about:blank', { waitUntil: 'commit', timeout: 10_000 })
})

test('homepage starter survives login reload, stays authored, and is never replayed after sign-out', async ({ page }) => {
  const compilerRequests: string[] = []
  const urls: string[] = []
  page.on('request', request => {
    urls.push(request.url())
    if (new URL(request.url()).pathname === '/api/generate') compilerRequests.push(request.url())
  })
  await page.goto('/')
  await page.getByLabel('Describe the song you hear').fill(text)
  for (const label of ['Cinematic', 'Warm vocals', 'Indie soul']) await page.getByRole('button', { name: label, exact: true }).click()
  await page.getByRole('button', { name: 'Build Prompt', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!).text, STARTER_INTENT_STORAGE_KEY)).toBe(text)
  await page.reload()
  await login(page)
  await expect(page.getByLabel('Relationship notes')).toHaveValue(notes)
  await expect(page.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
  await expect(page.getByText('Collect nodes to begin.')).toBeVisible()
  expect(await page.evaluate(key => sessionStorage.getItem(key), STARTER_INTENT_STORAGE_KEY)).toBeNull()
  expect(compilerRequests).toEqual([])
  expect(urls.some(url => url.includes(encodeURIComponent(text)) || url.includes('Piano%20leads'))).toBe(false)

  const edited = 'Keep this newer workspace direction.'
  await page.getByLabel('Relationship notes').fill(edited)
  await page.goBack()
  await expect(page).toHaveURL(/\/login$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/workspace$/)
  // Existing routing may retain or remount the workspace. Full draft persistence
  // is not part of this handoff, but the consumed starter must never replay.
  await expect(page.getByLabel('Relationship notes')).not.toHaveValue(notes)
  expect(['', edited]).toContain(await page.getByLabel('Relationship notes').inputValue())

  // Even a newly pending local starter must be discarded when signing out.
  await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({
    version: 1, text: 'Pending private idea.', examples: [], createdAt: Date.now(), ownerId: null,
  })), STARTER_INTENT_STORAGE_KEY)
  await page.getByRole('button', { name: 'Sign Out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(key => sessionStorage.getItem(key), STARTER_INTENT_STORAGE_KEY)).toBeNull()
  await login(page)
  await expect(page.getByLabel('Relationship notes')).toHaveValue('')
  expect(compilerRequests).toEqual([])
})

test('signed-in homepage starter reaches workspace directly without generating or selecting nodes', async ({ page }) => {
  await login(page)
  await page.goto('/')
  await page.getByLabel('Describe the song you hear').fill(text)
  await page.getByRole('button', { name: 'Warm vocals', exact: true }).click()
  let requests = 0
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/generate') requests += 1 })
  await page.getByRole('button', { name: 'Build Prompt', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace$/)
  await expect(page.getByLabel('Relationship notes')).toHaveValue(`${text}\n\nExample directions: Warm vocals`)
  await expect(page.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
  expect(requests).toBe(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Build Prompt', exact: true })).toBeEnabled()
  await expect(page.getByLabel('Describe the song you hear')).toBeEnabled()
})

test('login cannot attach a starter owned by another account', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({
    version: 1, text: 'Other account idea.', examples: ['Cinematic'], createdAt: Date.now(), ownerId: 'different-fixture-account',
  })), STARTER_INTENT_STORAGE_KEY)
  await login(page)
  await expect(page.getByLabel('Relationship notes')).toHaveValue('')
  expect(await page.evaluate(key => sessionStorage.getItem(key), STARTER_INTENT_STORAGE_KEY)).toBeNull()
})

test('expired starter is not revived by a successful login', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(({ key, ttl }) => sessionStorage.setItem(key, JSON.stringify({
    version: 1, text: 'Expired idea.', examples: [], createdAt: Date.now() - ttl, ownerId: null,
  })), { key: STARTER_INTENT_STORAGE_KEY, ttl: STARTER_INTENT_TTL_MS })
  await login(page)
  await expect(page.getByLabel('Relationship notes')).toHaveValue('')
  expect(await page.evaluate(key => sessionStorage.getItem(key), STARTER_INTENT_STORAGE_KEY)).toBeNull()
})

test('blocked session storage keeps the authored form visible instead of silently navigating', async ({ page }) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Local fixture storage denial', 'SecurityError')
      return original.call(this, name, value)
    }
  }, STARTER_INTENT_STORAGE_KEY)
  await page.goto('/')
  await page.getByLabel('Describe the song you hear').fill(text)
  await page.getByRole('button', { name: 'Build Prompt', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Start your Sound Brain idea' }).getByRole('alert')).toContainText('Your browser couldn’t save this idea')
  await expect(page.getByLabel('Describe the song you hear')).toHaveValue(text)
  await expect(page.getByRole('button', { name: 'Build Prompt', exact: true })).toBeEnabled()
  await expect(page).toHaveURL(/\/$/)
})
