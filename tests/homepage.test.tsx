import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
import { EARLY_ACCESS_URL } from '../src/lib/site'
import Home, { metadata } from '../src/app/page'

describe('public homepage', () => {
  it('renders the product model and primary routes as meaningful HTML', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1, name: /turn your ideas.*into incredible music/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /learn it\. build it\. fix what matters/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'LEARN' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'BUILD' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FIX' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore fixes/i })).toHaveAttribute('href', '/learn/editing')
    expect(screen.getByText(/LEARN is open/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /join early access/i })[0]).toHaveAttribute('href', EARLY_ACCESS_URL)
    expect(screen.getAllByRole('link', { name: 'Learn' })[0]).toHaveAttribute('href', '/learn')
    expect(screen.getByRole('link', { name: /explore learn/i })).toHaveAttribute('href', '/learn')
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content')
  })

  it('publishes specific homepage metadata and a canonical URL', () => {
    expect(metadata.title).toBe('PromptSuno — Build better ideas for Suno')
    expect(metadata.description).toMatch(/explore musical ideas/i)
    expect(metadata.alternates).toEqual({ canonical: 'https://promptsuno.com' })
  })
})
