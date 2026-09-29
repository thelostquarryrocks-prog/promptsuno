import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LearnBlocks, NextActions, Sources } from "@/components/learn/LearnBlocks"
import styles from "@/components/learn/learn.module.css"
import { learnPageMap, learnPages } from "@/content/learn/pages"

export const dynamicParams = false

export function generateStaticParams() {
  return learnPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const page = learnPageMap.get(slug)
  if (!page) return {}

  return {
    title: page.shortTitle,
    description: page.description,
    alternates: { canonical: `/learn/${page.slug}` },
  }
}

export default async function LearnTopicPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params
  const page = learnPageMap.get(slug)
  if (!page) notFound()
  const related = page.related.map((relatedSlug) => learnPageMap.get(relatedSlug)).filter(Boolean)

  return (
    <main id="learn-content" className={styles.articleMain}>
      <div className={styles.articleRail} aria-hidden="true"><span>{page.number}</span><i /></div>
      <article>
        <header className={`${styles.articleHero} ${styles[page.accent]}`}>
          <Link href="/learn" className={styles.backLink}>← All lessons</Link>
          <p className={styles.eyebrow}>Lesson {page.number} · {page.readTime}</p>
          <h1>{page.title}</h1>
          <p className={styles.question}>{page.question}</p>
          <p className={styles.heroDescription}>{page.description}</p>
        </header>

        <div className={styles.articleBody}>
          <LearnBlocks page={page} />
          <Sources page={page} />
          <NextActions page={page} />
        </div>

        <nav className={styles.related} aria-label="Related lessons">
          <p className={styles.sectionKicker}>Keep learning</p>
          <h2>Related lessons</h2>
          <div>
            {related.map((item) => item ? (
              <Link href={`/learn/${item.slug}`} key={item.slug}>
                <span>{item.number}</span><strong>{item.shortTitle}</strong><small>{item.description}</small>
              </Link>
            ) : null)}
          </div>
        </nav>
      </article>
    </main>
  )
}
