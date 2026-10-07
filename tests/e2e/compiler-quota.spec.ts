import type { APIRequestContext, BrowserContext } from '@playwright/test'
import { expect, test } from './test'

const input = {
  nodes: [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }],
  relationship_notes: '  Piano foreground. Preserve 日本語 and punctuation?!  ',
}

async function signInFixture(context: BrowserContext, request: APIRequestContext) {
  const login = await request.post('http://127.0.0.1:3132/auth/v1/token?grant_type=password')
  const session = { ...await login.json(), expires_at: Math.floor(Date.now() / 1000) + 3600 }
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, url: 'http://127.0.0.1:3131' }])
}

test.afterEach(async ({ page, request }) => {
  await page.goto('about:blank', { waitUntil: 'commit', timeout: 10_000 })
  await request.post('http://127.0.0.1:3132/__fixture/quota')
  await request.post('http://127.0.0.1:3132/__fixture/spend')
})

test('shared aggregate ceiling blocks Assist after a failed Compile without another model call', async ({ page, context, request }) => {
  await request.post('http://127.0.0.1:3132/__fixture/quota?mode=provider-failure')
  await request.post('http://127.0.0.1:3132/__fixture/spend?limit=1')
  await signInFixture(context,request)
  const before=(await(await request.get('http://127.0.0.1:3132/__fixture/stats')).json()).modelCalls
  expect((await context.request.post('/api/generate',{data:input})).status()).toBe(502)
  await page.goto('/workspace')
  await page.getByRole('button',{name:'Lyrics',exact:true}).click()
  await page.getByRole('button',{name:'+ Verse',exact:true}).click()
  await page.getByLabel('Verse lyrics',{exact:true}).fill('Keep this line\nOld ending')
  await page.getByLabel('What would you like to change in this section?').fill('Change the ending.')
  const response=page.waitForResponse('**/api/workspace-assist')
  await page.getByRole('button',{name:'Suggest a section revision',exact:true}).click()
  expect((await response).status()).toBe(503)
  await expect(page.getByText('Assistance is unavailable. Your song is unchanged.')).toBeVisible()
  await expect(page.getByLabel('Verse lyrics',{exact:true})).toHaveValue('Keep this line\nOld ending')
  expect(await(await request.get('http://127.0.0.1:3132/__fixture/stats')).json()).toMatchObject({modelCalls:before+1,spendUsed:1,quotaUsed:1})
})

test('quota and provider errors retain intent and show retry guidance in the real browser', async ({ page, context, request }, testInfo) => {
  await page.clock.install()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !/status of (429|502|503)/.test(message.text())) errors.push(message.text())
  })
  await request.post('http://127.0.0.1:3132/__fixture/quota?limit=1&mode=provider-failure')
  const stats = async () => (await request.get('http://127.0.0.1:3132/__fixture/stats')).json()
  const before = (await stats()).modelCalls
  // Establish the simulated Auth session before testing quota behavior. The
  // existing compiler-security suite separately exercises browser sign-in.
  await signInFixture(context, request)
  // The live Canvas keeps loading resources; readiness is the visible controls,
  // not an idle network. The collection click below waits for those controls.
  await page.goto('/workspace', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/workspace$/, { timeout: 30_000 })
  await page.getByText('Choose nodes without dragging').click()
  await page.getByRole('button', { name: 'Collect Piano', exact: true }).click()
  await page.getByLabel('Relationship notes').fill(input.relationship_notes)
  // This case exercises real HTTP reservations and UI feedback, not animation.
  // Hold unrelated software-rendered frames; server deadlines stay wall-clock.
  // pauseAt fast-forwards due timers once rather than waiting a real minute.
  // The buffer exceeds slow protocol round trips without extending a deadline.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000))
  const generate = page.getByRole('button', { name: 'Generate Prompt' })
  const failed = page.waitForResponse('**/api/generate')
  await generate.click()
  const failedResponse = await failed
  expect(failedResponse.status()).toBe(502)
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Your nodes and notes are still here')
  expect(await stats()).toMatchObject({ modelCalls: before + 1, quotaUsed: 1 })

  const exhausted = page.waitForResponse('**/api/generate')
  await generate.focus()
  await page.keyboard.press('Enter')
  const response = await exhausted
  expect(response.status()).toBe(429)
  expect(response.headers()['retry-after']).toBe('60')
  expect(response.headers()['cache-control']).toBe('private, no-store')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Try again in 60 seconds')
  await expect(page.getByLabel('Relationship notes')).toHaveValue(input.relationship_notes)
  await expect(page.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
  await expect(generate).toBeFocused()
  expect(await stats()).toMatchObject({ modelCalls: before + 1, quotaUsed: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  // Artifact framing must not wait for WebKit's animation-frame stability while
  // the live WebGL scene runs. All state/focus assertions above remain intact.
  await page.getByRole('main').getByRole('alert').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.screenshot({ path: testInfo.outputPath('compiler-quota-exhausted.png'), timeout: 10_000 })

  for (const mode of ['missing-policy', 'store-error']) {
    await request.post(`http://127.0.0.1:3132/__fixture/quota?mode=${mode}`)
    const unavailable = page.waitForResponse('**/api/generate')
    await generate.click()
    expect((await unavailable).status()).toBe(503)
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Your nodes and notes are still here')
    expect((await stats()).modelCalls).toBe(before + 1)
  }
  expect(errors).toEqual([])
})

test('concurrent real API requests honor shared quota decisions without excess model calls', async ({ context, request }) => {
  await request.post('http://127.0.0.1:3132/__fixture/quota?limit=2')
  await signInFixture(context, request)
  const before = (await (await request.get('http://127.0.0.1:3132/__fixture/stats')).json()).modelCalls
  const responses = await Promise.all(Array.from({ length: 8 }, () => context.request.post('/api/generate', { data: input })))
  expect(responses.filter(response => response.status() === 200)).toHaveLength(2)
  expect(responses.filter(response => response.status() === 429)).toHaveLength(6)
  expect(await (await request.get('http://127.0.0.1:3132/__fixture/stats')).json()).toMatchObject({ modelCalls: before + 2, quotaUsed: 2 })
})
