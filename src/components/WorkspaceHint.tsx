'use client'
import { useSyncExternalStore } from 'react'
import { BananaIcon } from './home/BananaIcon'

const event = 'promptsuno-hint-change'
const subscribe = (notify: () => void) => {
  window.addEventListener(event, notify); window.addEventListener('storage', notify)
  return () => { window.removeEventListener(event, notify); window.removeEventListener('storage', notify) }
}
const dismissedInMemory = new Set<string>()
export default function WorkspaceHint({ id, children }: { id: string; children: React.ReactNode }) {
  const key = `promptsuno:hint:v1:${id}`
  const visible = useSyncExternalStore(subscribe, () => {
    if (dismissedInMemory.has(key)) return false
    try { return localStorage.getItem(key) !== 'dismissed' } catch { return true }
  }, () => false)
  if (!visible) return null
  return <aside className="workspace-hint" aria-label="Monkey Method">
    <BananaIcon /><p><strong>Monkey Method</strong>{children}</p>
    <button type="button" aria-label={`Dismiss ${id} hint`} onClick={() => {
      dismissedInMemory.add(key)
      try { localStorage.setItem(key, 'dismissed') } catch { /* Session dismissal still works. */ }
      window.dispatchEvent(new Event(event))
    }}>Got it</button>
  </aside>
}
