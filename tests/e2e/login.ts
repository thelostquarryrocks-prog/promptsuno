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

// The Sound step now opens with the song description above the collector, so the
// drifting nodes start below the fold. Scroll to the scene and point at it, as a
// person would; pointing pauses the drift so drags aim at a stable node.
export async function revealSoundScene(page: Page) {
  const scene = page.getByTestId('sound-brain-scene')
  await scene.scrollIntoViewIfNeeded()
  await scene.hover()
}
