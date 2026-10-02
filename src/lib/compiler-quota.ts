import type { SupabaseClient } from '@supabase/supabase-js'

type Reservation = { allowed: true } | { allowed: false; retryAfterSeconds: number }

// Server route only. Reuse the verified cookie session; never use a service-role
// client or send identity, allowance, clock, prompts or notes as RPC arguments.
export async function reserveCompilerAttempt(client: SupabaseClient): Promise<Reservation> {
  const { data, error } = await client.rpc('reserve_compiler_attempt')
    .abortSignal(AbortSignal.timeout(5_000))
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Compiler quota unavailable')
  }
  if (data.allowed === true && data.retry_after_seconds === 0) return { allowed: true }
  if (data.allowed === false && Number.isSafeInteger(data.retry_after_seconds)
      && data.retry_after_seconds >= 1 && data.retry_after_seconds <= 2_678_400) {
    return { allowed: false, retryAfterSeconds: data.retry_after_seconds }
  }
  // An absent, stale or malformed RPC contract is never an unlimited allowance.
  throw new Error('Invalid compiler quota response')
}
