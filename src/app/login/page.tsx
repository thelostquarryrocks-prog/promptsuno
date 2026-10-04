'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { EARLY_ACCESS_URL } from '@/lib/site'
import { createClient } from '../../lib/supabase/client'
import { bindStarterIntentToUser } from '../../lib/starter-intent'

const subscribeToHydration = () => () => {}
const clientReady = () => true
const serverReady = () => false

export default function LoginPage() {
  // Controlled SSR inputs must not accept edits before their handlers hydrate.
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      if (data.user) bindStarterIntentToUser(data.user.id)
      // If successful, push them to the protected workspace
      router.push('/workspace')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-6 text-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Promptsuno</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to your workspace</p>
        </div>

        <p className="text-center text-sm text-gray-400">New accounts and compilation are currently closed. Existing users can still sign in.</p>

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
                className="relative block w-full rounded-t-md border-0 bg-[#1e1e1e] p-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
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
                className="relative block w-full rounded-b-md border-0 bg-[#1e1e1e] p-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading || !hydrated}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
            <a
              href={EARLY_ACCESS_URL}
              className="flex w-full justify-center rounded-md border border-gray-600 bg-transparent px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Join early access
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
