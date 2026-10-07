# PromptSuno Developer Handoff

**Version:** 1.0 · **Prepared:** 7 October 2026, UTC  
**For:** developers joining the project and maintainers resuming work  
**Code baseline:** `3d8ae6457a2b02c413d6275e130fae944452f549`  
**Companions:** [System architecture](../architecture/System-Architecture.md) · [Evidence index](../reference/Architecture-Evidence-Index.md)

## 1. Goal and current status

PromptSuno helps a songwriter learn, express musical intent, write lyrics and improve a disappointing result from Suno. The product jobs are LEARN, BUILD and FIX. The shared Workspace is one song; Brain, Lyrics and Doctor are modes of that song. It is not three independent chatbots, a conventional wiki or a generic project dashboard.

The complete implementation lives in an **unmerged draft stack**, ending at PR16 on `codex/spend-guard-social-auth`. Main is `ef66bc08621322bf3c93c14d1e2e8f068b3d39ed` (PR8). Do not assume main includes the current design, shared editor or social/spend work. The baseline above is an inspected code snapshot, not a production release.

The latest protected staging URL is [promptsuno-signin-staging-kklmqrd7n-prompt-suno.vercel.app](https://promptsuno-signin-staging-kklmqrd7n-prompt-suno.vercel.app), deployment `dpl_8LZQyE4KkAEQ2WrtEWN1RkTP7fZE`. It runs that exact SHA, is READY and remains keyless, protected and closed to signup. Google is enabled on this deployment only; the owner reported successful existing-account sign-in after allowlisting its exact callback at 03:59 UTC. Facebook setup/testing is explicitly paused. Apple is not implemented.

Manual creative work is usable: exact Brain selections/notes, Lyrics sections/import/export, preservation, Doctor experiments and apply/reject/revert. AI routes are implemented but disabled on current staging. The original per-user quota is historically applied; the new aggregate spend migration and pricing/budget policy are not applied/seeded live. Do not repeat old migration or paid-smoke procedures simply because a dated checklist says pending. [Evidence: branch table and O1–O4](../reference/Architecture-Evidence-Index.md)

## 2. Authoritative reading order

1. [AGENTS.md](../../AGENTS.md): repository workflow, secrets, approval boundaries and checks. Current user authorization controls the task; do not infer approval from a generic runbook.
2. This handoff and the [System architecture](../architecture/System-Architecture.md): current integrated behavior, limits and practical work locations.
3. [Evidence index](../reference/Architecture-Evidence-Index.md): immutable source links, accepted evidence, contradictions and inspection scope.
4. [Product and Architecture v1](../authority/PromptSuno-Product-and-Architecture-v1.md), [Project Instructions v1.2](../authority/PromptSuno-Project-Instructions-v1.2.md), and [SEO and Content Architecture v1](../authority/PromptSuno-SEO-and-Content-Architecture-v1.md): product intent and research safeguards. Implementation sections are dated.
5. The approved Workspace brief, Library `libfile_f827d74eece4819188365448b014c987`, “Pasted text(3).txt”, 1,066 lines. It establishes the shared-song north star. This handoff is sufficient for onboarding when Library access is unavailable; obtain the exact brief from the owner before materially changing product direction.
6. [OPS-LOG](../implementation/OPS-LOG.md), latest dated entries first; [spend/social implementation notes](../implementation/SPEND-AND-SOCIAL-AUTH.md); relevant source and tests for the proposed change.
7. [Migration ledger](../authority/PromptSuno-Migration-Ledger-v1.1.md) and [file manifest](../authority/PromptSuno-Project-File-Manifest-v1.2.md): provenance and historical boundaries. Their use of “migration” is product-history migration, separate from SQL migrations.

Current code outranks old descriptions of implementation. Historical SunoV6.wiki research may support an evidence claim, but does not restore old branding, routes, database schemas or deterministic diagnostic rules. Known drift includes README's October 3 status, the old Three.js description, old Learn URL-context guidance and pre-Google-activation status in spend/social notes. Use the evidence index before treating a CURRENT heading as fresh operational fact.

## 3. Product semantics that must survive every change

| Must preserve | Practical developer implication |
|---|---|
| Structured intent is authoritative | Keep exact catalog IDs/labels/categories and authored notes; never reconstruct state from Styles |
| Affinity is visual-only | Do not send matrix weights or Speed/Density/Connection to AI or Suno |
| One song across modes | Use the existing provider; do not create separate Lyrics/Doctor stores |
| Explicit application | AI returns suggestions; only user Apply mutates the requested text |
| Small reversible experiments | Check current text against before/after and preserve untouched fields |
| Preservation | Keep section/phrase checks in pure helpers and validate again on apply/revert |
| Evidence discipline | Report symptoms as user observations, hypotheses as uncertain; no hidden-Suno claims |
| Local-first editing | No database call per drag/keystroke; cloud storage needs its own design |
| Usable core loop | No fake premium gate, fabricated AI response or unlimited-use claim |
| Privacy and identity isolation | No creative text in URLs/logs/analytics; old account results must not reach new account state |

The active Brain uses DOM/CSS and pointer capture at this snapshot. Older instructions about avoiding casual Three.js refactors remain useful historical caution, but do not add a new WebGL layer to make code resemble old documentation. Preserve the accepted orb design, category filtering, cancellation, reduced-motion and non-drag interactions.

## 4. Repository orientation

```text
src/app/                 Routes, metadata, public pages, auth and paid API handlers
src/components/          Workspace orchestration and Brain/Lyrics/Doctor UI
src/components/home/     Homepage starter and contextual brand interactions
src/components/learn/    Static content rendering and Monkey Methods client island
src/content/learn/       Typed curated guide records
src/lib/                 Draft/revision/AI/auth/catalog contracts and pure helpers
src/lib/supabase/        Browser/server SSR clients and cookie options
src/proxy.ts             Session refresh, Workspace access and response boundaries
data/sound-brain/        Canonical 899-term catalog and affinity matrix
public/                  Local brand/design images and historical font/license assets
supabase/migrations/     Two additive SQL migrations; no automatic remote apply
tests/                   Unit, API, component, browser and disposable SQL checks
.github/workflows/       CI only; no deployment automation
docs/authority/          Historical approved product direction and migration references
docs/implementation/     Operations history, approvals and implementation receipts
docs/architecture/       Current integrated system description
docs/onboarding/         This developer guide
docs/reference/          Audit/evidence map
```

The repository has no monorepo workspace, separate backend repository, CMS, queue service or song-storage API. `TagCollectorCanvas.tsx` is legacy unreferenced code. `compiler-quota.ts` retains the original quota helper, while current paid routes use `ai-spend.ts`. Generated `.next`, worker files, `.vercel`, `.env*`, reports and local captures are excluded; do not commit them accidentally.

## 5. Fresh setup and safe local development

### 5.1 Prerequisites

Use Git, npm and **Node 24.12.0** to match CI; the project does not declare a separate engine policy. Dependencies are locked by `package-lock.json`. Playwright Chromium/WebKit need installation and OS dependencies. GitHub CLI is optional for PR/run inspection. PostgreSQL client plus a disposable PostgreSQL 17 cluster are needed only for SQL integration tests; the existing CI provides that environment if it is unavailable locally.

The recent execution host was Windows/PowerShell (`RedBarnRoad`). `npm.cmd` avoids PowerShell script-policy issues. POSIX developers use `npm` with equivalent environment syntax. Keep `core.autocrlf=false` for clean worktrees used in byte-sensitive migration review/deployment. Do not change global Git settings or trust arbitrary repositories to work around ownership errors.

### 5.2 Obtain a working copy

Choose an ordinary developer directory and use the canonical remote. These are setup examples; they do not change the current staging system.

```powershell
git clone https://github.com/thelostquarryrocks-prog/promptsuno.git
Set-Location promptsuno
git fetch origin
git switch --detach 3d8ae6457a2b02c413d6275e130fae944452f549
git switch -c codex/<focused-milestone>
git status --short
npm.cmd ci --no-audit --no-fund
```

Replace the branch placeholder with a meaningful name. If joining later, first inspect the PR stack and ask the maintainer which accepted baseline to use; this SHA is a reference, not a forever-default branch. For an existing dirty checkout, preserve it and create a separate worktree rather than resetting/cleaning it:

```powershell
git -c core.autocrlf=false worktree add -b codex/<focused-milestone> ../promptsuno-work <approved-sha>
```

At this review, the original `C:\codex-projects\PromptSuno` has three unrelated untracked files: duplicate catalog JSON, duplicate matrix JSON and `desktop.ini`. They were preserved. Workspace paths are host-specific; no developer should need that absolute path to build the project.

### 5.3 Prefer the isolated browser fixture

For a realistic app without real Supabase accounts or paid AI, use the existing fixture launcher:

```powershell
$env:NEXT_TELEMETRY_DISABLED = '1'
node tests/e2e/server.mjs
```

Open `http://127.0.0.1:3131/login`. The fixture defines synthetic email `test@example.invalid` and password `local-test-only` in `tests/e2e/login.ts`; these are local test data, not real account credentials. The launcher binds fake Auth/quota/provider services to `127.0.0.1:3132` and starts Next dev on 3131 unless `TEST_SERVER_MODE=production`. It forcibly overrides Supabase URL/key, OpenAI key/base URL, AI/spend/social flags and signup mode in its child process. All model outputs are synthetic and must be described that way in screenshots or demonstrations. Stop with Ctrl+C after use.

Never deploy `tests/e2e/server.mjs` as an application server. Do not point it at a real provider, modify it to inherit live keys, or use its fake tokens as a security acceptance test. Plain `npm.cmd run dev` runs the application without this fake backend; `/workspace` then needs genuine configured Auth or will fail/redirect. The fixture is the preferred no-credential onboarding path.

### 5.4 Standard checks

Run these sequentially from the project root. Browser tests start their own servers, so stop a manual fixture instance first and keep ports 3131/3132 free.

```powershell
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:3132'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-fixture-placeholder'
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium webkit
npm.cmd run test:e2e
```

CI uses `playwright install --with-deps chromium webkit` on Linux. `test:e2e` runs against `next start`, so build first with the matching public fixture values. A server restart cannot replace public values embedded in an earlier browser build. `next build --webpack` is deliberate for PWA support; do not silently replace it with the framework's default build path. Clean builds may fetch Google fonts from `next/font/google`; network denial is not automatically an application regression.

Focused commands already defined:

```powershell
npm.cmd run test:homepage
npm.cmd run test:learn
npm.cmd run test:e2e:learn
npm.cmd test -- tests/workspace-revisions.test.ts
npm.cmd run test:e2e -- tests/e2e/creative-loop.spec.ts --project=desktop-chromium
```

The commands and fixture behavior are verified in source and in the baseline CI. No fresh end-to-end account/provider test was performed for this documentation task. A new docs PR runs the existing CI and should be assessed at its own SHA. [Sources: S1, S12, T1](../reference/Architecture-Evidence-Index.md)

## 6. Environment variable inventory

Do not copy live values into these documents, issue bodies, screenshots or shell history. The public anon key is not an administrative credential, but it still should be handled through approved setup rather than pasted into reports. Provider secrets are owner-entered directly into the relevant dashboard. Normal application code does not require a Supabase service-role key.

| Variable | Scope / purpose | Safe local value or rule | Current staging posture |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser build and server runtime Auth/RPC origin | `http://127.0.0.1:3132` for fixtures | Existing named Supabase project; per-deploy build/runtime override |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Auth/Data API key | `local-fixture-placeholder` with fixture backend | Existing public setting; never use service-role value |
| `SITE_URL` | Server/build canonical public origin | Omit for default `https://promptsuno.com`; must be HTTPS without credentials | Default unless separately configured |
| `VERCEL_ENV` | Platform environment; production indexability | Let Vercel set it; do not spoof production to test a preview | Preview |
| `OPENAI_API_KEY` | Server-only paid provider credential | Omit; fixture launcher inserts synthetic placeholder | Absent/revoked temporary key |
| `OPENAI_BASE_URL` | SDK-supported provider endpoint override | Fixture child forces `http://127.0.0.1:3132/v1` | No custom endpoint approved |
| `AI_SPEND_ENABLED` | Server gate for aggregate reservation | Absent/false except forced isolated fixture | Absent |
| `WORKSPACE_ASSIST_ENABLED` | Server gate for Lyrics/Doctor AI | Absent/false except fixture | Absent |
| `SOCIAL_AUTH_GOOGLE_ENABLED` | Server provider availability gate | Fixture controls synthetic Google | `true` only on latest approved deployment |
| `SOCIAL_AUTH_FACEBOOK_ENABLED` | Server provider availability gate | Fixture controls synthetic Facebook | Absent; setup paused |
| `AUTH_SIGNUP_ENABLED` | Server social-signup expectation, must agree with Supabase | `false`; never opens Supabase by itself | Absent/false and Supabase signup disabled |
| `NEXT_TELEMETRY_DISABLED` | Next tooling telemetry suppression | `1` in local checks/CI | Tooling setting, not creative-data telemetry policy |
| `TEST_SERVER_MODE` | Fixture launcher chooses `start` versus `dev` | `production` only after local fixture build | Never needed in application deployment |
| `LEARN_CAPTURE` | Enables responsive test captures | `1` when collecting evidence | CI only |
| `LOCAL_QUOTA_TEST_PORT` | Disposable loopback database port | `54322` by default | Never a live database endpoint |
| `LOCAL_QUOTA_TEST_PASSWORD` | Disposable database test authentication | Locally chosen disposable value | Never live database credentials |
| `NODE_ENV` | Framework runtime; disables PWA plugin in development | Managed by Next/npm process | Framework-managed |

`OPENAI_BASE_URL` is an SDK environment facility even though app code does not read it explicitly. Treat an inherited override as part of the provider trust boundary. No Google client secret, Facebook App Secret or Vercel token is an application env requirement in this table. Existing CLI login manages its own authentication; never pass a token as an inline command argument.

## 7. State, recovery and contracts: developer essentials

`WorkspaceProvider` updates one `WorkspaceDraftV1`, updates its timestamp and writes it to account-keyed sessionStorage. It does not debounce and does not use Supabase for creative state. Local storage records are validated before write/read; corrupt or future-version records block automatic overwrite. Recovery explicitly replaces the saved record only after the user understands the risk.

Do not describe “Saved in this tab” as cross-session/cloud backup. Export Styles and Lyrics are text files; song backup is JSON. There is no tested full-song restore UI yet. Successful sign-out clears the current account's tab copy and resets memory. Account switching, late session initialization and async responses are guarded separately. Keep all three layers: server authorization, browser ownership isolation and stale-result rejection.

For a new field, update the type, exact-key parser, fresh-draft factory, size bounds, projection rules, recovery/backward-compatibility decision and relevant tests together. A parser change can make existing records unreadable, so do not casually rename V1 keys. Decide whether to migrate explicitly or introduce a new version before shipping.

For a new editable target, implement it in the pure revision engine before UI wiring. Test preservation, before/current matching, apply/reject/revert, stale targets and reload. Current targets are notes, Styles and one lyric section. Section/phrase locks are text checks; semantic notes and musical roles require human/model review. Do not advertise a semantic guarantee from passing the JSON parser.

Assistance observes a projected request, not the full draft or all prior revisions. It can return suggestions only; the client assigns proposal IDs and runs local checks. Compiler output has exact coverage IDs and is revalidated on the client. Changes to either contract need request/response tests and invalid-output tests, not only snapshot updates. [Sources: S3, S5–S7](../reference/Architecture-Evidence-Index.md#source-map)

## 8. Tests and evidence interpretation

| Suite / files | Covers | Does not establish |
|---|---|---|
| `compiler-contract`, `generate-route`, `ai-spend` | Exact catalog/output shape, byte bounds, auth/origin, reservation ordering and errors | Real model semantics, current provider pricing |
| `workspace-draft`, `workspace-revisions`, component tests | Corruption/recovery, account association, locks, exact reversible edits | Durable cloud recovery or all browser storage implementations |
| `workspace-assistance`, `workspace-assist-route` | Scoped proposals, preserved text, failure paths, provider payload | Audio diagnosis or guaranteed semantic preservation |
| `social-auth*`, `oauth-handoff`, `starter-*` | Availability agreement, redirects, ownership, one-time flow and UI | Real provider review/consent/account-linking behavior |
| Browser suites under `tests/e2e` | Integrated route/UI behavior, pointer/touch/cancellation, navigation, auth races, errors and revisions | Physical devices, real software keyboards, human usability study |
| Learn/homepage/indexing/cache tests | Content projection, crawlable pages, metadata, cache rules, responsive layouts | Search rankings or full deployed CDN/PWA audit |
| `tests/db/compiler-quota.mjs` + `ai-spend.mjs` | Actual migrations, ACL/RLS, concurrent locks, rollback, quota/spend boundaries | Real Supabase JWT validation/PostgREST or provider invoice correctness |

Baseline CI [37564629678](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/37564629678) at exact implementation SHA passed 319 unit/API/component tests, 110 browser tests and 30 SQL checks, with seven existing browser skips. Types/build passed; lint retained two source warnings and no errors. Do not sum these into a universal quality score. Read conditional skip reasons in the specs before asserting a platform is covered.

Browser configuration uses one worker, zero retries, desktop Chromium, mobile Chromium/Pixel 7 and mobile WebKit/iPhone 13 emulation. It retains traces on failure and captures responsive evidence in CI. Some app fixtures delete `navigator.serviceWorker` so test isolation is not equivalent to offline-PWA acceptance. Test artifacts expire after seven days; durable reports should link the run and summarize scope/counts, not depend solely on temporary artifacts.

Use regression tests where a silent failure is costly: identity, authorization, quota, cross-account content, redirects, preservation or stale asynchronous writes. Do not add tests that merely mirror cosmetic implementation. Run required existing checks before release and report exact SHA. For documentation-only changes, inspect links/commands and let unchanged CI verify code rather than claiming new live acceptance.

## 9. Database migrations and paid activation

### 9.1 Local SQL testing

The database harness accepts only `127.0.0.1`, database `promptsuno_quota_test`, user `postgres` and a configured local port. It strips inherited `PG*` settings that could redirect libpq and refuses a nonempty database. It creates cluster-level roles, so the cluster itself must be disposable, not merely another database on a shared server.

Start a fresh isolated PostgreSQL 17 service using your team's local container procedure, ensure `psql` is on PATH, set only the two `LOCAL_QUOTA_TEST_*` variables as needed, then run:

```powershell
npm.cmd run test:quota-db
```

The harness applies both real migration files and imports the spend checks. A second run against the same nonempty database should refuse; provision a fresh disposable service rather than weakening that guard. On this Windows host `psql` was unavailable during the latest implementation, so actual PostgreSQL execution came from CI. CI's service configuration is the reproducible reference.

### 9.2 Remote change procedure — approval required

1. Identify the exact Supabase project and inspect its applied migration ledger without printing credentials or creative/user data.
2. Review the additive migration diff and SHA-256, preserving LF bytes; never edit a migration already applied elsewhere.
3. State separately whether the task authorizes schema apply, policy seed/update, credential installation, deployment and paid traffic. One does not imply the others.
4. Apply only after the named migration/target approval, using the owner's approved operator path. Do not add service-role credentials to the application.
5. Verify narrow RPC grants, empty search path, private schema/RLS, missing-policy failure and the intended policy under an approved acceptance plan.
6. Append dated evidence to OPS-LOG in the same source milestone. Never record a live password/key or user's identity.

Original `202609280001_compiler_quota.sql` is historically applied and accepted. New `20261007022852_aggregate_ai_spend_guard.sql` is unseeded and not applied live; checksum `41e3f26dd735424b77d61668c0e3a632f860782335191a19bafc65edc936075e`. Do not run an unrestricted `supabase db push` from a newcomer checkout.

The approved live per-user values were 3/60 seconds and 20/86,400 seconds. Aggregate daily/lifetime values, pricing version/expiry and activation are unresolved owner decisions. The new ledger retains reservations after failures, timeouts and account deletion; never reset counters to “fix” a denied request. A durable pause, if separately authorized, disables the singleton policy and prevents new reservations after the lock/update commits; in-flight reserved calls can finish. Do not drop tables or refund uncertainty as a rollback shortcut.

Provider spend alerts and enforced limits are distinct. Current OpenAI documentation supports optional enforced organization/project limits with propagation lag; no current account enforcement setting is established by this document. Verify economics and settings before any activation; the old $10 wording is not proof. [Official spend-limit reference](https://developers.openai.com/api/docs/guides/spend-limits)

## 10. Git and release workflow

### 10.1 Current stack

| PR | Head branch | Base | Head SHA (short) |
|---|---|---|---|
| [9](https://github.com/thelostquarryrocks-prog/promptsuno/pull/9) | `codex/reference-design-staging` | `main` | `249d49b` |
| [10](https://github.com/thelostquarryrocks-prog/promptsuno/pull/10) | `codex/sound-brain-staging` | PR9 branch | `cd3bb92` |
| [11](https://github.com/thelostquarryrocks-prog/promptsuno/pull/11) | `codex/shared-workspace` | PR10 branch | `b134d53` |
| [12](https://github.com/thelostquarryrocks-prog/promptsuno/pull/12) | `codex/workspace-creative-loop` | PR11 branch | `5f7f10c` |
| [13](https://github.com/thelostquarryrocks-prog/promptsuno/pull/13) | `codex/workspace-ai-acceptance` | PR12 branch | `1594cd2` |
| [14](https://github.com/thelostquarryrocks-prog/promptsuno/pull/14) | `codex/workspace-intent-fidelity` | PR13 branch | `54bee1e` |
| [15](https://github.com/thelostquarryrocks-prog/promptsuno/pull/15) | `codex/workspace-discoverability` | PR14 branch | `4682e3f` |
| [16](https://github.com/thelostquarryrocks-prog/promptsuno/pull/16) | `codex/spend-guard-social-auth` | PR15 branch | `3d8ae64` |

All eight were open drafts at review. Older open PR1/PR3 are historical side branches, not the current integrated baseline; do not merge or delete them automatically. A task on current code should branch from the actual accepted head and use a stacked draft PR if its base is unmerged. Keep one branch per milestone, focused commits, and OPS-LOG changes with the work. Preserve unrelated worktrees and dirty files.

Merge only when explicitly authorized and current CI/review conditions are met. Integrate dependencies in order or agree a reviewed consolidation plan; do not simply retarget the top PR to main and assume its review covers the cumulative change. Recheck descendant bases and tests after integration. No Git integration is connected to the staging Vercel project, so merges do not deploy it.

### 10.2 Protected preview deployment runbook — not permission to deploy

Target: Vercel team `prompt-suno` (`team_ID2vravvKgQ3XBHYVmHPHoPz`), project `promptsuno-signin-staging` (`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`). All deployments require explicit approval under AGENTS.md.

1. Present the exact source SHA, desired Preview-only overrides and target. Confirm current CI, clean source and no unintended secrets/environment flags.
2. Make a clean detached worktree with LF preservation from that SHA. Avoid deploying a dirty developer checkout or generated local build with unknown env.
3. Read project identity, all-deployment Vercel Authentication and Git-link state using existing authorized CLI metadata access. Stop if they differ from the approved plan. Read only the two approved public Supabase values when needed; do not enumerate secret values.
4. Use the existing safe procedure: public Supabase values passed in memory as both build and runtime overrides. Their saved project targets were Production-only, which is why an unqualified Preview deploy may lack them. Do not “fix” this by editing project settings without approval.
5. Perform a Preview deployment only, recording `githubCommitSha` and branch metadata. The latest Google preview additionally used runtime `SOCIAL_AUTH_GOOGLE_ENABLED=true`; that approval does not carry over to a new deployment automatically. Leave AI, signup and Facebook flags absent unless individually authorized.
6. Verify returned deployment ID, project, SHA, Preview target and READY; verify anonymous 302 to Vercel Authentication and noindex. Use read-only metadata and anonymous HTTP, not a tool that creates bypass access.
7. Give the owner the exact new origin and `/auth/callback` if OAuth is enabled. Immutable URLs change; the app availability check cannot confirm redirect allowlisting. Owner adds the exact callback, preserving Site URL and avoiding broad wildcards, then verifies in their normal protected browser.
8. Record result and limitations. No alias assignment, production promotion, DNS, signup opening, database apply or paid test is implied.

The local PowerShell helper used for prior deployment lived outside the repository. Do not depend on a developer's temporary file existing or execute an old helper without inspection. The procedure above and dated OPS-LOG are the durable description; a checked-in reusable helper would be a separate reviewed improvement.

**Avoid `vercel curl` against protected deployments.** Version 62.4.0 created a persistent protection-bypass token automatically during a full-URL availability check. That specific token was revoked and zero bypass entries were verified. Generating another needs explicit approval at action time. Do not use a share-link tool as an unreviewed alternative. Anonymous protection checks and owner browser verification are sufficient for the default runbook.

### 10.3 Rollback and incident response

For a UI regression in an immutable preview, preserve evidence, identify the last approved source/deployment and request approval for the exact replacement Preview. Do not change the stable alias or promote production as an expedient rollback. Changing env on a project does not remove a secret from an existing immutable deployment; revoke a compromised/temporary credential at its provider, then restore approved keyless configuration/deployment through the owner process.

For suspected paid leakage, stop paid testing, identify request scope without logging payloads and use an authorized durable pause/revocation path. No automatic refunds exist. For database regressions, favor a reviewed additive correction with compatibility checks; there is no tested destructive down-migration runbook. For local creative-data incidents, preserve the current tab, export available work and inspect version/size/status before recovery. Do not clear browser storage globally.

Production has no accepted launch/rollback acceptance in this review. Its domain/credential/observability readiness must be reviewed separately. Repository metadata defaults are not proof of production configuration.

## 11. Common changes and where to make them

| Task | Primary files | Review focus |
|---|---|---|
| Homepage design or starter | `src/app/page.tsx`, `page.module.css`, `components/home/HomeHero.tsx`, `lib/starter-intent.ts` | Hydration, exact starter text, account handoff, no text in URL |
| Add/edit a Learn guide | `src/content/learn/pages.ts`, `types.ts`, `components/learn/LearnBlocks.tsx` | Sources, caveats, related links, static HTML, canonical routes |
| Update Monkey Methods | `components/learn/MonkeyMethod.tsx`, content tip banks, `WorkspaceHint.tsx` | Optional disclosure, keyboard access, rotation and harmless storage |
| Brain presentation/filtering | `SoundBrainCanvas.tsx`, `sound-brain.css` | Exact records, pointer cancellation, keyboard path, reduced motion |
| Catalog additions | Two `data/sound-brain` JSON files, `sound-brain-catalog.ts` | Stable IDs, taxonomy/provenance, unchanged weight meaning; schema/tests |
| New song field / storage | `workspace-draft.ts`, `WorkspaceProvider.tsx` | Version compatibility, corruption recovery, limits, ownership |
| Lyrics editing/preservation | `LyricsStudio.tsx`, `workspace-revisions.ts` | Exact import/export, section/phrase locks and no sound mutation |
| Doctor experiment UI | `PromptDoctor.tsx`, `ProposalReview.tsx` | Observation/hypothesis distinction, explicit apply, revert conflicts |
| Compiler behavior | `api/generate/route.ts`, `compiler-contract.ts`, `compiler-request.ts` | Role/intent fidelity, strict output, auth/byte limits, no spend bypass |
| Assistance behavior | `api/workspace-assist/route.ts`, `workspace-assistance.ts`, `WorkspaceAssistance.tsx` | Scope, preservation, stale response rejection, honest disabled state |
| Authentication/OAuth | `lib/supabase`, `social-auth.ts`, `oauth-handoff.ts`, auth routes, login | No open redirects, correct cookies, same-tab adoption, settings agreement |
| Quota/spend | `ai-spend.ts`, SQL migrations and DB tests | Lock order, atomicity, no client prices/refunds, no live activation by code change |
| Indexing/cache | `indexing.ts`, robots/sitemap, `proxy.ts`, `next.config.ts` | Preview noindex, private/no-store and NetworkOnly auth routes |
| Release process | `.github/workflows/ci.yml`, OPS-LOG and this runbook | No secrets in CI, exact-SHA evidence, explicit deployment authority |

Read the bundled current Next.js documentation before changing framework behavior; AGENTS.md explicitly warns against relying on remembered APIs for this version. For provider changes, verify current primary documentation without silently updating models, keys or paid allowances.

## 12. Troubleshooting guide

| Symptom | First checks | Preserve / avoid |
|---|---|---|
| `/workspace` returns login | Fixture running? Correct public build URL? Verified Auth session? | Do not bypass server `getUser()` or invent a user ID |
| Login inputs briefly disabled | Expected until hydration attaches controlled handlers | Do not remove hydration guard to hide slow load |
| Google button disabled | Server flag, public provider setting, signup agreement, settings network/timeout | Do not inspect secrets; no callback readiness implied by enabled button |
| OAuth returns wrong destination/fails | Exact app callback allowlist, same origin used to start, provider→Supabase callback, PKCE expiration, Vercel browser session | No wildcard expansion or arbitrary `next` redirect |
| Compile/assist 503 in staging | Expected keyless/disabled state; otherwise auth/config/reservation | Do not retry paid calls or install keys without approval |
| 429 | Per-user window denial; validate Retry-After; distinguish provider failure in server diagnostics | Do not reset quota or bypass spend reservation |
| 502 | Provider failure, invalid JSON/schema, preservation violation | Original state unchanged; no refund/retry loop |
| Assistance disappears after editing/navigation | Expected stale snapshot rejection or component unmount | Re-request on current state only when authorized |
| Proposal cannot apply/revert | Current text changed, lock conflict, target missing or newer compiler result | Keep later work; create a new proposal rather than forcing overwrite |
| “Saved copy found” or corrupt storage | Exact owner key, schema/size, existing record versus early edits | Export before explicit replace; no automatic clear-all |
| Lost song in another tab/device | Persistence is tab-local, not cloud sync | Do not claim recovery exists from server |
| E2E port collision | Stop only your manual fixture on 3131/3132 | Do not kill unrelated Node processes |
| Browser test launch failure | Install correct Playwright browser versions/OS deps | Do not add retries to conceal deterministic failures |
| Build cannot fetch fonts | `next/font/google` build dependency and network policy | Do not misreport as syntax failure or use live secrets to fix it |
| DB suite refuses nonempty database | Fresh disposable PostgreSQL 17 cluster required | Never weaken host/database/emptiness guards |
| Old UI on stable staging URL | Compare deployment ID and immutable URL | No alias change without explicit approval |
| Migration checksum mismatch | Compare Git blob/LF bytes and reviewed checksum | Do not edit an applied migration to match a local conversion |

## 13. Access and onboarding checklist

- Obtain repository read access, then least-privilege branch/PR access as needed; confirm who reviews product, auth, database and release work.
- Run the fixture app and complete a manual Brain→Lyrics→Doctor experiment with synthetic text; refresh, preserve a phrase, apply and revert once.
- Run appropriate checks and inspect their fixture boundaries before requesting live access.
- Obtain authorized Vercel team/project access only if deployment duties require it. Inspect project identity without exporting tokens.
- Obtain Supabase dashboard access appropriate to the task; normal UI work needs neither database admin nor a service-role key.
- Obtain Learn research/asset references from the owner when editorial work requires them. The full corpus is not in the repository.
- Confirm release approval and incident escalation owners; this review found no standalone on-call/SLO policy.
- Keep Google/Facebook secrets and provider keys with the owner in approved dashboards. Facebook remains paused; no setup action is an onboarding prerequisite.
- Before paid work, obtain exact scope/call/budget approval and prove model, pricing, reservation and cleanup conditions. The earlier twelve-call allowance is closed.

## 14. Prioritized next steps and risk register

These are recommendations, not authorization or promises of scheduled work.

| Priority | Work / risk | Concrete next step and acceptance evidence |
|---|---|---|
| P0 before paid activation | Unapplied aggregate migration; unverified pricing/bound and current provider enforcement | Approved migration/policy review, conservative bound evidence, durable shutoff test, exact call/budget/key cleanup plan |
| P0 before public launch | Protected preview is not production readiness | Owner-approved release review covering signup, identity, credentials, privacy, monitoring, support and rollback |
| P1 | Long unmerged PR stack and stale status headings | Review dependency order, obtain merge authority, keep descendants valid; update entrypoint status pointers without erasing history |
| P1 | Tab-local loss and backup without restore | Design explicit validated restore UX and retention messaging; test version, size, corruption and account behavior |
| P1 | Semantic AI errors remain possible | Expand approved offline evaluation cases for roles/vocal ambiguity; any live tests require a new bounded allowance |
| P1 | Real-device and live auth coverage incomplete | Owner-run mobile keyboard/focus, cancellation, existing-account linking, refresh and closed-signup denial plan; no physical-device claim from emulation |
| P1 | Protected verification can create credentials | Standardize metadata/anonymous checks; review CLI behavior before using protected-fetch commands |
| P2 | PWA/offline boundary and sensitive caching | Dedicated controlled service-worker lifecycle tests without disabling worker; inspect only synthetic content |
| P2 | Performance not measured | Measure draft serialization, catalog projection and long-editor rendering; establish budgets before optimization |
| P2 | Public Learn→Workspace continuity partial | Design safe topic-ID handoff and contextual links, preserving private-text URL prohibition |
| P2 | Asset provenance and monitoring ownership incomplete | Assemble rights/source inventory and metadata-only observability/incident policy |
| Later | Cloud projects, sync, deeper history, variants, tiers | Agree conflict/retention/RLS/economics first; preserve useful free core |
| Paused | Facebook social configuration | Wait for owner to resume; no Meta app/secret/live-mode action under this handoff |

## 15. Completed evidence and handoff protocol

The code baseline, locked versions, routes, canonical data, state/auth/AI contracts, both migrations, CI, tests, public content and authority/implementation documents were inspected for this guide. Main/PR state and baseline CI were read from GitHub during review. Current deployment/auth facts come from preceding verified operations; Google success comes from the owner report. No new live login, paid call, migration, provider config or deployment was performed to write these documents.

A good continuation note states: objective; exact branch/base/head; modified files; reason for material decisions; exact checks and limits; current deployment only if actually deployed; dirty/untracked state; next concrete task; and remaining approval gates. Never write “ready” as a substitute for evidence. Preserve source links and the distinction between a working mock, a passing SQL fixture, an owner observation and production acceptance.
