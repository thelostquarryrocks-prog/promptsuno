// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../src/app/api/generate/route'

const { createCompletion } = vi.hoisted(() => ({ createCompletion: vi.fn() }))
vi.mock('openai', () => ({
  default: class {
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
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('existing Luna compiler API', () => {
  it('forwards only exact nodes and authored notes to gpt-5.6-luna with the strict schema', async () => {
    createCompletion.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(ready) } }] })
    const response = await POST(request(input))
    expect(response.status).toBe(200)
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
    expect((await POST(new Request('http://localhost/api/generate', { method: 'POST', body: '{' }))).status).toBe(400)
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
