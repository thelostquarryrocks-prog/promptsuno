import type { Metadata } from "next"
import { robotsMetadata } from "@/lib/indexing"
import { LearnFooter, LearnHeader } from "@/components/learn/LearnChrome"
import styles from "@/components/learn/learn.module.css"

export const metadata: Metadata = {
  robots: robotsMetadata("/learn"),
  title: { default: "Learn music prompting | PromptSuno", template: "%s | PromptSuno Learn" },
  description: "Fast, practical lessons for shaping, testing, and repairing music-generation ideas.",
}

export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <div className={styles.learnShell}>
      <a className={styles.skipLink} href="#learn-content">Skip to lesson</a>
      <LearnHeader />
      {children}
      <LearnFooter />
    </div>
  )
}
