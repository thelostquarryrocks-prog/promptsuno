import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'narrow-mobile', width: 320, height: 740 },
  { name: 'iphone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 1000 },
]

test('homepage communicates the product with crawlable metadata and no runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

  await page.goto('/')
  await expect(page).toHaveTitle('PromptSuno — Build better ideas for Suno')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Explore musical ideas/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://promptsuno.com')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn your ideas')
  await expect(page.getByRole('heading', { name: 'LEARN', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'FIX', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Learn' }).first()).toHaveAttribute('href', '/learn')
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('workspace keeps its existing anonymous sign-in boundary', async ({ page }) => {
  await page.goto('/workspace')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Sign in to your workspace')).toBeVisible()
})

test('homepage stays readable across the required responsive matrix', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One Chromium run owns the explicit viewport matrix.')

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /join early access/i }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), viewport.name).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`homepage-${viewport.name}.png`), fullPage: true })
  }
})

test('homepage supports keyboard focus and reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One Chromium run owns keyboard and motion verification.')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)

  const primary = page.getByRole('link', { name: /join early access/i }).first()
  await primary.focus()
  expect(await primary.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')

  const heroAction = page.getByRole('link', { name: 'Build a Prompt' }).first()
  const duration = await heroAction.evaluate(element => getComputedStyle(element).transitionDuration)
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001)
})

// Interactive coaching is available without auth, with native dialog keyboard handling.
test('banana tips support keyboard, dismissal, and repeated opening', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Open Monkey Method: Start with the part you can hear' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Start with the part you can hear' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Got it' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Got it' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})
