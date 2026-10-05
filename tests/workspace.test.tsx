import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from '../src/components/Workspace'
import SoundBrainCanvas from '../src/components/SoundBrainCanvas'
import { getSoundBrainDiscovery } from '../src/lib/sound-brain-catalog'
import type { CompilerInput, SelectedNode } from '../src/lib/compiler-contract'
import { STARTER_INTENT_STORAGE_KEY } from '../src/lib/starter-intent'

type LocalSession = { user: { id: string } } | null
const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  listeners: new Set<(event: string, session: LocalSession) => void>(),
}))
vi.mock('../src/lib/supabase/client', () => ({
  createClient: () => ({ auth: {
    getSession: auth.getSession,
    getUser: auth.getUser,
    signOut: auth.signOut,
    onAuthStateChange: (listener: (event: string, session: LocalSession) => void) => {
      auth.listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => auth.listeners.delete(listener) } } }
    },
  } }),
}))

// Collection controls and Workspace are real; only routing and auth are mocked.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('next/dynamic', async () => {
  const { default: Canvas } = await import('../src/components/SoundBrainCanvas')
  return { default: () => Canvas }
})

const { nodes: catalogNodes, affinities } = getSoundBrainDiscovery()
const nodes = catalogNodes.slice(0, 12)
const piano = nodes.find(node => node.node_id === 'piano')!
const aggressive = nodes.find(node => node.node_id === 'aggressive')!
const ambient = nodes.find(node => node.node_id === 'dreamy-ambient')!
const fetchMock = vi.fn()
const ready = (selected: SelectedNode[], styles = 'Piano is foreground in aggressive dreamy ambient.') => ({
  version: '1.0.0', status: 'ready', styles,
  coverage: selected.map(node => ({ node_id: node.node_id, status: 'preserved' })), interpretations: [], questions: [],
})

beforeEach(() => {
  sessionStorage.clear()
  auth.listeners.clear()
  auth.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'workspace-test-owner' } } }, error: null })
  auth.getUser.mockReset()
  auth.signOut.mockReset().mockImplementation(async () => {
    for (const listener of auth.listeners) listener('SIGNED_OUT', null)
    return { error: null }
  })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

function seedStarter(ownerId: string | null = 'workspace-test-owner') {
  sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, JSON.stringify({
    version: 1, text: '  Piano leads.\nLeave space.  ', examples: ['Cinematic', 'Warm vocals'], createdAt: Date.now(), ownerId,
  }))
}

describe('starter handoff and account boundaries', () => {
  it('consumes starter notes once without selecting nodes or calling the compiler', async () => {
    seedStarter()
    const view = render(<Workspace discoveryNodes={nodes} affinities={affinities} />)
    await waitFor(() => expect(screen.getByLabelText('Relationship notes')).toHaveValue('  Piano leads.\nLeave space.  \n\nExample directions: Cinematic, Warm vocals'))
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(auth.getUser).not.toHaveBeenCalled()
    view.unmount()
    renderWorkspace()
    await waitFor(() => expect(auth.getSession).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
  })

  it('does not overwrite notes entered while the local session read is pending', async () => {
    seedStarter()
    let verify!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { verify = resolve }))
    renderWorkspace()
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: 'Keep this newer idea.' } })
    await act(async () => verify({ data: { session: { user: { id: 'workspace-test-owner' } } }, error: null }))
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('Keep this newer idea.')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('does not apply an abandoned anonymous draft or another account’s notes', async () => {
    seedStarter('different-test-owner')
    renderWorkspace()
    await screen.findByText('Your current workspace was kept. The pending starter was not applied.')
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('keeps the draft until the local session is ready and never consumes after unmount', async () => {
    seedStarter()
    let verify!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { verify = resolve }))
    const view = render(<Workspace discoveryNodes={nodes} affinities={affinities} />)
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).not.toBeNull()
    view.unmount()
    await act(async () => verify({ data: { session: { user: { id: 'workspace-test-owner' } } }, error: null }))
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).not.toBeNull()
  })

  it('keeps a pending starter on transient session-read failure with retry guidance', async () => {
    seedStarter()
    auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('offline') })
    renderWorkspace()
    await screen.findByText('Your starter is still saved in this tab. Refresh to try carrying it over again.')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).not.toBeNull()
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
  })

  it.each(['SIGNED_OUT', 'SIGNED_IN'])('clears imported notes and pending drafts on %s account boundaries', async event => {
    seedStarter()
    renderWorkspace()
    await screen.findByText(/Your starter is in Relationship notes/)
    seedStarter()
    act(() => { for (const listener of auth.listeners) listener(event, event === 'SIGNED_OUT' ? null : { user: { id: 'different-test-owner' } }) })
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('cannot apply an in-flight starter after sign-out', async () => {
    seedStarter()
    let verify!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { verify = resolve }))
    const user = renderWorkspace()
    await user.click(screen.getByRole('button', { name: 'Sign Out' }))
    await act(async () => verify({ data: { session: { user: { id: 'workspace-test-owner' } } }, error: null }))
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('cannot restore an old account’s output when an in-flight compile finishes after sign-out', async () => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: 'Private older idea.' } })
    let finish!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    act(() => { for (const listener of auth.listeners) listener('SIGNED_OUT', null) })
    await act(async () => finish(Response.json(ready([piano], 'Private older output.'))))
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
    expect(screen.queryByLabelText('Editable Styles prompt')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
  })
})

function renderWorkspace(discoveryNodes = nodes) {
  const user = userEvent.setup()
  render(<Workspace discoveryNodes={discoveryNodes} affinities={affinities} />)
  return user
}

async function collect(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: `Collect ${label}` }))
}

describe('canonical selection bridge', () => {
  it('makes later catalog records reachable without mounting the entire catalog', async () => {
    const user = userEvent.setup()
    const onCollect = vi.fn()
    render(<SoundBrainCanvas discoveryNodes={catalogNodes} affinities={affinities} selectedNodes={[]} onCollect={onCollect} onRemove={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Genre' }))
    const later = catalogNodes.filter(node => node.category === 'Genre')[24]
    expect(screen.queryByRole('button', { name: `Collect ${later.label}` })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Show more genre styles/ }))
    await user.click(screen.getByRole('button', { name: `Collect ${later.label}` }))
    expect(onCollect).toHaveBeenCalledWith(later)
  })

  it('keeps exact selections and notes across categories and resets discovery at account boundaries', async () => {
    const user = renderWorkspace()
    await waitFor(() => expect(auth.getSession).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Instrument' }))
    await collect(user, 'Piano')
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: '  Piano leads.\nKeep this exact.  ' } })
    await user.click(screen.getByRole('button', { name: 'Genre' }))
    await collect(user, 'Dreamy Ambient')
    await user.click(screen.getByRole('button', { name: 'Instrument' }))
    expect(screen.getByRole('button', { name: 'Collect Piano' })).toBeDisabled()
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('  Piano leads.\nKeep this exact.  ')
    fetchMock.mockResolvedValue(Response.json(ready([piano, ambient])))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await screen.findByLabelText('Editable Styles prompt')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ nodes: [piano, ambient], relationship_notes: '  Piano leads.\nKeep this exact.  ' })
    act(() => { for (const listener of auth.listeners) listener('SIGNED_IN', { user: { id: 'new-owner' } }) })
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Remove Piano' })).not.toBeInTheDocument()
  })

  it('keeps open native collection controls mounted through category transitions', async () => {
    const user = userEvent.setup()
    const onCollect = vi.fn()
    render(<SoundBrainCanvas discoveryNodes={nodes} affinities={affinities} selectedNodes={[]} onCollect={onCollect} onRemove={vi.fn()} />)
    const summary = screen.getByText('Choose nodes without dragging')
    await user.click(summary)
    const details = summary.closest('details')!
    await user.click(screen.getByRole('button', { name: 'Instrument' }))
    expect(details).toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: 'Collect Piano' }))
    expect(onCollect).toHaveBeenCalledWith(piano)
    expect(details).toHaveAttribute('open')
  })

  it('synchronizes collect, duplicate prevention, remove, and recollect with Workspace', async () => {
    const user = renderWorkspace()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
    await collect(user, 'Piano')
    expect(screen.getByText('1 node selected.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collect Piano' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Remove Piano' }))
    expect(screen.getByText('Collect nodes to begin.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeDisabled()
    await collect(user, 'Piano')
    expect(screen.getAllByRole('button', { name: 'Remove Piano' })).toHaveLength(1)
  })

  it('Canvas emits the supplied record and removal ID, and reflects external selection changes', async () => {
    const user = userEvent.setup()
    const onCollect = vi.fn()
    const onRemove = vi.fn()
    const props = { discoveryNodes: nodes, affinities, onCollect, onRemove }
    const view = render(<SoundBrainCanvas {...props} selectedNodes={[]} />)
    await collect(user, 'Piano')
    expect(onCollect).toHaveBeenCalledWith(piano)
    expect(screen.queryByRole('button', { name: 'Remove Piano' })).not.toBeInTheDocument()
    view.rerender(<SoundBrainCanvas {...props} selectedNodes={[piano]} />)
    await user.click(screen.getByRole('button', { name: 'Remove Piano' }))
    expect(onRemove).toHaveBeenCalledWith('piano')
    view.rerender(<SoundBrainCanvas {...props} selectedNodes={[]} />)
    expect(screen.queryByRole('button', { name: 'Remove Piano' })).not.toBeInTheDocument()
  })

  it('never derives IDs from display labels or merges distinct IDs that share a label', async () => {
    const records = [{ node_id: 'opaque-ID/42', label: 'Same label', category: 'Texture' }, { node_id: 'catalog:77', label: 'Same label', category: 'Genre' }]
    const user = renderWorkspace(records)
    const buttons = screen.getAllByRole('button', { name: 'Collect Same label' })
    await user.click(buttons[0])
    await user.click(buttons[1])
    expect(screen.getByText('2 nodes selected.')).toBeInTheDocument()
    fetchMock.mockResolvedValue(Response.json(ready(records)))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await screen.findByLabelText('Editable Styles prompt')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).nodes).toEqual(records)
    await user.click(screen.getAllByRole('button', { name: 'Remove Same label' })[0])
    expect(screen.getByText('1 node selected.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Editable Styles prompt')).not.toBeInTheDocument()
  })
})

describe('compile states, authored notes, and candidate actions', () => {
  it('explains keyless compiler unavailability without losing intent or exposing provider details', async () => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: 'Piano leads.' } })
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'Private provider configuration' }, { status: 503 }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Prompt compilation is currently unavailable. Your nodes and notes are still here.')
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('Piano leads.')
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeEnabled()
    expect(screen.queryByText('Private provider configuration')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Editable Styles prompt')).not.toBeInTheDocument()
  })

  it.each(['60', 'invalid'])('shows bounded quota retry guidance for Retry-After %s while retaining intent', async retryAfter => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: 'Piano leads.' } })
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'private detail' }, { status: 429, headers: { 'Retry-After': retryAfter } }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Compiler usage limit reached')
    expect(alert).toHaveTextContent(retryAfter === '60' ? 'Try again in 60 seconds' : 'Please try again later')
    expect(alert).not.toHaveTextContent('private detail')
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('Piano leads.')
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeEnabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('submits actual unusual selections and exact notes; preserves them through loading', async () => {
    const user = renderWorkspace()
    for (const node of [aggressive, ambient, piano]) await collect(user, node.label)
    const notes = 'Piano is foreground.\nKeep the aggressive dreamy contrast; no added drums.'
    // Paste the authored passage as one real input action. Per-character delays
    // can outlive the test deadline on a busy host and leak into the next test.
    await user.click(screen.getByLabelText('Relationship notes'))
    await user.paste(notes)
    let complete!: (response: Response) => void
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { complete = resolve }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    const request = fetchMock.mock.calls[0]
    expect(request[0]).toBe('/api/generate')
    expect(request[1].method).toBe('POST')
    expect(JSON.parse(request[1].body)).toEqual({ nodes: [aggressive, ambient, piano], relationship_notes: notes })
    expect(screen.getByLabelText('Relationship notes')).toHaveValue(notes)
    expect(screen.getByLabelText('Relationship notes')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Crafting Prompt…' })).toBeDisabled()
    await act(async () => complete(Response.json(ready([aggressive, ambient, piano]))))
    expect(await screen.findByLabelText('Editable Styles prompt')).toHaveValue('Piano is foreground in aggressive dreamy ambient.')
    expect(screen.getByText('3 nodes selected.')).toBeInTheDocument()
    expect(screen.getByLabelText('Relationship notes')).toHaveValue(notes)
  })

  it('shows clarification and resubmits unchanged nodes plus the user answer in notes', async () => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    await user.type(screen.getByLabelText('Relationship notes'), 'Piano leads.')
    fetchMock.mockResolvedValueOnce(Response.json({ ...ready([piano]), status: 'needs_clarification', styles: '', coverage: [{ node_id: 'piano', status: 'unresolved' }], questions: ['Should piano be dry or reverberant?'] }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await screen.findByText('Should piano be dry or reverberant?')
    expect(screen.queryByRole('button', { name: 'Copy to Clipboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
    await user.type(screen.getByLabelText('Relationship notes'), ' Keep piano dry.')
    expect(screen.getByText('Should piano be dry or reverberant?')).toBeInTheDocument()
    fetchMock.mockResolvedValueOnce(Response.json(ready([piano], 'Dry foreground piano.')))
    await user.click(screen.getByRole('button', { name: 'Compile with clarification' }))
    expect(await screen.findByLabelText('Editable Styles prompt')).toHaveValue('Dry foreground piano.')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ nodes: [piano], relationship_notes: 'Piano leads. Keep piano dry.' })
    expect(screen.queryByText('Should piano be dry or reverberant?')).not.toBeInTheDocument()
  })

  it.each(['http', 'network', 'json', 'coverage'])('keeps selections/notes and enables retry after a %s error', async failure => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    await user.type(screen.getByLabelText('Relationship notes'), 'Piano leads.')
    if (failure === 'http') fetchMock.mockResolvedValueOnce(Response.json({ error: 'server detail' }, { status: 500 }))
    if (failure === 'network') fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    if (failure === 'json') fetchMock.mockResolvedValueOnce(new Response('bad JSON'))
    if (failure === 'coverage') fetchMock.mockResolvedValueOnce(Response.json(ready([aggressive])))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeEnabled()
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('Piano leads.')
    expect(screen.getByRole('button', { name: 'Generate Prompt' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Copy to Clipboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export Styles' })).not.toBeInTheDocument()
    fetchMock.mockResolvedValueOnce(Response.json(ready([piano])))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await screen.findByLabelText('Editable Styles prompt')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body) as CompilerInput).toEqual({ nodes: [piano], relationship_notes: 'Piano leads.' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('copies and exports only the edited Styles text, then invalidates output when intent changes', async () => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    fetchMock.mockResolvedValue(Response.json(ready([piano], 'Piano leads.')))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    const output = await screen.findByLabelText('Editable Styles prompt')
    await user.clear(output)
    await user.type(output, 'Edited piano intent.\nKeep this line.')
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    await user.click(screen.getByRole('button', { name: 'Copy to Clipboard' }))
    expect(writeText).toHaveBeenCalledWith('Edited piano intent.\nKeep this line.')
    expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument()
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:styles')
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = vi.fn()
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: 'Export Styles' }))
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/plain;charset=utf-8')
    expect(blob.size).toBe(new TextEncoder().encode('Edited piano intent.\nKeep this line.').length)
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('promptsuno-styles.txt')
    expect(screen.getByText('Styles export requested.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Relationship notes'), 'New section role.')
    expect(screen.queryByLabelText('Editable Styles prompt')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Piano' })).toBeInTheDocument()
  })

  it('reports clipboard/export failure and disables actions for an empty edited output', async () => {
    const user = renderWorkspace()
    await collect(user, 'Piano')
    fetchMock.mockResolvedValue(Response.json(ready([piano])))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    const output = await screen.findByLabelText('Editable Styles prompt')
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('clipboard denied'))
    await user.click(screen.getByRole('button', { name: 'Copy to Clipboard' }))
    expect(screen.getByText(/Could not copy/)).toBeInTheDocument()
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = vi.fn(() => { throw new Error('unavailable') })
    })
    await user.click(screen.getByRole('button', { name: 'Export Styles' }))
    expect(screen.getByText(/Could not export/)).toBeInTheDocument()
    fireEvent.change(output, { target: { value: '  ' } })
    expect(screen.getByRole('button', { name: 'Copy to Clipboard' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export Styles' })).toBeDisabled()
    await waitFor(() => expect(screen.queryByText(/Could not export/)).not.toBeInTheDocument())
  })
})
