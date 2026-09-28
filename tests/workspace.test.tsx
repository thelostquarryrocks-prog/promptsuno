import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from '../src/components/Workspace'
import SoundBrainCanvas from '../src/components/SoundBrainCanvas'
import { getSoundBrainDiscovery } from '../src/lib/sound-brain-catalog'
import type { CompilerInput, SelectedNode } from '../src/lib/compiler-contract'

// Only replace WebGL and Next routing. Collection controls and Workspace are real.
// Real drag/raycast and animation are exercised by the browser suite.
vi.mock('@react-three/fiber', () => ({ Canvas: () => <div data-testid="webgl-preview" />, useFrame: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('next/dynamic', async () => {
  const { default: Canvas } = await import('../src/components/SoundBrainCanvas')
  return { default: () => Canvas }
})

const { nodes, affinities } = getSoundBrainDiscovery()
const piano = nodes.find(node => node.node_id === 'piano')!
const aggressive = nodes.find(node => node.node_id === 'aggressive')!
const ambient = nodes.find(node => node.node_id === 'dreamy-ambient')!
const fetchMock = vi.fn()
const ready = (selected: SelectedNode[], styles = 'Piano is foreground in aggressive dreamy ambient.') => ({
  version: '1.0.0', status: 'ready', styles,
  coverage: selected.map(node => ({ node_id: node.node_id, status: 'preserved' })), interpretations: [], questions: [],
})

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
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
