import Link from "next/link"
import type { LearnBlock, LearnPage } from "@/content/learn/types"
import { MonkeyMethod } from "./MonkeyMethod"
import styles from "./learn.module.css"

function Block({ block }: { block: LearnBlock }) {
  switch (block.type) {
    case "fast-answer":
      return (
        <section className={styles.fastAnswer} aria-labelledby="fast-answer-title">
          <p className={styles.sectionKicker}>Fast answer</p>
          <h2 id="fast-answer-title">{block.title}</h2>
          <p className={styles.lede}>{block.body}</p>
          {block.points ? (
            <ul className={styles.answerPoints}>
              {block.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          ) : null}
        </section>
      )
    case "why":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Why it matters</p>
          <h2>{block.title}</h2>
          {block.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      )
    case "workflow":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Step by step</p>
          <h2>{block.title}</h2>
          <ol className={styles.workflow}>
            {block.steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </section>
      )
    case "example":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Example</p>
          <h2>{block.title}</h2>
          <figure className={styles.example}>
            <figcaption>{block.label}</figcaption>
            <pre>{block.prompt}</pre>
          </figure>
          <p>{block.explanation}</p>
        </section>
      )
    case "comparison":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Before / after</p>
          <h2>{block.title}</h2>
          <div className={styles.comparison}>
            <div><span>{block.before.label}</span><p>{block.before.text}</p></div>
            <div><span>{block.after.label}</span><p>{block.after.text}</p></div>
          </div>
          <p>{block.takeaway}</p>
        </section>
      )
    case "caveat":
      return (
        <aside className={block.tone === "warning" ? styles.warning : styles.note}>
          <p className={styles.sectionKicker}>{block.tone === "warning" ? "Keep in mind" : "Testing note"}</p>
          <h2>{block.title}</h2>
          <p>{block.body}</p>
        </aside>
      )
    case "mistakes":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Failure cases</p>
          <h2>{block.title}</h2>
          <div className={styles.mistakes}>
            {block.items.map((item) => (
              <div key={item.title}><h3>{item.title}</h3><p>{item.fix}</p></div>
            ))}
          </div>
        </section>
      )
    case "advanced":
      return (
        <section className={styles.proseSection}>
          <p className={styles.sectionKicker}>Go deeper</p>
          <h2>{block.title}</h2>
          <p>{block.intro}</p>
          <div className={styles.advancedList}>
            {block.items.map((item) => (
              <div key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>
            ))}
          </div>
        </section>
      )
    case "monkey-method":
      return <MonkeyMethod method={block.method} />
  }
}

export function LearnBlocks({ page }: { page: LearnPage }) {
  return (
    <>
      {page.blocks.map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
    </>
  )
}

export function Sources({ page }: { page: LearnPage }) {
  if (page.sources.length === 0) return null

  return (
    <details className={styles.sources}>
      <summary>Sources &amp; testing notes <span>Optional evidence</span></summary>
      <div>
        <p className={styles.sourceIntro}>Feature availability and product labels can change. These notes state what the source supports—and what it does not.</p>
        <ol>
          {page.sources.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
              <div>
                <span>{source.kind === "official" ? "Official Suno" : "PromptSuno research"}</span>
                {source.href ? (
                  <a href={source.href} target="_blank" rel="noreferrer">{source.title}<span className={styles.srOnly}> (opens in a new tab)</span></a>
                ) : <strong>{source.title}</strong>}
                <p>{source.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}

export function NextActions({ page }: { page: LearnPage }) {
  return (
    <section className={styles.nextActions} aria-labelledby="next-actions-title">
      <p className={styles.sectionKicker}>Next useful action</p>
      <h2 id="next-actions-title">Take the lesson into the work</h2>
      <div>
        {page.actions.map((action) => (
          <Link href={action.href} key={action.pillar} className={styles.actionLink}>
            <span>{action.pillar === "fix" ? "EARLY ACCESS" : "EXISTING USERS"}</span>
            <strong>{action.title}</strong>
            <p>{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
