'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { parseCompilerOutput, type CompilerOutput, type DiscoveryAffinities, type SelectedNode } from '../lib/compiler-contract'

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

  const collectNode = useCallback((node: SelectedNode) => {
    if (requestInFlight.current) return
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
      router.push('/login')
      router.refresh()
    } catch {
      setError('Could not sign out. Please try again.')
    }
  }

  const handleGenerate = async () => {
    if (requestInFlight.current || selectedNodes.length === 0) return
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
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'))
        const retry = Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 2_678_400
          ? `Try again in ${seconds} seconds.` : 'Please try again later.'
        setError(`Compiler usage limit reached. ${retry} Your nodes and notes are still here.`)
        return
      }
      if (!response.ok) throw new Error('Could not compile your prompt. Your nodes and notes are still here. Please try again.')
      const compiled = parseCompilerOutput(await response.json(), selectedNodes)
      setResult(compiled)
      setOutput(compiled.styles)
    } catch (caught) {
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
    <div className="flex min-h-screen flex-col bg-[#121212] text-white">
      <header className="flex items-center justify-between border-b border-gray-800 bg-black px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight">PromptSuno</h1>
        <button onClick={handleSignOut} disabled={isGenerating} className={`min-h-11 px-2 text-sm text-gray-300 hover:text-white ${focusStyle}`}>Sign Out</button>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <section aria-labelledby="sound-brain-heading" className="space-y-2">
          <h2 id="sound-brain-heading" className="text-sm font-medium text-gray-300">Sound Brain Collector</h2>
          <SoundBrainCanvas discoveryNodes={discoveryNodes} affinities={affinities} selectedNodes={selectedNodes} onCollect={collectNode} onRemove={removeNode} disabled={isGenerating} />
          <p role="status" className="text-sm text-gray-300">{selectedNodes.length === 0 ? 'Collect nodes to begin.' : `${selectedNodes.length} ${selectedNodes.length === 1 ? 'node' : 'nodes'} selected.`}</p>
        </section>

        <div className="space-y-2">
          <label htmlFor="relationship-notes" className="text-sm font-medium text-gray-300">Relationship notes</label>
          <p id="notes-help" className="text-sm text-gray-400">Describe roles, contrasts, or sections. For example: Piano leads while cello stays in the background.</p>
          <textarea id="relationship-notes" aria-describedby="notes-help" value={relationshipNotes} disabled={isGenerating} onChange={event => {
            setRelationshipNotes(event.target.value)
            // Keep clarification visible while the user answers it in notes.
            setOutput('')
            setCopyStatus('')
            setError('')
            if (result?.status === 'ready') setResult(null)
          }} rows={3} className={`w-full rounded-md border border-gray-700 bg-[#1a1a1a] p-3 text-sm ${focusStyle}`} />
        </div>

        {result?.status === 'needs_clarification' && (
          <section aria-labelledby="clarification-heading" role="status" className="space-y-2 rounded-md border border-yellow-400/40 p-4">
            <h2 id="clarification-heading" className="font-semibold text-yellow-300">A little more direction</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">{result.questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
            <p className="text-sm text-gray-300">Answer in Relationship notes, then compile again.</p>
          </section>
        )}

        <button ref={generateButton} onClick={handleGenerate} disabled={isGenerating || selectedNodes.length === 0} className={`min-h-12 rounded-md bg-yellow-300 px-4 py-3 text-sm font-semibold text-black hover:bg-yellow-200 disabled:opacity-50 ${focusStyle}`}>
          {isGenerating ? 'Crafting Prompt…' : result?.status === 'needs_clarification' ? 'Compile with clarification' : 'Generate Prompt'}
        </button>
        {isGenerating && <p role="status" className="text-sm text-gray-300">Compiling your selected nodes and notes…</p>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        {result?.status === 'ready' && (
          <section aria-labelledby="output-heading" className="space-y-3 pb-6">
            <h2 id="output-heading" className="text-sm font-medium text-gray-300">Suno Styles candidate</h2>
            <label htmlFor="styles-output" className="sr-only">Editable Styles prompt</label>
            <textarea id="styles-output" value={output} onChange={event => { setOutput(event.target.value); setCopyStatus('') }} rows={5} className={`w-full rounded-md border border-gray-700 bg-[#1a1a1a] p-4 text-sm leading-relaxed ${focusStyle}`} />
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
