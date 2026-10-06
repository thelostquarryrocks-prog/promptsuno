import { expect, test } from './test'
import { login } from './login'

test('one local song retains exact Brain intent and edited Styles through modes and refresh', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'environment', description: 'Local mocked authentication and compiler response; emulated browser, no paid provider calls.' })
  await login(page)
  await expect(page.getByText('Saved in this tab', { exact: true })).toBeVisible()
  await page.getByLabel('Song title').fill('Quiet windows')
  await page.getByText('Choose nodes without dragging').click()
  await page.getByRole('button', { name: 'Collect Piano', exact: true }).click()
  const notes = '  Piano leads.\nKeep the contrast exactly.  '
  const edited = '  Edited foreground piano.\nLeave the ending open.  '
  await page.getByLabel('Relationship notes').fill(notes)
  let calls = 0
  await page.route('**/api/generate', async route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ nodes: [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }], relationship_notes: notes })
    await route.fulfill({ status: 200, json: { version: '1.0.0', status: 'ready', styles: 'Foreground piano.', coverage: [{ node_id: 'piano', status: 'preserved' }], interpretations: [], questions: [] } })
  })
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await page.getByLabel('Editable Styles prompt').fill(edited)
  await page.getByRole('button', { name: 'Lyrics', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lyrics Studio', exact: true })).toBeVisible()
  await expect(page.getByTestId('brain-orb')).toBeHidden()
  await page.getByRole('button', { name: 'Doctor', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Doctor', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByLabel('Song title')).toHaveValue('Quiet windows')
  await page.getByRole('button', { name: 'Brain', exact: true }).click()
  await expect(page.getByLabel('Relationship notes')).toHaveValue(notes)
  await expect(page.getByLabel('Editable Styles prompt')).toHaveValue(edited)
  await expect(page.locator('[data-node-id="piano"]')).toHaveCount(1)
  expect(calls).toBe(1)
  expect(new URL(page.url()).search).toBe('')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('workspace-shared-local-mocked-auth.png'), fullPage: true })
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('promptsuno:workspace:')))).toEqual([])
  await login(page)
  await expect(page.getByLabel('Relationship notes')).toHaveValue('')
  await expect(page.getByLabel('Editable Styles prompt')).toHaveCount(0)
})
