// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_MODEL, AI_OUTPUT_TOKEN_CAP, reserveAIRequest } from '../src/lib/ai-spend'
const abortSignal = vi.fn()
const rpc = vi.fn(() => ({ abortSignal }))
const client = { rpc } as unknown as SupabaseClient
const request = () => ({ model: AI_MODEL, max_completion_tokens: AI_OUTPUT_TOKEN_CAP, messages: [{ role: 'user' as const, content: 'Private song' }] })
const accepted = { contract_version: 1, allowed: true, model: AI_MODEL, input_token_reservation: 131072, output_token_cap: 2048, reserved_microusd: 133120 }
beforeEach(() => { vi.stubEnv('AI_SPEND_ENABLED', 'true'); rpc.mockClear(); abortSignal.mockReset().mockResolvedValue({ data: accepted, error: null }) })
afterEach(() => vi.unstubAllEnvs())
it('requires explicit server enablement before any reservation', async () => {
  vi.stubEnv('AI_SPEND_ENABLED', '')
  expect(await reserveAIRequest(client, 'compile', request())).toEqual({ allowed: false, reason: 'paused' })
  expect(rpc).not.toHaveBeenCalled()
})
it.each(['compile', 'assist'] as const)('reserves %s once without sending creative content or prices', async action => {
  expect(await reserveAIRequest(client, action, request())).toEqual({ allowed: true })
  expect(rpc).toHaveBeenCalledExactlyOnceWith('reserve_ai_attempt', { requested_action: action })
  expect(abortSignal.mock.calls[0][0]).toBeInstanceOf(AbortSignal)
})
it.each([{ model: 'other' }, { max_completion_tokens: 4096 }, { tools: [] }, { n: 2 }, { messages: [{ role: 'user' as const, content: 'x'.repeat(98304) }] }])('rejects unaccounted provider requests before reserving: %j', async change => {
  await expect(reserveAIRequest(client, 'compile', { ...request(), ...change })).rejects.toThrow('unbounded')
  expect(rpc).not.toHaveBeenCalled()
})
it.each([null, {}, { ...accepted, contract_version: 2 }, { ...accepted, model: 'other' }, { ...accepted, input_token_reservation: 1 }, { ...accepted, output_token_cap: 4096 }, { ...accepted, reserved_microusd: 0 }, { contract_version: 1, allowed: false, reason: 'quota', retry_after_seconds: 0 }])('fails closed on an incompatible reservation: %j', async data => {
  abortSignal.mockResolvedValue({ data, error: null })
  await expect(reserveAIRequest(client, 'assist', request())).rejects.toThrow()
  expect(rpc).toHaveBeenCalledTimes(1)
})
it('distinguishes shared pause and existing user throttling', async () => {
  abortSignal.mockResolvedValueOnce({ data: { contract_version: 1, allowed: false, reason: 'paused' } })
    .mockResolvedValueOnce({ data: { contract_version: 1, allowed: false, reason: 'quota', retry_after_seconds: 60 } })
  expect(await reserveAIRequest(client, 'compile', request())).toEqual({ allowed: false, reason: 'paused' })
  expect(await reserveAIRequest(client, 'assist', request())).toEqual({ allowed: false, reason: 'quota', retryAfterSeconds: 60 })
})
it('never retries or refunds a timeout with an unknown commit outcome', async () => {
  abortSignal.mockRejectedValue(new Error('timeout'))
  await expect(reserveAIRequest(client, 'compile', request())).rejects.toThrow('timeout')
  expect(rpc).toHaveBeenCalledTimes(1)
})
