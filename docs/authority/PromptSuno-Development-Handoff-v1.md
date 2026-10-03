Historical as of 3 October 2026. Current state: see README.md and docs/implementation/OPS-LOG.md.
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

## Implementation update — 2026-09-27 selection-to-compiler bridge

The baseline and integration gap above are retained as historical implementation
context. This update supersedes the stated gap and immediate post-migration task
on `codex/sound-brain-compiler-bridge`; it does not claim a merge to `main` or deployment.

- `src/app/workspace/page.tsx` now projects the existing 12 discovery concepts from
  the current catalog and matrix on the server, then mounts `Workspace`.
- `src/components/Workspace.tsx` owns canonical selected records, authored
  relationship notes, compile/fetch, loading/errors, clarification, editable
  Styles output, clipboard feedback, and plain-text export.
- `SoundBrainCanvas` takes controlled selections and reports collection records
  and removal IDs. Three.js physics, drag/raycast, attraction, and BrainOrb
  animation remain in mutable refs and `useFrame`. Keyboard collection shares
  the collection handler. Mobile canvas height and pixel ratio are bounded.
- Selection identity comes directly from catalog `id`, with exact catalog label
  and category. Matrix labels address visual affinity lookup only; affinities
  never enter compiler requests or become Suno prompt weights.
- `/api/generate` accepts `{ nodes, relationship_notes }`, validates unique exact
  catalog records, retains `gpt-5.6-luna` with its supported
  `max_completion_tokens` parameter, and validates exact response coverage.
  Invalid input returns 400, missing backend credentials 503, and provider/contract
  failure 502. Provider error details and credentials are not returned or logged.
- Selection and notes remain intact through loading, errors, and clarification.
  Answer clarification in notes and compile again. Intent edits invalidate a
  previous candidate; editing Styles does not mutate structured selections.
- Catalog/matrix metadata and provenance remain in the canonical source files;
  only the bounded discovery projection reaches the client. The full catalog is
  available for server-side identity validation.

Verification tooling:
`npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`,
and `npm.cmd run test:e2e` (after build). Browser tests use local Supabase fixtures
through the existing login/middleware and controlled compiler responses. They do
not configure real accounts or establish physical-device/Suno-audio acceptance.
Local traces, screenshots, and failure receipts are excluded from commits.

## Implementation update — 2026-09-28 paid compiler authentication

On `codex/paid-compiler-auth`, based exactly on bridge head
`3d44bfdb6ee4e6f44a65faf4c30cea26df58861a`, `/api/generate` now verifies the
cookie session with Supabase Auth `getUser()` before reading input or creating
the model client. The route owns authentication independently of middleware.
Missing, invalid and expired sessions return JSON 401; auth setup/verification
exceptions fail closed with 503. Client user IDs cannot establish identity.

The API accepts JSON from the same browser origin (originless non-browser JSON
requests still require a verified cookie session). Application resource bounds
are 256 KiB of actual request bytes, 16 KiB of UTF-8 relationship notes, and no
more nodes than the catalog contains. These are application safety limits, not
Suno prompt-length rules. Accepted notes, punctuation, whitespace and selected
catalog identities are unchanged. Matrix strengths remain visual-only.

**Hosting is blocked pending approval and implementation of durable cost
controls and real Supabase session acceptance.** No durable limiter or 429 quota
response is implemented. No database migrations, credentials, policies, Vercel
projects or deployments were created. PR #2 and PR #3 are unchanged.

See [Paid-Compiler-Security.md](../implementation/Paid-Compiler-Security.md) for
the security boundary, concrete Supabase limiter proposal, verification evidence
and remaining deployment gates. Earlier bridge evidence remains historical.

## Implementation update — 2026-09-28 atomic compiler quota

On local branch `codex/atomic-compiler-quota`, based on authentication head
`54dd77ff63f0b1a21d176af5f2e6bedf73c60b2e`, the compiler reserves an attempt
through the same verified Supabase session before constructing the paid model
client. `public.reserve_compiler_attempt()` takes no arguments and uses
`auth.uid()`. A private operator-configured policy and one locked row per user
enforce both burst and sustained windows atomically. No privileged database
credential is added. Provider failure retains consumption; retries reserve anew.
Exhaustion returns 429 plus Retry-After; unavailable/missing configuration fails
closed with 503 in every environment. Workspace displays the quota retry delay.

This supersedes the earlier statement that no quota implementation exists on
this successor branch. The migration has NOT been applied remotely. Numerical
allowances remain an operator decision, not a free/premium entitlement. Hosting
remains blocked pending real Supabase verification, migration/configuration approval,
real-account acceptance, operational spend controls and separate deployment
authorization. See [Atomic-Compiler-Quota.md](../implementation/Atomic-Compiler-Quota.md).

Local follow-up verification applied the actual migration to an isolated
disposable PostgreSQL 17.11 cluster: 17 database checks passed, including locking,
rollback, lost connections, ACLs/RLS and deletion. The Auth shim supplies a trusted
subject directly and does not validate real JWTs or exercise PostgREST. This
closes the local SQL execution gate only; the linked report retains actual
receipts, browser results and separate staging/hosting approval requirements.
The final independent full browser suite passed 21/21 with zero retries; final
unit tests passed 95/95, typecheck/build/security scans passed, and lint retained
two existing warnings with zero errors. Earlier failed and aborted receipts are
preserved in that report. These are local fixture results, not hosted acceptance.
