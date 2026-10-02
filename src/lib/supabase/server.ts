import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseCookieOptions, usesSecureCookies } from './cookie-options'

export async function createClient(requestUrl?: string | URL) {
  const cookieStore = await cookies()
  const protocol = requestUrl ? new URL(requestUrl).protocol : undefined

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(usesSecureCookies({ protocol })),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
