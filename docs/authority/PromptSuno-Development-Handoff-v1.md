# PromptSuno Development Handoff v1
Status: CURRENT IMPLEMENTATION HANDOFF
Date: 2026-09-27

## Repository

Canonical repository:
`thelostquarryrocks-prog/promptsuno`

Canonical implementation branch:
`main`

Baseline inspected on 2026-09-27:
`1a919abd3591a9136b47582a1ef7d4bf3e2d36ad`

Treat repository code as authority for actual implementation state.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Three.js
- @react-three/fiber
- @react-three/drei
- OpenAI SDK
- PWA support
- Supabase authentication infrastructure

## Current major implementation

### SoundBrainCanvas

File:
`src/components/SoundBrainCanvas.tsx`

Current behavior includes:
- nodes spawning around Z=-20
- forward flow toward camera
- relationship-based attraction
- direct 3D dragging/raycasting
- bullet-time Z freeze during drag
- related-node glow/pull behavior
- unrelated-node dimming
- category-specific colors
- central BrainOrb
- node consumption animation
- shrink/plump/flare/settle animation state
- dynamic blended Brain color
- Brain growth capped around 10 selected nodes

Physics/animation intentionally run primarily through refs/useFrame rather than React state.

Do not casually rewrite this architecture.

### LLM compiler API

File:
`src/app/api/generate/route.ts`

Current model:
`gpt-5.6-luna`

Role:
Compile structured musical intent into a concise professional Suno Styles prompt.

The route already includes strong safeguards against:
- fake numeric weighting
- invented deterministic Suno grammar
- fake bracket commands
- invented BPM/key/meter
- hidden-parser claims
- lyrics rewriting
- invented hidden model behavior

Current structured response concepts:
- version
- status
- styles
- coverage
- interpretations
- questions

Status:
- ready
- needs_clarification

Coverage is intended to preserve exact node identities.

## Current integration gap

`SoundBrainCanvas` owns its selected/collected tags internally.

`src/app/workspace/page.tsx` separately owns compiler/fetch logic and a `currentTags` state.

The workspace currently mounts the SoundBrain without a selection bridge, so the actual collected nodes do not populate the state used for compilation.

This is the next implementation problem AFTER the PromptSuno project migration/setup is complete.

## Preferred next architecture

SoundBrainCanvas owns:
- graphical interaction
- physics
- selection behavior

Workspace owns:
- structured selected nodes
- relationship notes
- compile action
- loading/error state
- clarification
- generated output
- copy/export

Do not move API orchestration into the Three.js component.

## Structured selected node

Use stable records:

```ts
type SelectedNode = {
  node_id: string
  label: string
  category: string
}
```

Use the catalog's stable IDs where possible.

## New Sound Brain data assets

Current product-data sources created 2026-09-27:

- `suno-style-catalog-v1.json`
- `suno-style-matrix-v1.json`

The catalog covers:
- Genre
- Mood
- Instrument
- Vocal
- Rhythm
- Texture
- Production
- Structure
- Energy
- Era

The catalog explicitly states that UI categories are organizational rather than mutually exclusive musical laws.

The matrix uses `default_weight: 0.20`.

Relationship weights mean estimated musical affinity for tag discovery and relative attraction. They are not probabilities, popularity, Suno parameters, measured co-occurrence, embedding similarity, or audio-quality scores.

Missing explicit pairs are unscored and fall back to the default; missing does not mean measured incompatibility.

## Gemini handoff integration

The earlier Gemini handoff correctly captured the existing flow-field, BrainOrb, and constrained compiler.

One architectural correction for current PromptSuno direction:

Do NOT put the compile/fetch orchestration into `SoundBrainCanvas.tsx`.

Keep the canvas focused on interaction and emit structured selections upward. Workspace should own orchestration.

## Immediate post-migration task

Build:

Sound Brain
→ structured selected nodes
→ relationship notes
→ LLM compiler
→ clarification if needed
→ generated Styles prompt
→ copy/export

Do not expand this task into:
- full Song Intent implementation
- Lyrics Studio
- Prompt Doctor
- saved projects/history
- premium gating redesign
- broad Three.js refactor
