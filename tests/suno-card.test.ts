import { describe, expect, it } from 'vitest'
import { quickStylesDraft, songCardFileName, songCardText } from '../src/lib/suno-card'

const node = (node_id: string, label: string, category: string) => ({ node_id, label, category })

describe('Send to Suno helpers', () => {
  it('lists exactly the chosen labels, broad identity first, adding nothing', () => {
    const draft = quickStylesDraft([
      node('piano', 'Piano', 'Instrument'), node('dark', 'Dark', 'Mood'),
      node('synthwave', 'Synthwave', 'Genre'), node('cello', 'Cello', 'Instrument'),
    ])
    expect(draft).toBe('Synthwave, Dark, Piano, Cello')
    expect(draft).not.toMatch(/instrumental|bpm|vocals/i)
    expect(quickStylesDraft([])).toBe('')
  })

  it('renders a plain-text card with every field labelled', () => {
    const text = songCardText({ title: 'Night Drive', styles: 'Synthwave, Dark', lyrics: '[Verse]\nHeadlights' })
    expect(text).toContain('Title: Night Drive')
    expect(text).toContain('Style of Music:\nSynthwave, Dark')
    expect(text).toContain('Lyrics:\n[Verse]\nHeadlights')
    expect(songCardText({ title: '', styles: '', lyrics: '' })).toContain('turn on Instrumental')
  })

  it('makes a safe download name', () => {
    expect(songCardFileName('Night Drive / Take 2!')).toBe('night-drive-take-2-suno-card.txt')
    expect(songCardFileName('***')).toBe('untitled-song-suno-card.txt')
  })
})
