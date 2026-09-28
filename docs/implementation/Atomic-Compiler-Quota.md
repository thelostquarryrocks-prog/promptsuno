# Atomic compiler usage quota

Status: local implementation; **HOSTING BLOCKED**. No remote migration, push,
PR, Vercel link, deployment or merge is authorized or performed by this task.

## Authority and baseline

The user's 2026-09-28 quota work package, current PromptSuno Project Instructions,
Product and Architecture, Development Handoff and Paid Compiler Security report
govern this work. Base branch `codex/paid-compiler-auth` was verified at
`54dd77ff63f0b1a21d176af5f2e6bedf73c60b2e`, with no staged or tracked changes.
The checkout was not completely clean: two duplicate catalog/matrix JSON files
and `desktop.ini` were already untracked. Their hashes were recorded and their
bytes preserved; they are excluded from this commit. New local branch:
`codex/atomic-compiler-quota`. Existing branch refs and PR #2/#3 are untouched.

## Reservation and report corrections

- Keep Supabase and `{ nodes, relationship_notes }`. Verify `auth.getUser()`,
  validate input and check the existing provider key before reserving. Await the
  RPC result before constructing OpenAI. Each allowed response permits one SDK
  call, with existing `maxRetries: 0`, 30-second timeout and 2,048 completion cap.
  Installed PostgREST SDK inspection confirmed that POST RPCs are not retried on
  HTTP or network errors. No application retry/refund loop is added.
- The RPC takes **no arguments**. PostgREST's verified session supplies
  `auth.uid()`; no body, header ID, metadata, allowance, timestamp, prompt or notes
  is passed to quota SQL. It uses the same Supabase SSR client as authentication.
  No service-role/admin key is required by the application or exposed to clients.
- Correction/clarification: store the four mandatory budget/window settings in
  a private database policy row, rather than per-instance environment defaults
  or RPC arguments. This provides one server-controlled policy across instances
  without giving an authenticated browser authority to choose its allowance.
- Correction/simplification: one per-user row holds both counters, replacing two
  independent counter rows. `INSERT ... ON CONFLICT DO NOTHING`, then `FOR UPDATE`
  serializes first-use and existing-user races. Both counters increment in one
  transaction only when both budgets allow; denial changes neither counter.
  Policy `FOR SHARE` precedes usage locks, so operator updates wait for current
  reservations. PostgreSQL owns persistence and coordination; no process counter
  is an application authority.
- Authenticated clients can directly call the argument-free RPC and consume
  **their own** budget. They cannot increase it, choose another identity, reset
  it or turn an RPC response into a model call: the API always reserves itself.
  This self-exhaustion tradeoff retains the report's session-only design.

## Failure, retry and window semantics

| Event | Behavior |
| --- | --- |
| Missing/invalid session | 401 before body read, quota or model call |
| Invalid/oversized intent or missing provider key | Existing 4xx/503; no reservation/model call |
| Budget exhausted | 429, private/no-store, integer Retry-After and matching JSON retry_after_seconds; no model call |
| Missing policy/migration, SQL error, outage, malformed RPC result | Generic 503; no model call; no fail-open path, even in development |
| RPC timeout/unknown commit outcome | 503, no automatic retry or refund; a committed attempt may be consumed without a model call |
| Provider failure/timeout/malformed output | Existing 502; reservation retained; no refund |
| Manual retry, duplicate POST or clarification compile | A new reservation and at most one model attempt; no idempotency promise or replay cache |
| Crash/disconnect after reservation | Consumption remains; safety favors bounded paid attempts over exact billing |

The database reads `clock_timestamp()` after taking the user lock. Each expired
window is reset on the next successful reservation to its next UTC Unix-epoch
aligned boundary. At exact expiry (`now >= end`) the new window is eligible.
The two durations are independent; daily 86,400-second windows end at UTC
midnight, not the user's local midnight. Retry-After is the ceiling of seconds
until the **latest exhausted** window ends, at least one. Another request may
consume the next window before a retry arrives; the delay is not a guarantee.
Fixed windows permit adjacent-window bursts (up to two allowances near a
boundary); this is not a sliding-window or in-flight concurrency limiter.

Policy limit changes apply on the next reservation. Duration changes preserve
already stored expiry times and apply on the next rollover; neither operation
clears consumed counts early. Lowered limits can immediately exhaust a user.
Operators must review changes as cost-control changes. Deleting the policy row
blocks new reservations, but cannot cancel model work already authorized.

The app aborts an RPC after five seconds; SQL lock waits have a three-second
limit. HTTP abort does not prove database rollback. Configure/verify the hosting
PostgREST statement timeout separately; a function-local statement_timeout
would not reliably establish a deadline for an already-running statement.

## Migration and privacy review

`supabase/migrations/202609280001_compiler_quota.sql` is a single transactional,
additive migration. It creates a private schema, singleton policy table,
per-user usage table and one exposed RPC. It intentionally seeds **no policy**.
Missing any mandatory value fails closed, not unlimited. Limits are constrained
to positive integers <= 1,000,000, durations to 1..2,678,400 seconds (31 days),
with burst duration/allowance <= sustained duration/allowance.

Both tables enable RLS without client policies. Schema/table access is revoked
from PUBLIC, anon, authenticated and service_role, including Supabase defaults.
Only authenticated receives function EXECUTE. The fixed empty search_path and
schema-qualified table/auth references protect the SECURITY DEFINER function.
There is no dynamic SQL or caller-selected identifier. The migration runner
owns these objects (expected trusted Supabase migration operator); review that
owner and actual ACLs in the target before hosting. Do not expose the private
schema in API settings. A public RPC is intentional; its elevated privilege is
limited by static SQL and auth.uid(), not by trusting caller configuration.

Usage records contain only account UUID, two integer counts and two expiry
timestamps. One row is reused per account, so expired-window history does not
accumulate and no scheduled retention job is needed. `auth.users(id)` deletion
cascades to its row. Do not purge live-account rows to tidy storage: that resets
allowances. Prompts, notes, IPs, cookies, provider results and credentials are
absent. Deleting/recreating accounts and multiple accounts remain abuse risks.

Rollback guidance: first disable new reservations using the private policy and
stop API traffic. Preserve counters if restoring the implementation later.
Do not drop production data or remove the route guard as an automatic rollback;
that requires a separate operator decision. No rollback was applied here.

References reviewed: [Supabase database functions](https://supabase.com/docs/guides/database/functions),
[Supabase RLS/auth.uid](https://supabase.com/docs/guides/database/postgres/row-level-security),
[PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
and [database time functions](https://www.postgresql.org/docs/current/functions-datetime.html).
The row-lock design assumes standard PostgREST READ COMMITTED transactions;
stricter isolation can reject a concurrent transaction, which the app treats
as a store failure (503), never permission to bypass the quota.

## Configuration and initial allowance recommendation

Recommend an initial controlled-pilot ceiling of **3 attempts per 60 seconds and
20 per 86,400 seconds per verified account**, subject to explicit approval.
This is a cost-control starting point, not a final free/premium entitlement.
Nothing seeds these values or advertises unlimited compilation.

The operator must populate exactly one row of
`compiler_quota_private.policy` using an approved privileged database session:
`singleton=true`, `burst_limit`, `burst_window_seconds`, `sustained_limit`,
`sustained_window_seconds`. There are deliberately no browser or app environment
overrides. The existing server OPENAI_API_KEY and Supabase URL/public key remain
required; no privileged quota credential is added to deployment configuration.

Cost estimate checked 2026-09-28 against the exact
[GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna):
$0.20 per million uncached input tokens and $1.20 per million output tokens.
With an illustrative 3,000-token complete input and the full 2,048-token output
cap, one attempt is about $0.00306; 20/day is $0.0612/account/day or $1.83 over
30 fully used days. At 30,000 input tokens the same ceiling is about
$0.1692/day or $5.07/30 days. These are estimates, not measured token usage or
hard dollar caps; include system/developer/schema overhead, applicable cache
writes/service tiers/regional rates and failed provider attempts in real billing.
Input byte limits are not token limits. Multiply by active accounts: 1,000
accounts fully using the 3,000-token scenario is approximately $61.15/day,
excluding hosting/database/auth costs. Verify account billing/model access and
measure usage before widening the pilot; account quotas do not cap global spend.

## Verification and remaining hosting gates

Local evidence: ignored `.verification/compiler-quota/`. Unit tests simulate RPC
decisions; browser tests exercise the real built Next route and Supabase SDK
against loopback Auth, quota and model HTTP fixtures. They prove rejection makes
no model call and preserve browser intent, not database locking or real JWTs.
The quota alert displays bounded Retry-After guidance. Keyboard focus returns
to Generate after a request disables the button, unless the user moved focus
elsewhere. A browser assertion exposed that focus loss; the implementation was
corrected without removing the assertion.

`npm.cmd run test:quota-db` is an opt-in multi-connection PostgreSQL harness.
It only connects to `127.0.0.1`, database `promptsuno_quota_test`, user `postgres`,
port `LOCAL_QUOTA_TEST_PORT` (default 54322), and refuses a nonempty database.
Inherited libpq `PG*` overrides are removed, including PGHOSTADDR/PGSERVICE;
an optional local-only password comes from LOCAL_QUOTA_TEST_PASSWORD. No password
prompt, host argument or remote connection string is accepted.
Use a disposable local cluster: its Auth shim and roles are fixtures, and roles
are cluster-wide. Create the empty database externally; normal local PostgreSQL
authentication applies. The runner applies the migration to that disposable
database only and retains it for inspection. It covers simultaneous first-use,
cross-user isolation, both-window denial, rollover across a held lock, rollback,
grants, missing/invalid configuration, duration changes and account deletion.

No local psql/postgres/initdb, Docker/Supabase CLI or PostgreSQL service was found.
The database harness exited with `spawn psql ENOENT`: **0 database checks ran**.
Consequently SQL parsing/execution, actual locking, transaction rollback, grants,
RLS, FK deletion and database-clock boundaries were inspected only, not proven.
No remote database was contacted to compensate. This remains a hosting gate.

Before hosting, require all of the following:

1. Execute and review the database harness on a disposable PostgreSQL instance,
   then verify real Supabase/PostgREST JWT identity, grants and RPC shape in an
   explicitly authorized staging project. Include concurrent separate sessions,
   outage/ambiguous-commit tests, refresh/revocation and forged identity attempts.
2. Explicitly approve the target migration/access policy and numerical launch
   limits/windows. Apply the migration and policy only under separate approval;
   verify missing policy still yields 503 and exhaustion yields 429/no model call.
3. Approve signup/anti-abuse policy and global provider spend controls, alerts,
   statement timeouts and an operator response procedure. Review actual token
   costs and Supabase/database capacity. Per-account quotas alone do not prevent
   multi-account abuse or bound aggregate application cost.
4. Verify hosted origin/cookie behavior and real-account acceptance without
   exposing credentials, then obtain separate hosting/deployment authorization.

## Changed files

| File | Change |
| --- | --- |
| `supabase/migrations/202609280001_compiler_quota.sql` | Private quota policy/counters and atomic argument-free RPC |
| `src/lib/compiler-quota.ts` | Bounded RPC call and fail-closed result validation |
| `src/app/api/generate/route.ts` | Reserve before provider; 429/Retry-After and safe 503 |
| `src/components/Workspace.tsx` | Quota guidance, retained intent and request focus restoration |
| `tests/generate-route.test.ts` | Guard ordering, simulated concurrent/isolation decisions, failure/no-call assertions |
| `tests/workspace.test.tsx` | Quota guidance and realistic pasted-note test setup |
| `tests/e2e/compiler-quota.spec.ts` | Built-route and browser quota checks |
| `tests/e2e/compiler-security.spec.ts` | Existing stats assertion accepts added quota fixture count |
| `tests/e2e/workspace.spec.ts` | Bound Auth navigation and lazy Canvas startup waits to 30 seconds |
| `tests/e2e/server.mjs` | Loopback quota/provider-failure fixtures |
| `tests/db/compiler-quota.mjs` | Opt-in local PostgreSQL migration/RPC checks |
| `package.json` | Local database verification command; no dependency change |
| `README.md` | Current hosting gate |
| `docs/authority/PromptSuno-Development-Handoff-v1.md` | Current quota decision and remaining gates |
| `docs/implementation/Paid-Compiler-Security.md` | Historical-base clarification and successor report link |
| `docs/implementation/Atomic-Compiler-Quota.md` | Migration review, configuration, cost rationale and evidence |

## Verification results

| Command/check | Result | Evidence under `.verification/compiler-quota/` |
| --- | --- | --- |
| `npm.cmd run lint` | 0 errors, 2 baseline unused-variable warnings (middleware and Supabase server helper) | `lint-verified.log` |
| `npm.cmd run typecheck` | Route type generation and TypeScript completed successfully | `typecheck-final.log` |
| `npm.cmd run typecheck` after browser harness changes | Successful | `typecheck-browser-harness.log` |
| `npm.cmd test` | 95 passed, 0 failed, 0 skipped across 3 files after focus correction | `unit-verified.log` |
| `npm.cmd run build` | 8/8 static pages, 0 warnings, 0 errors | `build-final.log` |
| `npm.cmd run test:quota-db` | Unavailable: psql ENOENT; 0 database checks executed | `database.log` |
| `node --check tests/db/compiler-quota.mjs` and `node --check tests/e2e/server.mjs` | Both parsed successfully | Terminal check |
| `node node_modules/eslint/bin/eslint.js tests/db/compiler-quota.mjs` | 0 errors, 0 warnings after loopback-environment hardening | `database-script-lint.log` |
| `node node_modules/eslint/bin/eslint.js tests/e2e/compiler-quota.spec.ts tests/e2e/workspace.spec.ts` | 0 errors, 0 warnings after browser setup changes | `browser-harness-lint.log` |
| Credential/client bundle scan | 71 files including 14 client JS chunks; no configured key value exposed, no server quota/credential markers in client chunks | `credential-scan-final.log` |
| `git diff --check`, protected refs and unrelated SHA-256 checks | No whitespace errors; existing branch refs and all three unrelated file hashes unchanged | Baseline receipts and Git inspection |

Build used process-local NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3132,
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-fixture-placeholder and NEXT_TELEMETRY_DISABLED=1.
Browser Auth/quota/model fixtures bind loopback and override inherited provider
credentials; there was no real paid model call. Baseline Three.js CommonJS and
Playwright NO_COLOR/FORCE_COLOR warnings remain. Expected fixture Auth failures
and generic provider-failure diagnostics are not evidence of a live outage.
Hosted CI, real Supabase accounts, actual database behavior, physical devices
and real model/audio acceptance have not been verified.

Browser command receipts (all use a built production server, one worker and no
automatic retries; PLAYWRIGHT_HTML_OUTPUT_DIR points to the corresponding
ignored report directory):

| Exact command | Result | Evidence |
| --- | --- | --- |
| `npm.cmd run test:e2e -- --output=.verification/compiler-quota/browser-results` | 17 passed, 4 failed, 0 skipped | `browser.log` |
| `npm.cmd run test:e2e -- --output=.verification/compiler-quota/browser-results-final` | 15 passed, 6 failed, 0 skipped; all 6 security cases passed | `browser-final.log` |
| `npm.cmd run test:e2e -- tests/e2e/compiler-quota.spec.ts tests/e2e/workspace.spec.ts --output=.verification/compiler-quota/browser-results-affected` | 13 passed, 2 failed, 0 skipped; all 9 workspace cases passed | `browser-affected.log` |
| `npm.cmd run test:e2e -- tests/e2e/compiler-quota.spec.ts --output=.verification/compiler-quota/browser-results-quota-verified` | 6 passed, 0 failed, 0 skipped in 2.8 minutes, all three browser projects | `browser-quota-verified.log` |

These are distinct runs, not a claim of one clean full-suite pass. Final quota
verification passed all six cases, including provider failure retained against
quota, exhausted Retry-After, missing policy/database failure, concurrent request
decisions and zero extra model calls. The final sources have passing coverage
for six quota cases, nine workspace cases and six security cases across those
separate runs. The final quota run exited normally. Mobile and desktop quota
screenshots were visually inspected: readable retry guidance, unchanged notes
and selection, visible keyboard focus, and no horizontal overflow. These are
emulated browsers, not physical-device or assistive-technology acceptance.

Failure receipts retained:

- `unit.log`: 91 passed, 4 failed, 0 skipped. Two existing component tests
  timed out while typecheck overlapped; subsequent typing contaminated later
  interaction tests. `unit-serial.log`: 93 passed, 2 failed, 0 skipped; the long
  note setup still exceeded five seconds and typed into the next test.
  Changed that setup to paste the exact same passage as one input action;
  preserved all assertions and timeouts. `unit-final.log` then recorded
  95 passed, 0 failed, 0 skipped before the later browser focus correction.
- `browser.log` / `browser-results/`: 17 passed, 4 failed, 0 skipped in 6.8 minutes.
  Three quota cases exposed Generate focus loss across all browser projects;
  one existing desktop case exceeded its five-second Canvas-ready assertion.
  Browser evidence after correction is separate; no assertion was removed.
- `browser-final.log` / `browser-results-final/`: 15 passed, 6 failed, 0 skipped
  in 10.1 minutes after focus correction. All six existing security checks
  passed. Five quota checks passed; the WebKit quota UI check failed during
  login setup, before quota assertions. The other failures were existing
  workspace login/Canvas startup waits. Some WebKit login snapshots showed
  email cleared during initialization. The quota UI case now uses the same
  fixture-issued cookie session as its concurrent API case, then visits the
  real workspace; compiler-security retains browser sign-in coverage. Existing
  workspace Auth/navigation and lazy-Canvas setup waits are explicitly bounded
  at 30 seconds; interaction assertions and their timeouts remain unchanged.
- `browser-affected.log` / `browser-results-affected/`: 13 passed, 2 failed,
  0 skipped in 12.1 minutes. The two Chromium quota UI cases waited for
  `networkidle` until their test deadlines despite a rendered workspace.
  Corrected that new test to wait for DOMContentLoaded and visible controls.
  The edit occurred during this diagnostic pass; only the later independent
  quota run is treated as final evidence for the quota test source. All nine
  workspace cases passed with the final bounded startup waits. No product
  runtime source changed after the verified build and 95-test unit run.
