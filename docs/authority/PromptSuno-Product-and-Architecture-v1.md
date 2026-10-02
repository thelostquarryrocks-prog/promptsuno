# PromptSuno Product and Architecture v1
Status: CURRENT / AUTHORITATIVE
Effective: 2026-09-27

## Product definition

PromptSuno is a mobile-first creative companion for people using Suno.

It is not a conventional wiki and should not become a generic form-based prompt generator.

The product is organized around:
- LEARN
- BUILD
- FIX

The strongest differentiator is that advanced musical intent, evidence-backed guidance, and troubleshooting are presented through direct interactive workflows rather than documentation-first navigation.

## Experience identity

Retain:
- monkey mascot system
- Monkey Methods contextual teaching interactions
- tactile musical interaction
- dark studio / neon sound identity
- yellow + spectrum-gradient visual language where still appropriate
- strong mobile-first behavior

Monkey Methods should feel like optional, contextual coaching rather than modal onboarding.

## BUILD — Sound Brain

Sound Brain is a spatial prompt-building interface.

Users discover musical concepts as floating nodes, drag useful ideas toward the central Brain, and assemble musical intent visually.

Current node taxonomy:
Genre, Mood, Instrument, Vocal, Rhythm, Texture, Production, Structure, Energy, Era.

The production Sound Brain data should come from:
- `suno-style-catalog-v1.json`
- `suno-style-matrix-v1.json`

The catalog provides stable IDs, categories, aliases, provenance, and relationship metadata.

The matrix provides estimated symmetric musical affinity for discovery and UI attraction. It is not a Suno control surface and must never be serialized as fake Suno numeric weighting.

### Core interaction principles

- Visual discovery should remain playful and fast.
- The user should not have to understand the relationship matrix.
- The interface should reveal useful nearby ideas without making compatibility claims absolute.
- Unusual combinations should remain possible.
- The Brain should preserve what the user chose rather than silently “correcting” them.

### Compiler handoff

Sound Brain should ultimately produce structured musical intent:

```json
{
  "nodes": [
    {
      "node_id": "genre-cinematic",
      "label": "Cinematic",
      "category": "genre"
    }
  ],
  "relationship_notes": "Piano is foreground while synths remain distant."
}
```

The final Styles prompt is a rendering of intent, not the authoritative project state.

## Shared Song Intent

Long-term architecture should move toward a shared structured Song Intent object.

The important distinction:

Structured intent = project state.
Rendered prompt text = one output representation.

This lets multiple tools operate on the same meaning without repeatedly re-interpreting a flattened text prompt.

Future consumers:
- Sound Brain
- Lyrics Studio
- Prompt Doctor
- Prompt Explainer
- saved projects/history
- variants
- Learn explanations
- comparison workflows

Do not build the entire shared model during a narrow bridge task.

## LLM compiler

The current compiler is a constrained writer, not a Suno simulator.

It should:
- preserve every selected concept
- express relationships rather than concatenate labels
- preserve unusual combinations
- ask clarification only where necessary
- keep uncertainty explicit
- output strict structured JSON
- avoid hidden-mechanism claims

It should not:
- make fake numeric weights
- invent command syntax
- add unrequested instruments
- invent BPM/key/meter
- treat emotion as deterministic arrangement/tempo
- silently choose winners in unresolved contradictions
- claim that the candidate was applied, saved, or validated on audio

## LEARN

LEARN should make research useful without exposing users to research complexity.

Use:
- contextual Monkey Methods
- concise explainers
- evidence labels where valuable
- examples
- experiment-backed guidance
- mythbusting
- progressive disclosure

Do not turn LEARN into a traditional encyclopedia hierarchy by default.

## FIX — Prompt Doctor

Prompt Doctor is a diagnostic workflow.

Primary principles:
- diagnose the bounded problem
- capture only relevant context
- preserve original work
- propose reversible changes
- separate observed symptoms from hypothesized causes
- prefer the lowest-risk useful next step
- connect back to Build or Learn when appropriate

## Future Lyrics Studio

Lyrics Studio remains separate from Sound Brain but should eventually share Song Intent.

Possible starts:
- Start fresh
- Use my Sound Brain
- Use an existing style prompt

Avoid making Lyrics Studio a second generic chat box.

## Research architecture

Research is an internal product advantage.

Primary migrated research sources:
- SunoV6-Source-of-Truth.pdf
- SunoV6-Research-Knowledge-Base.json
- SunoV6-YouTube-Audiovisual-Evidence-Supplement-v1.pdf
- SunoV6-YouTube-Evidence-Delta-v1.json
- SunoV6.wiki - Source of Truth Audit v1

Use them as evidence sources, not product-direction authorities.

## Visual migration boundary

Current PromptSuno may reuse approved visual language and mascot assets from SunoV6.wiki, but old product-name wordmarks should not automatically become PromptSuno branding.

Safe to retain:
- mascot identity/poses
- Monkey Methods motif
- LEARN / BUILD / FIX icon language
- yellow / dark / spectrum palette direction
- neutral soundwave/banana/book/wrench artwork
- approved interaction-art style

Re-evaluate:
- `SunoV6.wiki` wordmarks
- old `v6` primary product mark
- homepage-specific composite art
- old route-specific graphics
- artwork containing obsolete product copy
