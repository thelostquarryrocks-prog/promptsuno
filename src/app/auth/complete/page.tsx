'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { bindStarterIntentToUser } from '../../../lib/starter-intent'
import { consumeOAuthHandoff } from '../../../lib/oauth-handoff'

export default function OAuthComplete() {
  const router = useRouter()
  const [error, setError] = useState(false)
  const handoff = useRef<boolean | null>(null)
  useEffect(() => {
    let active = true
    if (handoff.current === null) handoff.current = consumeOAuthHandoff(new URLSearchParams(window.location.search).get('flow'))
    window.history.replaceState(null, '', '/auth/complete')
    createClient().auth.getUser().then(({ data, error }) => {
      if (!active) return
      if (error || !data.user) { setError(true); return }
      if (handoff.current) { handoff.current = false; bindStarterIntentToUser(data.user.id) }
      router.replace('/workspace')
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [router])
  return <main className="min-h-screen bg-[#080c0e] p-8 text-white"><p role="status">{error ? 'Could not finish sign-in. Your saved song remains in this browser.' : 'Finishing sign-in…'}</p>{error && <a href="/login">Return to sign in</a>}</main>
}
