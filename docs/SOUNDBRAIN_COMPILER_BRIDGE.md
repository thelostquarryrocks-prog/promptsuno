# Sound Brain Compiler Bridge — Implementation Contract

Status: next implementation target

## Goal

Connect the existing Sound Brain interaction to the existing compiler API without moving API orchestration into WebGL code or destabilizing the Three.js interaction architecture.

## Ownership

### SoundBrainCanvas owns

- rendering
- physics/animation
- drag interaction
- node collection/removal behavior
- presentation of collected nodes

### Workspace owns

- canonical selected-node records
- relationship notes
- compile action
- loading/error state
- clarification questions
- generated output
- copy/export

## Required data model

Replace submission-time loose string identity with stable records:

```ts
type SelectedNode = {
  node_id: string
  label: string
  category: string
}
```

Node IDs must be defined alongside node metadata. Do not synthesize them from labels only when submitting.

## Bridge behavior

SoundBrainCanvas should expose selection changes to Workspace through a narrow callback contract.

The callback should report the complete current structured selection after add/remove operations. Workspace should treat that payload as canonical compile input.

Avoid React state updates inside animation frames. Only selection mutations should cross the React boundary.

## Notes

Add a user-authored relationship/context field in Workspace.

Notes can describe foreground/background roles, hierarchy, scope, relationships, and explicit musical requirements. They are musical intent, not claims about Suno internals.

## Compiler request

The request should send structured selected nodes plus relationship notes in a shape compatible with the existing constrained compiler contract.

Do not reduce the request back to a string array.

## Response handling

Workspace must handle both:

- `ready`: render generated `styles`, coverage, and optional interpretations
- `needs_clarification`: render questions and do not pretend a Styles prompt was generated

Preserve exact node IDs in coverage.

## Validation

At minimum verify:

- adding a node updates Workspace state
- removing a node updates Workspace state
- Generate is disabled for zero nodes
- compiler receives structured nodes
- notes are included
- ready response renders/copies styles
- clarification response renders questions
- compiler/network errors are visible and recoverable
- no Three.js animation loop is moved into React state
- lint and production build pass

## Explicit non-goals

- full Song Intent architecture
- saved projects/history
- premium gating redesign
- Lyrics Studio
- Prompt Doctor implementation
- broad Three.js refactor
