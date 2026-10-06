import { describe, expect, it } from 'vitest'
import { createWorkspaceDraft } from '../src/lib/workspace-draft'
import { buildAssistRequest, parseAssistRequest, parseAssistResponse } from '../src/lib/workspace-assistance'
const draft = () => {
  const d = createWorkspaceDraft()
  d.lyrics.sections = [{ id: 'verse', title: 'Verse', text: 'stay stay light' }]
  return d
}
const proposal = { target: 'lyricsSection', targetId: 'verse', before: 'stay stay light', after: 'stay stay bright', rationale: 'Try a stronger last word.' }
const output = (p = proposal) => ({ observations: ['The verse repeats stay.'], hypotheses: ['A shorter ending may help.'], proposals: [p] })
describe('assistance contract', () => {
  it('projects creative context without account/project/revision metadata', () => {
    const d = draft()
    const request = buildAssistRequest(d, 'lyrics', 'verse', 'Refine the ending')
    expect(request.sections).toEqual(d.lyrics.sections)
    expect(JSON.stringify(request)).not.toContain(d.project.id)
    expect(request).not.toHaveProperty('project')
    expect(request).not.toHaveProperty('revisions')
    expect(parseAssistResponse(output(), request)).toEqual(output())
  })
  it.each([
    { ...proposal, before: 'stale' }, { ...proposal, after: proposal.before },
    { ...proposal, targetId: 'unknown' }, { ...proposal, target: 'compiledStyles', targetId: null },
    { ...proposal, after: '' }, { ...proposal, extra: 'invented' },
  ])('rejects stale, unchanged, unknown or disallowed proposals', p => {
    expect(() => parseAssistResponse(output(p as typeof proposal), buildAssistRequest(draft(), 'lyrics', 'verse', ''))).toThrow()
  })
  it('rejects duplicate targets and oversized batches', () => {
    const request = buildAssistRequest(draft(), 'lyrics', 'verse', '')
    expect(() => parseAssistResponse({ ...output(), proposals: [proposal, proposal] }, request)).toThrow()
    expect(() => parseAssistResponse({ ...output(), proposals: Array(4).fill(proposal) }, request)).toThrow()
  })
  it('honors section locks and counts repeated preserved phrases', () => {
    const d = draft()
    d.preservationGoals = [{ id: 'lock', scope: 'section', targetId: 'verse', text: '' }]
    expect(() => parseAssistResponse(output(), buildAssistRequest(d, 'lyrics', 'verse', ''))).toThrow()
    d.preservationGoals = [{ id: 'phrase', scope: 'phrase', targetId: 'verse', text: 'stay' }]
    const req = buildAssistRequest(d, 'lyrics', 'verse', '')
    expect(parseAssistResponse(output(), req)).toEqual(output())
    expect(() => parseAssistResponse(output({ ...proposal, after: 'stay bright' }), req)).toThrow()
  })
  it('supports lyrics-first and doctor sound proposals without changing selected nodes', () => {
    const req = buildAssistRequest(draft(), 'doctor', null, '')
    const p = { target: 'relationshipNotes', targetId: null, before: '', after: 'Piano foreground', rationale: 'Try clarifying the foreground.' }
    expect(parseAssistResponse({ observations: [], hypotheses: [], proposals: [p] }, req).proposals).toEqual([p])
  })
  it('rejects injected metadata, invalid section IDs and malformed locks', () => {
    const req = buildAssistRequest(draft(), 'lyrics', 'verse', '')
    expect(() => parseAssistRequest({ ...req, owner: 'other' })).toThrow()
    expect(() => parseAssistRequest({ ...req, targetId: null })).toThrow()
    expect(() => parseAssistRequest({ ...req, preservationGoals: [{ id: 'x', scope: 'section', targetId: 'missing', text: '' }] })).toThrow()
  })
})
