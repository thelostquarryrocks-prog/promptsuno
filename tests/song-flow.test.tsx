import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from '../src/components/Workspace'
import { getSoundBrainDiscovery, getSoundBrainMentionAliases } from '../src/lib/sound-brain-catalog'

const auth = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../src/lib/supabase/client', () => ({
  createClient: () => ({ auth: {
    getSession: auth.getSession,
    getUser: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  } }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('next/dynamic', async () => {
  const { default: Canvas } = await import('../src/components/SoundBrainCanvas')
  return { default: () => Canvas }
})

const { nodes: catalogNodes, affinities } = getSoundBrainDiscovery()
const nodes = catalogNodes.slice(0, 12)
const fetchMock = vi.fn()

beforeEach(() => {
  sessionStorage.clear()
  auth.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'flow-test-owner' } } }, error: null })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

async function renderFlow() {
  const user = userEvent.setup()
  render(<Workspace discoveryNodes={nodes} affinities={affinities} mentionAliases={getSoundBrainMentionAliases()} />)
  await waitFor(() => expect(auth.getSession).toHaveBeenCalled())
  return user
}

describe('four-step song flow', () => {
  it('offers the four steps in order and marks the current one', async () => {
    const user = await renderFlow()
    const nav = screen.getByRole('navigation', { name: 'Song tools' })
    expect(within(nav).getAllByRole('button').map(button => button.textContent)).toEqual(['1Sound', '2Lyrics', '3Send to Suno', '4Fix'])
    expect(screen.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Continue to lyrics' }))
    expect(screen.getByRole('button', { name: 'Lyrics' })).toHaveAttribute('aria-current', 'page')
    await user.click(await screen.findByRole('button', { name: 'Continue to Send to Suno' }))
    expect(screen.getByRole('button', { name: 'Send to Suno' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Listened? Fix what missed' }))
    expect(screen.getByRole('button', { name: 'Fix' })).toHaveAttribute('aria-current', 'page')
  })

  it('suggests exact catalog sounds from the description and adds them only on request', async () => {
    const user = await renderFlow()
    await user.type(screen.getByLabelText('Describe your song'), 'Dark synthwave where piano leads')
    const found = screen.getByRole('group', { name: /Found in your description/ })
    expect(within(found).getByRole('button', { name: 'Add Piano from your description' })).toBeInTheDocument()
    expect(screen.getByText('Collect nodes to begin.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Piano from your description' }))
    expect(screen.getByText('1 node selected.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add Piano from your description' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add all 2' }))
    expect(screen.getByText('3 nodes selected.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Found in your description/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Describe your song')).toHaveValue('Dark synthwave where piano leads')
  })

  it('builds a Suno-ready card with a non-AI quick draft and per-field copy', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const user = await renderFlow()
    await user.type(screen.getByLabelText('Describe your song'), 'piano and synthwave')
    await user.click(screen.getByRole('button', { name: 'Add all 2' }))
    await user.click(screen.getByRole('button', { name: 'Send to Suno' }))
    const card = screen.getByRole('region', { name: 'Send to Suno' })
    expect(within(card).getByRole('link', { name: /Open Suno/ })).toHaveAttribute('href', 'https://suno.com/create')
    expect(within(card).getByRole('button', { name: 'Copy styles' })).toBeDisabled()
    await user.click(within(card).getByRole('button', { name: 'Use quick draft' }))
    expect(within(card).getByLabelText('Styles to paste')).toHaveTextContent('Synthwave, Piano')
    expect(fetchMock).not.toHaveBeenCalled()
    await user.click(within(card).getByRole('button', { name: 'Copy styles' }))
    expect(writeText).toHaveBeenCalledWith('Synthwave, Piano')
    expect(within(card).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sound' }))
    expect(screen.getByLabelText('Editable Styles prompt')).toHaveValue('Synthwave, Piano')
  })

  it('points empty fields at the step that fills them', async () => {
    const user = await renderFlow()
    await user.click(screen.getByRole('button', { name: 'Send to Suno' }))
    const card = screen.getByRole('region', { name: 'Send to Suno' })
    expect(within(card).getByText(/turn on its Instrumental switch/)).toBeInTheDocument()
    await user.click(within(card).getByRole('button', { name: 'Write lyrics' }))
    expect(screen.getByRole('button', { name: 'Lyrics' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Send to Suno' }))
    await user.click(screen.getByRole('button', { name: 'Choose sounds' }))
    expect(screen.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-current', 'page')
  })

  it('leads with the quick draft once the prompt writer reports unavailable', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    const user = await renderFlow()
    await user.click(screen.getByText('Choose nodes without dragging'))
    await user.click(screen.getByRole('button', { name: 'Collect Piano' }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('quick draft in Send to Suno')
    await user.click(screen.getByRole('button', { name: 'Send to Suno' }))
    const card = screen.getByRole('region', { name: 'Send to Suno' })
    expect(within(card).getByText(/isn’t available right now/)).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Generate prompt' })).not.toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Use quick draft' })).toBeInTheDocument()
  })
})
