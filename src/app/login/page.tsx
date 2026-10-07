'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { EARLY_ACCESS_URL } from '@/lib/site'
import { createClient } from '../../lib/supabase/client'
import { bindStarterIntentToUser } from '../../lib/starter-intent'
import { startOAuthHandoff, clearOAuthHandoff } from '../../lib/oauth-handoff'
import type { SocialAvailability, SocialProvider } from '../../lib/social-auth'

const subscribeToHydration = () => () => {}
const clientReady = () => true
const serverReady = () => false
const subscribeToNavigation = (listener: () => void) => { window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener) }
const authReason = () => new URLSearchParams(window.location.search).get('auth_error') ?? ''
const noAuthReason = () => ''
const authMessages: Record<string, string> = { cancelled: 'Social sign-in was cancelled. Your song is unchanged.', expired: 'That sign-in link expired or was already used. Please start again.', unavailable: 'Sign-in is temporarily unavailable. Please try again.', failed: 'Social sign-in could not be completed. Please try again or use email.' }

export default function LoginPage() {
  // Controlled SSR inputs must not accept edits before their handlers hydrate.
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady)
  const reason = useSyncExternalStore(subscribeToNavigation, authReason, noAuthReason)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)
  const [social, setSocial] = useState<SocialAvailability>({ google: false, facebook: false, signupEnabled: false })
  const [intent, setIntent] = useState<'signin' | 'signup'>('signin')
  useEffect(() => {
    const controller = new AbortController()
    const reason = new URLSearchParams(window.location.search).get('auth_error')
    if (reason) {
      clearOAuthHandoff()
    }
    const reset = () => { inFlight.current = false; setLoading(false) }
    window.addEventListener('pageshow', reset)
    fetch('/auth/providers', { cache: 'no-store', signal: controller.signal }).then(response => response.ok ? response.json() : null).then(value => {
      if (value && !controller.signal.aborted) setSocial({ google: value.google === true, facebook: value.facebook === true, signupEnabled: value.signupEnabled === true })
    }).catch(() => { /* Unavailable providers stay disabled. */ })
    return () => { controller.abort(); window.removeEventListener('pageshow', reset) }
  }, [])
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    setError(null)

    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      inFlight.current = false
    } else {
      if (data.user) bindStarterIntentToUser(data.user.id)
      // If successful, push them to the protected workspace
      router.push('/workspace')
    }
    } catch { setError('Sign-in is temporarily unavailable. Please try again.'); setLoading(false); inFlight.current = false }
  }

  const handleSocial = async (provider: SocialProvider) => {
    if (inFlight.current || !social[provider]) return
    inFlight.current = true; setLoading(true); setError(null)
    try {
      const flow = crypto.randomUUID()
      startOAuthHandoff(flow)
      const response = await fetch('/auth/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider, flow, intent }) })
      const result = await response.json()
      if (!response.ok || typeof result.url !== 'string') throw new Error('unavailable')
      const destination = new URL(result.url)
      if (destination.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin || destination.pathname !== '/auth/v1/authorize') throw new Error('invalid redirect')
      window.location.assign(destination.href)
    } catch { clearOAuthHandoff(); setError('Could not start social sign-in. Check browser storage and try again, or use email.'); setLoading(false); inFlight.current = false }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080c0e] p-6 text-white">
      <div className="w-full max-w-sm space-y-7 rounded-3xl border border-[#384047] bg-[#101619] p-6 shadow-[0_0_80px_#ff791212] sm:p-8">
        <div className="text-center">
          <Link href="/" aria-label="PromptSuno home" className="text-3xl font-extrabold tracking-tighter focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">Prompt<span className="text-[#ff702b]">Suno</span></Link>
          <h1 className="mt-2 text-sm font-normal text-gray-400">Sign in to your workspace</h1>
        </div>

        <p className="text-center text-sm text-gray-400">{social.signupEnabled ? 'Continue with Google or Facebook to create an account or sign in.' : 'New accounts and compilation are currently closed. Existing users can still sign in.'}</p>
        {social.signupEnabled && <div className="flex gap-3"><button type="button" aria-pressed={intent === 'signin'} onClick={() => setIntent('signin')}>Sign in</button><button type="button" aria-pressed={intent === 'signup'} onClick={() => setIntent('signup')}>Create account</button></div>}
        <div className="space-y-3" aria-label="Social sign-in">
          <button type="button" disabled={!hydrated || loading || !social.google} onClick={() => handleSocial('google')} className="flex min-h-12 w-full items-center justify-center rounded-full disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"><Image src="/brand/google-signin.png" alt="Sign in with Google" width={180} height={40} className="h-auto w-full" unoptimized /></button>
          <button type="button" disabled={!hydrated || loading || !social.facebook} onClick={() => handleSocial('facebook')} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[#0866ff] px-4 py-3 font-semibold text-white disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">Continue with Facebook</button>
          {(!social.google || !social.facebook) && <p className="text-center text-xs text-gray-400">{!social.google && !social.facebook ? 'Google and Facebook' : !social.google ? 'Google' : 'Facebook'} sign-in is not available yet.</p>}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={!hydrated}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-xl border-0 bg-[#090e11] p-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={!hydrated}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-xl border-0 bg-[#090e11] p-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          {(error || reason) && <p role="alert" className="text-sm text-red-300 text-center">{error ?? authMessages[reason] ?? authMessages.failed}</p>}

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading || !hydrated}
              className="flex w-full justify-center rounded-full bg-linear-to-r from-[#ff5b37] to-[#ffdf45] px-3 py-3 text-sm font-bold text-black hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            <a
              href={EARLY_ACCESS_URL}
              className="flex w-full justify-center rounded-full border border-gray-600 bg-transparent px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Join early access
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
