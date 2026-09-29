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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn musical instinct')
  await expect(page.getByRole('heading', { name: 'Lyrics Studio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Prompt Doctor' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('homepage stays readable across the required responsive matrix', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One Chromium run owns the explicit viewport matrix.')

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /open sound brain/i }).first()).toBeVisible()
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

  const primary = page.getByRole('link', { name: /open sound brain/i }).first()
  await primary.focus()
  expect(await primary.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')

  const animatedCore = page.locator('[class*="brainCore"]').first()
  const duration = await animatedCore.evaluate(element => getComputedStyle(element).animationDuration)
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001)
})
