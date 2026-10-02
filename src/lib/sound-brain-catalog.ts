// Imported only by the server page/API. Research/provenance stays out of client bundles.
import catalog from '../../data/sound-brain/suno-style-catalog-v1.json'
import matrix from '../../data/sound-brain/suno-style-matrix-v1.json'
import { hasExactKeys, isRecord, type CompilerInput, type DiscoveryAffinities, type SelectedNode } from './compiler-contract'
import { MAX_RELATIONSHIP_NOTES_BYTES } from './compiler-request'

const catalogById = new Map(catalog.terms.map(term => [term.id, term]))

function selectedRecord(term: typeof catalog.terms[number]): SelectedNode {
  return { node_id: term.id, label: term.label, category: term.category }
}

// Preserve the existing discovery pool. IDs are explicit catalog IDs, never label slugs.
const discoveryIds = [
  'cinematic', 'aggressive', 'synthwave', 'dreamy-ambient', 'piano', '808-drums',
  'sparse-arrangement', 'cello', 'dark', 'ethereal-vocals', 'driving-rhythm', 'staccato',
]

export function getSoundBrainDiscovery() {
  const nodes = discoveryIds.map(id => {
    const term = catalogById.get(id)
    if (!term) throw new Error('Sound Brain discovery ID is missing from the catalog')
    return selectedRecord(term)
  })
  const relationships: Record<string, Record<string, number>> = matrix.relationships
  const affinities: DiscoveryAffinities = {}
  for (const a of nodes) {
    affinities[a.node_id] = {}
    for (const b of nodes) {
      // Labels address the supplied matrix; persistent identity remains the catalog ID.
      affinities[a.node_id][b.node_id] = relationships[a.label]?.[b.label]
        ?? relationships[b.label]?.[a.label] ?? matrix.default_weight
    }
  }
  return { nodes, affinities }
}

export function resolveCompilerInput(value: unknown): CompilerInput {
  if (!isRecord(value) || !hasExactKeys(value, ['nodes', 'relationship_notes'])
    || !Array.isArray(value.nodes) || value.nodes.length === 0 || value.nodes.length > catalogById.size
    || typeof value.relationship_notes !== 'string'
    || new TextEncoder().encode(value.relationship_notes).byteLength > MAX_RELATIONSHIP_NOTES_BYTES) {
    throw new Error('Select at least one catalog node and supply relationship notes as text.')
  }
  const seenIds = new Set<string>()
  const nodes = value.nodes.map(node => {
    if (!isRecord(node) || !hasExactKeys(node, ['node_id', 'label', 'category']) || typeof node.node_id !== 'string') {
      throw new Error('Each selection must contain an exact catalog ID, label, and category.')
    }
    const term = catalogById.get(node.node_id)
    if (!term || node.label !== term.label || node.category !== term.category || seenIds.has(term.id)) {
      throw new Error('Selections must use unique, unchanged catalog records.')
    }
    seenIds.add(term.id)
    return selectedRecord(term)
  })
  return { nodes, relationship_notes: value.relationship_notes }
}
