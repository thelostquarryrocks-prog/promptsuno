import { isIndexable, NO_INDEX } from './lib/indexing'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseCookieOptions, usesSecureCookies } from './lib/supabase/cookie-options'

export const PRIVATE_CACHE_CONTROL = 'private, no-store'

export function isProtectedPathname(pathname: string) {
  return /^\/(?:workspace(?:\/|$)|login(?:\/|$)|auth(?:\/|$)|api\/(?:generate|workspace-assist)(?:\/|$))/.test(pathname)
}

function applyResponseBoundaries(response: NextResponse, pathname: string) {
  if (isProtectedPathname(pathname)) {
    response.headers.set('Cache-Control', PRIVATE_CACHE_CONTROL)
  }
  if (!isIndexable(pathname)) response.headers.set('X-Robots-Tag', NO_INDEX)
  return response
}

export async function proxy(request: NextRequest) {
  // The paid route owns verification and JSON failures, including config outages.
  // Avoid a second auth/refresh attempt or middleware redirect before its guard.
  if (['/api/generate', '/api/workspace-assist'].includes(request.nextUrl.pathname)) {
    return applyResponseBoundaries(NextResponse.next({ request }), request.nextUrl.pathname)
  }

  const pathname = request.nextUrl.pathname

  // Static/public responses need the indexing boundary, not a session refresh.
  if (!isProtectedPathname(pathname)) {
    return applyResponseBoundaries(NextResponse.next({ request }), pathname)
  }

  let supabaseResponse = applyResponseBoundaries(NextResponse.next({ request }), pathname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(usesSecureCookies({
        forwardedProtocol: request.headers.get('x-forwarded-proto'),
        hostname: request.nextUrl.hostname,
        protocol: request.nextUrl.protocol,
      })),
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = applyResponseBoundaries(NextResponse.next({ request }), pathname)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(responseHeaders).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value)
          })
        },
      },
    }
  )

  // Refresh the session and get the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users trying to access the workspace
  if (request.nextUrl.pathname.startsWith('/workspace') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return applyResponseBoundaries(NextResponse.redirect(url), pathname)
  }

  return applyResponseBoundaries(supabaseResponse, pathname)
}

export const config = {
  matcher: '/:path*',
}
