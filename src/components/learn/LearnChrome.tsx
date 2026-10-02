import Link from "next/link"
import { learnPages } from "@/content/learn/pages"
import { MonkeyMark } from "./MonkeyMark"
import styles from "./learn.module.css"

export function LearnHeader() {
  return (
    <header className={styles.siteHeader}>
      <Link href="/" className={styles.brand} aria-label="PromptSuno home">
        <MonkeyMark className={styles.brandMark} />
        <span><strong>PromptSuno</strong><small>LEARN</small></span>
      </Link>
      <nav aria-label="Learn topics" className={styles.topicNav}>
        {learnPages.map((page) => <Link href={`/learn/${page.slug}`} key={page.slug}>{page.shortTitle}</Link>)}
      </nav>
      <div className={styles.pillarNav} aria-label="PromptSuno tools">
        <Link href="/workspace?tool=build&from=learn">BUILD</Link>
        <Link href="/workspace?tool=fix&from=learn">FIX</Link>
      </div>
    </header>
  )
}

export function LearnFooter() {
  return (
    <footer className={styles.siteFooter}>
      <p><strong>PromptSuno LEARN</strong> turns music-generation uncertainty into small, testable creative moves.</p>
      <div><Link href="/">PromptSuno home</Link><Link href="/learn">All topics</Link><Link href="/workspace?tool=build&from=learn-footer">Open BUILD</Link><Link href="/workspace?tool=fix&from=learn-footer">Open FIX</Link></div>
    </footer>
  )
}
