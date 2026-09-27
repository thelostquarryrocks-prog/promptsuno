# PromptSuno Research Baseline v1

Status: selectively migrated from SunoV6.wiki research
Migration date: 2026-09-27
Legacy evidence cutoff: 2026-09-13

## Purpose

This document carries forward the strongest research principles and product-safe findings from the SunoV6.wiki research program without carrying forward its old product architecture.

It is not a full copy of the legacy Source of Truth.

## Core evidence position

The legacy research supports useful controls, careful troubleshooting, and an experiment program. It does not support treating Suno V6 prompting as a deterministic language with guaranteed acoustic outcomes.

PromptSuno should preserve this distinction:

- a documented interface feature is not proof of reliable acoustic behavior
- a community technique is not a hidden parser rule
- repeated anecdotes are not controlled evidence
- absence of validation is not proof of zero effect

## Evidence classes

Use evidence classes independently from confidence.

- OFFICIAL — attributable Suno feature, policy, description, or technical statement; does not certify every claimed outcome
- STRONGLY SUPPORTED — genuinely convergent, independent, reproducible evidence appropriate to the claim
- COMMUNITY-TESTED — a bounded community test with documented controls and limitations
- EXPERIMENTAL — plausible technique or product inference that still needs validation
- ANECDOTAL — bounded creator report or preference without sufficient independent verification
- DISPUTED / UNKNOWN — conflicting, absent, insufficient, or materially unverified evidence

Track claim kind separately where useful, e.g. `suno_feature`, `suno_behavior`, `workflow`, `documentation_state`, `research_method`, `product_inference`.

## Product-safe findings to retain

### 1. Track structured generation context

A final prompt string alone is not enough to explain a result.

Future PromptSuno project state should be capable of representing the relevant generation context separately from rendered prompt text.

This supports the long-term Song Intent direction, but does not require building the full model during the current compiler-bridge task.

### 2. Preserve user intent rather than invent parser rules

There is no established universal genre-first or first-N-words weighting rule in the migrated evidence.

Product behavior:
- order text for readability and clarity
- preserve explicit user intent when rearranging
- do not present ordering heuristics as hidden Suno mechanics

### 3. Do not impose an invented optimal prompt length

The migrated evidence does not establish a universal optimal V6 prompt length.

Product behavior:
- show actual limits/counts when those limits are documented and current
- avoid arbitrary “ideal length” enforcement
- let the compiler use as much text as needed to express the supplied intent cleanly

### 4. Do not fake numeric weighting

Numeric forms such as `(guitar:1.4)` are not validated native V6 control syntax in the migrated evidence.

Product behavior:
- relationship strength in Sound Brain is internal product guidance
- never serialize matrix strength into fake numeric Suno syntax
- keep explicit weighting experiments in research/experiment contexts unless evidence changes

### 5. Treat structural labels as soft controls unless evidence improves

Section labels and similar structures can be useful organizational conventions, but migrated evidence does not justify presenting bracket labels as deterministic commands.

Product behavior:
- use soft-control wording
- do not promise compliance
- distinguish structure requested by the user from hidden-command claims

### 6. Build around diagnosis and retained work

The strongest legacy product translation was not “more tags.” It was:
- identify what missed
- preserve what worked
- compare revisions
- keep transformations reversible
- choose the appropriate next action

This directly supports Prompt Doctor and future saved-project/history systems.

## Audiovisual supplement carry-forward

The later audiovisual supplement did not establish a new strongly supported acoustic technique merely because a behavior appeared repeatedly in creator videos.

It reinforced these rules:

- repetition on YouTube alone does not upgrade a claim to strong evidence
- older-model demonstrations must not be silently transferred to V6
- metadata-only or incompletely retrieved sources must not be reconstructed as if fully observed
- direct UI/audio testing remains necessary for many unresolved behavioral claims

## Scope limitations

The legacy baseline was captured only days after the V6 launch and explicitly did not perform direct Suno generations, authenticated UI testing, or independent audio-listening evaluation.

Therefore PromptSuno must keep research version-aware and revisit behavior after meaningful model/interface changes.

## What was intentionally NOT migrated as authority

- SunoV6.wiki domain or routing decisions
- old homepage architecture
- legacy launch sequencing
- old repository assumptions
- old backlog priority
- any claim that the legacy research itself proved deterministic prompt grammar

## Legacy sources used for this selective migration

- `SunoV6-Source-of-Truth.md / PDF` — Research Edition 1.0
- `SunoV6.wiki - Source of Truth Audit v1`
- `SunoV6-YouTube-Audiovisual-Evidence-Supplement-v1`

The complete legacy sources remain historical research references. This document is the compact PromptSuno-facing baseline.
