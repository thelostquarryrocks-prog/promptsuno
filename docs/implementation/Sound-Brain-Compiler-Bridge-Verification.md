# Sound Brain selection-to-compiler bridge

Verified locally on 2026-09-27 America/New_York (live receipt 2026-09-28 UTC).
Repository: `C:\codex-projects\PromptSuno`, remote
`thelostquarryrocks-prog/promptsuno`.
Branch: `codex/sound-brain-compiler-bridge`.
Original baseline: `1a919abd3591a9136b47582a1ef7d4bf3e2d36ad`.
Foundation commit: `3d39a263c7ac4a602b442d9b39541783954e07ec`.

## Result and scope

Collected catalog records and authored relationship notes now flow from
SoundBrainCanvas through Workspace into the existing `gpt-5.6-luna` compiler.
Workspace owns the canonical selections, requests, loading/errors, clarification,
editable Styles candidate, copy, and text export. The canvas retains Three.js
rendering, mutable animation refs, `useFrame`, drag/raycast, attraction, and gulp
animation. It reports collection/removal events and displays controlled selections.

The discovery pool remains the existing 12 concepts, now resolved by explicit
catalog IDs. Catalog categories replace the old sample mappings. Only a bounded
node/affinity projection reaches the browser; full catalog metadata/provenance
remain in the source data. The full catalog is used for API identity validation.
Matrix affinities affect visual attraction only. Compiler requests contain exactly
`nodes: [{ node_id, label, category }]` and `relationship_notes`; no fake numeric
prompt weights or premium flags are sent.

Loading, errors, and clarification retain all selections and notes. A clarification
answer is authored in notes and submitted with the same nodes. New intent edits
invalidate old output. Output edits preserve structured intent. Errors/questions
are never copyable/exportable as Styles. Keyboard collection and removal share
the same controlled selection path. The mobile canvas height is 360px (desktop
500px), touch dragging disables browser panning within the canvas, and rendering
pixel ratio is capped at 1.5.

No full Song Intent, Lyrics Studio, Prompt Doctor, persistence, premium gating,
deployment, PR, push, or merge was added/performed. The former nonfunctional
Troubleshoot button was removed from the compiler action area.

## Files

Foundation commit preserves these supplied files separately from implementation:

- `docs/authority/PromptSuno-Project-Instructions-v1.2.md`
- `docs/authority/PromptSuno-Product-and-Architecture-v1.md`
- `docs/authority/PromptSuno-Development-Handoff-v1.md`
- `docs/authority/PromptSuno-Migration-Ledger-v1.1.md`
- `docs/authority/PromptSuno-SEO-and-Content-Architecture-v1.md`
- `docs/authority/PromptSuno-Project-File-Manifest-v1.2.md`
- `data/sound-brain/suno-style-catalog-v1.json`
- `data/sound-brain/suno-style-matrix-v1.json`

The canonical JSON files are byte-identical copies of the supplied `(1)` files:
catalog SHA-256 `B6EAC540465385F2540E1B3D97F12B7A1EB050DCB7B94954A27538C17ADA12E2`;
matrix SHA-256 `62846BDE7B24E2CECCFFC0EF9B3BD8B66F6EAA24AE5A7B7AA50BC9022BD29A64`.
Both original `(1)` files and `desktop.ini` remain untouched and untracked.
`AGENTS.md` remains unchanged. The supplied manifest's existing blank line at EOF
was retained in the foundation commit rather than modifying supplied content.

Implementation and verification files:

- `src/app/workspace/page.tsx` — server-side bounded discovery projection.
- `src/components/Workspace.tsx` — canonical intent and compiler/candidate flow.
- `src/components/SoundBrainCanvas.tsx` — controlled selection bridge and accessible collection.
- `src/lib/compiler-contract.ts` — types and strict response/identity coverage validation.
- `src/lib/sound-brain-catalog.ts` — current catalog identity resolver and visual affinity projection.
- `src/app/api/generate/route.ts` — strict input/output, lazy backend SDK initialization, supported token parameter, safe failures.
- `docs/authority/PromptSuno-Development-Handoff-v1.md` — explicit implementation update retaining the baseline history.
- `docs/implementation/Sound-Brain-Compiler-Bridge-Verification.md` — this report.
- `package.json`, `package-lock.json` — test tooling and type/test scripts.
- `.gitignore`, `eslint.config.mjs`, `tsconfig.json` — exclude generated verification evidence from Git/source analysis.
- `vitest.config.ts`, `tests/setup.ts` — focused test runner.
- `tests/compiler-contract.test.ts` — catalog, matrix boundary, exact input, output/coverage validation.
- `tests/generate-route.test.ts` — provider forwarding, model/parameter, invalid input/output, unavailable credentials, safe failure.
- `tests/workspace.test.tsx` — real collection controls, synchronization, notes, request states, copy/export.
- `playwright.config.ts`, `tests/e2e/server.mjs`, `tests/e2e/workspace.spec.ts` — production-preview browser verification with local authentication fixtures.

## Verification

| Command / check | Final result |
| --- | --- |
| `npm.cmd run build` | Successful production build; 8/8 static pages; 0 build warnings, 0 build errors |
| `npm.cmd run lint` | 0 errors, 2 pre-existing unused-variable warnings (`middleware.ts`, Supabase server helper) |
| `npm.cmd run typecheck` | `next typegen` and `tsc --noEmit` successful |
| `npm.cmd test` | 3 files, 46 tests passed; 0 failed, 0 skipped |
| `npm.cmd run test:e2e` | 9 passed; 0 failed, 0 skipped; mobile Chromium, desktop Chromium, mobile WebKit |
| Live Workspace → API → `gpt-5.6-luna` → Workspace | HTTP 200, `ready`, exact 3 IDs and notes, rendered Styles matched returned Styles |
| `git diff --check` | No implementation whitespace errors |
| Client bundle inspection | No catalog provenance/taxonomy/evidence metadata found in `.next/static` JavaScript |

Browser cases exercise actual WebGL rendering and real raycast drag collection,
selection/removal synchronization, unusual combinations, exact outgoing JSON,
loading/disabled controls, HTTP/network/malformed-response errors, clarification
and resubmission, edited copy/export, keyboard removal, and responsive overflow.
Rendered mobile/desktop screenshots were inspected. The main workflow checks
runtime errors and framework overlays; intentional HTTP 502 console messages are
classified as the error-state test, not hidden runtime faults.

Authentication is simulated by a local Supabase HTTP fixture through the existing
login/middleware, without changing application authentication. Compiler responses
are controlled for automated adverse-state tests. Chromium clipboard reads the
native clipboard (Windows CRLF normalized for comparison); mobile WebKit verifies
the clipboard boundary with a stub. All three projects verify actual downloaded
Styles file contents exactly. These checks do not establish physical-device,
real-Supabase-account, or Suno-audio acceptance.

Builds used process-local Supabase fixture values and network access for existing
Google Fonts imports. No environment/credential files were changed. Unit tests
emit an upstream Three.js CommonJS deprecation warning; browser/server tooling
emits a `NO_COLOR`/`FORCE_COLOR` warning. Neither is a build error or application
console error. The deliberate mutable-ref canvas has a documented, file-scoped
React immutability lint exception; unsafe `any` refs and unnecessary type-ignore
comments were removed, and all other source checks remain active.

The full automated browser suite ran against the bridge before the backend token
parameter repair; after that API-only repair, the final production build, all 46
unit/UI/API tests, type/lint checks, and a real browser-to-live-model round trip
were run. No user-visible workflow changed after the successful 9-browser-case run.

## Repairs and retained evidence

- Baseline lint: 15 errors and 4 warnings. Scoped canvas types/initialization and
  the existing API type-ignore were repaired while retaining mutable animation refs.
- Latest Vitest initially conflicted with Node 20 types. Vitest 4.0.0 then failed
  module loading with Vite's `getBuiltins` protocol. Vitest 4.0.18 repaired the runner;
  existing application dependency versions remain locked.
- Development-mode runs had timing/context-teardown failures and an overly broad
  alert selector. Production run 1 had 4 passes/5 failures due to native clipboard
  newline comparison, hydration readiness, and transient canvas bounds. Tests now
  wait for client readiness and canvas bounds, scope application alerts, and compare
  Windows clipboard text with its OS newline normalization. Production run 2 passed
  all 9 cases; no assertions or error-state coverage were removed.
- Retained generated Playwright viewer assets initially entered a later lint run:
  259 errors and 2797 warnings. Generated-evidence directories are now explicitly
  excluded; application/test source rules remain intact.
- Initial live API attempt returned 502. A read-only model lookup confirmed
  availability. Exact-request diagnostics returned provider HTTP 400,
  `unsupported_parameter`, `max_tokens`. The SDK documents that parameter as
  deprecated. Replacing it with `max_completion_tokens` retained the model and
  budget. A subsequent sandbox-restricted local server could not reach the
  provider; restarting the preview with network access yielded the final HTTP 200
  Workspace round trip. No model substitution or credential change was made.

Evidence is local and excluded from commits:

- `.verification/e2e-dev-run-1/`, `.verification/e2e-dev-run-2/`
- `.verification/e2e-production-run-1/`, `.verification/e2e-production-run-1-report/`
- `.verification/e2e-production-run-2/`, `.verification/e2e-production-run-2-report/`
- `test-results/` and `playwright-report/` — successful automated run artifacts.
- `.verification/live-compiler-before-token-fix.json`, `.verification/provider-model-check.json`, `.verification/provider-request-check.json`
- `.verification/live-compiler-after-token-fix.json`, `.verification/provider-request-after-token-fix.json`
- `.verification/live-workspace-compiler.json`, `.verification/live-workspace-ready.png` — final live evidence.

There is no remaining blocker for the scoped local bridge. Deployment, PR, push,
merge, production publication, and physical-device/audio acceptance remain outside
this work package.
