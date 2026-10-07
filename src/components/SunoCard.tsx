'use client'

import { useEffect, useRef, useState } from 'react'
import type { SelectedNode } from '../lib/compiler-contract'
import { quickStylesDraft, songCardFileName, songCardText } from '../lib/suno-card'
import WorkspaceIcon from './WorkspaceIcon'

const SUNO_CREATE_URL = 'https://suno.com/create'

type Field = 'lyrics' | 'styles' | 'title'
type Step = 'brain' | 'lyrics'

export default function SunoCard({ title, styles, lyrics, sectionCount, selectedNodes, compileUnavailable, onUseQuickDraft, onGoTo }: {
  title: string
  styles: string
  lyrics: string
  sectionCount: number
  selectedNodes: SelectedNode[]
  compileUnavailable: boolean
  onUseQuickDraft: (styles: string) => void
  onGoTo: (step: Step, focus?: 'generate' | 'title') => void
}) {
  const [copied, setCopied] = useState<Field | null>(null)
  const [status, setStatus] = useState('')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const hasStyles = styles.trim().length > 0
  const hasLyrics = lyrics.trim().length > 0
  const namedSong = title.trim().length > 0 && title.trim() !== 'Untitled song'
  const draft = quickStylesDraft(selectedNodes)

  async function copy(field: Field, value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setStatus(`${label} copied. Paste it into Suno.`)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(null), 2200)
    } catch {
      setStatus(`Could not copy ${label.toLowerCase()}. Select the text and copy it manually.`)
    }
  }

  function download() {
    try {
      const url = URL.createObjectURL(new Blob([songCardText({ title, styles, lyrics })], { type: 'text/plain;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = songCardFileName(title)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus('Song card download started.')
    } catch {
      setStatus('Could not download the song card. Copy each field instead.')
    }
  }

  const copyButton = (field: Field, value: string, label: string) => <button type="button" className="slot-copy" data-copied={copied === field || undefined}
    disabled={!value.trim()} onClick={() => copy(field, value, label)}>
    <WorkspaceIcon name={copied === field ? 'apply' : 'copy'} />{copied === field ? 'Copied' : `Copy ${label.toLowerCase()}`}
  </button>

  return <section className="suno-card" aria-labelledby="suno-card-heading">
    <header className="suno-card-header">
      <div>
        <h2 id="suno-card-heading">Send to Suno</h2>
        <p>In Suno, open Create and switch to Custom. Then paste each field below into the matching box.</p>
      </div>
      <div className="suno-card-actions">
        <a className="suno-open" href={SUNO_CREATE_URL} target="_blank" rel="noopener noreferrer">Open Suno <WorkspaceIcon name="external" /><span className="sr-only">(opens in a new tab)</span></a>
        <button type="button" className="suno-download" onClick={download}><WorkspaceIcon name="download" />Download song card</button>
      </div>
    </header>

    <ol className="suno-slots">
      <li className="suno-slot" data-ready={hasLyrics || undefined}>
        <div className="slot-head"><h3>Lyrics</h3><span>{hasLyrics ? `${sectionCount} ${sectionCount === 1 ? 'section' : 'sections'} · ${lyrics.length.toLocaleString()} characters` : 'Empty'}</span>{copyButton('lyrics', lyrics, 'Lyrics')}</div>
        {hasLyrics
          ? <pre className="slot-value" tabIndex={0} aria-label="Lyrics to paste">{lyrics}</pre>
          : <div className="slot-empty"><p>No lyrics yet. For an instrumental, leave Suno’s Lyrics box empty and turn on its Instrumental switch.</p><button type="button" onClick={() => onGoTo('lyrics')}>Write lyrics</button></div>}
      </li>

      <li className="suno-slot" data-ready={hasStyles || undefined}>
        <div className="slot-head"><h3>Style of Music</h3><span>{hasStyles ? `${styles.length.toLocaleString()} characters` : 'Empty'}</span>{copyButton('styles', styles, 'Styles')}</div>
        {hasStyles
          ? <pre className="slot-value" tabIndex={0} aria-label="Styles to paste">{styles}</pre>
          : selectedNodes.length === 0
            ? <div className="slot-empty"><p>Pick a few sounds first. Your styles prompt is built from them.</p><button type="button" onClick={() => onGoTo('brain')}>Choose sounds</button></div>
            : <div className="slot-empty">
              <p>{compileUnavailable ? 'The AI prompt writer isn’t available right now.' : 'Generate a prompt from your sounds and description, or start from a plain list of what you picked.'}</p>
              <div className="slot-empty-actions">
                {!compileUnavailable && <button type="button" onClick={() => onGoTo('brain', 'generate')}>Generate prompt</button>}
                <button type="button" className={compileUnavailable ? 'is-primary' : undefined} onClick={() => onUseQuickDraft(draft)}>Use quick draft</button>
              </div>
              <p className="slot-preview"><span>Quick draft</span>{draft}</p>
            </div>}
      </li>

      <li className="suno-slot" data-ready={namedSong || undefined}>
        <div className="slot-head"><h3>Title</h3><span>{namedSong ? 'Ready' : 'Not named yet'}</span>{copyButton('title', namedSong ? title : '', 'Title')}</div>
        {namedSong
          ? <p className="slot-value slot-title">{title}</p>
          : <div className="slot-empty"><p>Optional. Name your song in the title field at the top of the page.</p><button type="button" onClick={() => onGoTo('brain', 'title')}>Name this song</button></div>}
      </li>
    </ol>

    <p role="status" className="suno-status">{status}</p>

    <aside className="suno-tips" aria-labelledby="suno-tips-heading">
      <h3 id="suno-tips-heading">Before you press Create</h3>
      <ul>
        <li>Want to keep a sound out? Put it in <b>Exclude</b> under Advanced Options. “No drums” written in Styles is easy for Suno to miss.</li>
        <li>Suno makes two versions each time. Listen to both before you change anything.</li>
        <li>If something misses, come back and use <b>Fix</b> to change one thing at a time.</li>
      </ul>
    </aside>
  </section>
}
