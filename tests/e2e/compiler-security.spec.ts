import { expect, test } from '@playwright/test'
import { login } from './login'

const input = {
  nodes: [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }],
  relationship_notes: '  Piano leads.\nKeep [Verse], 127 BPM; 日本語?!  ',
}

test('real route rejects absent/forged/expired sessions and malformed requests without model calls', async ({ context, request }) => {
  const stats = async () => (await request.get('http://127.0.0.1:3132/__fixture/stats')).json()
  const before = (await stats()).modelCalls
  const anonymous = await context.request.post('/api/generate', { data: input, headers: { 'x-user-id': 'forged' } })
  expect(anonymous.status()).toBe(401)
  expect(anonymous.headers()['cache-control']).toContain('no-store')

  // Real Supabase SSR cookie decoding and Auth HTTP calls, with simulated Auth responses.
  for (const expired of [false, true]) {
    const session = {
      access_token: 'forged.fixture.token', refresh_token: 'invalid-fixture-refresh',
      expires_at: Math.floor(Date.now() / 1000) + (expired ? -3600 : 3600),
      token_type: 'bearer', user: { id: 'forged-client-user' },
    }
    await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, url: 'http://127.0.0.1:3131' }])
    expect((await context.request.post('/api/generate', { data: input })).status()).toBe(401)
    await context.clearCookies()
  }
  expect((await stats()).modelCalls).toBe(before)
})

test('browser session reaches the guarded compiler; revoked session preserves notes with no model call', async ({ page, context, request }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('status of 401')) errors.push(message.text())
  })
  const stats = async () => (await request.get('http://127.0.0.1:3132/__fixture/stats')).json()
  await login(page)
  await page.getByText('Choose nodes without dragging').click()
  await page.getByRole('button', { name: 'Collect Piano', exact: true }).click()
  await page.getByLabel('Relationship notes').fill(input.relationship_notes)
  const before = (await stats()).modelCalls
  const response = page.waitForResponse('**/api/generate')
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  expect((await response).status()).toBe(200)
  await expect(page.getByLabel('Editable Styles prompt')).toHaveValue('Fixture Styles from exact authored intent.')
  expect(await stats()).toMatchObject({ modelCalls: before + 1, lastIntent: input })

  // No route interception: these requests go through the built Next.js route.
  for (const invalid of [{ ...input, user_id: 'forged' }, { ...input, relationship_notes: 'x'.repeat(16385) }, { ...input, affinities: { piano: 1 } }]) {
    expect((await context.request.post('/api/generate', { data: invalid })).status()).toBe(400)
  }
  expect((await context.request.post('/api/generate', { data: '{', headers: { 'content-type': 'application/json' } })).status()).toBe(400)
  expect((await context.request.post('/api/generate', { data: input, headers: { origin: 'https://attacker.invalid' } })).status()).toBe(403)
  expect((await context.request.post('/api/generate', { data: ' '.repeat(262145), headers: { 'content-type': 'application/json' } })).status()).toBe(413)
  expect((await stats()).modelCalls).toBe(before + 1)

  await request.post('http://127.0.0.1:3132/__fixture/revoke')
  const rejected = page.waitForResponse('**/api/generate')
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  expect((await rejected).status()).toBe(401)
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Your nodes and notes are still here')
  await expect(page.getByLabel('Relationship notes')).toHaveValue(input.relationship_notes)
  await expect(page.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
  await page.getByLabel('Relationship notes').focus()
  await expect(page.getByLabel('Relationship notes')).toBeFocused()
  expect((await stats()).modelCalls).toBe(before + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('compiler-session-rejected.png') })
  expect(errors).toEqual([])
})
