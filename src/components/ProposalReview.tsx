'use client'

import { useState } from 'react'
import { useWorkspace } from './WorkspaceProvider'
import { applyProposal, rejectProposal, revertProposal } from '../lib/workspace-revisions'
import type { WorkspaceProposal } from '../lib/workspace-draft'

export type NavigateToIntent = (mode: 'brain' | 'lyrics', targetId?: string | null) => void

export default function ProposalReview({ onNavigate, sectionId }: { onNavigate: NavigateToIntent; sectionId?: string }) {
  const { draft, update } = useWorkspace()
  const [error, setError] = useState('')
  const proposals = draft.doctor.proposedChanges.filter(proposal => !sectionId || proposal.targetId === sectionId)
  const run = (action: 'apply' | 'reject' | 'revert', proposal: WorkspaceProposal) => {
    try {
      update(current => action === 'apply' ? applyProposal(current, proposal.id) : action === 'reject' ? rejectProposal(current, proposal.id) : revertProposal(current, proposal.id))
      setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'This change could not be applied. Your song is unchanged.') }
  }
  if (!proposals.length) return null
  return <section className="proposal-review" aria-label="Song experiments">
    <h3>Small changes to try</h3>
    <p className="workbench-muted">Preview first. Nothing changes until you apply it. Results in Suno can vary.</p>
    {error && <p role="alert">{error}</p>}
    {proposals.slice().reverse().map(proposal => <article className="proposal-card" key={proposal.id}>
      <div className="workbench-row"><strong>{proposal.target === 'lyricsSection' ? draft.lyrics.sections.find(section => section.id === proposal.targetId)?.title || 'Lyric section' : proposal.target === 'compiledStyles' ? 'Styles output' : 'Sound relationship notes'}</strong><span>{proposal.status} · {proposal.source === 'user' ? 'Your experiment' : 'Assistant suggestion'}</span></div>
      <p>{proposal.rationale}</p>
      <div className="proposal-comparison"><div><h4>Before</h4><p className="preserve-lines">{proposal.before || '(Empty)'}</p></div><div><h4>Proposed revision</h4>
        {proposal.status === 'pending' ? <textarea aria-label="Modify proposed revision" value={proposal.after} maxLength={64000} rows={4} onChange={event => update(current => ({ ...current, doctor: { ...current.doctor, proposedChanges: current.doctor.proposedChanges.map(item => item.id === proposal.id ? { ...item, after: event.target.value } : item) } }))} /> : <p className="preserve-lines">{proposal.after}</p>}
      </div></div>
      <div className="workbench-actions">
        {proposal.status === 'pending' && <><button onClick={() => run('apply', proposal)}>Try this change</button><button onClick={() => run('reject', proposal)}>Reject</button></>}
        {proposal.status === 'applied' && <button onClick={() => run('revert', proposal)}>Revert this change</button>}
        <button onClick={() => onNavigate(proposal.target === 'lyricsSection' ? 'lyrics' : 'brain', proposal.targetId)}>{proposal.target === 'lyricsSection' ? 'Edit in Lyrics' : 'Open in Brain'}</button>
      </div>
    </article>)}
  </section>
}
