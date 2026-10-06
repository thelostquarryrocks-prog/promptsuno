import { hasExactKeys, isRecord, parseCompilerOutput, type CompilerOutput, type SelectedNode } from './compiler-contract'

export type WorkspaceMode = 'brain' | 'lyrics' | 'doctor'
export type WorkspaceProposal = {
  id: string; source: 'user' | 'assistant'; target: 'relationshipNotes' | 'compiledStyles' | 'lyricsSection'
  targetId: string | null; before: string; after: string; rationale: string
  status: 'pending' | 'applied' | 'rejected' | 'reverted'; createdAt: string
}
export type WorkspaceRevision = {
  id: string; proposalId: string; target: WorkspaceProposal['target']; targetId: string | null
  before: string; after: string; createdAt: string
  compilerBefore: { compiledStyles: string; compilerResult: CompilerOutput | null } | null
}
export type WorkspaceDraftV1 = {
  version: 1
  project: { id: string; title: string; createdAt: string; updatedAt: string }
  mode: WorkspaceMode
  styleIntent: { selectedNodes: SelectedNode[]; relationshipNotes: string; compiledStyles: string; compilerResult: CompilerOutput | null }
  lyrics: { text: string; sections: { id: string; title: string; text: string }[]; lyricNotes: string }
  preservationGoals: { id: string; scope: 'section' | 'phrase' | 'note'; targetId: string | null; text: string }[]
  doctor: { reportedProblem: string; symptom: string; hypotheses: string[]; proposedChanges: WorkspaceProposal[] }
  revisions: WorkspaceRevision[]
}

// Tab-local by design: refresh survives without allowing another tab to silently
// replace this song. Authentication, not this storage key, authorizes the app.
export function workspaceStorageKey(owner: string): string {
  return `promptsuno:workspace:v1:${encodeURIComponent(owner)}`
}

export function createWorkspaceDraft(): WorkspaceDraftV1 {
  const now = new Date().toISOString()
  return {
    version: 1,
    project: { id: crypto.randomUUID(), title: 'Untitled song', createdAt: now, updatedAt: now },
    mode: 'brain',
    styleIntent: { selectedNodes: [], relationshipNotes: '', compiledStyles: '', compilerResult: null },
    lyrics: { text: '', sections: [], lyricNotes: '' },
    preservationGoals: [],
    doctor: { reportedProblem: '', symptom: '', hypotheses: [], proposedChanges: [] },
    revisions: [],
  }
}

const MAX_SERIALIZED_LENGTH = 1_000_000
const text = (value: unknown, max = 64_000): value is string => typeof value === 'string' && value.length <= max
const id = (value: unknown): value is string => text(value, 128) && value.length > 0
const ownerValid = (owner: unknown): owner is string => id(owner)
const timestamp = (value: unknown) => text(value, 40) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))
const record = (value: unknown, keys: string[]): value is Record<string, unknown> => isRecord(value) && hasExactKeys(value, keys)
const list = (value: unknown, max: number): value is unknown[] => Array.isArray(value) && value.length <= max
function validTarget(target: unknown, targetId: unknown): boolean {
  return target === 'lyricsSection' ? id(targetId) : (target === 'relationshipNotes' || target === 'compiledStyles') && targetId === null
}

function parseDraft(raw: string, catalog?: SelectedNode[]): WorkspaceDraftV1 {
  if (raw.length > MAX_SERIALIZED_LENGTH) throw new Error('Invalid draft')
  const value: unknown = JSON.parse(raw)
  const fail = (): never => { throw new Error('Invalid draft') }
  if (!record(value, ['version', 'project', 'mode', 'styleIntent', 'lyrics', 'preservationGoals', 'doctor', 'revisions']) || value.version !== 1) return fail()
  const { project, styleIntent: style, lyrics, doctor } = value
  if (!record(project, ['id', 'title', 'createdAt', 'updatedAt']) || !id(project.id) || !text(project.title, 160)
    || !timestamp(project.createdAt) || !timestamp(project.updatedAt)) return fail()
  if (!['brain', 'lyrics', 'doctor'].includes(value.mode as string)) return fail()
  if (!record(style, ['selectedNodes', 'relationshipNotes', 'compiledStyles', 'compilerResult'])
    || !list(style.selectedNodes, 2_000) || !text(style.relationshipNotes) || !text(style.compiledStyles)) return fail()
  const byId = catalog ? new Map(catalog.map(node => [node.node_id, node])) : null
  const selected: SelectedNode[] = []
  const seen = new Set<string>()
  for (const node of style.selectedNodes) {
    if (!record(node, ['node_id', 'label', 'category']) || !id(node.node_id) || !text(node.label, 512) || !text(node.category, 128) || seen.has(node.node_id)) return fail()
    const canonical = byId?.get(node.node_id)
    if (byId && (!canonical || node.label !== canonical.label || node.category !== canonical.category)) return fail()
    seen.add(node.node_id)
    selected.push(node as SelectedNode)
  }
  if (style.compilerResult !== null) {
    const result = parseCompilerOutput(style.compilerResult, selected)
    if (!text(result.styles) || !result.interpretations.every(item => text(item, 8_000)) || !result.questions.every(item => text(item, 8_000))) return fail()
  }
  if (!record(lyrics, ['text', 'sections', 'lyricNotes']) || !text(lyrics.text) || !text(lyrics.lyricNotes) || !list(lyrics.sections, 100)) return fail()
  const sections = new Set<string>()
  for (const section of lyrics.sections) {
    if (!record(section, ['id', 'title', 'text']) || !id(section.id) || sections.has(section.id) || !text(section.title, 160) || !text(section.text)) return fail()
    sections.add(section.id)
  }
  if (!list(value.preservationGoals, 200)) return fail()
  const goals = new Set<string>()
  for (const goal of value.preservationGoals) {
    if (!record(goal, ['id', 'scope', 'targetId', 'text']) || !id(goal.id) || goals.has(goal.id)
      || !['section', 'phrase', 'note'].includes(goal.scope as string) || !(goal.targetId === null || id(goal.targetId)) || !text(goal.text, 8_000)) return fail()
    if (goal.scope === 'section' && (typeof goal.targetId !== 'string' || !sections.has(goal.targetId))) return fail()
    goals.add(goal.id)
  }
  if (!record(doctor, ['reportedProblem', 'symptom', 'hypotheses', 'proposedChanges']) || !text(doctor.reportedProblem)
    || !text(doctor.symptom, 8_000) || !list(doctor.hypotheses, 30) || !doctor.hypotheses.every(item => text(item, 8_000))
    || !list(doctor.proposedChanges, 20) || !list(value.revisions, 20)) return fail()
  const proposals = new Map<string, WorkspaceProposal>()
  for (const proposal of doctor.proposedChanges) {
    if (!record(proposal, ['id', 'source', 'target', 'targetId', 'before', 'after', 'rationale', 'status', 'createdAt'])
      || !id(proposal.id) || proposals.has(proposal.id) || !['user', 'assistant'].includes(proposal.source as string)
      || !validTarget(proposal.target, proposal.targetId) || !text(proposal.before) || !text(proposal.after) || !text(proposal.rationale, 8_000)
      || !['pending', 'applied', 'rejected', 'reverted'].includes(proposal.status as string) || !timestamp(proposal.createdAt)) return fail()
    proposals.set(proposal.id, proposal as WorkspaceProposal)
  }
  const revisions = new Set<string>()
  const revisedProposals = new Set<string>()
  for (const revision of value.revisions) {
    if (!record(revision, ['id', 'proposalId', 'target', 'targetId', 'before', 'after', 'createdAt', 'compilerBefore'])
      || !id(revision.id) || revisions.has(revision.id) || !id(revision.proposalId) || revisedProposals.has(revision.proposalId)
      || !validTarget(revision.target, revision.targetId) || !text(revision.before) || !text(revision.after) || !timestamp(revision.createdAt)) return fail()
    const proposal = proposals.get(revision.proposalId)
    if (!proposal || !['applied', 'reverted'].includes(proposal.status) || proposal.target !== revision.target || proposal.targetId !== revision.targetId
      || proposal.before !== revision.before || proposal.after !== revision.after) return fail()
    if (revision.target === 'relationshipNotes') {
      if (!record(revision.compilerBefore, ['compiledStyles', 'compilerResult']) || !text(revision.compilerBefore.compiledStyles)) return fail()
      const result = revision.compilerBefore.compilerResult
      if (result !== null) {
        // Historical coverage may refer to earlier node selections.
        if (!isRecord(result) || !list(result.coverage, 2_000)) return fail()
        const historicalNodes = result.coverage.map(item => {
          if (!isRecord(item) || !id(item.node_id)) return fail()
          return { node_id: item.node_id, label: '', category: '' }
        })
        const parsed = parseCompilerOutput(result, historicalNodes)
        if (!text(parsed.styles) || !parsed.interpretations.every(item => text(item, 8_000)) || !parsed.questions.every(item => text(item, 8_000))) return fail()
      }
    } else if (revision.compilerBefore !== null) return fail()
    revisions.add(revision.id)
    revisedProposals.add(revision.proposalId)
  }
  for (const proposal of proposals.values()) {
    if (['applied', 'reverted'].includes(proposal.status) && !revisedProposals.has(proposal.id)) return fail()
  }
  return value as WorkspaceDraftV1
}

export function readWorkspaceDraft(owner: string, nodes: SelectedNode[]): { status: 'empty' | 'ready' | 'corrupt' | 'unavailable'; draft?: WorkspaceDraftV1 } {
  if (!ownerValid(owner)) return { status: 'unavailable' }
  let raw: string | null
  try { raw = window.sessionStorage.getItem(workspaceStorageKey(owner)) } catch { return { status: 'unavailable' } }
  if (raw === null) return { status: 'empty' }
  try { return { status: 'ready', draft: parseDraft(raw, nodes) } } catch { return { status: 'corrupt' } }
}

export function saveWorkspaceDraft(owner: string, draft: WorkspaceDraftV1, options: { overwriteCorrupt?: boolean } = {}): boolean {
  if (!ownerValid(owner)) return false
  try {
    const raw = JSON.stringify(draft)
    parseDraft(raw)
    const storage = window.sessionStorage
    const key = workspaceStorageKey(owner)
    const previous = storage.getItem(key)
    // Recovery is explicit. A newer schema or damaged JSON must not disappear
    // just because an autosave happened after loading this app version.
    if (previous !== null && !options.overwriteCorrupt) parseDraft(previous)
    storage.setItem(key, raw)
    return true
  } catch { return false }
}

export function clearWorkspaceDraft(owner: string): boolean {
  if (!ownerValid(owner)) return false
  try { window.sessionStorage.removeItem(workspaceStorageKey(owner)); return true } catch { return false }
}
