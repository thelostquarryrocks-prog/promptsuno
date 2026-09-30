import { expect, test as base } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(Navigator.prototype, 'serviceWorker')
    })
    await run(page)
  },
})

export { expect }
