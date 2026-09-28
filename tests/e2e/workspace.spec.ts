import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { CompilerInput } from '../../src/lib/compiler-contract'

const nodes = [
  { node_id: 'aggressive', label: 'Aggressive', category: 'Energy' },
  { node_id: 'dreamy-ambient', label: 'Dreamy Ambient', category: 'Genre' },
  { node_id: 'piano', label: 'Piano', category: 'Instrument' },
]
const notes = 'Piano leads.\nKeep aggressive dreamy contrast without added drums.'
const styles = 'Foreground piano with an aggressive attack inside a dreamy ambient setting.'

async function login(page: Page) {
  // Wait for login's client code before typing into server-rendered inputs.
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Email address').fill('test@example.invalid')
  await page.getByLabel('Password').fill('local-test-only')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace$/)
  await expect(page.getByText('Choose nodes without dragging')).toBeVisible()
}

test('selection, authored notes, loading, error retry, clarification, edited copy/export, and keyboard removal', async ({ page, context }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('status of 502')) errors.push(message.text()) })
  await login(page)
  await expect(page.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  expect(await canvas.evaluate(element => Boolean((element as HTMLCanvasElement).getContext('webgl2')))).toBe(true)
  await page.getByText('Choose nodes without dragging').click()
  for (const node of nodes) await page.getByRole('button', { name: `Collect ${node.label}`, exact: true }).click()
  await expect(page.getByText('3 nodes selected.')).toBeVisible()
  for (const node of nodes) {
    await expect(page.locator(`[data-node-id="${node.node_id}"]`)).toContainText(node.label)
    await expect(page.getByRole('button', { name: `Collect ${node.label}`, exact: true })).toBeDisabled()
  }
  await page.getByLabel('Relationship notes').fill(notes)
  const submitted: CompilerInput[] = []
  let release!: () => void
  let call = 0
  await page.route('**/api/generate', async route => {
    submitted.push(route.request().postDataJSON())
    call += 1
    if (call === 1) {
      await new Promise<void>(resolve => { release = resolve })
      await route.fulfill({ status: 502, json: { error: 'Failed to compile intent' } })
    } else if (call === 2) {
      await route.fulfill({ json: { version: '1.0.0', status: 'needs_clarification', styles: '', coverage: nodes.map(node => ({ node_id: node.node_id, status: 'unresolved' })), interpretations: [], questions: ['Should the foreground piano be dry or reverberant?'] } })
    } else {
      await route.fulfill({ json: { version: '1.0.0', status: 'ready', styles, coverage: nodes.map(node => ({ node_id: node.node_id, status: 'preserved' })), interpretations: [], questions: [] } })
    }
  })
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await expect(page.getByRole('button', { name: 'Crafting Prompt…' })).toBeDisabled()
  await expect(page.getByLabel('Relationship notes')).toHaveValue(notes)
  await expect(page.getByLabel('Relationship notes')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Remove Piano' })).toBeDisabled()
  await expect.poll(() => submitted.length).toBe(1)
  release()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Your nodes and notes are still here')
  await expect(page.getByRole('button', { name: 'Copy to Clipboard' })).toHaveCount(0)
  await expect(page.getByText('3 nodes selected.')).toBeVisible()
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await expect(page.getByText('Should the foreground piano be dry or reverberant?')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export Styles' })).toHaveCount(0)
  await page.getByLabel('Relationship notes').fill(`${notes}\nKeep foreground piano dry.`)
  await page.getByRole('button', { name: 'Compile with clarification' }).click()
  await expect(page.getByLabel('Editable Styles prompt')).toHaveValue(styles)
  expect(submitted).toEqual([
    { nodes, relationship_notes: notes },
    { nodes, relationship_notes: notes },
    { nodes, relationship_notes: `${notes}\nKeep foreground piano dry.` },
  ])
  const edited = `${styles}\nPiano stays dry.`
  await page.getByLabel('Editable Styles prompt').fill(edited)
  // Chromium provides readable browser clipboard permissions; WebKit uses a
  // clipboard boundary stub. The downloaded file is real in every project.
  if (testInfo.project.name.includes('chromium')) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Copy to Clipboard' }).click()
    await expect(page.getByText('Copied to clipboard.')).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    // Windows' native clipboard normalizes LF to CRLF. Compare textual content;
    // the exported file below is still checked byte-for-byte against the edit.
    expect(copied.replace(/\r\n/g, '\n')).toBe(edited)
  } else {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { document.documentElement.dataset.copiedStyles = value } } })
    })
    await page.getByRole('button', { name: 'Copy to Clipboard' }).click()
    expect(await page.evaluate(() => document.documentElement.dataset.copiedStyles)).toBe(edited)
  }
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Styles' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('promptsuno-styles.txt')
  expect(await readFile((await download.path())!, 'utf8')).toBe(edited)
  await page.screenshot({ path: testInfo.outputPath('workspace-ready.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.locator('[data-nextjs-dialog]').count()).toBe(0)
  await page.getByRole('button', { name: 'Remove Piano' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('2 nodes selected.')).toBeVisible()
  await expect(page.getByLabel('Editable Styles prompt')).toHaveCount(0)
  await expect(page.getByLabel('Relationship notes')).toHaveValue(`${notes}\nKeep foreground piano dry.`)
  expect(errors).toEqual([])
})

test('network and malformed-output errors preserve intent and never expose copy/export', async ({ page }) => {
  await login(page)
  await page.getByText('Choose nodes without dragging').click()
  await page.getByRole('button', { name: 'Collect Piano', exact: true }).click()
  await page.getByLabel('Relationship notes').fill('Piano leads.')
  await page.route('**/api/generate', route => route.abort('failed'))
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  await page.unroute('**/api/generate')
  await page.route('**/api/generate', route => route.fulfill({ json: { version: '1.0.0', status: 'ready', styles: 'Wrong coverage', coverage: [{ node_id: 'invented', status: 'preserved' }], interpretations: [], questions: [] } }))
  await page.getByRole('button', { name: 'Generate Prompt' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('invalid result')
  await expect(page.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
  await expect(page.getByLabel('Relationship notes')).toHaveValue('Piano leads.')
  await expect(page.getByRole('button', { name: 'Copy to Clipboard' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Export Styles' })).toHaveCount(0)
})

test('real raycast drag collects a catalog record and synchronizes removal', async ({ page }, testInfo) => {
  await login(page)
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.getByRole('slider', { name: 'Speed', exact: true }).focus()
  await page.keyboard.press('Home')
  await canvas.scrollIntoViewIfNeeded()
  await expect.poll(() => canvas.boundingBox()).not.toBeNull()
  const box = (await canvas.boundingBox())!
  let caught = false
  // Find a real raycast target by its existing grab cursor, without a test-only
  // scene API or replacing Three.js. Scan a bounded area outside the Brain.
  for (let y = 40; y < box.height - 20 && !caught; y += 25) {
    for (let x = 25; x < box.width - 20 && !caught; x += 30) {
      await page.mouse.move(box.x + x, box.y + y)
      if (await page.evaluate(() => document.body.style.cursor) !== 'grab') continue
      await page.mouse.down()
      await page.waitForTimeout(80)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 })
      await page.waitForTimeout(400)
      await page.mouse.up()
      caught = await page.getByText('1 node selected.', { exact: true }).isVisible()
    }
  }
  expect(caught, 'A real floating node should be draggable into the Brain').toBe(true)
  const chip = page.locator('[data-node-id]')
  await expect(chip).toHaveCount(1)
  const id = await chip.getAttribute('data-node-id')
  const selected = page.locator('details button').filter({ hasText: (await chip.innerText()).replace('×', '').trim() })
  await expect(selected).toBeDisabled()
  await page.screenshot({ path: testInfo.outputPath('workspace-drag-collected.png') })
  await chip.getByRole('button').click()
  await expect(page.locator(`[data-node-id="${id}"]`)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
})
