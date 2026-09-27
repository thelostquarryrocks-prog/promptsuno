# PromptSuno Implementation Baseline

Baseline commit: `1a919abd3591a9136b47582a1ef7d4bf3e2d36ad`
Captured: 2026-09-27

## Stack

- Next.js 16.3.6 App Router
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- Three.js 0.186.1
- @react-three/fiber 9.8.1
- @react-three/drei 10.7.9
- OpenAI SDK 7.23.0
- Supabase auth infrastructure
- PWA package present

## Current repository state

The repository is an early foundational build.

Important implementation files:

- `src/components/SoundBrainCanvas.tsx`
- `src/app/workspace/page.tsx`
- `src/app/api/generate/route.ts`
- `src/components/TagCollectorCanvas.tsx`
- `src/lib/supabase/*`

The public asset directory currently contains only default starter SVGs. No migrated PromptSuno mascot/brand asset pack is present yet.

The root README is still the default Create Next App README before this documentation branch.

## Sound Brain

Already implemented:

- WebGL node environment
- node flow from depth toward camera
- relationship matrix
- direct 3D drag/raycast interaction
- drag-time motion slowdown
- related-node attraction
- unrelated-node dimming
- category color treatment
- central BrainOrb
- node-consumption animation
- dynamic color blending
- growth based on collected tags
- local removable collected-tag chips

Performance-sensitive animation/physics uses refs and `useFrame`. Do not casually rewrite that architecture.

## Compiler API

`src/app/api/generate/route.ts` already calls `gpt-5.6-luna`.

The API is designed as a constrained musical-intent compiler, not a tag concatenator. It already guards against fake weighting, invented grammar, unsupported BPM/key/meter, hidden-parser claims, lyrics rewriting, and invented Suno behavior.

It returns structured JSON with:

- version
- status
- styles
- coverage
- interpretations
- questions

## Confirmed bridge defect

`SoundBrainCanvas` currently owns `collectedTags` internally.

`workspace/page.tsx` separately owns `currentTags` and compile/fetch logic.

The workspace renders `<SoundBrainCanvas />` without a selection callback, so `currentTags` remains empty and the Generate button cannot represent the actual collected node state.

This is the immediate integration gap.

## Immediate implementation target

Build the path:

Sound Brain
→ structured selected nodes
→ relationship notes
→ compiler request
→ clarification if needed
→ generated Styles prompt
→ copy/export

Do not expand this work into the full future Song Intent system yet.
