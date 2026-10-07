import type { SelectedNode } from './compiler-contract'

// Broad identity first, then feel, then performers, then sonic detail. This is
// a readable ordering for a person to edit, not a claim about Suno weighting.
const CATEGORY_ORDER = ['Genre', 'Era', 'Mood', 'Energy', 'Rhythm', 'Vocal', 'Instrument', 'Texture', 'Production', 'Structure']

// A plain, non-AI rendering of the exact selected labels. It adds nothing the
// person did not choose: no tempo, key, vocal assumptions or instrumental flag.
export function quickStylesDraft(nodes: SelectedNode[]): string {
  const rank = (category: string) => {
    const index = CATEGORY_ORDER.indexOf(category)
    return index < 0 ? CATEGORY_ORDER.length : index
  }
  return nodes
    .map((node, index) => ({ node, index }))
    .sort((a, b) => rank(a.node.category) - rank(b.node.category) || a.index - b.index)
    .map(({ node }) => node.label)
    .join(', ')
}

export type SongCardFields = { title: string; styles: string; lyrics: string }

export function songCardText({ title, styles, lyrics }: SongCardFields): string {
  return [
    `Title: ${title.trim() || 'Untitled song'}`,
    '',
    'Style of Music:',
    styles.trim() || '(empty)',
    '',
    'Lyrics:',
    lyrics.trim() || '(none — turn on Instrumental in Suno)',
    '',
  ].join('\n')
}

export function songCardFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return `${slug || 'untitled-song'}-suno-card.txt`
}
