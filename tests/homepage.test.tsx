import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EARLY_ACCESS_URL } from '../src/lib/site'
import Home, { metadata } from '../src/app/page'

describe('public homepage', () => {
  it('renders the product model and primary routes as meaningful HTML', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1, name: /turn musical instinct into clear direction/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /learn it\. build it\. fix what matters/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /your sound is a space to explore/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lyrics Studio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prompt Doctor' })).toBeInTheDocument()
    expect(screen.getByText(/LEARN is open/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /join early access/i })[0]).toHaveAttribute('href', EARLY_ACCESS_URL)
    expect(screen.getAllByRole('link', { name: 'Learn' })[0]).toHaveAttribute('href', '/learn')
    expect(screen.getByRole('link', { name: /start with learn/i })).toHaveAttribute('href', '/learn')
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content')
  })

  it('publishes specific homepage metadata and a canonical URL', () => {
    expect(metadata.title).toBe('PromptSuno — Build better ideas for Suno')
    expect(metadata.description).toMatch(/explore musical ideas/i)
    expect(metadata.alternates).toEqual({ canonical: 'https://promptsuno.com' })
  })
})
