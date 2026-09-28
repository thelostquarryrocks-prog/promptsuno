export type SelectedNode = {
  node_id: string
  label: string
  category: string
}

export type CompilerInput = {
  nodes: SelectedNode[]
  relationship_notes: string
}

// Discovery is visual guidance only; it is never part of CompilerInput.
export type DiscoveryAffinities = Record<string, Record<string, number>>

export type CompilerOutput = {
  version: string
  status: 'ready' | 'needs_clarification'
  styles: string
  coverage: { node_id: string; status: 'preserved' | 'unresolved' }[]
  interpretations: string[]
  questions: string[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => key in value)
}

export function parseCompilerOutput(value: unknown, nodes: SelectedNode[]): CompilerOutput {
  const fail = () => { throw new Error('The compiler returned an invalid result. Please try again.') }
  if (!isRecord(value) || !hasExactKeys(value, ['version', 'status', 'styles', 'coverage', 'interpretations', 'questions'])) return fail()
  if (value.version !== '1.0.0' || typeof value.styles !== 'string') return fail()
  if (value.status !== 'ready' && value.status !== 'needs_clarification') return fail()
  if (!Array.isArray(value.coverage) || value.coverage.length !== nodes.length) return fail()
  if (!Array.isArray(value.interpretations) || value.interpretations.length > 3 || !value.interpretations.every(item => typeof item === 'string')) return fail()
  if (!Array.isArray(value.questions) || !value.questions.every(item => typeof item === 'string' && item.trim().length > 0)) return fail()

  const expectedIds = new Set(nodes.map(node => node.node_id))
  const seenIds = new Set<string>()
  for (const item of value.coverage) {
    if (!isRecord(item) || !hasExactKeys(item, ['node_id', 'status'])) return fail()
    if (typeof item.node_id !== 'string' || !expectedIds.has(item.node_id) || seenIds.has(item.node_id)) return fail()
    if (item.status !== 'preserved' && item.status !== 'unresolved') return fail()
    if (value.status === 'ready' && item.status !== 'preserved') return fail()
    seenIds.add(item.node_id)
  }
  if (value.status === 'ready' && (!value.styles.trim() || value.questions.length !== 0)) return fail()
  if (value.status === 'needs_clarification' && (value.styles !== '' || value.questions.length < 1 || value.questions.length > 2)) return fail()
  return value as CompilerOutput
}
