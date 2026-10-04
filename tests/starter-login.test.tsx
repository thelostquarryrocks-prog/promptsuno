import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../src/app/login/page'
import { STARTER_INTENT_STORAGE_KEY } from '../src/lib/starter-intent'

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('../src/lib/supabase/client', () => ({ createClient: () => ({ auth: {
  signInWithPassword: mocks.signIn,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
} }) }))

beforeEach(() => {
  mocks.signIn.mockReset()
  mocks.push.mockReset()
  sessionStorage.clear()
  sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, JSON.stringify({
    version: 1, text: 'Piano leads.', examples: ['Warm vocals'], createdAt: Date.now(), ownerId: null,
  }))
})

async function submitLogin() {
  const user = userEvent.setup()
  render(<LoginPage />)
  await user.type(screen.getByLabelText('Email address'), 'test@example.invalid')
  await user.type(screen.getByLabelText('Password'), 'local-test-only')
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

describe('starter login handoff', () => {
  it('leaves authored intent unchanged after a failed login', async () => {
    const pending = sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)
    mocks.signIn.mockResolvedValue({ data: { user: null }, error: { message: 'Local fixture sign-in failed' } })
    await submitLogin()
    await screen.findByText('Local fixture sign-in failed')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBe(pending)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('binds an anonymous draft to the explicitly signed-in account before navigating', async () => {
    mocks.signIn.mockResolvedValue({ data: { user: { id: 'fixture-login-owner' } }, error: null })
    mocks.push.mockImplementation(() => {
      expect(JSON.parse(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)!).ownerId).toBe('fixture-login-owner')
    })
    await submitLogin()
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/workspace'))
    const pending = JSON.parse(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)!)
    expect(pending.text).toBe('Piano leads.')
    expect(pending.examples).toEqual(['Warm vocals'])
  })
})
