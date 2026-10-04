import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EARLY_ACCESS_URL, SITE_URL } from '@/lib/site'
import { robotsMetadata } from '@/lib/indexing'
import HomeHero from '@/components/home/HomeHero'
import { BananaTip } from '@/components/home/BananaTip'
import styles from './page.module.css'

export const metadata: Metadata = {
  robots: robotsMetadata('/'),
  title: 'PromptSuno — Build better ideas for Suno',
  description: 'Explore musical ideas with free Suno prompting lessons. Shape your sound in the existing Sound Brain workspace; signup and compilation are currently closed.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'PromptSuno — Build better ideas for Suno',
    description: 'Better prompts. Brighter music. Learn, build, and refine your musical direction.',
    type: 'website', url: SITE_URL, siteName: 'PromptSuno',
  },
  twitter: { card: 'summary_large_image', title: 'PromptSuno — Build better ideas for Suno', description: 'Learn, build, and refine your musical direction.' },
}

function Arrow() { return <span aria-hidden="true">→</span> }
function PillarIcon({ type }: { type: 'learn' | 'build' | 'fix' }) {
  return <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
    {type === 'learn' ? <path d="M18 29V9m0 0C14 5 8 5 4 7v20c5-2 10-1 14 2 4-3 9-4 14-2V7c-4-2-10-2-14 2Z" /> : type === 'build' ? <><path d="m18 3 13 7v16l-13 7L5 26V10l13-7Z" /><path d="m5 10 13 8 13-8M18 18v15" /></> : <path d="M22 4a9 9 0 0 0-10 12L3 27a4 4 0 0 0 6 6l11-11A9 9 0 0 0 32 12l-7 5-5-5 2-8Z" />}
  </svg>
}

const pillars = [
  { type: 'learn' as const, number: '01', name: 'LEARN', title: 'Master the art of prompting.', body: 'Practical guides and examples to help you make clearer musical decisions.', href: '/learn', cta: 'Start Learning', tip: 'Make one testable move', tipBody: 'Change one meaningful detail, then compare the results. Keep a note of what improved so your next prompt builds on what you heard.' },
  { type: 'build' as const, number: '02', name: 'BUILD', title: 'Give your ideas a direction.', body: 'Collect sounds, explore relationships, and shape your idea in Sound Brain.', href: '#sound-brain', cta: 'Start Building', tip: 'Give every sound a role', tipBody: '“Piano leads while the cello stays behind it” gives a clearer relationship than a long list of instruments. Add that direction to your authored notes.' },
  { type: 'fix' as const, number: '03', name: 'FIX', title: 'Improve and refine.', body: 'Find the smallest useful change. Keep what works, then test one focused edit.', href: '/learn/editing', cta: 'Explore Fixes', tip: 'Keep the part you love', tipBody: 'Before changing a song, name what should stay. Then isolate the section, sound, or lyric that needs attention. Our editing guide helps you choose a bounded next step.' },
]

export default function Home() {
  return (
    <div className={styles.siteShell}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="PromptSuno home">Prompt<span>Suno</span></Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/" aria-current="page">Home</Link><Link href="/learn">Learn</Link><a href="#sound-brain">Build</a><Link href="/learn/editing">Fix</Link>
        </nav>
        <Link href="/login" className={styles.headerCta}>Sign in <Arrow /></Link>
      </header>
      <main id="main-content">
        <HomeHero />
        <section className={styles.pillarsSection} aria-labelledby="pillars-title">
          <h2 id="pillars-title" className={styles.srOnly}>Learn it. Build it. Fix what matters.</h2>
          <div className={styles.pillarGrid}>
            {pillars.map(pillar => <article key={pillar.type} className={`${styles.pillarCard} ${styles[pillar.type]}`}>
              <Image src={`/images/design/${pillar.type}-equipment.webp`} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" className={styles.cardImage} />
              <div className={styles.cardShade} />
              <div className={styles.cardContent}>
                <span className={styles.pillarNumber}>{pillar.number}</span>
                <span className={styles.pillarIcon}><PillarIcon type={pillar.type} /></span>
                <h3>{pillar.name}</h3><h4>{pillar.title}</h4><p>{pillar.body}</p>
                <Link href={pillar.href} className={styles.cardLink}>{pillar.cta} <Arrow /></Link>
              </div>
              <div className={styles.cardTip}><BananaTip title={pillar.tip}><p>{pillar.tipBody}</p>{pillar.type === 'fix' ? <Link href="/learn/editing">Read the editing guide →</Link> : null}</BananaTip></div>
            </article>)}
          </div>
        </section>
        <section className={styles.methodsSection} id="monkey-methods" aria-labelledby="methods-title">
          <BananaTip title="Small banana. Big tips." large><p>Look for the bananas as you explore. Tap one for a short hint, a practical technique, or a creative nudge. Take what helps, then get back to your music.</p><p>Try it in <Link href="/learn/style-prompts">the style prompts lesson</Link>.</p></BananaTip>
          <div className={styles.methodCopy}><p className={styles.kicker}>Small banana. Big tips.</p><h2 id="methods-title">Monkey <span>Methods</span></h2><h3>Look for the bananas</h3><p>Tap a banana for a helpful hint, technique, or creative nudge.</p></div>
          <div className={styles.methodWatermark} aria-hidden="true"><Image src="/images/design/methods-monkey-watermark.webp" alt="" width={358} height={330} sizes="230px" /></div>
        </section>
        <section className={styles.finalCta} aria-labelledby="final-title">
          <p className={styles.kicker}>Ready to create?</p><h2 id="final-title">Your Next Song Starts <span>Here</span></h2>
          <a href="#sound-brain" className={styles.primaryButton}>Build a Prompt <Arrow /></a>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}><Link href="/" className={styles.brand}>Prompt<span>Suno</span></Link><p>Better prompts. Brighter music.</p><p className={styles.independent}>An independent creative companion for Suno.</p></div>
          <nav aria-label="Product"><h2>Product</h2><Link href="/">Home</Link><Link href="/learn">Learn</Link><a href="#sound-brain">Build</a><Link href="/learn/editing">Fix guides</Link></nav>
          <nav aria-label="Learning resources"><h2>Resources</h2><Link href="/learn/style-prompts">Style prompts</Link><Link href="/learn/song-structure">Song structure</Link><Link href="/learn/vocals">Vocals</Link><Link href="/learn/lyrics">Lyrics</Link></nav>
          <div className={styles.footerAccess}><h2>Stay in the loop</h2><p>Get early access news and help shape what comes next.</p><a href={EARLY_ACCESS_URL} className={styles.footerAccessLink}>Join early access <Arrow /></a><p className={styles.closedNote}>Signup and compilation are currently closed.</p></div>
        </div>
        <div className={styles.footerBottom}><p>© 2026 PromptSuno. All rights reserved.</p><p>For creators, by creators.</p></div>
      </footer>
    </div>
  )
}
