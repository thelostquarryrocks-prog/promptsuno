import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '../../../lib/supabase/server'
import { authRequestOrigin, FLOW_ID, OAUTH_FLOW_COOKIE, SOCIAL_PROVIDERS, socialAvailability, type SocialProvider } from '../../../lib/social-auth'

export async function POST(request: Request) {
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
  const origin = authRequestOrigin(request)
  if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Start sign-in from this site.' }, 403)
  let provider: SocialProvider; let flow: string; let intent: string
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error()
    if (!request.body) throw new Error()
    const reader = request.body.getReader()
    const bytes: number[] = []
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (bytes.length + value.byteLength > 1024) {
          void reader.cancel().catch(() => {})
          throw new Error()
        }
        bytes.push(...value)
      }
    } finally { reader.releaseLock() }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
    const input = JSON.parse(text)
    if (!SOCIAL_PROVIDERS.includes(input.provider) || !FLOW_ID.test(input.flow) || !['signin', 'signup'].includes(input.intent)) throw new Error()
    provider = input.provider; flow = input.flow; intent = input.intent
  } catch { return json({ error: 'Invalid sign-in request.' }, 400) }
  const available = await socialAvailability()
  if (!available[provider] || (intent === 'signup' && !available.signupEnabled)) return json({ error: 'This sign-in option is not available yet. Use an existing email login.' }, 503)
  try {
    const client = await createClient(request.url)
    const { data, error } = await client.auth.signInWithOAuth({ provider, options: {
      redirectTo: `${origin}/auth/callback`, skipBrowserRedirect: true,
      scopes: provider === 'facebook' ? 'email' : 'openid email profile',
    } })
    if (error || !data.url) throw new Error()
    const redirect = new URL(data.url)
    const expected = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    if (redirect.origin !== expected.origin || redirect.pathname !== '/auth/v1/authorize') throw new Error()
    const store = await cookies()
    store.set(OAUTH_FLOW_COOKIE, flow, { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', path: '/auth', maxAge: 600 })
    return json({ url: redirect.href })
  } catch { return json({ error: 'Could not start social sign-in. Please try again or use email.' }, 503) }
}
