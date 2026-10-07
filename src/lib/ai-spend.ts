import type { SupabaseClient } from '@supabase/supabase-js'
import type OpenAI from 'openai'

export const AI_MODEL = 'gpt-5.6-luna'
export const AI_OUTPUT_TOKEN_CAP = 2048
export const AI_INPUT_TOKEN_RESERVATION = 131072
export const AI_REQUEST_BYTE_CAP = 96 * 1024
export type AIAction = 'compile' | 'assist'
export type AIReservation = { allowed: true } | { allowed: false; reason: 'quota'; retryAfterSeconds: number } | { allowed: false; reason: 'paused' }

// This is an app liability reservation, not a provider invoice or tokenizer.
// No refunds: failed, invalid, interrupted and unknown-outcome calls retain it.
// Pricing must be operator-verified and unexpired in the database before enablement.
export async function reserveAIRequest(client: SupabaseClient, action: AIAction, request: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming): Promise<AIReservation> {
  if (process.env.AI_SPEND_ENABLED !== 'true') return { allowed: false, reason: 'paused' }
  if (!['compile', 'assist'].includes(action) || request.model !== AI_MODEL
    || Object.keys(request).some(key => !['model', 'messages', 'max_completion_tokens', 'response_format'].includes(key))
    || request.max_completion_tokens !== AI_OUTPUT_TOKEN_CAP || request.stream
    || request.tools || request.audio || request.modalities
    || request.messages.some(message => typeof message.content !== 'string')
    || new TextEncoder().encode(JSON.stringify(request)).length > AI_REQUEST_BYTE_CAP) {
    throw new Error('Unsupported or unbounded AI request')
  }
  const { data, error } = await client.rpc('reserve_ai_attempt', { requested_action: action })
    .abortSignal(AbortSignal.timeout(5_000))
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.contract_version !== 1) {
    throw new Error('AI spending checks unavailable')
  }
  if (data.allowed === true && data.model === AI_MODEL
    && data.input_token_reservation === AI_INPUT_TOKEN_RESERVATION
    && data.output_token_cap === AI_OUTPUT_TOKEN_CAP
    && Number.isSafeInteger(data.reserved_microusd) && data.reserved_microusd > 0) return { allowed: true }
  if (data.allowed === false && data.reason === 'paused') return { allowed: false, reason: 'paused' }
  if (data.allowed === false && data.reason === 'quota' && Number.isSafeInteger(data.retry_after_seconds)
    && data.retry_after_seconds >= 1 && data.retry_after_seconds <= 2_678_400) {
    return { allowed: false, reason: 'quota', retryAfterSeconds: data.retry_after_seconds }
  }
  // A timeout/malformed response may follow a committed reservation. Never retry.
  throw new Error('Invalid AI spending response')
}
