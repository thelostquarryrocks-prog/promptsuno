import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearWorkspaceDraft, createWorkspaceDraft, readWorkspaceDraft, saveWorkspaceDraft, workspaceStorageKey } from '../src/lib/workspace-draft'

const nodes = [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }]
beforeEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('account-isolated workspace storage', () => {
  it('roundtrips exact structured intent separately from edited output and lyrics', () => {
    const draft = createWorkspaceDraft()
    draft.styleIntent = {
      selectedNodes: nodes,
      relationshipNotes: '  Piano first.\nLeave space.  ',
      compiledStyles: 'My edited Styles',
      compilerResult: { version: '1.0.0', status: 'ready', styles: 'Original Styles', coverage: [{ node_id: 'piano', status: 'preserved' }], interpretations: [], questions: [] },
    }
    draft.mode = 'lyrics'
    draft.lyrics = { text: '  My song\n', sections: [{ id: 'verse', title: 'Verse 1', text: '  My song\n' }], lyricNotes: 'Keep this line' }
    draft.preservationGoals = [{ id: 'keep', scope: 'section', targetId: 'verse', text: 'Keep the verse' }]
    expect(saveWorkspaceDraft('account-a', draft)).toBe(true)
    expect(readWorkspaceDraft('account-a', nodes)).toEqual({ status: 'ready', draft })
    expect(readWorkspaceDraft('account-b', nodes)).toEqual({ status: 'empty' })
    expect(localStorage.length).toBe(0)
  })

  it('separates keys without delimiter collisions and clears only the specified account', () => {
    const a = createWorkspaceDraft(), b = createWorkspaceDraft()
    expect(workspaceStorageKey('a:b')).not.toBe(workspaceStorageKey('a%3Ab'))
    saveWorkspaceDraft('account-a', a)
    saveWorkspaceDraft('account-b', b)
    expect(clearWorkspaceDraft('account-a')).toBe(true)
    expect(readWorkspaceDraft('account-a', nodes).status).toBe('empty')
    expect(readWorkspaceDraft('account-b', nodes)).toEqual({ status: 'ready', draft: b })
  })

  it.each(['{broken', JSON.stringify({ version: 2 }), 'x'.repeat(1_000_001)])('preserves corrupt storage until explicit recovery (%#)', raw => {
    sessionStorage.setItem(workspaceStorageKey('account-a'), raw)
    expect(readWorkspaceDraft('account-a', nodes)).toEqual({ status: 'corrupt' })
    expect(saveWorkspaceDraft('account-a', createWorkspaceDraft())).toBe(false)
    expect(sessionStorage.getItem(workspaceStorageKey('account-a'))).toBe(raw)
    expect(saveWorkspaceDraft('account-a', createWorkspaceDraft(), { overwriteCorrupt: true })).toBe(true)
    expect(readWorkspaceDraft('account-a', nodes).status).toBe('ready')
  })

  it.each([
    { selectedNodes: [{ node_id: 'piano', label: 'Modified piano', category: 'Instrument' }] },
    { selectedNodes: [{ node_id: 'unknown', label: 'Piano', category: 'Instrument' }] },
    { selectedNodes: [nodes[0], nodes[0]] },
  ])('rejects modified, unknown, and duplicate catalog selections (%#)', ({ selectedNodes }) => {
    const draft = createWorkspaceDraft()
    draft.styleIntent.selectedNodes = selectedNodes
    const raw = JSON.stringify(draft)
    sessionStorage.setItem(workspaceStorageKey('account-a'), raw)
    expect(readWorkspaceDraft('account-a', nodes).status).toBe('corrupt')
    expect(sessionStorage.getItem(workspaceStorageKey('account-a'))).toBe(raw)
  })

  it('rejects a compiler result whose coverage no longer matches selected intent', () => {
    const draft = createWorkspaceDraft()
    draft.styleIntent.selectedNodes = nodes
    draft.styleIntent.compilerResult = { version: '1.0.0', status: 'ready', styles: 'Piano', coverage: [], interpretations: [], questions: [] }
    expect(saveWorkspaceDraft('account-a', draft)).toBe(false)
  })

  it('rejects oversized text, unexpected fields, and dangling preservation targets', () => {
    const draft = createWorkspaceDraft()
    draft.lyrics.text = 'x'.repeat(64_001)
    expect(saveWorkspaceDraft('account-a', draft)).toBe(false)
    draft.lyrics.text = ''
    draft.preservationGoals = [{ id: 'keep', scope: 'section', targetId: 'absent', text: 'Keep' }]
    expect(saveWorkspaceDraft('account-a', draft)).toBe(false)
    sessionStorage.setItem(workspaceStorageKey('account-a'), JSON.stringify({ ...createWorkspaceDraft(), unexpected: 'value' }))
    expect(readWorkspaceDraft('account-a', nodes).status).toBe('corrupt')
  })

  it('keeps the previous save when quota is exhausted and allows retry', () => {
    const draft = createWorkspaceDraft()
    saveWorkspaceDraft('account-a', draft)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
    const edited = { ...draft, mode: 'doctor' as const }
    expect(saveWorkspaceDraft('account-a', edited)).toBe(false)
    expect(readWorkspaceDraft('account-a', nodes)).toEqual({ status: 'ready', draft })
    write.mockRestore()
    expect(saveWorkspaceDraft('account-a', edited)).toBe(true)
  })

  it('reports blocked storage without confusing it with an empty song', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
    expect(readWorkspaceDraft('account-a', nodes)).toEqual({ status: 'unavailable' })
    expect(saveWorkspaceDraft('account-a', createWorkspaceDraft())).toBe(false)
  })

  it('rejects missing owners and reports failed logout cleanup', () => {
    expect(readWorkspaceDraft('', nodes)).toEqual({ status: 'unavailable' })
    expect(saveWorkspaceDraft('', createWorkspaceDraft())).toBe(false)
    expect(clearWorkspaceDraft('')).toBe(false)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
    expect(clearWorkspaceDraft('account-a')).toBe(false)
  })
})
