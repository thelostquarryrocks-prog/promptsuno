import { NextResponse } from 'next/server'
import { socialAvailability } from '../../../lib/social-auth'
export async function GET() {
  return NextResponse.json(await socialAvailability(), { headers: { 'Cache-Control': 'private, no-store' } })
}
