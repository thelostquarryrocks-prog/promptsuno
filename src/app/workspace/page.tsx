'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import SoundBrainCanvas from '../../components/SoundBrainCanvas'

export default function WorkspacePage() {
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTags, setCurrentTags] = useState<string[]>([])
  
  // NEW: State for the Copy Button
  const [isCopied, setIsCopied] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleGenerate = async () => {
    if (currentTags.length === 0) {
      alert("Please catch some tags in the Sound Brain first!")
      return
    }

    setIsGenerating(true)
    setOutput('') 

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: currentTags,
          isPremium: true 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const data = await response.json()
      // Store just the raw prompt styles for cleaner copying
      setOutput(data.styles)

    } catch (error) {
      console.error(error)
      setOutput('Error: Could not connect to the Sound Brain API.')
    } finally {
      setIsGenerating(false)
    }
  }

  // NEW: Handle copying to clipboard
  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-[#000000] px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight">Promptsuno</h1>
        <button 
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col p-4 space-y-6 max-w-2xl mx-auto w-full">
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Sound Brain Collector
          </label>
          {/* We now pass isGenerating down to the canvas to trigger the pulse! */}
          <SoundBrainCanvas/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || currentTags.length === 0}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Crafting Prompt...' : 'Generate Prompt'}
          </button>
          <button
            disabled={isGenerating}
            className="flex items-center justify-center rounded-md border border-gray-600 bg-transparent px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            Troubleshoot
          </button>
        </div>

        {/* Output Section with Copy Button */}
        {output && (
          <div className="flex flex-col space-y-2 flex-1 pb-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Suno Output
              </label>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isCopied ? '✓ Copied' : 'Copy to Clipboard'}
              </button>
            </div>
            
            <div className="relative group">
              <div className="w-full min-h-[100px] rounded-md border border-gray-700 bg-[#1a1a1a] p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner text-gray-200">
                {output}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}