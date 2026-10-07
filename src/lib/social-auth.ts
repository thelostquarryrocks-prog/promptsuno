export const SOCIAL_PROVIDERS = ['google', 'facebook'] as const
export type SocialProvider = typeof SOCIAL_PROVIDERS[number]
export const OAUTH_FLOW_COOKIE = 'promptsuno-oauth-flow'
export const FLOW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export type SocialAvailability = { google: boolean; facebook: boolean; signupEnabled: boolean }
const unavailable: SocialAvailability = { google: false, facebook: false, signupEnabled: false }

// Next may give the route an internal hostname. Use the actual request Host,
// as the existing compiler origin guard does, never X-Forwarded-Host.
export function authRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  return new URL(`${url.protocol}//${request.headers.get('host') ?? url.host}`).origin
}

// Operator flags AND public Supabase settings must agree. No provider secret is read.
export async function socialAvailability(): Promise<SocialAvailability> {
  const google = process.env.SOCIAL_AUTH_GOOGLE_ENABLED === 'true'
  const facebook = process.env.SOCIAL_AUTH_FACEBOOK_ENABLED === 'true'
  if (!google && !facebook) return { ...unavailable }
  try {
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    const response = await fetch(new URL('/auth/v1/settings', base), {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return { ...unavailable }
    const settings = await response.json()
    const signupEnabled = process.env.AUTH_SIGNUP_ENABLED === 'true'
    if (!settings || settings.disable_signup !== !signupEnabled) return { ...unavailable }
    return { google: google && settings.external?.google === true,
      facebook: facebook && settings.external?.facebook === true, signupEnabled }
  } catch { return { ...unavailable } }
}
