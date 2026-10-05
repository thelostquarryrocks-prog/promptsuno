'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'
import { parseCompilerOutput, type CompilerOutput, type DiscoveryAffinities, type SelectedNode } from '../lib/compiler-contract'
import { clearStarterIntent, consumeStarterIntent, hasStarterIntent } from '../lib/starter-intent'

const SoundBrainCanvas = dynamic(() => import('./SoundBrainCanvas'), {
  ssr: false,
  loading: () => <p role="status" className="py-6 text-gray-300">Loading Sound Brain…</p>,
})

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300'

export default function Workspace({ discoveryNodes, affinities }: {
  discoveryNodes: SelectedNode[]
  affinities: DiscoveryAffinities
}) {
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([])
  const [relationshipNotes, setRelationshipNotes] = useState('')
  const [result, setResult] = useState<CompilerOutput | null>(null)
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [starterStatus, setStarterStatus] = useState('')
  const [discoverySession, setDiscoverySession] = useState(0)
  const intentWasEdited = useRef(false)
  const workspaceOwner = useRef<string | null | undefined>(undefined)
  const accountRevision = useRef(0)
  const requestInFlight = useRef(false)
  const generateButton = useRef<HTMLButtonElement>(null)
  const restoreGenerateFocus = useRef(false)
  const router = useRouter()

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
  }, [])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    const resetIntent = () => {
      accountRevision.current += 1
      setDiscoverySession(value => value + 1)
      intentWasEdited.current = true
      clearStarterIntent()
      setRelationshipNotes('')
      setSelectedNodes([])
      setStarterStatus('')
      clearCandidate()
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const owner = session?.user.id ?? null
      if (event === 'SIGNED_OUT' || (workspaceOwner.current !== undefined && workspaceOwner.current !== owner)) resetIntent()
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
        return
      }
      if (workspaceOwner.current !== undefined && workspaceOwner.current !== data.session.user.id) {
        resetIntent()
        return
      }
      workspaceOwner.current = data.session.user.id
      const starter = consumeStarterIntent(data.session.user.id, intentWasEdited.current)
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
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [clearCandidate])

  const collectNode = useCallback((node: SelectedNode) => {
    if (requestInFlight.current) return
    intentWasEdited.current = true
    setSelectedNodes(previous => previous.some(item => item.node_id === node.node_id) ? previous : [...previous, node])
    clearCandidate()
  }, [clearCandidate])

  const removeNode = useCallback((nodeId: string) => {
    if (requestInFlight.current) return
    setSelectedNodes(previous => previous.filter(node => node.node_id !== nodeId))
    clearCandidate()
  }, [clearCandidate])

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
    restoreGenerateFocus.current = document.activeElement === generateButton.current
    requestInFlight.current = true
    setIsGenerating(true)
    clearCandidate()
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: selectedNodes, relationship_notes: relationshipNotes }),
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
      setResult(compiled)
      setOutput(compiled.styles)
    } catch (caught) {
      if (revision !== accountRevision.current) return
      setError(caught instanceof Error && caught.message.startsWith('The compiler returned')
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 pt-7 sm:p-6">
        {starterStatus && <p role="status" className="text-sm text-gray-300">{starterStatus}</p>}
        <section aria-labelledby="sound-brain-heading" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="sound-brain-heading" className="text-xl font-bold tracking-tight">Sound Brain Collector</h2><Link href="/learn/style-prompts" className={`text-sm text-amber-300 ${focusStyle}`}>Prompting guide →</Link></div>
          <SoundBrainCanvas key={discoverySession} discoveryNodes={discoveryNodes} affinities={affinities} selectedNodes={selectedNodes} onCollect={collectNode} onRemove={removeNode} disabled={isGenerating} />
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

        {result?.status === 'ready' && (
          <section aria-labelledby="output-heading" className="space-y-3 pb-6">
            <h2 id="output-heading" className="text-sm font-medium text-gray-300">Suno Styles candidate</h2>
            <label htmlFor="styles-output" className="sr-only">Editable Styles prompt</label>
            <textarea id="styles-output" value={output} onChange={event => { setOutput(event.target.value); setCopyStatus('') }} rows={5} className={`w-full rounded-xl border border-[#38444d] bg-[#0f171c] p-4 text-sm leading-relaxed ${focusStyle}`} />
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCopy} disabled={!output.trim()} className={`min-h-11 rounded-md border border-gray-600 px-4 text-sm disabled:opacity-50 ${focusStyle}`}>Copy to Clipboard</button>
              <button onClick={handleExport} disabled={!output.trim()} className={`min-h-11 rounded-md border border-gray-600 px-4 text-sm disabled:opacity-50 ${focusStyle}`}>Export Styles</button>
            </div>
            {copyStatus && <p role="status" className="text-sm text-gray-300">{copyStatus}</p>}
            {result.interpretations.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300">{result.interpretations.map((item, index) => <li key={index}>{item}</li>)}</ul>}
          </section>
        )}
      </main>
    </div>
  )
}
