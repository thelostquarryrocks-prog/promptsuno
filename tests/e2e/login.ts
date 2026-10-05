import { expect, type Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  const email = page.getByLabel('Email address')
  const password = page.getByLabel('Password')
  await expect(email).toBeEnabled({ timeout: 30_000 })
  await email.fill('test@example.invalid')
  await password.fill('local-test-only')
  await expect(email).toHaveValue('test@example.invalid')
  await expect(password).toHaveValue('local-test-only')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace$/, { timeout: 30_000 })
  await expect(page.getByText('Choose nodes without dragging')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('sound-brain-scene')).toBeVisible({ timeout: 30_000 })
}
