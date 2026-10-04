import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bindStarterIntentToUser, clearStarterIntent, consumeStarterIntent, hasStarterIntent,
  saveStarterIntent, STARTER_INTENT_STORAGE_KEY, STARTER_INTENT_TTL_MS, STARTER_TEXT_MAX_LENGTH,
} from '../src/lib/starter-intent'

type LocalSession = { user: { id: string } } | null
const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  listeners: new Set<(event: string, session: LocalSession) => void>(),
}))
vi.mock('../src/lib/supabase/client', () => ({
  createClient: () => ({ auth: {
    getSession: auth.getSession,
    onAuthStateChange: (listener: (event: string, session: LocalSession) => void) => {
      auth.listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => auth.listeners.delete(listener) } } }
    },
  } }),
}))

beforeEach(() => {
  sessionStorage.clear()
  auth.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null })
})

const ownedDraft = () => ({ version: 1, text: 'Piano leads.', examples: ['Cinematic'], createdAt: Date.now(), ownerId: 'test-owner' })
function seedDraft(draft: unknown = ownedDraft()) {
  sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, JSON.stringify(draft))
}

describe('tab-scoped starter handoff', () => {
  it('preserves exact authored text and example labels through explicit login, then consumes once', async () => {
    const text = '  Piano leads.\nKeep some space.  '
    expect(await saveStarterIntent({ text, examples: ['Cinematic', 'Warm vocals', 'Indie soul'] })).toEqual({ ok: true })
    expect(hasStarterIntent()).toBe(true)
    expect(localStorage.length).toBe(0)
    bindStarterIntentToUser('test-owner')
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'ready', notes: `${text}\n\nExample directions: Cinematic, Warm vocals, Indie soul` })
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'empty' })
    expect(hasStarterIntent()).toBe(false)
  })

  it('allows examples alone as authored notes and never invents catalog records', async () => {
    await saveStarterIntent({ text: '', examples: ['Indie soul'] })
    bindStarterIntentToUser('test-owner')
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'ready', notes: 'Example directions: Indie soul' })
  })

  it('binds a signed-in starter locally without requiring login again', async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'test-owner' } } }, error: null })
    await saveStarterIntent({ text: 'Piano leads.' })
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'ready', notes: 'Piano leads.' })
  })

  it('does not adopt an anonymous starter into a session opened elsewhere', async () => {
    await saveStarterIntent({ text: 'Piano leads.' })
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'discarded' })
    expect(hasStarterIntent()).toBe(false)
  })

  it.each([true, false])('discards mismatched owners even when workspace has existing intent: %s', existing => {
    seedDraft()
    expect(consumeStarterIntent('different-owner', existing)).toEqual({ status: 'discarded' })
    expect(hasStarterIntent()).toBe(false)
  })

  it('never replaces existing notes or resets their selections', () => {
    seedDraft()
    expect(consumeStarterIntent('test-owner', true)).toEqual({ status: 'discarded' })
    expect(hasStarterIntent()).toBe(false)
  })

  it('never reassigns an already-owned draft at login', () => {
    seedDraft()
    bindStarterIntentToUser('different-owner')
    expect(consumeStarterIntent('different-owner', false)).toEqual({ status: 'empty' })
  })

  it.each(['SIGNED_OUT', 'SIGNED_IN'])('clears pending notes after %s in another tab', async event => {
    await saveStarterIntent({ text: 'Piano leads.' })
    bindStarterIntentToUser('test-owner')
    for (const listener of auth.listeners) listener(event, event === 'SIGNED_OUT' ? null : { user: { id: 'different-owner' } })
    expect(hasStarterIntent()).toBe(false)
  })

  it('does not save a stale getSession response after sign-out', async () => {
    let finish!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const pending = saveStarterIntent({ text: 'Old account idea.' })
    for (const listener of auth.listeners) listener('SIGNED_OUT', null)
    finish({ data: { session: { user: { id: 'test-owner' } } }, error: null })
    expect(await pending).toEqual({ ok: false, reason: 'unavailable' })
    expect(hasStarterIntent()).toBe(false)
  })

  it('a slower previous submit cannot replace a newer starter', async () => {
    let finish!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const old = saveStarterIntent({ text: 'Older idea.' })
    await saveStarterIntent({ text: 'Newer idea.' })
    finish({ data: { session: null }, error: null })
    expect(await old).toEqual({ ok: false, reason: 'unavailable' })
    bindStarterIntentToUser('test-owner')
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'ready', notes: 'Newer idea.' })
  })

  it('navigation cancellation cannot save an abandoned pending starter', async () => {
    let finish!: (value: unknown) => void
    auth.getSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const controller = new AbortController()
    const pending = saveStarterIntent({ text: 'Abandoned idea.' }, controller.signal)
    controller.abort()
    finish({ data: { session: null }, error: null })
    expect(await pending).toEqual({ ok: false, reason: 'unavailable' })
    expect(hasStarterIntent()).toBe(false)
  })
})

describe('validation and unavailable storage', () => {
  it.each([
    { text: '' }, { text: '   ' }, { text: 'x'.repeat(STARTER_TEXT_MAX_LENGTH + 1) },
    { text: 'Piano', examples: ['Cinematic', 'Cinematic'] },
    { text: 'Piano', examples: ['Cinematic', 'Warm vocals', 'Indie soul', 'Cinematic'] },
    { text: 'Piano', examples: ['fabricated-node'] },
    { text: 123 },
  ])('rejects invalid input without saving or touching auth (case %#)', async value => {
    expect(await saveStarterIntent(value as Parameters<typeof saveStarterIntent>[0])).toEqual({ ok: false, reason: 'invalid' })
    expect(auth.getSession).not.toHaveBeenCalled()
    expect(hasStarterIntent()).toBe(false)
  })

  it.each([
    null, { invalidShape: [] }, {},
    { version: 2 }, { ownerId: null }, { ownerId: '' }, { ownerId: 'x'.repeat(129) },
    { createdAt: 0 }, { createdAt: Date.now() + 86_400_000 }, { createdAt: 'not-a-date' },
    { text: 'x'.repeat(STARTER_TEXT_MAX_LENGTH + 1) }, { examples: ['Piano'] },
    { examples: ['Cinematic', 'Cinematic'] }, { unexpected: true },
  ])('rejects untrusted storage shape or account data (case %#)', value => {
    seedDraft(value !== null && Object.keys(value).length ? { ...ownedDraft(), ...value } : value)
    const result = consumeStarterIntent('test-owner', false)
    expect(result.status).not.toBe('ready')
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('expires after 30 minutes without extending expiry at login', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)
    seedDraft({ ...ownedDraft(), ownerId: null })
    vi.spyOn(Date, 'now').mockReturnValue(now + STARTER_INTENT_TTL_MS - 1)
    bindStarterIntentToUser('test-owner')
    vi.spyOn(Date, 'now').mockReturnValue(now + STARTER_INTENT_TTL_MS)
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'empty' })
    expect(hasStarterIntent()).toBe(false)
  })

  it.each(['{broken', 'x'.repeat(26_001)])('discards malformed or oversized JSON', raw => {
    sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, raw)
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'empty' })
    expect(sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)).toBeNull()
  })

  it('reports blocked storage without navigating or exposing notes', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    expect(await saveStarterIntent({ text: 'Piano leads.' })).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('does not return notes when one-shot removal fails', () => {
    seedDraft()
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    expect(consumeStarterIntent('test-owner', false)).toEqual({ status: 'unavailable' })
    expect(() => clearStarterIntent()).not.toThrow()
  })

  it('fails closed on unavailable local auth rather than assigning an anonymous owner', async () => {
    auth.getSession.mockRejectedValueOnce(new Error('unavailable'))
    expect(await saveStarterIntent({ text: 'Piano leads.' })).toEqual({ ok: false, reason: 'unavailable' })
    expect(hasStarterIntent()).toBe(false)
  })
})
