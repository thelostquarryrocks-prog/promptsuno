import { expect, test } from './test'
import { login } from './login'

test('category changes preserve selected records, exact notes and the compiler payload', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Instrument', exact: true }).click()
  await page.getByText('Choose nodes without dragging').click()
  await page.getByRole('button', { name: 'Collect Piano', exact: true }).click()
  const notes = '  Piano leads.\nKeep the contrast exactly.  '
  await page.getByLabel('Relationship notes').fill(notes)
  await page.getByRole('button', { name: 'Genre', exact: true }).click()
  await expect(page.locator('[data-stream-node]:not([data-category="Genre"])')).toHaveCount(0)
  await page.getByRole('button', { name: 'Collect Synthwave', exact: true }).click()
  await page.getByRole('button', { name: 'Collect Dreamy Ambient', exact: true }).click()
  await page.getByRole('button', { name: 'Instrument', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Collect Piano', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Relationship notes')).toHaveValue(notes)
  await page.route('**/api/generate', async route => {
    expect(route.request().postDataJSON()).toEqual({ nodes: [
      { node_id: 'piano', label: 'Piano', category: 'Instrument' },
      { node_id: 'synthwave', label: 'Synthwave', category: 'Genre' },
      { node_id: 'dreamy-ambient', label: 'Dreamy Ambient', category: 'Genre' },
    ], relationship_notes: notes })
    await route.fulfill({ status: 503, json: { error: 'unavailable' } })
  })
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Relationship notes')).toHaveValue(notes)
  await expect(page.locator('[data-node-id]')).toHaveCount(3)
})

test('queued category changes and lost capture never collect a cancelled drag', async ({ page }) => {
  await login(page)
  const node = page.locator('[data-stream-node]').first()
  const box = (await node.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  // A keyboard category change can occur while another pointer owns the drag.
  await page.getByRole('button', { name: 'Mood', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Finish your drag to explore Mood.')).toBeVisible()
  await node.evaluate(element => element.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true })))
  await page.mouse.up()
  await expect(page.getByRole('button', { name: 'Mood', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-node-id]')).toHaveCount(0)
  await expect(page.locator('[data-stream-node]:not([data-category="Mood"])')).toHaveCount(0)
})

test('reduced motion preserves keyboard collection and responsive layout', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await login(page)
  await page.getByRole('button', { name: 'Genre', exact: true }).click()
  const node = page.locator('[data-stream-node]').first()
  await node.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-node-id]')).toHaveCount(1)
  expect(await node.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('workspace-overhaul.png'), fullPage: true })
  for (const category of ['Genre', 'Mood', 'Instrument', 'Vocal', 'Rhythm', 'Texture', 'Production', 'Structure', 'Energy', 'Era']) {
    await page.getByRole('button', { name: category, exact: true }).click()
    await expect(page.locator(`[data-stream-node]:not([data-category="${category}"])`)).toHaveCount(0)
    expect(await page.locator('[data-stream-node]').count()).toBeGreaterThan(0)
  }
  await page.setViewportSize({ width: 320, height: 800 })
  await page.getByLabel('Density', { exact: true }).fill('2')
  await expect(page.locator('[data-stream-node]')).toHaveCount(8)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('workspace-narrow-density.png'), fullPage: true })
})

test('native touch drags, cancellation and category scrolling are independent', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'CDP trusted touch dispatch is Chromium-only; WebKit keyboard and pointer coverage runs separately.')
  await login(page)
  const session = await context.newCDPSession(page)
  const node = page.locator('[data-stream-node]').first()
  await node.scrollIntoViewIfNeeded()
  let box = (await node.boundingBox())!
  let orb = (await page.getByTestId('brain-orb').boundingBox())!
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: orb.x + orb.width / 2, y: orb.y + orb.height / 2 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(page.locator('[data-node-id]')).toHaveCount(0)
  box = (await node.boundingBox())!
  orb = (await page.getByTestId('brain-orb').boundingBox())!
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] })
  for (let step = 1; step <= 8; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width / 2 + (orb.x + orb.width / 2 - box.x - box.width / 2) * step / 8, y: box.y + box.height / 2 + (orb.y + orb.height / 2 - box.y - box.height / 2) * step / 8 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('[data-node-id]')).toHaveCount(1)
  const categories = page.getByRole('group', { name: 'Style categories' })
  await categories.scrollIntoViewIfNeeded()
  const row = (await categories.boundingBox())!
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: row.x + row.width - 20, y: row.y + 25 }] })
  for (let step = 1; step <= 8; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: row.x + row.width - 20 - step * 30, y: row.y + 25 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => categories.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await expect(page.locator('[data-node-id]')).toHaveCount(1)
  await session.detach()
})
