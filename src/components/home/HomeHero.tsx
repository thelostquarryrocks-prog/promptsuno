'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveStarterIntent, STARTER_EXAMPLES, MAX_STARTER_TEXT_LENGTH, type StarterExample } from '@/lib/starter-intent'
import { EARLY_ACCESS_URL } from '@/lib/site'
import { BananaTip } from './BananaTip'
import styles from '@/app/page.module.css'

const subscribe = () => () => {}

export default function HomeHero() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<StarterExample[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const pendingSave = useRef<AbortController | null>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const resetSubmission = () => {
      pendingSave.current?.abort()
      pendingSave.current = null
      submitting.current = false
      setSaving(false)
    }
    // Next may retain this page's state in its back/forward cache. Release the
    // submission lock on departure, and also when a native bfcache restores it.
    window.addEventListener('pageshow', resetSubmission)
    return () => {
      window.removeEventListener('pageshow', resetSubmission)
      resetSubmission()
    }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (!text.trim() && selected.length === 0) {
      setError('Start with a few words, or choose a sound above.')
      input.current?.focus()
      return
    }
    submitting.current = true
    const controller = new AbortController()
    pendingSave.current = controller
    setSaving(true)
    setError('')
    const result = await saveStarterIntent({ text, examples: selected }, controller.signal)
    // Leaving the page cancels a delayed handoff instead of redirecting the
    // user later or saving an abandoned idea over a newer submission.
    if (controller.signal.aborted || pendingSave.current !== controller) return
    if (result.ok) {
      router.push('/workspace')
    } else {
      setError(result.reason === 'unavailable'
        ? 'Your browser couldn’t save this idea. Keep this page open and allow session storage, then try again.'
        : 'Keep your idea under 4,000 characters and try again.')
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Better prompts. Brighter music.</p>
          <h1 id="hero-title">Turn your ideas <br />into <span>incredible music.</span></h1>
          <p className={styles.heroBody}>Give the sound in your head a clearer direction. Learn what to try, shape your ideas, and build more intentional prompts for Suno.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#sound-brain" onClick={() => input.current?.focus()}>Build a Prompt <span aria-hidden="true">→</span></a>
            <Link className={styles.secondaryButton} href="/learn"><span className={styles.playIcon} aria-hidden="true">▷</span> Explore Learn</Link>
          </div>
          <p className={styles.accessNote}>LEARN is open. <a href={EARLY_ACCESS_URL}>Join early access</a></p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroHalo} aria-hidden="true" />
          <Image src="/images/design/hero-monkey.webp" width={1135} height={782} alt="A thoughtful monkey in a black beanie and headphones, pointing toward a musical idea" className={styles.heroMonkey} sizes="(max-width: 700px) 100vw, 62vw" preload />
          <div className={styles.styleChoices} role="group" aria-label="Example musical directions">
            {STARTER_EXAMPLES.map((example, index) => <button key={example} type="button" disabled={!hydrated || saving}
              aria-pressed={selected.includes(example)} className={`${styles.styleTag} ${styles[`styleTag${index}`]}`}
              onClick={() => { setSelected(previous => previous.includes(example) ? previous.filter(item => item !== example) : [...previous, example]); setError('') }}>
              <span aria-hidden="true">{selected.includes(example) ? '✓' : '•'}</span>{example}
            </button>)}
          </div>
        </div>
      </section>
      <section id="sound-brain" className={styles.starterSection} aria-label="Start your Sound Brain idea">
        <form className={styles.starterForm} onSubmit={submit}>
          <div className={styles.starterTopline}><span>{selected.length ? selected.join(' · ') : 'Start with a sound, a mood, a moment.'}</span><span className={styles.starterDestination}>Your idea → Sound Brain</span></div>
          <div className={styles.starterControls}>
            <div className={styles.starterInput}>
              <span className={styles.pencil} aria-hidden="true">✎</span>
              <label className={styles.srOnly} htmlFor="song-idea">Describe the song you hear</label>
              <textarea ref={input} id="song-idea" name="idea" rows={1} maxLength={MAX_STARTER_TEXT_LENGTH} placeholder="Describe the song you hear…" value={text} disabled={!hydrated || saving}
                aria-describedby="starter-note" onChange={event => { setText(event.target.value); setError('') }} />
              <BananaTip title="Start with the part you can hear"><p>Name a sound, a mood, and one detail that matters. “Warm vocals over a slow piano groove” is enough to begin. You can refine the relationships in Sound Brain.</p></BananaTip>
            </div>
            <button className={styles.primaryButton} type="submit" disabled={!hydrated || saving}>{saving ? 'Opening Sound Brain…' : 'Build Prompt'} <span aria-hidden="true">→</span></button>
          </div>
          {error ? <p role="alert" className={styles.formError}>{error}</p> : null}
        </form>
        <p id="starter-note" className={styles.starterNote}>For existing users. Your idea stays in this tab for 30 minutes and carries into your notes after sign-in. New accounts and compilation are currently closed.</p>
      </section>
    </>
  )
}
