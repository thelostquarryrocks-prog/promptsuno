import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'PromptSuno — Build better ideas for Suno',
  description:
    'Explore musical ideas, build focused Suno style prompts, learn as you create, and diagnose what to improve with PromptSuno.',
  alternates: { canonical: 'https://promptsuno.com' },
  openGraph: {
    title: 'PromptSuno — Build better ideas for Suno',
    description:
      'A creative companion for exploring musical direction, building prompts, and improving your next Suno song.',
    type: 'website',
    url: 'https://promptsuno.com',
    siteName: 'PromptSuno',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptSuno — Build better ideas for Suno',
    description:
      'Explore musical direction, build focused prompts, and learn while you create.',
  },
}

const soundNodes = [
  { label: 'Dreamy', className: styles.nodeDreamy },
  { label: 'Analog warmth', className: styles.nodeWarmth },
  { label: 'Piano', className: styles.nodePiano },
  { label: 'Slow build', className: styles.nodeBuild },
  { label: 'Wide vocals', className: styles.nodeVocals },
  { label: 'Tape texture', className: styles.nodeTexture },
]

const pillars = [
  {
    index: '01',
    name: 'LEARN',
    title: 'Understand what to try next.',
    body: 'Get direct, practical guidance that begins with the useful answer and reveals deeper context when you want it.',
    link: '#monkey-methods',
    linkLabel: 'See how learning works',
  },
  {
    index: '02',
    name: 'BUILD',
    title: 'Shape a musical direction.',
    body: 'Explore ideas spatially, keep the combinations that feel right, and turn them into an editable Suno Styles prompt.',
    link: '#sound-brain',
    linkLabel: 'Meet Sound Brain',
  },
  {
    index: '03',
    name: 'FIX',
    title: 'Improve without starting over.',
    body: 'Diagnose one bounded problem, preserve your original work, and take the lowest-risk useful next step.',
    link: '#studio-tools',
    linkLabel: 'Preview Prompt Doctor',
  },
]

function SignalMark() {
  return (
    <span className={styles.signalMark} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

function SoundBrainPreview({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={`${styles.brainPreview} ${compact ? styles.brainPreviewCompact : ''}`}>
      <div className={styles.previewTopline}>
        <span className={styles.previewLive}><i /> Sound Brain</span>
        <span>6 ideas in orbit</span>
      </div>
      <div className={styles.brainStage} aria-hidden="true">
        <div className={styles.orbit} />
        <div className={styles.orbitSecondary} />
        <div className={styles.brainCore}>
          <span className={styles.coreRing} />
          <span className={styles.coreGlow} />
          <span className={styles.coreLabel}>your sound</span>
        </div>
        {soundNodes.map((node) => (
          <span key={node.label} className={`${styles.soundNode} ${node.className}`}>
            <i />{node.label}
          </span>
        ))}
      </div>
      <figcaption className={styles.visuallyHidden}>
        A lightweight preview of musical ideas orbiting a central Sound Brain, including Dreamy,
        Analog warmth, Piano, Slow build, Wide vocals, and Tape texture.
      </figcaption>
      <div className={styles.previewFooter} aria-hidden="true">
        <span>Drag an idea toward the center</span>
        <span className={styles.previewMeter}><i /><i /><i /><i /><i /></span>
      </div>
    </figure>
  )
}

export default function Home() {
  return (
    <div className={styles.siteShell}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="PromptSuno home">
          <SignalMark />
          <span>PromptSuno</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <a href="#learn">Learn</a>
          <a href="#sound-brain">Build</a>
          <a href="#studio-tools">Fix</a>
        </nav>
        <Link className={styles.headerCta} href="/workspace">
          Open app <Arrow />
        </Link>
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> A creative companion for Suno</p>
            <h1 id="hero-title">
              Turn musical instinct into <em>clear direction.</em>
            </h1>
            <p className={styles.heroBody}>
              Explore ideas, shape focused style prompts, learn what matters, and improve what is not
              working—without flattening your music into a generic formula.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/workspace">
                Open Sound Brain <Arrow />
              </Link>
              <a className={styles.secondaryButton} href="#learn">
                Start with Learn
              </a>
            </div>
            <p className={styles.freeNote}>
              <span aria-hidden="true">●</span> Genuinely useful for free. Go deeper only when you need to.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroHalo} aria-hidden="true" />
            <SoundBrainPreview compact />
            <p className={styles.visualNote}><span>BUILD / 01</span> Spatial prompt discovery</p>
          </div>
        </section>

        <section className={styles.introStrip} aria-label="PromptSuno product summary">
          <p>Less guessing. More intentional songs.</p>
          <div aria-hidden="true" />
          <p>Built for how creative work actually moves.</p>
        </section>

        <section className={styles.pillarsSection} id="learn" aria-labelledby="pillars-title">
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>One connected creative loop</p>
            <h2 id="pillars-title">Learn it. Build it. Fix what matters.</h2>
            <p>PromptSuno meets you at the job in front of you, then keeps the next step close.</p>
          </div>
          <div className={styles.pillarGrid}>
            {pillars.map((pillar) => (
              <article className={styles.pillarCard} key={pillar.name}>
                <div className={styles.pillarMeta}>
                  <span>{pillar.index}</span>
                  <strong>{pillar.name}</strong>
                </div>
                <div className={styles.pillarGlyph} data-pillar={pillar.name} aria-hidden="true">
                  <i /><i /><i />
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
                <a href={pillar.link}>{pillar.linkLabel} <Arrow /></a>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.soundBrainSection} id="sound-brain" aria-labelledby="sound-brain-title">
          <div className={styles.soundBrainCopy}>
            <p className={styles.kicker}>Flagship BUILD experience</p>
            <h2 id="sound-brain-title">Your sound is a space to explore.</h2>
            <p className={styles.sectionLead}>
              Sound Brain turns prompt building into musical discovery. Pull ideas toward the center,
              notice useful neighbors, and keep the strange combinations that make the song yours.
            </p>
            <ul className={styles.featureList}>
              <li><span>01</span><div><strong>Discover without a settings wall</strong><p>Move through genres, moods, instruments, vocals, rhythm, texture, and production naturally.</p></div></li>
              <li><span>02</span><div><strong>Keep intent structured</strong><p>Your chosen ideas stay distinct; an editable Styles prompt is the output, not the source of truth.</p></div></li>
              <li><span>03</span><div><strong>Stay in control</strong><p>Relationship guidance supports discovery. It never pretends to expose hidden Suno weights or guarantees.</p></div></li>
            </ul>
            <Link className={styles.textLink} href="/workspace">Build with Sound Brain <Arrow /></Link>
          </div>
          <SoundBrainPreview />
        </section>

        <section className={styles.methodsSection} id="monkey-methods" aria-labelledby="methods-title">
          <div className={styles.methodCard}>
            <div className={styles.methodBadge} aria-hidden="true">
              <span className={styles.methodCurve} />
              <span className={styles.methodDot} />
            </div>
            <div className={styles.methodContent}>
              <p className={styles.kicker}>Monkey Method · Contextual learning</p>
              <h2 id="methods-title">A useful nudge, exactly when it helps.</h2>
              <p>
                No forced tour. No encyclopedia detour. Monkey Methods offer short, optional guidance
                beside the creative decision you are already making.
              </p>
              <div className={styles.methodExample}>
                <span>TRY THIS</span>
                <p>Give each idea a role. “Piano in front, synths far away” says more than adding extra adjectives.</p>
              </div>
            </div>
          </div>
          <div className={styles.methodAside}>
            <span aria-hidden="true">⌁</span>
            <p>Simple first.</p>
            <p>Deeper when useful.</p>
            <p>Evidence without the lecture.</p>
          </div>
        </section>

        <section className={styles.toolsSection} id="studio-tools" aria-labelledby="tools-title">
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>One song, more than one tool</p>
            <h2 id="tools-title">Keep creating past the first prompt.</h2>
            <p>PromptSuno is growing into a connected studio for musical direction, lyrics, and diagnosis.</p>
          </div>
          <div className={styles.toolGrid}>
            <article className={styles.toolCard}>
              <div className={styles.toolTopline}>
                <span>BUILD / LYRICS</span>
                <span>In the studio</span>
              </div>
              <div className={styles.lyricVisual} aria-hidden="true">
                <span>[ VERSE ]</span>
                <i /><i /><i /><i />
                <span>[ CHORUS ]</span>
                <i /><i className={styles.shortLine} />
              </div>
              <h3>Lyrics Studio</h3>
              <p>Start fresh, bring in your Sound Brain direction, or shape an existing style prompt—without turning songwriting into another chat box.</p>
            </article>
            <article className={styles.toolCard}>
              <div className={styles.toolTopline}>
                <span>FIX / DIAGNOSE</span>
                <span>In the studio</span>
              </div>
              <div className={styles.doctorVisual} aria-hidden="true">
                <div><span>Observed</span><i /></div>
                <div><span>Possible cause</span><i /></div>
                <div><span>Next test</span><i /></div>
              </div>
              <h3>Prompt Doctor</h3>
              <p>Focus on the symptom, preserve what already works, and test the smallest useful change before rewriting everything.</p>
            </article>
          </div>
        </section>

        <section className={styles.trustSection} aria-labelledby="trust-title">
          <div>
            <p className={styles.kicker}>Useful guidance, honestly framed</p>
            <h2 id="trust-title">Built around evidence—not prompt folklore.</h2>
          </div>
          <div className={styles.trustPoints}>
            <p><span>01</span>Documented behavior stays distinct from experiments and community observations.</p>
            <p><span>02</span>Uncertainty is made clear. PromptSuno does not claim access to hidden Suno mechanics.</p>
            <p><span>03</span>Your private prompts, lyrics, and project context do not belong in public URLs.</p>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-title">
          <div className={styles.finalSignal} aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <p className={styles.kicker}>Ready when the idea is</p>
          <h2 id="final-title">Find the direction your next song needs.</h2>
          <p>Start with the free core experience. Explore first, commit when something sounds like you.</p>
          <Link className={styles.primaryButton} href="/workspace">Open Sound Brain <Arrow /></Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Link className={styles.brand} href="/" aria-label="PromptSuno home"><SignalMark /><span>PromptSuno</span></Link>
          <p>A creative companion for people making music with Suno.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#learn">Learn</a>
          <a href="#sound-brain">Sound Brain</a>
          <a href="#studio-tools">Studio tools</a>
          <Link href="/login">Sign in</Link>
        </nav>
        <p className={styles.copyright}>© {new Date().getFullYear()} PromptSuno</p>
      </footer>
    </div>
  )
}
