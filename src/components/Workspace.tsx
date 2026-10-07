'use client'

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'
import { parseCompilerOutput, type CompilerOutput, type DiscoveryAffinities, type SelectedNode } from '../lib/compiler-contract'
import { clearStarterIntent, consumeStarterIntent, hasStarterIntent } from '../lib/starter-intent'
import { WorkspaceProvider, useWorkspace } from './WorkspaceProvider'
import ProposalReview from './ProposalReview'
import WorkspaceAssistance from './WorkspaceAssistance'
import WorkspaceIcon from './WorkspaceIcon'
import WorkspaceHint from './WorkspaceHint'
import { createWorkspaceDraft } from '../lib/workspace-draft'
import './creative-workbench.css'

const LyricsStudio = lazy(() => import('./LyricsStudio'))
const PromptDoctor = lazy(() => import('./PromptDoctor'))

const SoundBrainCanvas = dynamic(() => import('./SoundBrainCanvas'), {
  ssr: false,
  loading: () => <p role="status" className="py-6 text-gray-300">Loading Sound Brain…</p>,
})

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300'

export default function Workspace({ discoveryNodes, affinities, assistanceAvailable = false }: {
  discoveryNodes: SelectedNode[]
  affinities: DiscoveryAffinities
  assistanceAvailable?: boolean
}) {
  return <WorkspaceProvider catalog={discoveryNodes}><WorkspaceTools discoveryNodes={discoveryNodes} affinities={affinities} assistanceAvailable={assistanceAvailable} /></WorkspaceProvider>
}

function WorkspaceTools({ discoveryNodes, affinities, assistanceAvailable }: { discoveryNodes: SelectedNode[]; affinities: DiscoveryAffinities; assistanceAvailable: boolean }) {
  const { draft, update, openAccount, closeAccount, saveStatus, retrySave, recoverSave } = useWorkspace()
  const { selectedNodes, relationshipNotes, compilerResult: result, compiledStyles: output } = draft.styleIntent
  const setSelectedNodes = useCallback((change: (nodes: SelectedNode[]) => SelectedNode[]) => update(current => ({ ...current, styleIntent: { ...current.styleIntent, selectedNodes: change(current.styleIntent.selectedNodes), compilerResult: null, compiledStyles: '' } })), [update])
  const setRelationshipNotes = useCallback((relationshipNotes: string) => update(current => ({ ...current, styleIntent: { ...current.styleIntent, relationshipNotes } })), [update])
  const setResult = useCallback((compilerResult: CompilerOutput | null) => update(current => ({ ...current, styleIntent: { ...current.styleIntent, compilerResult } })), [update])
  const setOutput = useCallback((compiledStyles: string) => update(current => ({ ...current, styleIntent: { ...current.styleIntent, compiledStyles } })), [update])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [starterStatus, setStarterStatus] = useState('')
  const [discoverySession, setDiscoverySession] = useState(0)
  const [intentFocus, setIntentFocus] = useState<{ mode: 'brain' | 'lyrics'; id: string | null } | null>(null)
  const intentWasEdited = useRef(false)
  const workspaceOwner = useRef<string | null | undefined>(undefined)
  const accountRevision = useRef(0)
  const requestInFlight = useRef(false)
  const generateButton = useRef<HTMLButtonElement>(null)
  const songDrawer = useRef<HTMLDialogElement>(null)
  const songTrigger = useRef<HTMLButtonElement>(null)
  const navigation = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const position = () => {
      const editing = document.activeElement?.matches('input,textarea,select')
      const inset = editing && viewport.scale === 1 ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0
      navigation.current?.closest<HTMLElement>('.brain-workspace')?.style.setProperty('--keyboard-inset', `${inset}px`)
    }
    const afterFocus = () => queueMicrotask(position)
    position()
    viewport.addEventListener('resize', position)
    viewport.addEventListener('scroll', position)
    document.addEventListener('focusin', afterFocus)
    document.addEventListener('focusout', afterFocus)
    return () => { viewport.removeEventListener('resize', position); viewport.removeEventListener('scroll', position); document.removeEventListener('focusin', afterFocus); document.removeEventListener('focusout', afterFocus) }
  }, [])
  const restoreGenerateFocus = useRef(false)
  const router = useRouter()
  const navigateToIntent = useCallback((mode: 'brain' | 'lyrics', id: string | null = null) => {
    setIntentFocus({ mode, id })
    update(current => ({ ...current, mode }))
  }, [update])
  useEffect(() => {
    if (draft.mode !== 'brain' || intentFocus?.mode !== 'brain') return
    const element = intentFocus.id ? document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(intentFocus.id)}"]`) : document.getElementById('relationship-notes')
    element?.focus()
    element?.scrollIntoView?.({ block: 'center', behavior: 'instant' })
  }, [draft.mode, intentFocus])

  useEffect(() => {
    if (isGenerating || !restoreGenerateFocus.current) return
    restoreGenerateFocus.current = false
    // Native disabled buttons lose keyboard focus. Restore it after the request
    // only if the user has not moved focus to another control while waiting.
    if (document.activeElement === document.body) generateButton.current?.focus()
  }, [isGenerating])

  const clearCandidate = useCallback(() => {
    setResult(null)
    setOutput('')
    setError('')
    setCopyStatus('')
  }, [setResult, setOutput])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    const resetIntent = () => {
      accountRevision.current += 1
      setDiscoverySession(value => value + 1)
      setIntentFocus(null)
      intentWasEdited.current = true
      clearStarterIntent()
      closeAccount()
      setStarterStatus('')
      setError('')
      setCopyStatus('')
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const owner = session?.user.id ?? null
      if (event === 'SIGNED_OUT' || (workspaceOwner.current !== undefined && workspaceOwner.current !== owner)) {
        resetIntent()
        if (owner) openAccount(owner, false)
      }
      workspaceOwner.current = owner
    })
    const revision = accountRevision.current
    // The protected server route already verifies access. This local session
    // snapshot only associates tab-local notes with their owner; do not add a
    // browser /auth/v1/user fetch that could enter a cross-origin PWA cache.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || revision !== accountRevision.current) return
      if (error || !data.session?.user) {
        if (hasStarterIntent()) setStarterStatus('Your starter is still saved in this tab. Refresh to try carrying it over again.')
        else setStarterStatus('Autosave could not establish this tab’s account. Keep this tab open, export your work, and refresh to retry.')
        return
      }
      if (workspaceOwner.current !== undefined && workspaceOwner.current !== data.session.user.id) {
        resetIntent()
        return
      }
      workspaceOwner.current = data.session.user.id
      const restored = openAccount(data.session.user.id, intentWasEdited.current)
      const starter = consumeStarterIntent(data.session.user.id, intentWasEdited.current || restored)
      if (starter.status === 'ready') {
        intentWasEdited.current = true
        setRelationshipNotes(starter.notes)
        setStarterStatus('Your starter is in Relationship notes. Collect Sound Brain nodes when you’re ready.')
      } else if (starter.status === 'discarded') {
        setStarterStatus('Your current workspace was kept. The pending starter was not applied.')
      } else if (starter.status === 'unavailable') {
        setStarterStatus('Your starter could not be carried over. Return home to try again.')
      }
    }).catch(() => {
      if (mounted && hasStarterIntent()) setStarterStatus('Your starter is still saved in this tab. Refresh to try carrying it over again.')
      else if (mounted) setStarterStatus('Autosave could not establish this tab’s account. Keep this tab open, export your work, and refresh to retry.')
    })
    return () => { mounted = false; accountRevision.current += 1; subscription.unsubscribe() }
  }, [closeAccount, openAccount, setRelationshipNotes])

  const collectNode = useCallback((node: SelectedNode) => {
    if (requestInFlight.current) return
    intentWasEdited.current = true
    setSelectedNodes(previous => previous.some(item => item.node_id === node.node_id) ? previous : [...previous, node])
    clearCandidate()
  }, [clearCandidate, setSelectedNodes])

  const removeNode = useCallback((nodeId: string) => {
    if (requestInFlight.current) return
    setSelectedNodes(previous => previous.filter(node => node.node_id !== nodeId))
    clearCandidate()
  }, [clearCandidate, setSelectedNodes])

  const handleSignOut = async () => {
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      clearStarterIntent()
      router.push('/login')
      router.refresh()
    } catch {
      setError('Could not sign out. Please try again.')
    }
  }

  const handleGenerate = async () => {
    if (requestInFlight.current || selectedNodes.length === 0) return
    const revision = accountRevision.current
    const intentSnapshot = JSON.stringify({ nodes: selectedNodes, relationship_notes: relationshipNotes })
    const songSnapshot = draft.project.id
    restoreGenerateFocus.current = document.activeElement === generateButton.current
    requestInFlight.current = true
    setIsGenerating(true)
    clearCandidate()
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: intentSnapshot,
      })
      if (revision !== accountRevision.current) return
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'))
        const retry = Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 2_678_400
          ? `Try again in ${seconds} seconds.` : 'Please try again later.'
        setError(`Compiler usage limit reached. ${retry} Your nodes and notes are still here.`)
        return
      }
      if (response.status === 503) {
        setError('Prompt compilation is currently unavailable. Your nodes and notes are still here.')
        return
      }
      if (!response.ok) throw new Error('Could not compile your prompt. Your nodes and notes are still here. Please try again.')
      const compiled = parseCompilerOutput(await response.json(), selectedNodes)
      if (revision !== accountRevision.current) return
      update(current => {
        if (current.project.id !== songSnapshot || JSON.stringify({ nodes: current.styleIntent.selectedNodes, relationship_notes: current.styleIntent.relationshipNotes }) !== intentSnapshot || current.styleIntent.compiledStyles || current.styleIntent.compilerResult) {
          throw new Error('Your song changed during compilation. Compile again from the current intent.')
        }
        return { ...current, styleIntent: { ...current.styleIntent, compilerResult: compiled, compiledStyles: compiled.styles } }
      })
    } catch (caught) {
      if (revision !== accountRevision.current) return
      setError(caught instanceof Error && (caught.message.startsWith('The compiler returned') || caught.message.startsWith('Your song changed'))
        ? caught.message : 'Could not compile your prompt. Your nodes and notes are still here. Please try again.')
    } finally {
      requestInFlight.current = false
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!output.trim()) return
    try {
      await navigator.clipboard.writeText(output)
      setCopyStatus('Copied to clipboard.')
    } catch {
      setCopyStatus('Could not copy. Select the Styles text to copy it manually.')
    }
  }

  const handleExport = () => {
    if (!output.trim()) return
    try {
      const url = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'promptsuno-styles.txt'
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Allow the browser to begin consuming the download before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setCopyStatus('Styles export requested.')
    } catch {
      setCopyStatus('Could not export. You can copy the Styles text instead.')
    }
  }

  return (
    <div className="brain-workspace flex min-h-screen flex-col text-white">
      <header className="flex items-center justify-between border-b border-[#303940] bg-[#090e11] px-5 py-4">
        <h1 className="text-2xl font-extrabold tracking-tighter"><Link href="/" className={focusStyle}>Prompt<span className="text-[#ff702b]">Suno</span></Link></h1>
        <button onClick={handleSignOut} disabled={isGenerating} className={`min-h-11 px-2 text-sm text-gray-300 hover:text-white ${focusStyle}`}>Sign Out</button>
      </header>
        <div className="song-identity">
          <div className="song-identity-fields">
          <label htmlFor="song-title" className="sr-only">Song title</label>
          <input id="song-title" value={draft.project.title} maxLength={120} onChange={event => update(current => ({ ...current, project: { ...current.project, title: event.target.value } }))} className="song-title" />
          <p role="status" className="text-xs text-gray-400">{saveStatus}</p>
          {saveStatus.startsWith('Not saved') && <button onClick={retrySave} className={`text-sm text-amber-300 ${focusStyle}`}>Retry autosave</button>}
          </div>
          <button ref={songTrigger} className="song-drawer-trigger" aria-haspopup="dialog" onClick={() => songDrawer.current?.showModal()}><WorkspaceIcon name="song" /><span>Song drawer<small>Context · saved material</small></span><span aria-hidden="true">⌄</span></button>
        </div>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pt-7 sm:p-6">
        <div ref={navigation} className="workspace-navigation">
          <nav aria-label="Song tools" className="song-modes">
            {(['brain', 'lyrics', 'doctor'] as const).map(mode => <button key={mode} aria-current={draft.mode === mode ? 'page' : undefined} onClick={() => update(current => ({ ...current, mode }))}><WorkspaceIcon name={mode} />{mode === 'brain' ? 'Brain' : mode === 'lyrics' ? 'Lyrics' : 'Doctor'}</button>)}
          </nav>
        </div>
        <WorkspaceHint id="song">One song, three tools. Open <b>Song drawer</b> for your sound context, preserved material and backup.</WorkspaceHint>
        {starterStatus && <p role="status" className="text-sm text-gray-300">{starterStatus}</p>}
        <div hidden={draft.mode !== 'brain'} className="space-y-6">
        {intentFocus?.mode === 'brain' && <p className="intent-spotlight">Review {selectedNodes.find(node => node.node_id === intentFocus.id)?.label || 'your sound notes'} in the context of this song. No sound ideas were added or removed.</p>}
        <section aria-labelledby="sound-brain-heading" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="sound-brain-heading" className="text-xl font-bold tracking-tight">Sound Brain Collector</h2><Link href="/learn/style-prompts" className={`text-sm text-amber-300 ${focusStyle}`}>Prompting guide →</Link></div>
          <SoundBrainCanvas key={discoverySession} discoveryNodes={discoveryNodes} affinities={affinities} selectedNodes={selectedNodes} onCollect={collectNode} onRemove={removeNode} disabled={isGenerating} highlightedNodeId={intentFocus?.mode === 'brain' ? intentFocus.id : null} />
          <p role="status" className="text-sm text-gray-300">{selectedNodes.length === 0 ? 'Collect nodes to begin.' : `${selectedNodes.length} ${selectedNodes.length === 1 ? 'node' : 'nodes'} selected.`}</p>
        </section>

        <div className="brain-notes space-y-2">
          <label htmlFor="relationship-notes" className="text-sm font-medium text-gray-300">Relationship notes</label>
          <p id="notes-help" className="text-sm text-gray-400">Describe roles, contrasts, or sections. For example: Piano leads while cello stays in the background.</p>
          <textarea id="relationship-notes" aria-describedby="notes-help" value={relationshipNotes} disabled={isGenerating} onChange={event => {
            intentWasEdited.current = true
            setRelationshipNotes(event.target.value)
            // Keep clarification visible while the user answers it in notes.
            setOutput('')
            setCopyStatus('')
            setError('')
            if (result?.status === 'ready') setResult(null)
          }} rows={3} className={`w-full rounded-xl border border-[#38444d] bg-[#0f171c] p-3 text-sm ${focusStyle}`} />
        </div>

        {result?.status === 'needs_clarification' && (
          <section aria-labelledby="clarification-heading" role="status" className="space-y-2 rounded-md border border-yellow-400/40 p-4">
            <h2 id="clarification-heading" className="font-semibold text-yellow-300">A little more direction</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">{result.questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
            <p className="text-sm text-gray-300">Answer in Relationship notes, then compile again.</p>
          </section>
        )}

        <button ref={generateButton} onClick={handleGenerate} disabled={isGenerating || selectedNodes.length === 0} className={`min-h-12 rounded-full bg-linear-to-r from-[#ff6734] to-[#ffe043] px-4 py-3 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50 ${focusStyle}`}>
          {isGenerating ? 'Crafting Prompt…' : result?.status === 'needs_clarification' ? 'Compile with clarification' : 'Generate Prompt'}
        </button>
        {isGenerating && <p role="status" className="text-sm text-gray-300">Compiling your selected nodes and notes…</p>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        {(result?.status === 'ready' || output) && (
          <section aria-labelledby="output-heading" className="space-y-3 pb-6">
            <h2 id="output-heading" className="text-sm font-medium text-gray-300">Suno Styles candidate</h2>
            <label htmlFor="styles-output" className="sr-only">Editable Styles prompt</label>
            <textarea id="styles-output" value={output} onChange={event => { setOutput(event.target.value); setCopyStatus('') }} rows={5} className={`w-full rounded-xl border border-[#38444d] bg-[#0f171c] p-4 text-sm leading-relaxed ${focusStyle}`} />
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCopy} disabled={!output.trim()} className={`min-h-11 rounded-md border border-gray-600 px-4 text-sm disabled:opacity-50 ${focusStyle}`}>Copy to Clipboard</button>
              <button onClick={handleExport} disabled={!output.trim()} className={`min-h-11 rounded-md border border-gray-600 px-4 text-sm disabled:opacity-50 ${focusStyle}`}>Export Styles</button>
            </div>
            {copyStatus && <p role="status" className="text-sm text-gray-300">{copyStatus}</p>}
            {!!result?.interpretations.length && <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300">{result.interpretations.map((item, index) => <li key={index}>{item}</li>)}</ul>}
          </section>
        )}
        </div>
        <Suspense fallback={<p role="status">Opening your workbench…</p>}>
          {draft.mode === 'lyrics' && <div key={`lyrics-${draft.project.id}`} className="space-y-6"><LyricsStudio focusSectionId={intentFocus?.mode === 'lyrics' ? intentFocus.id : null} /><WorkspaceAssistance action="lyrics" available={assistanceAvailable} targetId={intentFocus?.mode === 'lyrics' ? intentFocus.id : draft.lyrics.sections[0]?.id || null} /><ProposalReview onNavigate={navigateToIntent} /></div>}
          {draft.mode === 'doctor' && <PromptDoctor key={`doctor-${draft.project.id}`} onNavigate={navigateToIntent} assistanceAvailable={assistanceAvailable} />}
        </Suspense>
        {draft.mode === 'brain' && <ProposalReview onNavigate={navigateToIntent} />}
        <dialog ref={songDrawer} className="song-dock" aria-labelledby="song-drawer-heading" onClose={() => songTrigger.current?.focus()} onClick={event => { if (event.target === event.currentTarget) songDrawer.current?.close() }}>
          <div className="song-drawer-header"><div><p className="drawer-kicker">YOUR SONG / SHARED CONTEXT</p><h2 id="song-drawer-heading">Song drawer</h2></div><button autoFocus aria-label="Close song drawer" onClick={() => songDrawer.current?.close()}><WorkspaceIcon name="reject" /></button></div>
          <p className="song-drawer-title">{draft.project.title || 'Untitled song'}</p>
          <p>{selectedNodes.length} sound ideas · {draft.lyrics.text ? 'Lyrics draft' : 'No lyrics yet'} · {draft.preservationGoals.length} preserved</p>
          <div className="space-y-3 pt-4 text-sm">
            <p><strong>Sound:</strong> {selectedNodes.map(node => node.label).join(' · ') || 'Collect your first idea in Brain.'}</p>
            <p className="whitespace-pre-wrap"><strong>Intent:</strong> {relationshipNotes || 'No relationship notes yet.'}</p>
            <p><strong>Lyrics:</strong> {draft.lyrics.sections.map(section => section.title).join(' · ') || 'No sections yet.'}</p>
            <p><strong>Preserved:</strong> {draft.preservationGoals.map(goal => goal.text).join(' · ') || 'Nothing locked yet.'}</p>
            {draft.doctor.reportedProblem && <p className="whitespace-pre-wrap"><strong>What missed:</strong> {draft.doctor.reportedProblem}</p>}
            <details><summary>Bring existing Styles into this song</summary><label htmlFor="import-styles">Existing Styles output</label><textarea id="import-styles" rows={3} maxLength={64000} value={output} onChange={event => { setResult(null); setOutput(event.target.value) }} className="w-full rounded-xl border border-gray-600 bg-[#0f171c] p-3" /><p className="text-gray-400">This edits the output only. Your selected sound ideas and notes stay structured.</p></details>
            <p className="text-gray-400">Local to this browser tab and account. No cloud sync.</p>
            <button className={`min-h-11 text-amber-300 ${focusStyle}`} onClick={() => {
              try {
                const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }))
                const link = document.createElement('a')
                link.href = url
                link.download = 'promptsuno-song.json'
                link.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
              } catch { setError('Could not export your song. Keep this tab open and copy your work manually.') }
            }}>Export song backup</button>
            <button disabled={isGenerating} className={`min-h-11 text-amber-300 ${focusStyle}`} onClick={() => {
              if (!window.confirm('Start a new song? This replaces the current local song and its revision history. Export a song backup first to keep it.')) return
              update(() => createWorkspaceDraft())
              setIntentFocus(null)
              setDiscoverySession(value => value + 1)
              setError(''); setStarterStatus(''); setCopyStatus('')
            }}>Start a new song</button>
            {saveStatus.startsWith('Saved song could not') && <div className="space-y-2">
              <p>The unreadable saved copy is protected. Export the current song first. Replacing it discards the unreadable copy.</p>
              <button onClick={recoverSave} className={`min-h-11 text-amber-300 ${focusStyle}`}>Replace unreadable copy with this song</button>
            </div>}
            {saveStatus.startsWith('Saved copy found') && <button onClick={recoverSave} className={`min-h-11 text-amber-300 ${focusStyle}`}>Replace saved copy with this song</button>}
          </div>
        </dialog>
      </main>
    </div>
  )
}
