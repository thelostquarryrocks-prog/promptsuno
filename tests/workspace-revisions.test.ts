import { beforeEach, describe, expect, it } from 'vitest'
import { createWorkspaceDraft, readWorkspaceDraft, saveWorkspaceDraft, type WorkspaceDraftV1 } from '../src/lib/workspace-draft'
import { applyProposal, changeLyricsSection, makeProposal, rejectProposal, renderLyrics, replaceLyricsSections, revertProposal } from '../src/lib/workspace-revisions'

const nodes = [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }]
function song() {
  const draft = createWorkspaceDraft()
  draft.styleIntent = { selectedNodes: nodes, relationshipNotes: 'Piano leads', compiledStyles: 'Edited piano', compilerResult: { version: '1.0.0', status: 'ready', styles: 'Piano', coverage: [{ node_id: 'piano', status: 'preserved' }], interpretations: [], questions: [] } }
  draft.lyrics.sections = [{ id: 'verse', title: 'Verse', text: '  Keep me\nKeep me' }, { id: 'chorus', title: 'Chorus', text: 'Sing again' }]
  draft.lyrics.text = renderLyrics(draft.lyrics.sections)
  return draft
}
function propose(draft: WorkspaceDraftV1, target: 'relationshipNotes' | 'compiledStyles' | 'lyricsSection' = 'relationshipNotes', after = 'Piano supports') {
  const proposal = makeProposal(draft, { source: 'user', target, targetId: target === 'lyricsSection' ? 'verse' : null, after, rationale: 'Try a quieter role' })
  return { ...draft, doctor: { ...draft.doctor, proposedChanges: [...draft.doctor.proposedChanges, proposal] } }
}
beforeEach(() => sessionStorage.clear())
describe('reversible song proposals', () => {
  it('previews without mutation, applies notes clearing output, and restores exact compiler state', () => {
    const original = song()
    const pending = propose(original)
    expect(pending.styleIntent).toEqual(original.styleIntent)
    const id = pending.doctor.proposedChanges[0].id
    const applied = applyProposal(pending, id)
    expect(applied.styleIntent).toEqual({ ...original.styleIntent, relationshipNotes: 'Piano supports', compiledStyles: '', compilerResult: null })
    expect(revertProposal(applied, id).styleIntent).toEqual(original.styleIntent)
    expect(original.revisions).toEqual([])
  })
  it('rejects without changing song text or adding revisions', () => {
    const draft = propose(song())
    const rejected = rejectProposal(draft, draft.doctor.proposedChanges[0].id)
    expect(rejected.styleIntent).toEqual(draft.styleIntent)
    expect(rejected.revisions).toEqual([])
    expect(rejected.doctor.proposedChanges[0].status).toBe('rejected')
    expect(() => applyProposal(rejected, rejected.doctor.proposedChanges[0].id)).toThrow('pending')
  })
  it('refuses stale apply and revert after later text edits', () => {
    const draft = propose(song())
    const id = draft.doctor.proposedChanges[0].id
    expect(() => applyProposal({ ...draft, styleIntent: { ...draft.styleIntent, relationshipNotes: 'Later' } }, id)).toThrow('changed')
    const applied = applyProposal(draft, id)
    expect(() => revertProposal({ ...applied, styleIntent: { ...applied.styleIntent, relationshipNotes: 'Later' } }, id)).toThrow('Later edits')
    expect(() => revertProposal({ ...applied, styleIntent: { ...applied.styleIntent, compiledStyles: 'New output' } }, id)).toThrow('newer compiler')
    expect(() => revertProposal({ ...applied, styleIntent: { ...applied.styleIntent, selectedNodes: [] } }, id)).toThrow('Sound selections')
  })
  it('edits compiled output independently of canonical intent and reverts it', () => {
    const draft = propose(song(), 'compiledStyles', 'Warm piano')
    const id = draft.doctor.proposedChanges[0].id
    const applied = applyProposal(draft, id)
    expect(applied.styleIntent.relationshipNotes).toBe('Piano leads')
    expect(applied.styleIntent.compilerResult).toEqual(draft.styleIntent.compilerResult)
    expect(revertProposal(applied, id).styleIntent).toEqual(draft.styleIntent)
  })
  it('enforces section locks both when proposing and when applying/reverting later', () => {
    const draft = propose(song(), 'lyricsSection', 'Changed verse')
    const id = draft.doctor.proposedChanges[0].id
    const locked = { ...draft, preservationGoals: [{ id: 'lock', scope: 'section' as const, targetId: 'verse', text: 'Keep verse' }] }
    expect(() => changeLyricsSection(locked, 'verse', 'Changed')).toThrow('preserved')
    expect(() => applyProposal(locked, id)).toThrow('preserved')
    expect(() => propose(locked, 'lyricsSection', 'Changed')).toThrow('preserved')
    const applied = applyProposal(draft, id)
    expect(() => revertProposal({ ...applied, preservationGoals: locked.preservationGoals }, id)).toThrow('preserved')
  })
  it('preserves exact phrase occurrence counts, including overlapping occurrences', () => {
    const draft = song()
    draft.preservationGoals = [{ id: 'phrase', scope: 'phrase', targetId: null, text: 'Keep me' }]
    expect(() => changeLyricsSection(draft, 'verse', 'Keep me')).toThrow('preserved phrase')
    expect(changeLyricsSection(draft, 'verse', 'Keep me\nKeep me\nnew').lyrics.text).toBe('Keep me\nKeep me\nnew\n\nSing again')
    draft.lyrics.sections[0].text = 'aaa'
    draft.preservationGoals[0].text = 'aa'
    expect(() => changeLyricsSection(draft, 'verse', 'aa')).toThrow('preserved phrase')
  })
  it('prevents deleting or renaming locked sections and rejects oversized rendered songs', () => {
    const draft = song()
    draft.preservationGoals = [{ id: 'lock', scope: 'section', targetId: 'verse', text: 'Keep verse' }]
    expect(() => replaceLyricsSections(draft, draft.lyrics.sections.slice(1))).toThrow('preserved')
    expect(() => replaceLyricsSections(draft, draft.lyrics.sections.map(section => ({ ...section, title: 'Renamed' })))).toThrow('preserved')
    expect(replaceLyricsSections(draft, [...draft.lyrics.sections].reverse()).lyrics.sections[1].id).toBe('verse')
    draft.preservationGoals = []
    expect(() => replaceLyricsSections(draft, [{ id: 'one', title: 'One', text: 'x'.repeat(32_000) }, { id: 'two', title: 'Two', text: 'x'.repeat(32_000) }])).toThrow('too long')
  })
  it('treats note goals as context and retains exact section whitespace through apply/revert', () => {
    const original = song()
    original.preservationGoals = [{ id: 'note', scope: 'note', targetId: null, text: 'Stay wistful' }]
    const draft = propose(original, 'lyricsSection', '  Another line\n')
    const id = draft.doctor.proposedChanges[0].id
    expect(applyProposal(draft, id).lyrics.text).toBe('  Another line\n\n\nSing again')
    expect(revertProposal(applyProposal(draft, id), id).lyrics).toEqual(original.lyrics)
  })
  it('roundtrips applied/reverted proposals and historical compiler coverage', () => {
    const pending = propose(song())
    const id = pending.doctor.proposedChanges[0].id
    const applied = applyProposal(pending, id)
    applied.styleIntent.selectedNodes = []
    expect(saveWorkspaceDraft('owner', applied)).toBe(true)
    expect(readWorkspaceDraft('owner', nodes)).toEqual({ status: 'ready', draft: applied })
    applied.styleIntent.selectedNodes = nodes
    const reverted = revertProposal(applied, id)
    expect(saveWorkspaceDraft('owner', reverted)).toBe(true)
    expect(readWorkspaceDraft('owner', nodes)).toEqual({ status: 'ready', draft: reverted })
  })
  it('bounds text, proposal counts, and rejects inconsistent revision records', () => {
    const draft = propose(song())
    expect(() => propose(song(), 'lyricsSection', 'x'.repeat(64_001))).toThrow('too long')
    const full = { ...draft, doctor: { ...draft.doctor, proposedChanges: Array.from({ length: 20 }, () => draft.doctor.proposedChanges[0]) } }
    expect(() => propose(full)).toThrow('20-proposal')
    const applied = applyProposal(draft, draft.doctor.proposedChanges[0].id)
    applied.revisions[0].before = 'Different'
    expect(saveWorkspaceDraft('owner', applied)).toBe(false)
  })
})
