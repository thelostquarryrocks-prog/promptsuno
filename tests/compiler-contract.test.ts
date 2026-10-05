import { describe, expect, it } from 'vitest'
import catalog from '../data/sound-brain/suno-style-catalog-v1.json'
import matrix from '../data/sound-brain/suno-style-matrix-v1.json'
import { getSoundBrainDiscovery, resolveCompilerInput } from '../src/lib/sound-brain-catalog'
import { parseCompilerOutput } from '../src/lib/compiler-contract'

const { nodes, affinities } = getSoundBrainDiscovery()
const piano = nodes.find(node => node.node_id === 'piano')!
const aggressive = nodes.find(node => node.node_id === 'aggressive')!
const ambient = nodes.find(node => node.node_id === 'dreamy-ambient')!
const input = { nodes: [aggressive, ambient, piano], relationship_notes: 'Keep the contrast; piano is foreground.\nDo not add drums.' }
const ready = {
  version: '1.0.0', status: 'ready', styles: 'Aggressive dreamy ambient with foreground piano.',
  coverage: input.nodes.map(node => ({ node_id: node.node_id, status: 'preserved' })),
  interpretations: [], questions: [],
}

describe('catalog identity and discovery boundary', () => {
  it('projects exact catalog IDs and categories with no provenance or evidence in client records', () => {
    expect(new Set(catalog.terms.map(term => term.id)).size).toBe(catalog.terms.length)
    for (const node of nodes) {
      const term = catalog.terms.find(term => term.id === node.node_id)!
      expect(node).toEqual({ node_id: term.id, label: term.label, category: term.category })
      expect(Object.keys(node).sort()).toEqual(['category', 'label', 'node_id'])
    }
    expect(aggressive.category).toBe('Energy')
    expect(nodes.find(node => node.node_id === 'staccato')?.category).toBe('Texture')
  })

  it('uses the supplied symmetric affinities, including the unscored default', () => {
    const relationships: Record<string, Record<string, number>> = matrix.relationships
    for (const a of nodes.slice(0, 12)) for (const b of nodes.slice(0, 12)) {
      expect(affinities[a.node_id][b.node_id] ?? matrix.default_weight).toBe(relationships[a.label]?.[b.label] ?? relationships[b.label]?.[a.label] ?? matrix.default_weight)
      expect(affinities[a.node_id][b.node_id] ?? matrix.default_weight).toBe(affinities[b.node_id][a.node_id] ?? matrix.default_weight)
    }
    expect(affinities.piano.piano ?? matrix.default_weight).toBe(0.2)
    expect(nodes).toHaveLength(catalog.terms.length)
    expect(new Set(nodes.map(node => node.category))).toEqual(new Set(catalog.terms.map(term => term.category)))
  })

  it('preserves unusual selections, ordering, exact notes, and every catalog ID', () => {
    expect(resolveCompilerInput(input)).toEqual(input)
    const all = catalog.terms.map(term => ({ node_id: term.id, label: term.label, category: term.category }))
    expect(resolveCompilerInput({ nodes: all, relationship_notes: '' }).nodes).toEqual(all)
  })

  it.each([
    { ...piano, node_id: 'genre-piano' },
    { ...piano, label: 'Grand piano' },
    { ...piano, category: 'genre' },
    { ...piano, weight: 0.9 },
  ])('rejects changed or invented records: %j', invalid => {
    expect(() => resolveCompilerInput({ nodes: [invalid], relationship_notes: '' })).toThrow()
  })

  it.each([
    { nodes: [], relationship_notes: '' },
    { nodes: [piano, piano], relationship_notes: '' },
    { tags: ['Piano'], isPremium: true },
    { ...input, relationship_notes: null },
    { ...input, affinities },
  ])('rejects empty/duplicate/legacy/nontext/discovery payloads: %j', invalid => {
    expect(() => resolveCompilerInput(invalid)).toThrow()
  })
})

describe('compiler response fidelity', () => {
  it('accepts exact coverage in any order without rewriting the Styles candidate', () => {
    const output = { ...ready, coverage: [...ready.coverage].reverse() }
    expect(parseCompilerOutput(output, input.nodes)).toEqual(output)
  })

  it('accepts clarification with unchanged identities, empty styles and one or two questions', () => {
    const output = { ...ready, status: 'needs_clarification', styles: '', questions: ['Where should piano sit?'], coverage: ready.coverage.map(item => ({ ...item, status: 'unresolved' })) }
    expect(parseCompilerOutput(output, input.nodes)).toEqual(output)
  })

  it.each([
    { ...ready, coverage: ready.coverage.slice(1) },
    { ...ready, coverage: [...ready.coverage.slice(1), ready.coverage[1]] },
    { ...ready, coverage: [{ node_id: 'invented', status: 'preserved' }, ...ready.coverage.slice(1)] },
    { ...ready, coverage: ready.coverage.map(item => ({ ...item, status: 'unresolved' })) },
    { ...ready, styles: '' },
    { ...ready, questions: ['A question despite ready'] },
    { ...ready, version: 'future' },
    { ...ready, status: 'needs_clarification', questions: ['Question but nonempty styles'] },
    { ...ready, status: 'needs_clarification', styles: '', questions: [] },
    { ...ready, status: 'needs_clarification', styles: '', questions: ['One', 'Two', 'Three'] },
    { ...ready, unexpected: 'extra' },
    {},
  ])('rejects malformed output: %j', invalid => {
    expect(() => parseCompilerOutput(invalid, input.nodes)).toThrow('invalid result')
  })
})
