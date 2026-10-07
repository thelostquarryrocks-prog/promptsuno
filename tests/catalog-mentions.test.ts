import { describe, expect, it } from 'vitest'
import { buildMentionIndex, findCatalogMentions } from '../src/lib/catalog-mentions'
import { getSoundBrainDiscovery, getSoundBrainMentionAliases } from '../src/lib/sound-brain-catalog'

const { nodes } = getSoundBrainDiscovery()
const index = buildMentionIndex(nodes, getSoundBrainMentionAliases())
const ids = (text: string) => findCatalogMentions(text, index).map(node => node.node_id)

describe('catalog mentions in a written description', () => {
  it('returns exact catalog records in the order they were written', () => {
    const found = findCatalogMentions('Slow piano under a cello, very synthwave', index)
    // "Slow" is a published alias of the catalog term Slow Tempo.
    expect(found.map(node => node.node_id)).toEqual(['slow-tempo', 'piano', 'cello', 'synthwave'])
    for (const node of found) expect(nodes).toContainEqual(node)
  })

  it('prefers the longest phrase so one written idea yields one suggestion', () => {
    expect(ids('dreamy ambient textures')).toContain('dreamy-ambient')
    expect(ids('dreamy ambient textures')).not.toContain('dreamy')
    expect(ids('just dreamy')).toEqual(['dreamy'])
  })

  it('tolerates hyphen, joined spelling and a final plural difference', () => {
    expect(ids('a lofi beat')).toContain('lo-fi')
    expect(ids('a lo-fi beat')).toContain('lo-fi')
    expect(ids('hiphop drums')).toContain('hip-hop')
    expect(ids('breathy vocal on top')).toContain('breathy-vocals')
  })

  it('matches published aliases without letting them hide real labels', () => {
    expect(ids('80s synths with horns')).toEqual(expect.arrayContaining(['1980s', 'brass-section']))
  })

  it('ignores everyday song-section words', () => {
    expect(ids('make the chorus bigger and the verse quieter')).toEqual([])
  })

  it('does not match inside other words and deduplicates repeats', () => {
    expect(ids('pianist and pianos')).toEqual(['piano'])
    expect(ids('piano piano piano')).toEqual(['piano'])
  })

  it('stays bounded on very long text', () => {
    expect(findCatalogMentions('piano '.repeat(50_000), index, 3).length).toBeLessThanOrEqual(3)
    expect(findCatalogMentions('', index)).toEqual([])
  })
})
