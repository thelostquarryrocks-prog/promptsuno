import Link from "next/link"
import { EARLY_ACCESS_URL } from "@/lib/site"
import { learnPages } from "@/content/learn/pages"
import styles from "./learn.module.css"

export function LearnHeader() {
  return (
    <>
      <header className={styles.siteHeader}>
        <Link href="/" className={styles.brand} aria-label="PromptSuno home">
          <span>Prompt<span className={styles.brandAccent}>Suno</span></span>
        </Link>
        <nav aria-label="Primary navigation" className={styles.topicNav}>
          <Link href="/">Home</Link>
          <Link href="/learn" aria-current="location">Learn</Link>
          <Link href="/workspace">Build</Link>
          <Link href="/learn/editing">Fix</Link>
        </nav>
        <div className={styles.pillarNav} aria-label="PromptSuno tools">
          <Link href="/login">Sign in</Link>
          <a href={EARLY_ACCESS_URL}>Join early access</a>
        </div>
      </header>
      <nav aria-label="Learn topics" className={styles.topicRail}>
        {learnPages.map((page) => <Link href={`/learn/${page.slug}`} key={page.slug}>{page.shortTitle}</Link>)}
      </nav>
    </>
  )
}

export function LearnFooter() {
  return (
    <footer className={styles.siteFooter}>
      <p><strong>Prompt<span className={styles.brandAccent}>Suno</span> LEARN</strong><br />Small, testable creative moves. Better prompts. Brighter music.</p>
      <div><Link href="/">PromptSuno home</Link><Link href="/learn">All topics</Link><Link href="/login">Sign in</Link><a href={EARLY_ACCESS_URL}>Join early access</a></div>
    </footer>
  )
}
