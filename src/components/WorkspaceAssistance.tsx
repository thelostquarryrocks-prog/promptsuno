'use client'

import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from './WorkspaceProvider'
import { buildAssistRequest, parseAssistResponse } from '../lib/workspace-assistance'
import { makeProposal } from '../lib/workspace-revisions'

export default function WorkspaceAssistance({ action, targetId = null, available = false }: { action: 'lyrics' | 'doctor'; targetId?: string | null; available?: boolean }) {
  const { draft, update } = useWorkspace()
  const [instruction, setInstruction] = useState('')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState('')
  const [observations, setObservations] = useState<string[]>([])
  const [chosenSection, setChosenSection] = useState<string | null>(null)
  const sectionTarget = chosenSection || targetId
  const targetLocked = action === 'lyrics' && draft.preservationGoals.some(goal => goal.scope === 'section' && goal.targetId === sectionTarget)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  const request = async () => {
    if (!available || abort.current || targetLocked) return
    let input
    try { input = buildAssistRequest(draft, action, sectionTarget, instruction) }
    catch { setStatus('This context is too large or the section has changed. Choose a current section and a smaller request. Your song is unchanged.'); return }
    const controller = new AbortController()
    abort.current = controller
    const projectId = draft.project.id
    const fingerprint = JSON.stringify(input)
    setPending(true)
    setStatus('')
    try {
      const response = await fetch('/api/workspace-assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: fingerprint, signal: controller.signal })
      if (response.status === 401) { setStatus('Your session has expired. Export your song, then sign in again before requesting assistance. Your song is unchanged.'); return }
      if (response.status === 503) { setStatus('Assistance is unavailable. Your song is unchanged.'); return }
      if (response.status === 429) { setStatus('Assistance usage limit reached. Try again later; your song is unchanged.'); return }
      if (!response.ok) throw new Error('Assistance could not complete. Your song is unchanged.')
      const result = parseAssistResponse(await response.json(), input)
      if (controller.signal.aborted) return
      update(current => {
        // Suspense can retain the previous workbench while the next mode loads.
        // Immutable draft identity also catches a quick switch away and back,
        // or an edit later undone. Effect cleanup alone is too late in that gap.
        if (current !== draft || current.mode !== action || current.project.id !== projectId || JSON.stringify(buildAssistRequest(current, action, sectionTarget, instruction)) !== fingerprint) throw new Error('Your song changed while assistance was working. No suggestion was added; try again with the current version.')
        if (current.doctor.proposedChanges.length + result.proposals.length > 20) throw new Error('This song has reached its local experiment limit. Export your song before starting another.')
        const proposals = result.proposals.map(proposal => makeProposal(current, { source: 'assistant', target: proposal.target, targetId: proposal.targetId, after: proposal.after, rationale: proposal.rationale }))
        return { ...current, doctor: { ...current.doctor, hypotheses: result.hypotheses, proposedChanges: [...current.doctor.proposedChanges, ...proposals] } }
      })
      setObservations(result.observations)
      setStatus(result.proposals.length ? 'Suggestions are ready to preview. Your song is unchanged.' : 'No change was proposed. Add a more specific observation or writing request.')
    } catch (caught) {
      if (!controller.signal.aborted) setStatus(caught instanceof Error ? caught.message : 'Assistance could not complete. Your song is unchanged.')
    } finally {
      if (abort.current === controller) abort.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  if (!available) return <p className="workbench-muted">{action === 'doctor' ? 'Automated diagnosis' : 'Writing assistance'} is unavailable in this protected preview. You can still edit, preserve, and test your own revisions.</p>
  return <div className="assistance-panel">
    {action === 'lyrics' && <><label htmlFor="assist-section">Section to revise</label><select id="assist-section" value={sectionTarget || ''} onChange={event => setChosenSection(event.target.value)}><option value="">Choose a section</option>{draft.lyrics.sections.map(section => <option key={section.id} value={section.id}>{section.title || 'Untitled section'}</option>)}</select></>}
    <label htmlFor={`assist-${action}`}>{action === 'doctor' ? 'What should the next experiment preserve?' : 'What would you like to change in this section?'}</label>
    <textarea id={`assist-${action}`} rows={2} maxLength={4000} value={instruction} onChange={event => setInstruction(event.target.value)} />
    <button onClick={request} disabled={pending || targetLocked || (action === 'lyrics' && !sectionTarget) || (action === 'doctor' && !draft.doctor.reportedProblem.trim())}>{pending ? 'Considering your song…' : action === 'doctor' ? 'Ask Doctor for a small experiment' : 'Suggest a section revision'}</button>
    {targetLocked && <p role="status">This section is preserved. Choose an unlocked section to revise. Preserved phrases in an unlocked section can stay while its other lines change.</p>}
    {status && <p role="status">{status}</p>}
    {observations.length > 0 && <div><h3>Observations from this request</h3><ul>{observations.map((observation, index) => <li key={index}>{observation}</li>)}</ul></div>}
  </div>
}
