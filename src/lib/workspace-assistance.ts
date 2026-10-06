import { hasExactKeys, isRecord, type SelectedNode } from './compiler-contract'
import type { WorkspaceDraftV1, WorkspaceProposal } from './workspace-draft'

export type AssistRequest = {
  action: 'lyrics' | 'doctor'; nodes: SelectedNode[]; relationship_notes: string; styles: string
  sections: { id: string; title: string; text: string }[]; lyricNotes: string
  preservationGoals: WorkspaceDraftV1['preservationGoals']; reportedProblem: string; symptom: string
  targetId: string | null; instruction: string
}
export type AssistResponse = {
  observations: string[]; hypotheses: string[]
  proposals: Pick<WorkspaceProposal, 'target' | 'targetId' | 'before' | 'after' | 'rationale'>[]
}
const fail = (): never => { throw new Error('Invalid assistance data') }
const text = (v: unknown, max = 16_000): v is string => typeof v === 'string' && v.length <= max
const id = (v: unknown): v is string => text(v, 128) && v.length > 0
const record = (v: unknown, keys: string[]): v is Record<string, unknown> => isRecord(v) && hasExactKeys(v, keys)
const list = (v: unknown, max: number): v is unknown[] => Array.isArray(v) && v.length <= max

export function parseAssistRequest(value: unknown): AssistRequest {
  if (!record(value, ['action', 'nodes', 'relationship_notes', 'styles', 'sections', 'lyricNotes', 'preservationGoals', 'reportedProblem', 'symptom', 'targetId', 'instruction'])
    || !['lyrics', 'doctor'].includes(value.action as string) || !list(value.nodes, 2_000)
    || !['relationship_notes', 'styles', 'lyricNotes', 'reportedProblem', 'symptom', 'instruction'].every(key => text(value[key]))
    || !list(value.sections, 100) || !list(value.preservationGoals, 200) || !(value.targetId === null || id(value.targetId))) return fail()
  const nodes = new Set<string>()
  for (const n of value.nodes) {
    if (!record(n, ['node_id', 'label', 'category']) || !id(n.node_id) || nodes.has(n.node_id) || !text(n.label, 512) || !text(n.category, 128)) return fail()
    nodes.add(n.node_id)
  }
  const sections = new Set<string>()
  for (const s of value.sections) {
    if (!record(s, ['id', 'title', 'text']) || !id(s.id) || sections.has(s.id) || !text(s.title, 160) || !text(s.text)) return fail()
    sections.add(s.id)
  }
  if ((value.targetId !== null && !sections.has(value.targetId as string)) || (value.action === 'lyrics' && value.targetId === null)) return fail()
  const goals = new Set<string>()
  for (const g of value.preservationGoals) {
    if (!record(g, ['id', 'scope', 'targetId', 'text']) || !id(g.id) || goals.has(g.id)
      || !['section', 'phrase', 'note'].includes(g.scope as string) || !text(g.text, 8_000)
      || !(g.targetId === null || (id(g.targetId) && sections.has(g.targetId)))
      || (g.scope === 'section' && g.targetId === null) || (g.scope === 'phrase' && !g.text)) return fail()
    goals.add(g.id)
  }
  return value as AssistRequest
}

export function buildAssistRequest(draft: WorkspaceDraftV1, action: AssistRequest['action'], targetId: string | null, instruction: string): AssistRequest {
  // Explicit projection keeps account, project, revision and storage metadata local.
  return parseAssistRequest({ action, nodes: draft.styleIntent.selectedNodes.map(n => ({ ...n })),
    relationship_notes: draft.styleIntent.relationshipNotes, styles: draft.styleIntent.compiledStyles,
    sections: draft.lyrics.sections.map(s => ({ ...s })), lyricNotes: draft.lyrics.lyricNotes,
    preservationGoals: draft.preservationGoals.map(g => ({ ...g })), reportedProblem: draft.doctor.reportedProblem,
    symptom: draft.doctor.symptom, targetId, instruction })
}

const occurrences = (source: string, phrase: string) => source.split(phrase).length - 1
export function parseAssistResponse(value: unknown, request: AssistRequest): AssistResponse {
  parseAssistRequest(request)
  if (!record(value, ['observations', 'hypotheses', 'proposals']) || !list(value.observations, 6)
    || !list(value.hypotheses, 6) || !list(value.proposals, 3)
    || ![...value.observations, ...value.hypotheses].every(v => text(v, 1_000) && v.trim())) return fail()
  const targets = new Set<string>()
  for (const p of value.proposals) {
    if (!record(p, ['target', 'targetId', 'before', 'after', 'rationale']) || !text(p.before) || !text(p.after, 8_000)
      || !text(p.rationale, 1_000) || !p.rationale.trim() || p.before === p.after || !p.after.trim()) return fail()
    let before: string
    if (p.target === 'lyricsSection') {
      const section = request.sections.find(s => s.id === p.targetId)
      if (!section || (request.action === 'lyrics' && p.targetId !== request.targetId)) return fail()
      before = section.text
    } else if (request.action === 'doctor' && p.targetId === null && (p.target === 'relationshipNotes' || p.target === 'compiledStyles')) {
      before = p.target === 'relationshipNotes' ? request.relationship_notes : request.styles
    } else return fail()
    const key = `${p.target}:${p.targetId}`
    if (before !== p.before || targets.has(key)) return fail()
    targets.add(key)
    for (const g of request.preservationGoals) {
      if (g.scope === 'section' && p.target === 'lyricsSection' && p.targetId === g.targetId) return fail()
      if (g.scope === 'phrase' && (g.targetId === null || (p.target === 'lyricsSection' && p.targetId === g.targetId))
        && occurrences(p.after, g.text) < occurrences(before, g.text)) return fail()
    }
  }
  return value as AssistResponse
}
