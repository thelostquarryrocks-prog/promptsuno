import { redirect } from 'next/navigation'

export default function Home() {
  // Instantly redirect anyone visiting the home page straight to the workspace
  redirect('/workspace')
}