// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/workspace-assist/route'
const { createCompletion, constructProvider, getUser, createClient, reserve } = vi.hoisted(() => ({
  createCompletion: vi.fn(), constructProvider: vi.fn(), getUser: vi.fn(), createClient: vi.fn(), reserve: vi.fn(),
}))
vi.mock('../src/lib/supabase/server', () => ({ createClient }))
vi.mock('../src/lib/compiler-quota', () => ({ reserveCompilerAttempt: reserve }))
vi.mock('openai', () => ({ default: class {
  constructor(options: unknown) { constructProvider(options) }
  chat = { completions: { create: createCompletion } }
} }))
const input = { action: 'lyrics', nodes: [{ node_id: 'piano', label: 'Piano', category: 'Instrument' }], relationship_notes: 'Piano foreground', styles: '', sections: [{ id: 'v', title: 'Verse', text: 'light' }], lyricNotes: '', preservationGoals: [], reportedProblem: '', symptom: '', targetId: 'v', instruction: 'Refine' }
const ready = { observations: ['The verse is one word.'], hypotheses: [], proposals: [{ target: 'lyricsSection', targetId: 'v', before: 'light', after: 'bright', rationale: 'Try this word.' }] }
const request = (body: unknown = input, headers = {}) => new Request('http://localhost/api/workspace-assist', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } })
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('WORKSPACE_ASSIST_ENABLED', 'true'); vi.stubEnv('OPENAI_API_KEY', 'test-placeholder')
  getUser.mockResolvedValue({ data: { user: { id: 'verified' } }, error: null })
  createClient.mockResolvedValue({ auth: { getUser } })
  reserve.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
})
describe('guarded workspace assistance', () => {
  it.each(['', 'false', 'TRUE'])('stays disabled with flag %s before quota/provider', async flag => {
    vi.stubEnv('WORKSPACE_ASSIST_ENABLED', flag)
    const req = request()
    expect((await POST(req)).status).toBe(503)
    expect(getUser).toHaveBeenCalledOnce(); expect(req.bodyUsed).toBe(false)
    expect(reserve).not.toHaveBeenCalled(); expect(constructProvider).not.toHaveBeenCalled()
  })
  it('fails closed without a key', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    expect((await POST(request())).status).toBe(503); expect(reserve).not.toHaveBeenCalled()
  })
  it.each([null, {}])('requires verified identity even while disabled', async user => {
    vi.stubEnv('WORKSPACE_ASSIST_ENABLED', '')
    getUser.mockResolvedValue({ data: { user }, error: null })
    expect((await POST(request())).status).toBe(401); expect(reserve).not.toHaveBeenCalled()
  })
  it('fails closed on auth outage without exposing diagnostics', async () => {
    getUser.mockRejectedValue(new Error('private detail'))
    const response = await POST(request())
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private detail')
  })
  it('uses exact canonical context, existing model and strict bounded provider settings after quota', async () => {
    const response = await POST(request())
    expect(response.status).toBe(200); expect(await response.json()).toEqual(ready)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(constructProvider).toHaveBeenCalledWith({ apiKey: 'test-placeholder', maxRetries: 0, timeout: 30_000 })
    expect(reserve.mock.invocationCallOrder[0]).toBeLessThan(constructProvider.mock.invocationCallOrder[0])
    const call = createCompletion.mock.calls[0][0]
    expect(call.model).toBe('gpt-5.6-luna'); expect(call.max_completion_tokens).toBe(2048)
    expect(call.response_format.json_schema.strict).toBe(true)
    expect(JSON.parse(call.messages[1].content)).toEqual(input)
  })
  it.each([
    [{ ...input, owner: 'forged' }, 400],
    [{ ...input, nodes: [{ ...input.nodes[0], label: 'forged' }] }, 400],
    [{ ...input, targetId: 'missing' }, 400],
  ])('rejects malformed context before quota', async (body, status) => {
    expect((await POST(request(body))).status).toBe(status); expect(reserve).not.toHaveBeenCalled()
  })
  it.each([
    [{ origin: 'https://hostile.invalid' }, 403], [{ 'sec-fetch-site': 'cross-site' }, 403],
    [{ 'content-type': 'text/plain' }, 415], [{ 'content-length': '65537' }, 413],
  ])('enforces request boundaries', async (headers, status) => {
    expect((await POST(request(input, headers))).status).toBe(status); expect(reserve).not.toHaveBeenCalled()
  })
  it('bounds actual body bytes despite a false declared size', async () => {
    expect((await POST(request({ ...input, instruction: 'x'.repeat(65536) }, { 'content-length': '1' }))).status).toBe(413)
    expect(reserve).not.toHaveBeenCalled()
  })
  it('cancels an oversized stream before quota', async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(32 * 1024).fill(32)) },
      cancel() { cancelled = true },
    })
    const req = new Request('http://localhost/api/workspace-assist', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half',
    } as RequestInit)
    expect((await POST(req)).status).toBe(413)
    expect(cancelled).toBe(true); expect(reserve).not.toHaveBeenCalled()
  })
  it('rejects hostile origins even when assistance is disabled', async () => {
    vi.stubEnv('WORKSPACE_ASSIST_ENABLED', '')
    expect((await POST(request(input, { origin: 'https://hostile.invalid' }))).status).toBe(403)
    expect(reserve).not.toHaveBeenCalled()
  })
  it('allows lyrics-first requests and actual same-origin Host behind internal routing', async () => {
    expect((await POST(request({ ...input, nodes: [] }, { host: '127.0.0.1:3131', origin: 'http://127.0.0.1:3131' }))).status).toBe(200)
  })
  it('returns quota denial with retry metadata and no provider', async () => {
    reserve.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 })
    const response = await POST(request())
    expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60')
    expect(constructProvider).not.toHaveBeenCalled()
  })
  it('does not retry ambiguous quota failure', async () => {
    reserve.mockRejectedValue(new Error('private timeout'))
    expect((await POST(request())).status).toBe(503); expect(reserve).toHaveBeenCalledOnce()
    expect(constructProvider).not.toHaveBeenCalled()
  })
  it.each(['{}', 'not json', JSON.stringify({ ...ready, proposals: [{ ...ready.proposals[0], before: 'stale' }] })])('rejects invalid provider data', async content => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content } }] })
    expect((await POST(request())).status).toBe(502)
  })
  it('rejects a provider edit to a locked section', async () => {
    expect((await POST(request({ ...input, preservationGoals: [{ id: 'lock', scope: 'section', targetId: 'v', text: '' }] }))).status).toBe(502)
  })
  it('keeps the reservation and returns a generic failure on provider errors', async () => {
    createCompletion.mockRejectedValue(new Error('private provider detail'))
    const response = await POST(request())
    expect(response.status).toBe(502); expect(await response.text()).not.toContain('private provider detail')
    expect(reserve).toHaveBeenCalledOnce(); expect(createCompletion).toHaveBeenCalledOnce()
  })
})
