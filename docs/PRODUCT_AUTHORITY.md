# PromptSuno Product Authority

Status: canonical
Effective: 2026-09-27

## Product

PromptSuno.com is the canonical product and repository.

PromptSuno is a mobile-first creative companion for people using Suno, organized around three primary jobs:

- LEARN — understand how to do something.
- BUILD — create something.
- FIX — diagnose and improve something.

SunoV6.wiki is historical/reference material. Its product-direction decisions, routing, homepage architecture, implementation assumptions, Git history, launch plans, and backlog do not automatically carry forward.

Only material explicitly migrated into this repository is authoritative for PromptSuno.

## Experience principles

The product should be mobile-first, highly interactive, app-like, musical, tactile, visually distinctive, simple on the surface, and sophisticated underneath.

Avoid generic SaaS dashboards, generic wiki/documentation styling, checkbox-heavy prompt builders, generic AI-purple aesthetics, and unnecessary settings walls.

Retain the monkey mascot system and Monkey Methods as product concepts, but migrate their actual production assets deliberately rather than assuming old assets are current.

## Product pillars

### BUILD — Sound Brain

Sound Brain is the most developed feature. It is a visual prompt-building environment with a central Brain and musical nodes representing concepts such as genre, mood, instrument, vocal, rhythm, texture, production, structure, energy, and era.

Relationship strengths are product guidance for musical compatibility/context. They are not claims about hidden Suno internals.

### FIX — Prompt Doctor

Prompt Doctor should diagnose bounded problems, preserve original text, make revisions reversible, ask only for relevant context, recommend the lowest-risk useful next action, and avoid claims about hidden causes.

### LEARN

Research-backed teaching should be integrated into the product, especially through contextual Monkey Methods rather than heavy onboarding.

## Near-term architecture rule

SoundBrainCanvas owns graphical interaction, physics, and selection behavior.

Workspace owns structured selected nodes, relationship notes, compile action, loading/error state, clarification, generated output, and copying/export.

API orchestration must not be buried in the Three.js canvas.

## Structured node identity

Persistent node identity must use stable explicit IDs, for example:

```json
{
  "node_id": "genre-cinematic",
  "label": "Cinematic",
  "category": "genre"
}
```

Do not derive persistent identity from display labels at submission time.

## Development rules

Prefer simple architecture, portable systems, strong mobile UX, reusable structured data, accessibility, performance, reversible transformations, privacy-aware analytics, and safe automation.

Do not overengineer.

Repository code plus current PromptSuno source documents outrank assumptions from SunoV6.wiki.
