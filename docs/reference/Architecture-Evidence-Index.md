# Architecture and Handoff Evidence Index

**Audit date:** 7 October 2026 (UTC). **Purpose:** make the two new documents independently reviewable and support editable document packaging without relying on a chat transcript.

Deliverables: [System Architecture](../architecture/System-Architecture.md) and [Developer Handoff](../onboarding/Developer-Handoff.md). They supplement existing authority; they do not rewrite history or authorize operational changes. Markdown is the editable source of record; Mermaid blocks are editable diagrams. Any DOCX/PDF rendition should retain the snapshot, evidence qualifications and links.

## Snapshot and method

- Repository: `thelostquarryrocks-prog/promptsuno`.
- Application snapshot: [`3d8ae6457a2b02c413d6275e130fae944452f549`](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549), PR16 head, `codex/spend-guard-social-auth`.
- Remote main read during review: [`ef66bc08621322bf3c93c14d1e2e8f068b3d39ed`](https://github.com/thelostquarryrocks-prog/promptsuno/tree/ef66bc08621322bf3c93c14d1e2e8f068b3d39ed), merged PR8. Application snapshot differs by 89 files, 5,119 insertions and 1,263 deletions.
- PRs 9–16 read from GitHub as open drafts, each based on the preceding branch; full stack is in the handoff. Historical PR1 and PR3 remain open side branches.
- Documentation branch: `docs/system-architecture-handoff`, based on exact PR16 SHA. Application, migrations, assets, tests and configuration are unchanged by this documentation task.
- Original checkout `C:\codex-projects\PromptSuno` retained its three unrelated untracked files; source worktree remained clean. Documentation uses a separate worktree.

Inspection included package/lock/config, route and component inventory, active rendering imports, state and revision helpers, request/response parsing, AI prompts and reservations, auth/PKCE/cookies/starter handoff, all SQL migrations, CI/test configuration and selected assertions, all authority document categories, relevant historical implementation receipts and latest OPS-LOG entries, catalog metadata/counts/projection, content models, SEO/cache policy and asset attribution. The approved Workspace brief was read in full through Library pagination (lines 1–1066, 27,821 bytes). No Library materialization was required.

This is an architecture/documentation audit, not a complete security penetration test, code review of every line, fresh live database inspection, asset-rights audit, or new device/provider acceptance. Missing evidence is called out rather than replaced by a guess.

## Source map

Each immutable link below resolves against the application snapshot. Use the surrounding directory for related files named in the documents.

| ID | Immutable source | Supports |
|---|---|---|
| S1 | [package.json](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/package.json), [package-lock.json](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/package-lock.json), [AGENTS.md](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/AGENTS.md) | Resolved dependency versions, commands, approval and workflow rules |
| S2 | [route tree](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/src/app), [Workspace.tsx](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/Workspace.tsx), [workspace page](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/app/workspace/page.tsx) | Routes, lazy loading, shared orchestration, stale compiler checks, export/recovery UI |
| S3 | [workspace-draft.ts](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/workspace-draft.ts), [WorkspaceProvider.tsx](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/WorkspaceProvider.tsx), [workspace-revisions.ts](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/workspace-revisions.ts) | V1 shape, tab-local synchronous autosave, strict recovery, locks, proposal state machine and bounds |
| S4 | [SoundBrainCanvas.tsx](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/SoundBrainCanvas.tsx), [catalog projection](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/sound-brain-catalog.ts), [canonical product data](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/data/sound-brain) | Current DOM/CSS rendering, interaction, exact 899-node taxonomy, sparse visual affinities |
| S5 | [generate route](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/app/api/generate/route.ts), [compiler contract](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/compiler-contract.ts), [request reader](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/compiler-request.ts) | Prompt boundaries, exact catalog identities, output schema, auth/origin/size/status behavior |
| S6 | [LyricsStudio](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/LyricsStudio.tsx), [PromptDoctor](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/PromptDoctor.tsx), [ProposalReview](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/ProposalReview.tsx) | Section workbench, exact import/export, manual diagnosis/experiments, cross-tool navigation and explicit apply |
| S7 | [assistance route](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/app/api/workspace-assist/route.ts), [assistance contract](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/workspace-assistance.ts), [WorkspaceAssistance](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/WorkspaceAssistance.tsx) | Project projection, request limits, observations/hypotheses/proposals, role preservation instructions and stale results |
| S8 | [auth routes](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/src/app/auth), [social-auth.ts](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/social-auth.ts), [starter-intent.ts](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/starter-intent.ts), [SSR helpers](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/supabase) | Provider/settings agreement, PKCE, cookie distinction, signup gate, account-isolated starter ownership |
| S9 | [ai-spend.ts](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/ai-spend.ts), [migrations](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/supabase/migrations), [spend/social notes](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/docs/implementation/SPEND-AND-SOCIAL-AUTH.md) | Exact model/envelope, atomic quota/spend design, grants/RLS, unseeded activation gates and bounds |
| S10 | [Learn records/types](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/src/content/learn), [Learn components](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/src/components/learn), [indexing](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/lib/indexing.ts) | Five curated static guides, source notes, optional coaching, real CTAs and production-only public indexing |
| S11 | [public assets](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/public), [Google attribution](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/docs/implementation/GOOGLE-ASSET.md), [root layout](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/app/layout.tsx) | Image/font inventory and actual root font loading, not an exhaustive rights audit |
| S12 | [CI workflow](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/.github/workflows/ci.yml), [tests](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/tests), [Playwright config](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/playwright.config.ts), [proxy](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/src/proxy.ts), [PWA config](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/next.config.ts) | CI/test topology, isolated mocks/SQL, cache/index/security boundaries and known verification limits |

## Product and supporting authority

| ID | Evidence | Interpretation |
|---|---|---|
| A1 | [Authority directory at snapshot](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/docs/authority) | Six versioned files covering product, development, project instructions, SEO/content, file manifest and migration ledger. Historical implementation statuses need reconciliation. |
| A2 | Library `libfile_f827d74eece4819188365448b014c987`, “Pasted text(3).txt”, 27,821 bytes, 1,066 lines | Fully read approved Workspace brief; product north star, stages, preservation/evidence/free-loop principles. No claim that every aspirational feature is implemented. |
| A3 | [OPS-LOG at snapshot](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/docs/implementation/OPS-LOG.md) and [implementation directory](https://github.com/thelostquarryrocks-prog/promptsuno/tree/3d8ae6457a2b02c413d6275e130fae944452f549/docs/implementation) | Prior quota/provider preflights, approvals and receipts; later design, Workspace, assistance and spend/social work. Dated claims are not continuing operational authorization. |
| A4 | [docs/learn.md](https://github.com/thelostquarryrocks-prog/promptsuno/blob/3d8ae6457a2b02c413d6275e130fae944452f549/docs/learn.md) | Content editing guide with historical handoff instructions; actual current links and private-text rules take precedence. |

The external research PDFs/JSON named by A1's manifest were not independently re-audited or copied into these deliverables. The documentation describes their intended editorial role and absence from runtime, not the truth of every historical Suno claim. No private provider keys, tokens, cookies, user email/IDs or raw creative text were added.

## Verification evidence

**T1 — implementation CI, directly re-read.** [Run 37564629678](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/37564629678), head `3d8ae6457a2b02c413d6275e130fae944452f549`, conclusion success. Logs show 21 unit test files / 319 tests passed; 110 browser passes / seven skips; original 17 quota plus 13 aggregate spend database checks. Actual SQL service was PostgreSQL 17.11. Build/types passed, lint zero errors/two warnings. Both workflow jobs succeeded. This evidence is for the application snapshot, not automatically the later docs commit.

**T2 — conditional browser skips, source-inspected.** Two explicit homepage viewport/keyboard matrix tests run only on desktop Chromium (four skips across the two other projects); one CDP touch test runs only on mobile Chromium (two skips); Cache Storage inspection skips WebKit (one skip). Other WebKit auth/pointer/browser coverage remains. Some fixtures suppress service workers. These limitations must survive document packaging.

**T3 — documentation validation.** Link/heading/source-path validation and docs-only diff review are performed for the documentation branch. Its draft PR's checks are the place for exact documentation-SHA CI evidence. No claimed new live account, physical-device or provider test follows from documentation validation.

## Operational evidence

| ID | Fact / provenance | Limit |
|---|---|---|
| O1 | Earlier 7 October approved CLI deployment returned READY for `dpl_8LZQyE4KkAEQ2WrtEWN1RkTP7fZE`, exact PR16 SHA, project `prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`. Anonymous login request returned 302 to Vercel and noindex. | Reused existing operation evidence; no deployment repeated for documentation. |
| O2 | That operation's effective `/auth/providers` response reported Google true, Facebook false, signup false. Owner subsequently reported saving exact callback and successful existing-account Google sign-in at 03:59 UTC; parent reported corroborating Google email. | Owner report, not a independently repeated login, complete OAuth matrix or signup test. No private email copied. |
| O3 | Prior bounded live AI acceptance closed after twelve authorized submissions, including corrections/retests for vocal ambiguity and instrument-role fidelity. Owner revoked temporary key; current preview keyless. | Qualified sample acceptance only; not Suno audio acceptance, renewed spend approval or model-wide reliability. |
| O4 | Vercel CLI 62.4.0 full-URL `vercel curl .../auth/providers --scope prompt-suno` automatically created an automation bypass via PATCH `/v1/projects/{projectId}/protection-bypass` with `{}`. Exact created token was revoked; subsequent metadata showed zero bypass entries and protection `all`. | Avoid protected CLI-fetch/share-link flows unless explicitly approved to create credentials. No token values are retained in docs. |
| O5 | Staging metadata in preceding verification showed only two public Supabase env settings, all-deployment authentication and no Git integration. Latest deploy adds Google as a per-deployment runtime override. Stable alias previously mapped to older deployment `dpl_8Ev9Qjye6wJ6dN7WvybzpaoAuF9r`. | Do not use stable alias as evidence of current SHA; future metadata must be rechecked before an approved deploy. |

The documentation request itself expressly pauses Facebook and forbids application/deployment/migration/provider/spend changes. It permits durable docs-only draft PR work under the repository's existing workflow. These documents do not extend any earlier activation allowance.

## Contradictions and resolutions

| Historical / ambiguous statement | Current resolution |
|---|---|
| Main is the current full implementation | Main ends at PR8; full inspected app is the unmerged PR9–16 stack. |
| Sound Brain is a Fiber/Three scene | Active component is DOM/CSS/pointer-based; installed packages and font notes are historical evidence only. |
| Shared intent/Lyrics is future-only | V1 shared state, section editor and Doctor revisions are implemented; deep cloud Song Intent remains future. |
| Local autosave implies durable saved projects | Session-storage, one tab/account; no cloud database or full JSON restore UI. |
| Compiler output guarantees preserved meaning | Runtime validates exact coverage IDs/shape; semantic fidelity still needs review. |
| All preservation is mechanically guaranteed | Section/phrase checks are mechanical; meaning/story notes and roles are guidance. |
| Spend controls are complete / $10 hard cap guaranteed | Original controls have historical receipts; new aggregate migration inactive. Current provider enforcement is not proven by old wording. |
| Both social providers disabled | Superseded by approved Google preview and owner success. Facebook remains paused; signup remains closed. |
| Enabled provider button means callbacks configured | Public settings check cannot inspect allowlist or provider dashboard configuration. |
| Learn handoff can carry context in URL | Only safe topic identifiers may do so; actual current CTAs are login/early access. Never creative text. |
| Vercel curl is a harmless authenticated read | Observed credential creation side effect; avoid under read-only verification scope. |
| Passing browser/SQL fixtures proves live acceptance | Mocks, emulation and JWT-subject shim have explicit limits; keep evidence categories separate. |

## External primary sources checked

- [OpenAI Spend limits](https://developers.openai.com/api/docs/guides/spend-limits), checked 7 October 2026: optional organization/project enforced limits versus alerts, lag/possible overshoot. No current account setting inspected. The older help article contains both soft-budget text and a link to this newer guide; use the specific current guide for behavior.
- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), checked 7 October 2026: integration/callback reference. Exact application behavior comes from S8; this document does not claim provider-dashboard inspection.
- [Vercel protection-bypass API](https://vercel.com/docs/rest-api/projects/update-protection-bypass-for-automation), checked during the preceding cleanup: supports interpretation of CLI token-generation/revocation. The observed CLI output and installed code were the direct evidence for O4.

## Packaging notes

Keep all three files together. The architecture has system-context, local-state flow, proposal lifecycle and OAuth sequence Mermaid diagrams; render them when producing DOCX if tooling supports it, but preserve the editable source. Tables contain status distinctions and must not be collapsed into unconditional capability claims. Retain the date, application snapshot, unmerged-stack notice, Google owner-report qualification, inactive spend guard, closed signup, local-storage limits and no-live-test statement. Do not insert screenshots of private accounts, credentials or a model response presented as an audio test.
