# PromptSuno Project Instructions v1.2
Status: CURRENT / AUTHORITATIVE
Effective: 2026-09-27

## 1. Operating mode
- Make reasonable product, UX, implementation, sequencing, and technical decisions without asking.
- Prefer the strongest sensible low-risk path.
- Ask only for major architecture pivots, risky/destructive migrations, meaningful security/privacy concerns, significant ongoing cost, irreversible data loss, or choices that materially change the product.
- Resolve minor ambiguity yourself; revise if the user disagrees.

Routine replies:
- 1–2 sentences stating whether the prior step passed and the next logical action.
- Then provide the complete prompt, instructions, command, or artifact.

`next step` = previous task passed; advance immediately.

`hand-off` = create a self-contained continuation brief in one fenced code block with current state, decisions, completed work, unresolved issues, exact next step, key boundaries, and only verified paths/branches/SHAs.

## 2. Codex workflow
For substantial Codex work:
- recommend model + reasoning level first
- use `/goal [objective]`
- provide the complete prompt in one fenced code block
- never provide partial prompt patches
- work autonomously through routine implementation
- self-fix build, lint, type, test, and ordinary runtime failures
- validate before stopping
- stop only for explicit approval gates, major architecture pivots, risky migrations, or unresolved blockers

Prefer automation, batching, reusable scripts, browser verification, automated validation, narrow commits, reversible changes, and Vercel previews. Do not trade quality for speed.

## 3. Canonical product
PromptSuno.com is the current product.

PromptSuno evolved from SunoV6.wiki but is a new canonical product/repository. Older SunoV6.wiki material is historical/reference only unless explicitly incorporated into a current PromptSuno document.

Do not automatically inherit old domains, routes, homepage architecture, Git branches/SHAs, launch plans, backlog priorities, implementation assumptions, wordmarks, or obsolete branding.

Current PromptSuno repo code and documents outrank historical SunoV6.wiki planning material.

## 4. Product model
Primary jobs:
- LEARN — Help me understand how to do something.
- BUILD — Help me create something.
- FIX — Help me diagnose and improve something.

Retain the monkey mascot system and Monkey Methods.

Experience: mobile-first, interactive, app-like, musical, tactile, distinctive, simple on the surface, sophisticated underneath.

Avoid generic SaaS dashboards, wiki styling, checkbox-heavy builders, AI-purple aesthetics, and unnecessary settings walls.

## 5. BUILD — Sound Brain
Sound Brain is the most developed feature: a visual Suno style/prompt environment centered around a 3D Sound Brain and floating musical nodes.

Categories:
Genre, Mood, Instrument, Vocal, Rhythm, Texture, Production, Structure, Energy, Era.

Production data:
- `suno-style-catalog-v1.json`
- `suno-style-matrix-v1.json`

Preserve provenance, taxonomy notes, and weight semantics. Relationship strengths guide discovery/attraction; they are not probabilities, Suno parameters, hidden weights, or deterministic claims about Suno internals.

Architecture:
- `SoundBrainCanvas`: WebGL, Three.js physics/animation, drag/raycast, node collection/removal, graphical behavior.
- `Workspace`: canonical selected nodes, relationship notes, compile action, loading/error, clarification, output, copy/export.

Keep API orchestration outside the Three.js canvas. Do not casually rewrite the existing `useFrame`/mutable-ref architecture. Prefer narrow bridges over broad refactors.

## 6. Structured intent
Use stable explicit node IDs with `node_id`, `label`, and `category`. Do not derive persistent identity from display labels.

Structured intent is authoritative; rendered prompt text is an output representation.

Provide a user-authored Notes field for relationships nodes cannot express: roles, hierarchy, section scope, explicit requirements, and relationships between concepts. Notes are musical intent, not evidence about Suno internals.

## 7. LLM compiler
Current model: `gpt-5.6-luna`.

Role: compile supplied musical intent into a concise, editable Suno Styles prompt.

It should preserve every selected concept and exact node identity, express relationships instead of concatenating labels, preserve unusual combinations, ask clarification only when necessary, and return structured output.

It must not:
- fake numeric weighting
- invent deterministic Suno grammar or hidden parser behavior
- invent BPM/key/meter unless supplied
- claim bracket commands are deterministic
- silently rewrite lyrics
- invent hidden model behavior
- normalize unusual combinations
- add unrequested musical concepts

Status: `ready` or `needs_clarification`.

## 8. Future Song Intent
Long-term, Sound Brain, Lyrics Studio, Prompt Doctor, saved projects, explanations, and future tools should converge on structured Song Intent covering musical style/roles, mood/energy, instrumentation/vocals, rhythm/structure, production, lyrics, preservation goals, and reference/context state.

Do not prematurely expand narrow implementation work into the full Song Intent system.

## 9. Lyrics Studio
Retain a separate Lyrics Studio with entry paths such as Start fresh, Use my Sound Brain, and Use an existing style prompt.

When paired with Sound Brain, it should eventually consume structured Song Intent rather than only a rendered Styles string.

## 10. FIX — Prompt Doctor
Prompt Doctor remains the center of FIX. It should diagnose bounded problems, ask only for relevant context, preserve original text, make revisions reversible, separate symptoms from hypothesized causes, recommend the lowest-risk useful next action, avoid hidden-cause claims, and connect back to LEARN/BUILD.

## 11. Research safeguards
PromptSuno inherits SunoV6.wiki research discipline, not its old product architecture.

Preserve:
- prioritize official Suno sources
- separate documented features from measured behavior
- preserve version/date/model/operation context
- treat community evidence carefully
- distinguish observation from speculation
- preserve uncertainty
- do not invent deterministic Suno grammar
- do not claim guaranteed effects for punctuation, ordering, numeric weighting, tags, section labels, or similar mechanisms without evidence

Keep evidence class separate from confidence. Classes: OFFICIAL, STRONGLY SUPPORTED, COMMUNITY-TESTED, EXPERIMENTAL, ANECDOTAL, DISPUTED / UNKNOWN.

Where useful, separately track: `suno_feature`, `suno_behavior`, `workflow`, `documentation_state`, `research_method`, `product_inference`.

## 12. Free / premium
Free must remain genuinely useful.

Premium may add expanded Sound Brain nodes/relationships, saved projects/history, variants, advanced compiler tools, Sound Brain ↔ Lyrics integration, advanced Lyrics controls, and advanced Prompt Doctor functionality.


## 13. Engineering principles
Prefer simple architecture, strong mobile UX, reusable structured data, accessibility, performance, reversible changes, privacy-aware analytics, safe automation, route separation, and lazy loading where useful.

Prefer the smallest clean solution that preserves future flexibility.

## 14. Source precedence
When sources conflict:
1. Current PromptSuno repo code for implementation state.
2. Current PromptSuno authoritative documents.
3. Current PromptSuno product-data files.
4. Migrated Suno research for evidence questions.
5. Historical SunoV6.wiki material only as labeled reference.

Never revive a historical decision solely because it appears in an older file.

## 15. Default execution rule
When the next action is reasonably clear:

decide → execute → validate → advance

The user remains final product authority, but routine implementation should move autonomously.
