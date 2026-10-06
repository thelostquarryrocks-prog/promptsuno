'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWorkspace } from './WorkspaceProvider'
import { makeProposal } from '../lib/workspace-revisions'
import type { WorkspaceProposal } from '../lib/workspace-draft'
import ProposalReview, { type NavigateToIntent } from './ProposalReview'
import WorkspaceAssistance from './WorkspaceAssistance'
import './creative-workbench.css'

const symptoms = ['Wrong vocal', 'Wrong genre/style', 'Missing instrument', 'Lyrics issue', 'Structure issue', 'Energy wrong', 'Production wrong', 'Something else']

export default function PromptDoctor({ onNavigate, assistanceAvailable = false }: { onNavigate: NavigateToIntent; assistanceAvailable?: boolean }) {
  const { draft, update } = useWorkspace()
  const [target, setTarget] = useState('relationshipNotes')
  const [after, setAfter] = useState('')
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState('')
  const targetId = target.startsWith('section:') ? target.slice(8) : null
  const targetKind: WorkspaceProposal['target'] = targetId ? 'lyricsSection' : target === 'compiledStyles' ? 'compiledStyles' : 'relationshipNotes'
  const before = targetKind === 'lyricsSection' ? draft.lyrics.sections.find(section => section.id === targetId)?.text || '' : draft.styleIntent[targetKind]
  const propose = () => {
    try {
      update(current => ({ ...current, doctor: { ...current.doctor, proposedChanges: [...current.doctor.proposedChanges, makeProposal(current, { source: 'user', target: targetKind, targetId, after, rationale: rationale || 'An experiment you chose. Compare the next result while keeping everything else steady.' })] } }))
      setAfter(''); setRationale(''); setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not prepare the experiment. Your song is unchanged.') }
  }
  return <section className="creative-workbench" aria-labelledby="doctor-heading">
    <div className="workbench-kicker">LISTEN · NOTICE · TRY ONE CHANGE</div>
    <h2 id="doctor-heading">Prompt Doctor</h2>
    <p className="workbench-intro">What missed?</p>
    <div className="symptom-choices" aria-label="Reported symptom">{symptoms.map(symptom => <button key={symptom} aria-pressed={draft.doctor.symptom === symptom} onClick={() => update(current => ({ ...current, doctor: { ...current.doctor, symptom } }))}>{symptom}</button>)}</div>
    <label htmlFor="reported-problem">What did you hear, and what did you want instead?</label>
    <textarea id="reported-problem" maxLength={64000} rows={3} placeholder={draft.doctor.symptom === 'Missing instrument' ? 'Which instrument was missing or hard to hear?' : 'Describe the result in your own words.'} value={draft.doctor.reportedProblem} onChange={event => update(current => ({ ...current, doctor: { ...current.doctor, reportedProblem: event.target.value } }))} />
    <details className="doctor-context"><summary>What this song already tells us</summary><div className="workbench-stack">
      <p><strong>Requested sound:</strong> {draft.styleIntent.selectedNodes.map(node => node.label).join(' · ') || 'No catalog ideas selected yet.'}</p>
      <p className="preserve-lines"><strong>Your sound notes:</strong> {draft.styleIntent.relationshipNotes || 'No notes yet.'}</p>
      <p><strong>Lyrics:</strong> {draft.lyrics.sections.length} sections · {draft.preservationGoals.length} preservation goals</p>
      <p className="workbench-muted">This is project context and your reported observation. No audio has been analyzed, and an observation does not establish a cause.</p>
      <div className="workbench-actions">{draft.styleIntent.selectedNodes.map(node => <button key={node.node_id} onClick={() => onNavigate('brain', node.node_id)}>Review {node.label} in Brain</button>)}</div>
      <div className="workbench-actions">{draft.lyrics.sections.map(section => <button key={section.id} onClick={() => onNavigate('lyrics', section.id)}>Edit {section.title || 'section'} in Lyrics</button>)}</div>
    </div></details>
    <WorkspaceAssistance action="doctor" available={assistanceAvailable} />
    {draft.doctor.hypotheses.length > 0 && <section className="hypothesis-card"><h3>Possible issues to test</h3><p className="workbench-muted">Hypotheses, not established causes or hidden Suno mechanisms.</p><ul>{draft.doctor.hypotheses.map((hypothesis, index) => <li key={index}>{hypothesis}</li>)}</ul></section>}
    <details className="experiment-builder"><summary>Plan your own small experiment</summary><div className="workbench-stack">
      <p className="workbench-muted">Change one passage or instruction, compare the next result, and keep the original available to revert.</p>
      <label htmlFor="experiment-target">Where would you like to try a change?</label><select id="experiment-target" value={target} onChange={event => { setTarget(event.target.value); setAfter('') }}><option value="relationshipNotes">Sound relationship notes</option><option value="compiledStyles">Styles output</option>{draft.lyrics.sections.map(section => <option key={section.id} value={`section:${section.id}`}>{section.title || 'Lyric section'}</option>)}</select>
      <div><h3>Before</h3><p className="preserve-lines proposal-original">{before || '(Empty)'}</p></div>
      <label htmlFor="experiment-after">Your proposed revision</label><textarea id="experiment-after" rows={4} maxLength={64000} value={after} onChange={event => setAfter(event.target.value)} />
      <label htmlFor="experiment-reason">What do you want to learn? <span className="workbench-muted">Optional</span></label><input id="experiment-reason" maxLength={4000} value={rationale} onChange={event => setRationale(event.target.value)} />
      {error && <p role="alert">{error}</p>}
      <button onClick={propose} disabled={!after.trim() || after === before}>Preview my experiment</button>
    </div></details>
    <ProposalReview onNavigate={onNavigate} />
    <p className="workbench-muted">Small experiments help you compare outcomes. They do not guarantee a particular result in Suno. <Link href="/learn/editing">Explore the editing guide</Link>.</p>
  </section>
}
