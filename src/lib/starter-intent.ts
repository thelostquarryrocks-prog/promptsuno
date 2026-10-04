import { createClient } from './supabase/client'

// This is a short-lived handoff, not saved workspace state. Authored text never
// belongs in a URL, a cookie, localStorage, or a catalog node identifier.
export const STARTER_EXAMPLES = ['Cinematic', 'Warm vocals', 'Indie soul'] as const
export type StarterExample = typeof STARTER_EXAMPLES[number]
export const STARTER_TEXT_MAX_LENGTH = 4000
export const MAX_STARTER_TEXT_LENGTH = STARTER_TEXT_MAX_LENGTH
export const STARTER_INTENT_STORAGE_KEY = 'promptsuno:starter-intent:v1'
export const STARTER_INTENT_TTL_MS = 30 * 60 * 1000

type StarterInput = { text: string; examples?: readonly StarterExample[] }
type StarterDraft = {
  version: 1
  text: string
  examples: StarterExample[]
  createdAt: number
  ownerId: string | null
}
type SaveResult = { ok: true } | { ok: false; reason: 'invalid' | 'unavailable' }
type ConsumeResult = { status: 'ready'; notes: string } | { status: 'empty' | 'discarded' | 'unavailable' }

function validInput(text: unknown, examples: unknown): examples is StarterExample[] {
  return typeof text === 'string' && text.length <= STARTER_TEXT_MAX_LENGTH
    && Array.isArray(examples) && examples.length <= STARTER_EXAMPLES.length
    && examples.every(example => STARTER_EXAMPLES.includes(example))
    && new Set(examples).size === examples.length
    && (text.trim().length > 0 || examples.length > 0)
}

function validOwner(ownerId: unknown): ownerId is string {
  return typeof ownerId === 'string' && ownerId.length > 0 && ownerId.length <= 128
}

export function clearStarterIntent(): void {
  try { window.sessionStorage.removeItem(STARTER_INTENT_STORAGE_KEY) } catch { /* Storage may be disabled. */ }
}

function readDraft(): StarterDraft | null {
  const raw = window.sessionStorage.getItem(STARTER_INTENT_STORAGE_KEY)
  if (raw === null) return null
  try {
    // Bound parsing work too, including malicious/stale JSON in first-party storage.
    if (raw.length > 26_000) throw new Error('Invalid starter')
    const draft: unknown = JSON.parse(raw)
    if (typeof draft !== 'object' || draft === null || Array.isArray(draft)) throw new Error('Invalid starter')
    const value = draft as Record<string, unknown>
    if (Object.keys(value).length !== 5 || value.version !== 1
      || !validInput(value.text, value.examples)
      || !Number.isSafeInteger(value.createdAt)
      || typeof value.createdAt !== 'number' || value.createdAt > Date.now()
      || Date.now() - value.createdAt >= STARTER_INTENT_TTL_MS
      || !(value.ownerId === null || validOwner(value.ownerId))) throw new Error('Invalid starter')
    return value as StarterDraft
  } catch {
    clearStarterIntent()
    return null
  }
}

export function hasStarterIntent(): boolean {
  try { return readDraft() !== null } catch { return false }
}

// Keep the pending handoff safe across client-side navigation and sign-out in a
// second tab. No auth APIs are awaited inside Supabase's synchronous callback.
let watchingAuth = false
let authRevision = 0
let saveSequence = 0
function watchAuth() {
  if (watchingAuth) return
  createClient().auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      authRevision += 1
      clearStarterIntent()
    }
    if (event === 'SIGNED_IN') {
      authRevision += 1
      try {
        const draft = readDraft()
        if (draft?.ownerId && draft.ownerId !== session?.user.id) clearStarterIntent()
      } catch { /* Storage may be disabled. */ }
    }
  })
  watchingAuth = true
}

export async function saveStarterIntent({ text, examples = [] }: StarterInput, signal?: AbortSignal): Promise<SaveResult> {
  if (!validInput(text, examples)) return { ok: false, reason: 'invalid' }
  if (signal?.aborted) return { ok: false, reason: 'unavailable' }
  try {
    watchAuth()
    const revision = authRevision
    const sequence = ++saveSequence
    // getSession only labels local draft ownership. It does not authorize the
    // workspace or compilation; the existing server guards still do that.
    const { data, error } = await createClient().auth.getSession()
    if (error || signal?.aborted || revision !== authRevision || sequence !== saveSequence) return { ok: false, reason: 'unavailable' }
    const ownerId = data.session?.user.id ?? null
    if (ownerId !== null && !validOwner(ownerId)) return { ok: false, reason: 'unavailable' }
    const draft: StarterDraft = { version: 1, text, examples: [...examples], createdAt: Date.now(), ownerId }
    window.sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, JSON.stringify(draft))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

// Only an explicit successful login in this tab may adopt an anonymous starter.
// An already-owned starter is never reassigned to a different account.
export function bindStarterIntentToUser(ownerId: string): void {
  try {
    watchAuth()
    const draft = readDraft()
    if (!draft) return
    if (!validOwner(ownerId) || (draft.ownerId !== null && draft.ownerId !== ownerId)) {
      clearStarterIntent()
      return
    }
    window.sessionStorage.setItem(STARTER_INTENT_STORAGE_KEY, JSON.stringify({ ...draft, ownerId }))
  } catch { clearStarterIntent() }
}

export function consumeStarterIntent(ownerId: string, hasExistingIntent: boolean): ConsumeResult {
  try {
    const draft = readDraft()
    if (!draft) return { status: 'empty' }
    // Remove before applying. A failed removal must never make a draft replayable.
    window.sessionStorage.removeItem(STARTER_INTENT_STORAGE_KEY)
    if (!validOwner(ownerId) || draft.ownerId !== ownerId || hasExistingIntent) return { status: 'discarded' }
    const examples = draft.examples.length ? `Example directions: ${draft.examples.join(', ')}` : ''
    return { status: 'ready', notes: `${draft.text}${draft.text && examples ? '\n\n' : ''}${examples}` }
  } catch {
    return { status: 'unavailable' }
  }
}
