import { describe, expect, it } from "vitest"
import { learnPages } from "@/content/learn/pages"

describe("LEARN content model", () => {
  it("publishes the five canonical launch topics with unique stable slugs", () => {
    expect(learnPages.map((page) => page.slug)).toEqual([
      "style-prompts",
      "song-structure",
      "vocals",
      "lyrics",
      "editing",
    ])
    expect(new Set(learnPages.map((page) => page.slug)).size).toBe(learnPages.length)
  })

  it("keeps every lesson complete, connected, and evidence-aware", () => {
    const allSlugs = new Set(learnPages.map((page) => page.slug))

    for (const page of learnPages) {
      expect(page.blocks[0].type).toBe("fast-answer")
      expect(page.blocks.some((block) => block.type === "workflow")).toBe(true)
      expect(page.blocks.some((block) => block.type === "example" || block.type === "comparison")).toBe(true)
      expect(page.blocks.some((block) => block.type === "mistakes")).toBe(true)
      expect(page.blocks.some((block) => block.type === "advanced")).toBe(true)
      expect(page.blocks.some((block) => block.type === "monkey-method")).toBe(true)
      expect(page.sources.length).toBeGreaterThan(0)
      expect(new Set(page.actions.map((action) => action.pillar))).toEqual(new Set(["build", "fix"]))
      expect(page.actions.every((action) => action.href.startsWith("/workspace?"))).toBe(true)
      expect(page.related.every((slug) => allSlugs.has(slug))).toBe(true)
    }
  })

  it("uses HTTPS official sources without presenting research notes as external authority", () => {
    for (const source of learnPages.flatMap((page) => page.sources)) {
      if (source.kind === "official") {
        expect(source.href).toMatch(/^https:\/\/help\.suno\.com\//)
      } else {
        expect("href" in source ? source.href : undefined).toBeUndefined()
        expect(source.note.toLowerCase()).toContain("not")
      }
    }
  })
})
