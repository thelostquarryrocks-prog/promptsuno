import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '../../../lib/supabase/server'
import { authRequestOrigin, FLOW_ID, OAUTH_FLOW_COOKIE } from '../../../lib/social-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = authRequestOrigin(request)
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin))
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.cookies.set(OAUTH_FLOW_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', path: '/auth', maxAge: 0 })
    return response
  }
  if (searchParams.has('error')) return redirect(`/login?auth_error=${searchParams.get('error') === 'access_denied' ? 'cancelled' : 'failed'}`)
  const code = searchParams.get('code')
  if (!code || code.length > 4096) return redirect('/login?auth_error=expired')
  try {
    const client = await createClient(request.url)
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (error) return redirect('/login?auth_error=expired')
    const flow = (await cookies()).get(OAUTH_FLOW_COOKIE)?.value
    // Fixed local destinations only. Ignore next and forwarded-host parameters.
    return redirect(flow && FLOW_ID.test(flow) ? `/auth/complete?flow=${flow}` : '/workspace')
  } catch { return redirect('/login?auth_error=unavailable') }
}
