import type { Metadata } from "next"
import Link from "next/link"
import { MonkeyMethod } from "@/components/learn/MonkeyMethod"
import styles from "@/components/learn/learn.module.css"
import { learnPages, rotatingLearnTips } from "@/content/learn/pages"

export const metadata: Metadata = {
  title: "Learn music prompting",
  description: "Five concise, evidence-aware guides for better style prompts, song structure, vocals, lyrics, and edits.",
}

export default function LearnIndexPage() {
  return (
    <main id="learn-content" className={styles.indexMain}>
      <section className={styles.indexHero}>
        <div>
          <p className={styles.eyebrow}>A practical music-making layer</p>
          <h1>Get the answer.<br />Then hear the difference.</h1>
          <p className={styles.heroLede}>Short lessons for turning a creative hunch into a prompt you can test. No secret syntax. No certainty theater. Just stronger musical decisions.</p>
        </div>
        <div className={styles.signalGraphic} aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>
      </section>

      <section className={styles.topicSection} aria-labelledby="topic-heading">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionKicker}>Start with the question in front of you</p>
          <h2 id="topic-heading">Five strong starting points</h2>
          <p>Each lesson begins with a fast answer and opens into workflow, examples, failure cases, advanced detail, and a useful next action.</p>
        </div>
        <div className={styles.topicList}>
          {learnPages.map((page) => (
            <Link className={`${styles.topicRow} ${styles[page.accent]}`} href={`/learn/${page.slug}`} key={page.slug}>
              <span className={styles.topicNumber}>{page.number}</span>
              <span className={styles.topicCopy}><strong>{page.title}</strong><small>{page.description}</small></span>
              <span className={styles.topicMeta}>{page.readTime}<b aria-hidden="true">↗</b></span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.learnPromise}>
        <div><p className={styles.sectionKicker}>How LEARN works</p><h2>Simple first. Evidence visible. Depth when you want it.</h2></div>
        <ol>
          <li><span>01</span><strong>Answer the real question</strong><p>Get a usable direction before background theory.</p></li>
          <li><span>02</span><strong>Make one testable move</strong><p>Examples and failure cases keep advice concrete.</p></li>
          <li><span>03</span><strong>Carry it forward</strong><p>Continue into BUILD, FIX, or the next lesson.</p></li>
        </ol>
      </section>

      <MonkeyMethod method={rotatingLearnTips} />
    </main>
  )
}
