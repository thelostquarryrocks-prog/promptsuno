import { FLOW_ID } from './social-auth'
const KEY = 'promptsuno:oauth-handoff:v1'
export function startOAuthHandoff(flow: string): void {
  if (!FLOW_ID.test(flow)) throw new Error('Invalid login flow')
  sessionStorage.setItem(KEY, JSON.stringify({ flow, startedAt: Date.now() }))
}
export function clearOAuthHandoff(): void { try { sessionStorage.removeItem(KEY) } catch { /* No creative content here. */ } }
export function consumeOAuthHandoff(flow: string | null): boolean {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw || !flow || !FLOW_ID.test(flow)) return false
    const value = JSON.parse(raw)
    return value.flow === flow && Number.isSafeInteger(value.startedAt) && value.startedAt <= Date.now() && Date.now() - value.startedAt < 600_000
  } catch { return false }
}
