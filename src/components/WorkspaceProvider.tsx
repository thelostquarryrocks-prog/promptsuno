'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import type { SelectedNode } from '../lib/compiler-contract'
import { clearWorkspaceDraft, createWorkspaceDraft, readWorkspaceDraft, saveWorkspaceDraft, type WorkspaceDraftV1 } from '../lib/workspace-draft'

type Update = (draft: WorkspaceDraftV1) => WorkspaceDraftV1
type WorkspaceState = {
  draft: WorkspaceDraftV1
  update: (change: Update) => void
  openAccount: (owner: string, keepCurrent: boolean) => boolean
  closeAccount: () => void
  saveStatus: string
  retrySave: () => void
  recoverSave: () => void
}
const Context = createContext<WorkspaceState | null>(null)

export function WorkspaceProvider({ children, catalog }: { children: ReactNode; catalog: SelectedNode[] }) {
  const [draft, setDraft] = useState(createWorkspaceDraft)
  const current = useRef(draft)
  const owner = useRef<string | null>(null)
  const blocked = useRef(false)
  const edited = useRef(false)
  const [saveStatus, setSaveStatus] = useState('Checking local song…')
  const show = useCallback((next: WorkspaceDraftV1) => {
    current.current = next
    setDraft(next)
  }, [])
  const persist = useCallback(() => {
    if (!owner.current || blocked.current) return
    setSaveStatus(saveWorkspaceDraft(owner.current, current.current)
      ? 'Saved in this tab' : 'Not saved — storage is unavailable. Keep this tab open and export your work.')
  }, [])
  const update = useCallback((change: Update) => {
    edited.current = true
    const next = change(current.current)
    show({ ...next, project: { ...next.project, updatedAt: new Date().toISOString() } })
    persist()
  }, [persist, show])
  const openAccount = useCallback((account: string, keepCurrent: boolean) => {
    if (owner.current === account) return false
    keepCurrent = keepCurrent || edited.current
    if (owner.current !== null) { show(createWorkspaceDraft()); keepCurrent = false; edited.current = false }
    owner.current = account
    const stored = readWorkspaceDraft(account, catalog)
    blocked.current = stored.status === 'corrupt' || stored.status === 'unavailable'
    if (stored.status === 'corrupt') {
      setSaveStatus('Saved song could not be read. Its stored copy is untouched; export your current work before recovery.')
      return false
    }
    if (stored.status === 'unavailable') {
      setSaveStatus('Not saved — storage is unavailable. Keep this tab open and export your work.')
      return false
    }
    if (stored.status === 'ready' && stored.draft && !keepCurrent) {
      show(stored.draft)
      setSaveStatus('Saved in this tab')
      const saved = stored.draft
      return Boolean(saved.styleIntent.selectedNodes.length || saved.styleIntent.relationshipNotes || saved.styleIntent.compiledStyles
        || saved.lyrics.text || saved.lyrics.sections.length || saved.lyrics.lyricNotes || saved.preservationGoals.length
        || saved.doctor.reportedProblem || saved.project.title !== 'Untitled song')
    }
    if (stored.status === 'ready' && keepCurrent) {
      blocked.current = true
      setSaveStatus('Saved copy found — current edits have not replaced it. Export this song, then reload to restore the saved copy or explicitly replace it.')
      return true
    }
    persist()
    return false
  }, [catalog, persist, show])
  const closeAccount = useCallback(() => {
    if (owner.current) clearWorkspaceDraft(owner.current)
    owner.current = null
    blocked.current = false
    edited.current = false
    show(createWorkspaceDraft())
    setSaveStatus('Sign in to autosave this song')
  }, [show])
  const retrySave = useCallback(() => {
    if (!owner.current) return
    const stored = readWorkspaceDraft(owner.current, catalog)
    if (stored.status === 'corrupt') return
    if (blocked.current && stored.status === 'ready') {
      setSaveStatus('Saved copy found — current edits have not replaced it. Export this song, then reload to restore the saved copy or explicitly replace it.')
      return
    }
    blocked.current = false
    persist()
  }, [catalog, persist])
  const recoverSave = useCallback(() => {
    if (!owner.current) return
    const saved = saveWorkspaceDraft(owner.current, current.current, { overwriteCorrupt: true })
    blocked.current = !saved
    setSaveStatus(saved ? 'Saved in this tab' : 'Not saved — storage is unavailable. Keep this tab open and export your work.')
  }, [])
  return <Context.Provider value={{ draft, update, openAccount, closeAccount, saveStatus, retrySave, recoverSave }}>{children}</Context.Provider>
}

export function useWorkspace() {
  const context = useContext(Context)
  if (!context) throw new Error('Workspace provider is required')
  return context
}
