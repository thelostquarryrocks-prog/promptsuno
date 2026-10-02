import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseCookieOptions, usesSecureCookies } from './cookie-options'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(usesSecureCookies({
        protocol: typeof window === 'undefined' ? undefined : window.location.protocol,
      })),
    }
  )
}
