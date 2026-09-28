// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/generate/route'
import { MAX_COMPILER_BODY_BYTES, MAX_RELATIONSHIP_NOTES_BYTES } from '../src/lib/compiler-request'

const { createCompletion, constructProvider, getUser, createClient, rpc, abortSignal } = vi.hoisted(() => ({
  createCompletion: vi.fn(), constructProvider: vi.fn(), getUser: vi.fn(), createClient: vi.fn(),
  rpc: vi.fn(), abortSignal: vi.fn(),
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
  rpc.mockReset().mockReturnValue({ abortSignal })
  abortSignal.mockReset().mockResolvedValue({ data: { allowed: true, retry_after_seconds: 0 }, error: null })
  createClient.mockReset().mockResolvedValue({ auth: { getUser }, rpc })
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
    expect(rpc).toHaveBeenCalledExactlyOnceWith('reserve_compiler_attempt')
    expect(getUser.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0])
    expect(abortSignal.mock.invocationCallOrder[0]).toBeLessThan(constructProvider.mock.invocationCallOrder[0])
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
    expect(rpc).not.toHaveBeenCalled()
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

describe('durable quota integration (RPC responses simulated)', () => {
  it('returns 429 with database Retry-After and never constructs a model client', async () => {
    abortSignal.mockResolvedValue({ data: { allowed: false, retry_after_seconds: 86400 }, error: null })
    const response = await POST(request(input))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('86400')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.json()).toMatchObject({ retry_after_seconds: 86400, error: expect.stringContaining('usage limit') })
    expect(createCompletion).not.toHaveBeenCalled()
    expect(constructProvider).not.toHaveBeenCalled()
  })

  it.each([
    ['missing policy', { data: null, error: { code: '55000', message: 'private configuration' } }],
    ['missing migration', { data: null, error: { code: 'PGRST202' } }],
    ['database outage', { data: null, error: { message: 'private database details' } }],
    ['error with apparent allowance', { data: { allowed: true, retry_after_seconds: 0 }, error: { code: 'failure' } }],
    ['empty result', { data: null, error: null }],
    ['incorrect shape', { data: [{ allowed: true, retry_after_seconds: 0 }], error: null }],
    ['truthy allowance', { data: { allowed: 'true', retry_after_seconds: 0 }, error: null }],
    ['missing retry', { data: { allowed: false }, error: null }],
    ['invalid retry', { data: { allowed: false, retry_after_seconds: -1 }, error: null }],
    ['fractional retry', { data: { allowed: false, retry_after_seconds: 1.5 }, error: null }],
    ['excessive retry', { data: { allowed: false, retry_after_seconds: 2678401 }, error: null }],
  ])('fails closed for %s in production without a model call', async (_label, result) => {
    vi.stubEnv('NODE_ENV', 'production')
    abortSignal.mockResolvedValue(result)
    const response = await POST(request(input))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Compiler usage checks are unavailable. Please try again later.' })
    expect(createCompletion).not.toHaveBeenCalled()
    expect(constructProvider).not.toHaveBeenCalled()
  })

  it('does not retry an ambiguous database timeout', async () => {
    abortSignal.mockRejectedValue(new DOMException('private timeout', 'TimeoutError'))
    expect((await POST(request(input))).status).toBe(503)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(abortSignal.mock.calls[0][0]).toBeInstanceOf(AbortSignal)
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it.each(['user_id', 'burst_limit', 'sustained_limit', 'window_seconds'])('rejects client %s overrides without reserving or calling the model', async key => {
    expect((await POST(request({ ...input, [key]: 'forged' }))).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
    expect(createCompletion).not.toHaveBeenCalled()
  })

  it('uses only the verified cookie client RPC and sends no identity, allowance or authored data', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const req = request(input)
    req.headers.set('x-user-id', 'victim')
    req.headers.set('x-quota-limit', '999999')
    expect((await POST(req)).status).toBe(200)
    expect(rpc).toHaveBeenCalledExactlyOnceWith('reserve_compiler_attempt')
  })

  it('keeps a reservation on provider failure; a manual retry must reserve again', async () => {
    abortSignal.mockResolvedValueOnce({ data: { allowed: true, retry_after_seconds: 0 }, error: null })
      .mockResolvedValue({ data: { allowed: false, retry_after_seconds: 30 }, error: null })
    createCompletion.mockRejectedValue(new Error('provider timeout'))
    expect((await POST(request(input))).status).toBe(502)
    expect((await POST(request(input))).status).toBe(429)
    expect(rpc.mock.calls).toEqual([['reserve_compiler_attempt'], ['reserve_compiler_attempt']])
    expect(createCompletion).toHaveBeenCalledTimes(1)
  })

  it('waits for committed reservation before making any model call', async () => {
    let resolveReservation!: (value: unknown) => void
    abortSignal.mockReturnValue(new Promise(resolve => { resolveReservation = resolve }))
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const pending = POST(request(input))
    await vi.waitFor(() => expect(abortSignal).toHaveBeenCalledTimes(1))
    expect(createCompletion).not.toHaveBeenCalled()
    resolveReservation({ data: { allowed: true, retry_after_seconds: 0 }, error: null })
    expect((await pending).status).toBe(200)
  })

  it('honors shared RPC decisions for concurrent requests across separate clients and users', async () => {
    // A mock atomic store tests route wiring, NOT PostgreSQL locking or isolation.
    const used = new Map<string, number>()
    const users = Array.from({ length: 24 }, (_, index) => index % 2 ? 'user-a' : 'user-b')
    createClient.mockImplementation(async () => {
      const id = users.shift()!
      return {
        auth: { getUser: async () => ({ data: { user: { id } }, error: null }) },
        rpc: (name: string) => {
          expect(name).toBe('reserve_compiler_attempt')
          return { abortSignal: async () => {
            await new Promise(resolve => setTimeout(resolve, 1))
            const count = used.get(id) ?? 0
            const allowed = count < 3
            if (allowed) used.set(id, count + 1)
            return { data: { allowed, retry_after_seconds: allowed ? 0 : 60 }, error: null }
          } }
        },
      }
    })
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const results = await Promise.all(Array.from({ length: 24 }, () => POST(request(input))))
    expect(results.filter(result => result.status === 200)).toHaveLength(6)
    expect(results.filter(result => result.status === 429)).toHaveLength(18)
    expect(used).toEqual(new Map([['user-a', 3], ['user-b', 3]]))
    expect(createCompletion).toHaveBeenCalledTimes(6)
  })
})
