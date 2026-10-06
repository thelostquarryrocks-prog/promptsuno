import { parseCompilerOutput } from './compiler-contract'
import type { WorkspaceDraftV1, WorkspaceProposal, WorkspaceRevision } from './workspace-draft'

export function renderLyrics(sections: WorkspaceDraftV1['lyrics']['sections']): string {
  return sections.map(section => section.text).join('\n\n')
}

function bounded(text: string, max = 64_000) {
  if (typeof text !== 'string' || text.length > max) throw new Error('This text is too long to save in the song.')
}
function occurrences(text: string, phrase: string) {
  if (!phrase) return 0
  let count = 0
  for (let position = text.indexOf(phrase); position !== -1; position = text.indexOf(phrase, position + 1)) count += 1
  return count
}
export function changeLyricsSection(draft: WorkspaceDraftV1, id: string, text: string): WorkspaceDraftV1 {
  bounded(text)
  const section = draft.lyrics.sections.find(section => section.id === id)
  if (!section) throw new Error('This lyric section no longer exists.')
  const sections = draft.lyrics.sections.map(section => section.id === id ? { ...section, text } : section)
  return replaceLyricsSections(draft, sections)
}
export function replaceLyricsSections(draft: WorkspaceDraftV1, sections: WorkspaceDraftV1['lyrics']['sections']): WorkspaceDraftV1 {
  if (sections.length > 100) throw new Error('This song has reached its 100-section limit.')
  const ids = new Set<string>()
  for (const section of sections) {
    bounded(section.text)
    bounded(section.title, 160)
    if (!section.id || section.id.length > 128 || ids.has(section.id)) throw new Error('Each lyric section needs a unique identifier.')
    ids.add(section.id)
  }
  for (const goal of draft.preservationGoals) {
    if (goal.scope !== 'section') continue
    const before = draft.lyrics.sections.find(section => section.id === goal.targetId)
    const after = sections.find(section => section.id === goal.targetId)
    if (!before || !after || before.text !== after.text || before.title !== after.title) {
      throw new Error('This section is preserved. Remove its preservation lock before editing.')
    }
  }
  const before = renderLyrics(draft.lyrics.sections)
  const after = renderLyrics(sections)
  bounded(after)
  if (draft.preservationGoals.some(goal => goal.scope === 'phrase' && occurrences(after, goal.text) < occurrences(before, goal.text))) {
    throw new Error('This change removes a preserved phrase. Update its preservation goal first.')
  }
  return { ...draft, lyrics: { ...draft.lyrics, sections, text: after } }
}

function currentText(draft: WorkspaceDraftV1, target: WorkspaceProposal['target'], targetId: string | null): string {
  if (target === 'lyricsSection') {
    const section = draft.lyrics.sections.find(section => section.id === targetId)
    if (!section) throw new Error('This lyric section no longer exists.')
    return section.text
  }
  if (targetId !== null || (target !== 'relationshipNotes' && target !== 'compiledStyles')) throw new Error('This proposal has an invalid target.')
  return draft.styleIntent[target]
}
function replaceText(draft: WorkspaceDraftV1, proposal: WorkspaceProposal, text: string): WorkspaceDraftV1 {
  if (proposal.target === 'lyricsSection') return changeLyricsSection(draft, proposal.targetId!, text)
  return { ...draft, styleIntent: { ...draft.styleIntent, [proposal.target]: text,
    ...(proposal.target === 'relationshipNotes' ? { compiledStyles: '', compilerResult: null } : {}) } }
}
export function makeProposal(draft: WorkspaceDraftV1, input: Pick<WorkspaceProposal, 'source' | 'target' | 'targetId' | 'after' | 'rationale'>): WorkspaceProposal {
  if (draft.doctor.proposedChanges.length >= 20) throw new Error('This song has reached its 20-proposal limit. Export a backup before starting another song.')
  bounded(input.after)
  bounded(input.rationale, 8_000)
  if (input.source !== 'user' && input.source !== 'assistant') throw new Error('This proposal has an invalid source.')
  const before = currentText(draft, input.target, input.targetId)
  if (before === input.after) throw new Error('Change the proposed text before creating a proposal.')
  const proposal: WorkspaceProposal = { ...input, id: crypto.randomUUID(), before, status: 'pending', createdAt: new Date().toISOString() }
  replaceText(draft, proposal, proposal.after)
  return proposal
}
function findProposal(draft: WorkspaceDraftV1, id: string): WorkspaceProposal {
  const proposal = draft.doctor.proposedChanges.find(proposal => proposal.id === id)
  if (!proposal) throw new Error('This proposal no longer exists.')
  return proposal
}
function status(draft: WorkspaceDraftV1, id: string, status: WorkspaceProposal['status']): WorkspaceDraftV1 {
  return { ...draft, doctor: { ...draft.doctor, proposedChanges: draft.doctor.proposedChanges.map(proposal => proposal.id === id ? { ...proposal, status } : proposal) } }
}
export function applyProposal(draft: WorkspaceDraftV1, id: string): WorkspaceDraftV1 {
  const proposal = findProposal(draft, id)
  if (proposal.status !== 'pending') throw new Error('Only a pending proposal can be applied.')
  if (currentText(draft, proposal.target, proposal.targetId) !== proposal.before) throw new Error('This text has changed since the proposal. Create a new proposal from the current text.')
  if (draft.revisions.length >= 20) throw new Error('This song has reached its 20-revision limit. Export a backup before starting another song.')
  const revision: WorkspaceRevision = {
    id: crypto.randomUUID(), proposalId: id, target: proposal.target, targetId: proposal.targetId,
    before: proposal.before, after: proposal.after, createdAt: new Date().toISOString(),
    compilerBefore: proposal.target === 'relationshipNotes' ? { compiledStyles: draft.styleIntent.compiledStyles, compilerResult: draft.styleIntent.compilerResult } : null,
  }
  const next = status(replaceText(draft, proposal, proposal.after), id, 'applied')
  return { ...next, revisions: [...next.revisions, revision] }
}
export function rejectProposal(draft: WorkspaceDraftV1, id: string): WorkspaceDraftV1 {
  if (findProposal(draft, id).status !== 'pending') throw new Error('Only a pending proposal can be rejected.')
  return status(draft, id, 'rejected')
}
export function revertProposal(draft: WorkspaceDraftV1, id: string): WorkspaceDraftV1 {
  const proposal = findProposal(draft, id)
  const revision = draft.revisions.find(revision => revision.proposalId === id)
  if (proposal.status !== 'applied' || !revision) throw new Error('Only an applied proposal can be reverted.')
  if (currentText(draft, proposal.target, proposal.targetId) !== revision.after) throw new Error('Later edits would be overwritten. Keep them or create a new proposal.')
  if (proposal.target === 'relationshipNotes') {
    if (draft.styleIntent.compiledStyles !== '' || draft.styleIntent.compilerResult !== null) throw new Error('A newer compiler result would be overwritten. Keep it or create a new proposal.')
    if (revision.compilerBefore?.compilerResult) {
      try { parseCompilerOutput(revision.compilerBefore.compilerResult, draft.styleIntent.selectedNodes) }
      catch { throw new Error('Sound selections changed after this proposal. Create a new proposal instead.') }
    }
  }
  let next = replaceText(draft, proposal, revision.before)
  if (proposal.target === 'relationshipNotes' && revision.compilerBefore) next = { ...next, styleIntent: { ...next.styleIntent, ...revision.compilerBefore } }
  return status(next, id, 'reverted')
}
