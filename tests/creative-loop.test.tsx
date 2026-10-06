import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from '../src/components/Workspace'
import { getSoundBrainDiscovery } from '../src/lib/sound-brain-catalog'
import { makeProposal } from '../src/lib/workspace-revisions'
import { buildAssistRequest, parseAssistResponse } from '../src/lib/workspace-assistance'
import { createWorkspaceDraft, workspaceStorageKey } from '../src/lib/workspace-draft'

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
const fetchMock = vi.fn()
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
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


const key = workspaceStorageKey('workspace-test-owner')
function stored() { return JSON.parse(sessionStorage.getItem(key)!) as ReturnType<typeof createWorkspaceDraft> }
function seedSong() {
  const draft = createWorkspaceDraft()
  draft.styleIntent.selectedNodes = [piano]
  draft.styleIntent.relationshipNotes = '  Piano leads.\nLeave space.  '
  draft.lyrics.sections = [{ id: 'verse-one', title: 'Verse', text: 'Keep my phrase\nOld ending' }, { id: 'chorus-one', title: 'Chorus', text: 'Unchanged chorus' }]
  draft.lyrics.text = draft.lyrics.sections.map(section => section.text).join('\n\n')
  sessionStorage.setItem(key, JSON.stringify(draft))
  return draft
}
async function mount() {
  const user = userEvent.setup()
  const view = render(<Workspace discoveryNodes={nodes} affinities={affinities} />)
  await screen.findByText('Saved in this tab')
  return { user, view }
}
async function preview(user: ReturnType<typeof userEvent.setup>, after: string) {
  await user.click(screen.getByRole('button', { name: 'Doctor' }))
  await user.click(await screen.findByText('Plan your own small experiment'))
  fireEvent.change(screen.getByLabelText('Your proposed revision'), { target: { value: after } })
  await user.click(screen.getByRole('button', { name: 'Preview my experiment' }))
}

describe('manual creative loop', () => {
  it('preserves sections and exact phrases through Doctor proposals without changing sound intent', async () => {
    const initial = seedSong()
    const { user } = await mount()
    await user.click(screen.getByRole('button', { name: 'Lyrics' }))
    const chorus = await screen.findByRole('article', { name: 'Chorus, section 2' })
    await user.click(within(chorus).getByRole('button', { name: 'Preserve section' }))
    await user.click(screen.getByText('Keep what matters'))
    fireEvent.change(screen.getByLabelText('Exact phrase to keep'), { target: { value: 'Keep my phrase' } })
    await user.click(screen.getByRole('button', { name: 'Preserve phrase' }))
    fireEvent.change(screen.getByLabelText('Verse lyrics'), { target: { value: 'Lost phrase' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('removes a preserved phrase')
    expect(screen.getByLabelText('Verse lyrics')).toHaveValue('Keep my phrase\nOld ending')
    expect(screen.getByLabelText('Chorus lyrics')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Doctor' }))
    await user.click(await screen.findByText('Plan your own small experiment'))
    await user.selectOptions(screen.getByLabelText('Where would you like to try a change?'), 'section:chorus-one')
    fireEvent.change(screen.getByLabelText('Your proposed revision'), { target: { value: 'Replace chorus' } })
    await user.click(screen.getByRole('button', { name: 'Preview my experiment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('section is preserved')
    await user.selectOptions(screen.getByLabelText('Where would you like to try a change?'), 'section:verse-one')
    fireEvent.change(screen.getByLabelText('Your proposed revision'), { target: { value: 'Keep my phrase\nNew ending' } })
    await user.click(screen.getByRole('button', { name: 'Preview my experiment' }))
    expect(stored().lyrics.text).toBe(initial.lyrics.text)
    await user.click(screen.getByRole('button', { name: 'Try this change' }))
    expect(stored().lyrics.sections[0].text).toBe('Keep my phrase\nNew ending')
    await user.click(screen.getByRole('button', { name: 'Edit in Lyrics' }))
    expect(await screen.findByRole('article', { name: 'Verse, section 1' })).toHaveClass('is-highlighted')
    await user.click(screen.getByRole('button', { name: 'Revert this change' }))
    expect(stored().lyrics.text).toBe(initial.lyrics.text)
    expect(stored().styleIntent).toEqual(initial.styleIntent)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('persists a pending preview on remount, then rejects it without altering the song', async () => {
    const initial = seedSong()
    const { user, view } = await mount()
    await preview(user, 'Try less reverb.')
    expect(stored().styleIntent).toEqual(initial.styleIntent)
    view.unmount()
    await mount()
    expect(await screen.findByLabelText('Modify proposed revision')).toHaveValue('Try less reverb.')
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(stored().doctor.proposedChanges[0].status).toBe('rejected')
    expect(stored().styleIntent).toEqual(initial.styleIntent)
    expect(stored().revisions).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to apply a stale preview over newer authored intent', async () => {
    seedSong()
    const { user } = await mount()
    await preview(user, 'Proposed older direction.')
    await user.click(screen.getByRole('button', { name: 'Brain' }))
    fireEvent.change(screen.getByLabelText('Relationship notes'), { target: { value: 'Newer authored direction.' } })
    await user.click(screen.getByRole('button', { name: 'Try this change' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('changed since the proposal')
    expect(stored().styleIntent.relationshipNotes).toBe('Newer authored direction.')
    expect(stored().doctor.proposedChanges[0].status).toBe('pending')
    expect(stored().revisions).toHaveLength(0)
  })
})


describe('pending creative response boundaries', () => {
  async function pendingDoctor() {
    const draft = seedSong()
    draft.mode = 'doctor'
    draft.doctor.reportedProblem = 'Piano was missing.'
    draft.doctor.symptom = 'Missing instrument'
    sessionStorage.setItem(key, JSON.stringify(draft))
    const user = userEvent.setup()
    render(<Workspace discoveryNodes={nodes} affinities={affinities} assistanceAvailable />)
    await screen.findByText('Saved in this tab')
    let finish!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
    await user.click(await screen.findByRole('button', { name: 'Ask Doctor for a small experiment' }))
    const request = buildAssistRequest(draft, 'doctor', null, '')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(request)
    const response = parseAssistResponse({ observations: ['You reported missing piano.'], hypotheses: ['A clearer role may be worth testing.'], proposals: [{ target: 'relationshipNotes', targetId: null, before: draft.styleIntent.relationshipNotes, after: 'Piano in the foreground.', rationale: 'Test a clearer role.' }] }, request)
    return { user, finish, response }
  }

  it('discards delayed assistance when shared song observations change while pending', async () => {
    const { finish, response } = await pendingDoctor()
    fireEvent.change(screen.getByLabelText('What did you hear, and what did you want instead?'), { target: { value: 'New observation: piano is present, but too quiet.' } })
    await act(async () => finish(Response.json(response)))
    expect(await screen.findByText(/Your song changed while assistance was working/)).toBeInTheDocument()
    expect(stored().doctor.proposedChanges).toHaveLength(0)
    expect(stored().doctor.hypotheses).toHaveLength(0)
    expect(stored().doctor.reportedProblem).toBe('New observation: piano is present, but too quiet.')
  })

  it('discards delayed assistance after an account switch without writing private results into the new song', async () => {
    const { finish, response } = await pendingDoctor()
    const otherKey = workspaceStorageKey('creative-test-other-owner')
    const other = createWorkspaceDraft()
    other.project.title = 'Other account song'
    other.styleIntent.relationshipNotes = 'Other private direction.'
    sessionStorage.setItem(otherKey, JSON.stringify(other))
    act(() => { for (const listener of auth.listeners) listener('SIGNED_IN', { user: { id: 'creative-test-other-owner' } }) })
    await act(async () => finish(Response.json(response)))
    expect(screen.getByLabelText('Song title')).toHaveValue('Other account song')
    expect(screen.getByLabelText('Relationship notes')).toHaveValue('Other private direction.')
    const current = JSON.parse(sessionStorage.getItem(otherKey)!)
    expect(current.doctor.proposedChanges).toHaveLength(0)
    expect(current.doctor.hypotheses).toHaveLength(0)
    expect(current.styleIntent.relationshipNotes).toBe('Other private direction.')
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('discards a delayed response after an intervening edit is undone', async () => {
    const { finish, response } = await pendingDoctor()
    const report = screen.getByLabelText('What did you hear, and what did you want instead?')
    fireEvent.change(report, { target: { value: 'An intervening observation.' } })
    fireEvent.change(report, { target: { value: 'Piano was missing.' } })
    await act(async () => finish(Response.json(response)))
    expect(await screen.findByText(/Your song changed while assistance was working/)).toBeInTheDocument()
    expect(stored().doctor.proposedChanges).toHaveLength(0)
    expect(stored().doctor.reportedProblem).toBe('Piano was missing.')
  })

  it.each(['relationshipNotes', 'compiledStyles'] as const)('does not overwrite a Doctor %s change when an older compiler request finishes', async target => {
    const draft = seedSong()
    draft.doctor.proposedChanges = [makeProposal(draft, { source: 'user', target, targetId: null, after: 'Newer explicitly applied direction.', rationale: 'A manual experiment.' })]
    sessionStorage.setItem(key, JSON.stringify(draft))
    const { user } = await mount()
    let finish!: (response: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve }))
    await user.click(screen.getByRole('button', { name: 'Generate Prompt' }))
    await user.click(screen.getByRole('button', { name: 'Doctor' }))
    await user.click(await screen.findByRole('button', { name: 'Try this change' }))
    await act(async () => finish(Response.json({ version: '1.0.0', status: 'ready', styles: 'Older compiler output.', coverage: [{ node_id: 'piano', status: 'preserved' }], interpretations: [], questions: [] })))
    expect(stored().styleIntent[target]).toBe('Newer explicitly applied direction.')
    expect(stored().styleIntent.compilerResult).toBeNull()
    expect(stored().styleIntent.compiledStyles).not.toBe('Older compiler output.')
    expect(stored().doctor.proposedChanges[0].status).toBe('applied')
    expect(stored().revisions).toHaveLength(1)
  })
})
