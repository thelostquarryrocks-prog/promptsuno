import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  // Extract the URL, the origin (your domain), and the search parameters
  const { searchParams, origin } = new URL(request.url)
  
  // Get the security code Supabase attached to the email link
  const code = searchParams.get('code')
  
  // Determine where to send them after logging in (defaults to /workspace)
  const next = searchParams.get('next') ?? '/workspace'

  if (code) {
    const supabase = await createClient(request.url)
    
    // Securely exchange the code for an active user session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If successful, send them to the workspace
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If the code is invalid or expired, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?error=Could not verify email`)
}
