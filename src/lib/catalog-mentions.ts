import type { SelectedNode } from './compiler-contract'

// Finds exact catalog terms a person already wrote in their own words.
// This is a deterministic text lookup, not interpretation: it never invents a
// node, never adds one by itself, and never reads text outside the browser.

export type MentionAliases = Record<string, string[]>

// Song-section words appear constantly in ordinary notes ("make the chorus
// bigger") and rarely mean the Structure node itself. Suggesting them is noise.
const IGNORED_SINGLE_WORDS = new Set(['bridge', 'chorus', 'verse', 'intro', 'outro', 'hook'])
const MAX_SCANNED_CHARACTERS = 8_000
const MAX_PHRASE_WORDS = 5

export function normalizeMention(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9/]+/g, ' ')
    .trim()
}

function variants(phrase: string): string[] {
  const spaced = normalizeMention(phrase)
  if (!spaced) return []
  const words = spaced.split(' ')
  const out = new Set([spaced])
  // "Lo-Fi" should also match "lofi"; "Hip-Hop" should match "hiphop".
  if (words.length > 1 && /[-]/.test(phrase)) out.add(words.join(''))
  // Tolerate a plural difference on the final word: "breathy vocal" ↔ "Breathy Vocals".
  for (const value of [...out]) {
    const parts = value.split(' ')
    const last = parts[parts.length - 1]
    if (last.length < 4 || /\d/.test(last)) continue
    parts[parts.length - 1] = last.endsWith('s') ? last.slice(0, -1) : `${last}s`
    out.add(parts.join(' '))
  }
  return [...out]
}

export type MentionIndex = { phrases: Map<string, SelectedNode>; longest: number }

export function buildMentionIndex(nodes: SelectedNode[], aliases: MentionAliases = {}): MentionIndex {
  const phrases = new Map<string, SelectedNode>()
  // Labels claim their phrases before aliases so an alias never hides a real label.
  for (const node of nodes) for (const value of variants(node.label)) if (!phrases.has(value)) phrases.set(value, node)
  for (const node of nodes) for (const alias of aliases[node.node_id] ?? []) {
    for (const value of variants(alias)) if (!phrases.has(value)) phrases.set(value, node)
  }
  for (const word of IGNORED_SINGLE_WORDS) phrases.delete(word)
  let longest = 1
  for (const key of phrases.keys()) longest = Math.max(longest, key.split(' ').length)
  return { phrases, longest: Math.min(longest, MAX_PHRASE_WORDS) }
}

// Greedy longest-match from left to right, so "dreamy ambient" wins over "dreamy"
// and each written word supports at most one suggestion. Order follows the text.
export function findCatalogMentions(text: string, index: MentionIndex, limit = 10): SelectedNode[] {
  const words = normalizeMention(text.slice(0, MAX_SCANNED_CHARACTERS)).split(' ').filter(Boolean)
  const found: SelectedNode[] = []
  const seen = new Set<string>()
  let position = 0
  while (position < words.length && found.length < limit) {
    let matched = 0
    for (let size = Math.min(index.longest, words.length - position); size >= 1; size -= 1) {
      const node = index.phrases.get(words.slice(position, position + size).join(' '))
      if (!node) continue
      matched = size
      if (!seen.has(node.node_id)) { seen.add(node.node_id); found.push(node) }
      break
    }
    position += matched || 1
  }
  return found
}
