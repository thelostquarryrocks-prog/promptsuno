type CookieSecurityContext = {
  forwardedProtocol?: string | null
  hostname?: string | null
  protocol?: string | null
}

export function usesSecureCookies({ forwardedProtocol, hostname, protocol }: CookieSecurityContext) {
  const effectiveProtocol = forwardedProtocol?.split(',')[0]?.trim() || protocol

  if (effectiveProtocol) {
    return effectiveProtocol.replace(/:$/, '').toLowerCase() === 'https'
  }

  if (!hostname) return true

  const normalizedHostname = hostname
    .replace(/^\[|\]$/g, '')
    .replace(/:\d+$/, '')
    .toLowerCase()

  return !['localhost', '127.0.0.1', '::1'].includes(normalizedHostname)
}

export function getSupabaseCookieOptions(secure: boolean) {
  return {
    httpOnly: false,
    path: '/',
    sameSite: 'lax' as const,
    secure,
  }
}
