// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/generate/route'
import { MAX_COMPILER_BODY_BYTES, MAX_RELATIONSHIP_NOTES_BYTES } from '../src/lib/compiler-request'

const { createCompletion, constructProvider, getUser, createClient } = vi.hoisted(() => ({
  createCompletion: vi.fn(), constructProvider: vi.fn(), getUser: vi.fn(), createClient: vi.fn(),
}))
vi.mock('../src/lib/supabase/server', () => ({ createClient }))
vi.mock('openai', () => ({
  default: class {
    constructor(options: unknown) { constructProvider(options) }
    chat = { completions: { create: createCompletion } }
  },
}))

const nodes = [
  { node_id: 'piano', label: 'Piano', category: 'Instrument' },
  { node_id: 'aggressive', label: 'Aggressive', category: 'Energy' },
  { node_id: 'dreamy-ambient', label: 'Dreamy Ambient', category: 'Genre' },
]
const input = { nodes, relationship_notes: 'Piano is foreground. Preserve aggressive dreamy contrast.\nNo drums.' }
const ready = { version: '1.0.0', status: 'ready', styles: 'Foreground piano in aggressive dreamy ambient.', coverage: nodes.map(node => ({ node_id: node.node_id, status: 'preserved' })), interpretations: [], questions: [] }
const request = (body: unknown) => new Request('http://localhost/api/generate', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'unit-test-placeholder')
  createCompletion.mockReset()
  constructProvider.mockReset()
  createClient.mockReset().mockResolvedValue({ auth: { getUser } })
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'verified-server-user' } }, error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('existing Luna compiler API', () => {
  it('forwards only exact nodes and authored notes to gpt-5.6-luna with the strict schema', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const response = await POST(request(input))
    expect(response.status).toBe(200)
    expect(getUser).toHaveBeenCalledExactlyOnceWith()
    expect(getUser.mock.invocationCallOrder[0]).toBeLessThan(constructProvider.mock.invocationCallOrder[0])
    expect(constructProvider).toHaveBeenCalledWith({ apiKey: 'unit-test-placeholder', maxRetries: 0, timeout: 30_000 })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toEqual(ready)
    const forwarded = createCompletion.mock.calls[0][0]
    expect(forwarded.model).toBe('gpt-5.6-luna')
    expect(forwarded.max_completion_tokens).toBe(2048)
    expect(forwarded).not.toHaveProperty('max_tokens')
    expect(forwarded.response_format.json_schema.strict).toBe(true)
    expect(JSON.parse(forwarded.messages.find((message: { role: string }) => message.role === 'user').content)).toEqual(input)
    expect(forwarded.messages[1].content).toContain("the user's authored musical requirements")
  })

  it('returns clarification without changing selected identities or adding Styles', async () => {
    const clarification = { ...ready, status: 'needs_clarification', styles: '', questions: ['Should the piano be dry or reverberant?'] }
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(clarification) } }] })
    expect(await (await POST(request(input))).json()).toEqual(clarification)
  })

  it('rejects incorrect identities and legacy payloads before any provider call', async () => {
    expect((await POST(request({ nodes: [{ ...nodes[0], node_id: 'genre-piano' }], relationship_notes: '' }))).status).toBe(400)
    expect((await POST(request({ tags: ['Piano'] }))).status).toBe(400)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('handles invalid JSON without calling the provider', async () => {
    expect((await POST(new Request('http://localhost/api/generate', { method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } }))).status).toBe(400)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('returns unavailable when credentials are missing, without module-load failure', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    expect((await POST(request(input))).status).toBe(503)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('returns a safe error for provider failure, never echoing provider details', async () => {
    createCompletion.mockRejectedValue(new Error('private provider detail'))
    const response = await POST(request(input))
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Failed to compile intent' })
    expect(console.error).toHaveBeenCalledWith('Luna compiler request failed')
  })

  it.each(['{}', 'invalid JSON', JSON.stringify({ ...ready, coverage: [{ node_id: 'wrong-id', status: 'preserved' }] })])('rejects malformed or mismatched provider output', async content => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content } }] })
    expect((await POST(request(input))).status).toBe(502)
  })
})

describe('paid compiler request boundary', () => {
  it.each([
    ['missing session', { data: { user: null }, error: null }],
    ['expired session', { data: { user: null }, error: { status: 401, code: 'session_expired' } }],
    ['invalid signature', { data: { user: null }, error: { status: 401, code: 'bad_jwt' } }],
    ['error alongside a user', { data: { user: { id: 'untrusted' } }, error: { status: 401 } }],
    ['user without identity', { data: { user: {} }, error: null }],
  ])('rejects %s before reading input or constructing the provider', async (_name, result) => {
    getUser.mockResolvedValue(result)
    const req = request(input)
    const response = await POST(req)
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(req.bodyUsed).toBe(false)
    expect(constructProvider).not.toHaveBeenCalled()
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it.each(['client', 'verification'])('fails closed when %s throws without exposing details', async boundary => {
    const error = new Error('private auth diagnostic')
    if (boundary === 'client') createClient.mockRejectedValue(error)
    else getUser.mockRejectedValue(error)
    const response = await POST(request(input))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain(error.message)
    expect(constructProvider).not.toHaveBeenCalled()
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('does not accept client identity headers or a user ID in the body', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const req = request({ ...input, user_id: 'someone-else' })
    req.headers.set('x-user-id', 'someone-else')
    req.headers.set('authorization', 'Bearer invented-token')
    expect((await POST(req)).status).toBe(401)
    getUser.mockResolvedValue({ data: { user: { id: 'verified-server-user' } }, error: null })
    expect((await POST(request({ ...input, user_id: 'someone-else' }))).status).toBe(400)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it.each([
    ['notes over budget', { ...input, relationship_notes: 'a'.repeat(MAX_RELATIONSHIP_NOTES_BYTES + 1) }],
    ['multibyte notes over budget', { ...input, relationship_notes: '🎵'.repeat(MAX_RELATIONSHIP_NOTES_BYTES / 4 + 1) }],
    ['matrix strengths', { ...input, affinities: { piano: 0.9 } }],
    ['node weights', { ...input, nodes: [{ ...nodes[0], weight: 1 }] }],
    ['wrong label', { ...input, nodes: [{ ...nodes[0], label: 'Invented' }] }],
    ['too many nodes', { ...input, nodes: Array(1000).fill(nodes[0]) }],
  ])('rejects %s without a model call', async (_name, body) => {
    expect((await POST(request(body))).status).toBe(400)
    expect(constructProvider).not.toHaveBeenCalled()
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('preserves Unicode, whitespace, punctuation and authored numbers at the exact notes byte boundary', async () => {
    const prefix = '  🎵\n[Verse]; 127 BPM?! 日本語\r\n'
    const notes = prefix + 'x'.repeat(MAX_RELATIONSHIP_NOTES_BYTES - new TextEncoder().encode(prefix).length)
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    expect((await POST(request({ ...input, relationship_notes: notes }))).status).toBe(200)
    const payload = createCompletion.mock.calls[0][0].messages[2].content
    expect(JSON.parse(payload)).toEqual({ ...input, relationship_notes: notes })
  })

  it.each([
    ['text/plain', { 'content-type': 'text/plain' }, 415],
    ['foreign origin', { 'content-type': 'application/json', origin: 'https://attacker.invalid' }, 403],
    ['opaque origin', { 'content-type': 'application/json', origin: 'null' }, 403],
    ['cross-site fetch', { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, 403],
    ['spoofed forwarded host', { 'content-type': 'application/json', host: 'localhost', 'x-forwarded-host': 'attacker.invalid', origin: 'http://attacker.invalid' }, 403],
    ['oversized declared length', { 'content-type': 'application/json', 'content-length': String(MAX_COMPILER_BODY_BYTES + 1) }, 413],
  ] as const)('rejects %s before reading input', async (_name, headers, status) => {
    const req = new Request('http://localhost/api/generate', { method: 'POST', headers, body: JSON.stringify(input) })
    expect((await POST(req)).status).toBe(status)
    expect(req.bodyUsed).toBe(false)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it.each([undefined, '1'])('bounds actual streamed bytes with declared length %s', async length => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(32 * 1024).fill(32)) },
      cancel() { cancelled = true },
    })
    const headers = new Headers({ 'content-type': 'application/json' })
    if (length) headers.set('content-length', length)
    const req = new Request('http://localhost/api/generate', { method: 'POST', headers, body, duplex: 'half' } as RequestInit)
    expect((await POST(req)).status).toBe(413)
    expect(cancelled).toBe(true)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('accepts a same-origin JSON request at the exact body byte boundary', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const body = JSON.stringify(input)
    const padding = ' '.repeat(MAX_COMPILER_BODY_BYTES - new TextEncoder().encode(body).length)
    const req = new Request('http://localhost/api/generate', { method: 'POST', body: body + padding, headers: { 'content-type': 'application/json; charset=utf-8', origin: 'http://localhost' } })
    expect((await POST(req)).status).toBe(200)
    expect(createCompletion).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid UTF-8 instead of silently rewriting authored notes', async () => {
    const req = new Request('http://localhost/api/generate', { method: 'POST', body: new Uint8Array([0xff]), headers: { 'content-type': 'application/json' } })
    expect((await POST(req)).status).toBe(400)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('compares the browser origin to Host when Next uses an internal URL hostname', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const req = request(input)
    req.headers.set('host', '127.0.0.1:3131')
    req.headers.set('origin', 'http://127.0.0.1:3131')
    expect((await POST(req)).status).toBe(200)
    expect(createCompletion).toHaveBeenCalledTimes(1)
  })
})
