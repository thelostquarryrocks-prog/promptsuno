import { expect, test } from "@playwright/test"

test("core lesson content is present in the server response", async ({ request }) => {
  const response = await request.get("/learn/style-prompts")
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain("How do I write a better Suno style prompt?")
  expect(html).toContain("Start with three useful decisions")
  expect(html).toContain("Suno documents musical terms")
  expect(html).toContain("Sources &amp; testing notes")
})

test("lesson navigation and contextual coaching work without horizontal overflow", async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/learn", { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { name: "Get the answer. Then hear the difference." })).toBeVisible()
  const signalAnimationDuration = await page.locator('[class*="signalGraphic"] span').first().evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).animationDuration)
  })
  expect(signalAnimationDuration).toBeLessThan(0.001)
  const indexHasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(indexHasOverflow).toBe(false)
  if (process.env.LEARN_CAPTURE === "1") {
    await page.screenshot({
      path: `.verification/learn-review-${testInfo.project.name}-index.png`,
      fullPage: true,
    })
  }
  await page.getByRole("link", { name: /Write clearer style prompts/ }).click()
  await expect(page).toHaveURL(/\/learn\/style-prompts$/)
  await expect(page.getByRole("heading", { name: "Write clearer style prompts" })).toBeVisible()

  const monkeyButton = page.getByRole("button", { name: /Open Monkey Method: The three-lane prompt/ })
  await monkeyButton.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByText(/Use one lane for musical identity/)).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(monkeyButton).toBeFocused()
  await expect(monkeyButton).toHaveAttribute("aria-expanded", "false")

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(hasOverflow).toBe(false)
  expect(errors).toEqual([])

  if (process.env.LEARN_CAPTURE === "1") {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.addStyleTag({ content: 'a[href="#learn-content"] { display: none !important; }' })
    await page.screenshot({
      path: `.verification/learn-review-${testInfo.project.name}-topic.png`,
      fullPage: true,
    })
  }
})
