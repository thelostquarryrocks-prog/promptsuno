'use client'

import { useEffect, useRef, useState } from 'react'
import type { WorkspaceDraftV1 } from '../lib/workspace-draft'
import { changeLyricsSection, renderLyrics, replaceLyricsSections } from '../lib/workspace-revisions'
import { useWorkspace } from './WorkspaceProvider'
import './lyrics-studio.css'

type Section = WorkspaceDraftV1['lyrics']['sections'][number]

// Only split where the canonical two-newline separator can reproduce every byte.
// Keep labels inside the text: importing must never silently rewrite the song.
function importSections(text: string): Section[] {
  return text.split(/\n\n(?=\[[^\]\r\n]{1,160}\](?:\r?\n|$))/).map((part, index) => ({
    id: crypto.randomUUID(), title: /^\[([^\]\r\n]{1,160})\](?:\r?\n|$)/.exec(part)?.[1] ?? `Section ${index + 1}`, text: part,
  }))
}

export default function LyricsStudio({ focusSectionId }: { focusSectionId?: string | null }) {
  const { draft, update } = useWorkspace()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [importText, setImportText] = useState('')
  const [preview, setPreview] = useState<Section[] | null>(null)
  const [goalText, setGoalText] = useState('')
  const [goalScope, setGoalScope] = useState<'phrase' | 'note'>('phrase')
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const sections = draft.lyrics.sections

  useEffect(() => {
    if (!focusSectionId) return
    const element = sectionRefs.current.get(focusSectionId)
    element?.scrollIntoView({ block: 'center', behavior: 'instant' })
    element?.focus({ preventScroll: true })
  }, [focusSectionId])

  function change(action: (current: WorkspaceDraftV1) => WorkspaceDraftV1) {
    try { update(action); setError(''); setNotice('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'This change could not be saved.') }
  }
  function addSection(title: string) {
    change(current => {
      const existing = current.lyrics.sections.length || !current.lyrics.text ? current.lyrics.sections : [{ id: crypto.randomUUID(), title: 'Existing lyrics', text: current.lyrics.text }]
      return replaceLyricsSections(current, [...existing, { id: crypto.randomUUID(), title, text: '' }])
    })
  }
  function moveSection(id: string, direction: number) {
    change(current => {
      const next = [...current.lyrics.sections]
      const index = next.findIndex(section => section.id === id)
      if (index < 0 || index + direction < 0 || index + direction >= next.length) return current
      ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
      return replaceLyricsSections(current, next)
    })
  }
  function preserveSection(section: Section) {
    change(current => {
      const existing = current.preservationGoals.filter(goal => goal.scope === 'section' && goal.targetId === section.id)
      if (existing.length) return { ...current, preservationGoals: current.preservationGoals.filter(goal => !existing.includes(goal)) }
      if (current.preservationGoals.length >= 200) throw new Error('This song has reached its 200 preservation goals limit.')
      return { ...current, preservationGoals: [...current.preservationGoals, { id: crypto.randomUUID(), scope: 'section', targetId: section.id, text: section.title }] }
    })
  }
  function addGoal() {
    if (!goalText.trim()) { setError('Enter the phrase or story note to preserve.'); return }
    try {
      update(current => {
        if (current.preservationGoals.length >= 200) throw new Error('This song has reached its 200 preservation goals limit.')
        if (goalScope === 'phrase' && !renderLyrics(current.lyrics.sections).includes(goalText)) throw new Error('The exact phrase must appear in your lyrics before you can preserve it.')
        return { ...current, preservationGoals: [...current.preservationGoals, { id: crypto.randomUUID(), scope: goalScope, targetId: null, text: goalText }] }
      })
      setGoalText(''); setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not preserve this material.') }
  }
  async function copyLyrics() {
    try { await navigator.clipboard.writeText(draft.lyrics.text); setNotice('Lyrics copied.'); setError('') }
    catch { setError('Clipboard is unavailable. Use Export lyrics to keep a copy.') }
  }
  function exportLyrics() {
    try {
    const url = URL.createObjectURL(new Blob([draft.lyrics.text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'promptsuno-lyrics.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Lyrics export requested.')
    } catch { setError('Export is unavailable. Keep this tab open and copy your lyric text manually.') }
  }

  return <section className="lyrics-studio" aria-labelledby="lyrics-heading">
    <header className="lyrics-intro">
      <div><p className="lyrics-eyebrow">THE WORDS / YOUR SONG</p><h2 id="lyrics-heading">Lyrics Studio</h2><p>Give your song a voice. Keep the lines that matter.</p></div>
      <div className="lyrics-actions"><button type="button" onClick={copyLyrics} disabled={!draft.lyrics.text}>Copy lyrics</button><button type="button" onClick={exportLyrics} disabled={!draft.lyrics.text}>Export lyrics</button></div>
    </header>
    <aside className="lyrics-context" aria-label="Shared sound context">
      <div><span className="lyrics-eyebrow">SOUND CONTEXT</span><p>{draft.styleIntent.selectedNodes.length ? draft.styleIntent.selectedNodes.map(node => node.label).join(' · ') : 'Your sound selections will appear here as you shape them in Brain.'}</p>{draft.styleIntent.relationshipNotes && <p className="lyrics-context-note">{draft.styleIntent.relationshipNotes}</p>}</div>
      <button type="button" onClick={() => change(current => ({ ...current, mode: 'brain' }))}>View Sound Intent <span aria-hidden="true">↗</span></button>
    </aside>
    {error && <p className="lyrics-feedback lyrics-error" role="alert">{error}</p>}
    {notice && <p className="lyrics-feedback" role="status">{notice}</p>}
    <div className="lyrics-layout"><div className="lyrics-main">
      {!sections.length && <div className="lyrics-empty"><span aria-hidden="true">♫</span><h2>{draft.lyrics.text ? 'Your existing lyrics are here.' : 'Start with a line you believe.'}</h2>{draft.lyrics.text ? <><p>Open them as a section to start editing. Your exact text is retained.</p><pre className="lyrics-existing">{draft.lyrics.text}</pre><button type="button" onClick={() => change(current => replaceLyricsSections(current, [{ id: crypto.randomUUID(), title: 'Existing lyrics', text: current.lyrics.text }]))}>Open existing lyrics as a section</button></> : <p>Add a verse or chorus below, or bring in lyrics you already have.</p>}</div>}
      {sections.map((section, index) => {
        const locked = draft.preservationGoals.some(goal => goal.scope === 'section' && goal.targetId === section.id)
        return <article className={`lyrics-section${locked ? ' is-preserved' : ''}${focusSectionId === section.id ? ' is-highlighted' : ''}`} key={section.id} tabIndex={-1} aria-label={`${section.title || 'Untitled section'}, section ${index + 1}`} ref={element => { if (element) sectionRefs.current.set(section.id, element); else sectionRefs.current.delete(section.id) }}>
          <div className="lyrics-section-top"><span className="lyrics-section-number">{String(index + 1).padStart(2, '0')}</span><label className="lyrics-title-label"><span className="lyrics-sr-only">Section {index + 1} title</span><input value={section.title} maxLength={160} disabled={locked} onChange={event => change(current => replaceLyricsSections(current, current.lyrics.sections.map(item => item.id === section.id ? { ...item, title: event.target.value } : item)))} /></label><button className="lyrics-lock" type="button" aria-pressed={locked} onClick={() => preserveSection(section)}>{locked ? 'Unlock section' : 'Preserve section'}</button></div>
          <div className="lyrics-body-label"><label className="lyrics-sr-only" htmlFor={`lyrics-section-${section.id}`}>{section.title || `Section ${index + 1}`} lyrics</label><textarea id={`lyrics-section-${section.id}`} value={section.text} maxLength={64_000} disabled={locked} placeholder="Let the first line find you…" rows={6} onChange={event => change(current => changeLyricsSection(current, section.id, event.target.value))} /></div>
          <footer className="lyrics-section-bottom"><span>{locked ? 'Preserved · unlock to edit' : `${section.text.length.toLocaleString()} characters`}</span><div><button type="button" disabled={index === 0} aria-label={`Move ${section.title || 'section'} up`} onClick={() => moveSection(section.id, -1)}>↑</button><button type="button" disabled={index === sections.length - 1} aria-label={`Move ${section.title || 'section'} down`} onClick={() => moveSection(section.id, 1)}>↓</button><button type="button" disabled={locked} onClick={() => { if (!section.text || window.confirm(`Remove ${section.title || 'this section'} and its lyrics?`)) change(current => replaceLyricsSections(current, current.lyrics.sections.filter(item => item.id !== section.id))) }}>Remove</button></div></footer>
        </article>
      })}
      <div className="lyrics-add" aria-label="Add lyric section"><button type="button" disabled={sections.length >= 100} onClick={() => addSection('Verse')}>+ Verse</button><button type="button" disabled={sections.length >= 100} onClick={() => addSection('Chorus')}>+ Chorus</button><button type="button" disabled={sections.length >= 100} onClick={() => addSection('Bridge')}>+ Bridge</button><button type="button" disabled={sections.length >= 100} onClick={() => addSection('Section')}>+ Section</button></div>
      <p className="lyrics-help">Section names organize your writing. They do not guarantee how Suno will perform it. Copy and export preserve your lyric text exactly.</p>
      <details className="lyrics-panel lyrics-import"><summary>Import existing lyrics</summary><p>Paste your lyrics to preview the import. Explicit [section] labels separated by blank lines become cards. Labels and whitespace stay in the lyric text; other formatting stays in one card.</p><label htmlFor="lyrics-import-text">Existing lyrics</label><textarea id="lyrics-import-text" rows={6} maxLength={64_000} value={importText} onChange={event => { setImportText(event.target.value); setPreview(null) }} /><button type="button" disabled={!importText} onClick={() => { setPreview(importSections(importText)); setError('') }}>Preview import</button>{preview && <div className="lyrics-import-preview"><p>{preview.length} section{preview.length === 1 ? '' : 's'} · {importText.length.toLocaleString()} characters. Original text retained.</p><ol>{preview.map(section => <li key={section.id}>{section.title}</li>)}</ol>{(sections.length > 0 || draft.lyrics.text) && <p className="lyrics-import-warning">Import replaces your current lyrics. Export a copy first if you want to keep them. Preserved sections and phrases cannot be removed.</p>}<button type="button" className="lyrics-primary" onClick={() => { try { update(current => replaceLyricsSections(current, preview)); setPreview(null); setImportText(''); setError(''); setNotice('Lyrics imported with original text retained.') } catch (caught) { setError(caught instanceof Error ? caught.message : 'Import could not be saved.') } }}>{sections.length > 0 || draft.lyrics.text ? 'Replace lyrics with this import' : 'Import these lyrics'}</button></div>}</details>
    </div><aside className="lyrics-sidebar" aria-label="Writing notes and preservation">
      <section className="lyrics-panel"><p className="lyrics-eyebrow">THE THREAD TO FOLLOW</p><h2>Writing notes</h2><label htmlFor="lyrics-notes">Story, perspective, or a feeling to return to</label><textarea id="lyrics-notes" rows={7} maxLength={64_000} value={draft.lyrics.lyricNotes} onChange={event => change(current => ({ ...current, lyrics: { ...current.lyrics, lyricNotes: event.target.value } }))} placeholder="Who is singing? What can’t they say out loud?" /></section>
      <details className="lyrics-panel" open={draft.preservationGoals.some(goal => goal.scope !== 'section') || undefined}><summary>Keep what matters</summary><p>Preserve exact phrases against edits, or record a story detail for future suggestions. Story notes guide you; they do not automatically check meaning.</p>{draft.preservationGoals.filter(goal => goal.scope !== 'section').map(goal => <div className="lyrics-goal" key={goal.id}><span className="lyrics-eyebrow">{goal.scope === 'phrase' ? 'EXACT PHRASE' : 'STORY NOTE'}</span><p>{goal.text}</p><button type="button" onClick={() => change(current => ({ ...current, preservationGoals: current.preservationGoals.filter(item => item.id !== goal.id) }))}>Remove preservation</button></div>)}<label htmlFor="lyrics-preserve-kind">Preservation type</label><select id="lyrics-preserve-kind" value={goalScope} onChange={event => setGoalScope(event.target.value as 'phrase' | 'note')}><option value="phrase">Exact phrase already in lyrics</option><option value="note">Story or meaning note</option></select><label htmlFor="lyrics-preserve-text">{goalScope === 'phrase' ? 'Exact phrase to keep' : 'Story detail to keep'}</label><textarea id="lyrics-preserve-text" maxLength={8_000} rows={3} value={goalText} onChange={event => setGoalText(event.target.value)} /><button type="button" onClick={addGoal} disabled={draft.preservationGoals.length >= 200}>Preserve {goalScope === 'phrase' ? 'phrase' : 'note'}</button></details>
    </aside></div>
  </section>
}
