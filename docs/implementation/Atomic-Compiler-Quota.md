# Atomic compiler usage quota

Status: local SQL and full browser verification passed; **HOSTING BLOCKED**.
The subsequent publication work package authorizes pushing a stacked draft PR
and obtaining hosted CI, while remote migration/policy, paid model calls, Vercel,
deployment, promotion and merge remain gated. Historical receipts below retain
the authority and outcomes of their original work packages.

Latest follow-up (2026-09-28): real disposable PostgreSQL 17.11 passed 17/17;
one independent full browser run passed 21/21 with zero retries; unit tests
passed 95/95. Typecheck, build and security scans passed; lint has zero errors
and two existing warnings. See the [final receipt](#final-full-suite-receipt--one-independent-run)
and [staging assessment](#staging-application-assessment). Earlier failed and
aborted receipts remain below; real Supabase/JWT and hosting gates remain open.

## Hosted publication follow-up

Remote inspection on 2026-09-28 verified PR #2 is an open draft at
`3d44bfdb6ee4e6f44a65faf4c30cea26df58861a`, branch
`codex/sound-brain-compiler-bridge`, based on main. PR #3 is an open draft at
`443f9f474bbee60ccdcd6a1da3d0434d46efd0a1`, branch `codex/minimum-pr-ci`,
also based on main. Neither PR is modified. PR #2's exact head is an ancestor
of the quota branch and its merge base; use that branch as the stacked base.
Its already-adopted CI workflow derives from PR #3; do not stack against PR #3
and reintroduce PR #2's implementation as a misleading diff.

CI now includes a separately reported `PostgreSQL 17 quota integration (17 checks)`
job with a disposable service, loopback-only published port and empty
`promptsuno_quota_test` database. It runs the unchanged opt-in harness and uploads
its receipt separately from the existing unit/build/browser steps. No real Auth,
deployment credential, remote database or paid model is used. Failure propagates
through pipefail; no check is weakened or retried into a pass.

The [staging approval packet](Compiler-Quota-Staging-Approval.md) records the
unchanged migration hash, proposed private policy, target evidence gaps,
read-only preflight, application/verification sequence and rollback. The exact
staging target is not designated; this is a blocking approval-packet field,
not permission to select a project. Hosted evidence will be linked in the draft
PR after its final head completes. Earlier failed/aborted local receipts remain
preserved under their original ignored verification directories.

Publication-local checks (`.verification/quota-publish/`): unchanged real harness
passed 17/17 on a fresh PostgreSQL 17.11 loopback cluster at port 55440; the
cluster was stopped normally. `npm.cmd test` passed 95/95 across three files,
0 failed/skipped; `npm.cmd run lint` had 0 errors and the two existing warnings.
`node --check tests/db/compiler-quota.mjs`, workflow parsing with installed
`js-yaml` plus isolation/failure-propagation assertions, and `git diff --check`
passed. `node .verification/quota-real/security-scan.mjs` checked 75 files and
14 client chunks with 0 exposed configured credentials or server markers.
Runtime sources remain unchanged; the earlier 21/21 full browser, typecheck and
8/8-page build receipts remain applicable local evidence, separately from the
forthcoming hosted run. These CI/documentation edits add no app behavior.

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

Rollback guidance: quiesce API traffic, then disable new reservations by deleting
the singleton private policy row in a separately authorized operator session.
Zero limits are invalid, so setting a limit to zero is not a disable procedure.
Policy deletion waits for existing reservations holding its shared lock; it
cannot cancel already authorized model work. Preserve the approved policy values
and usage rows for restoration. Restoring policy does not refund consumption or
reset stored expiry times. Do not truncate counters, drop production data, or
remove the route guard as an automatic rollback; those require separate operator
decisions. No remote rollback or destructive production action was applied here.

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

Historical baseline at `739f44005a694559f01f724c38b39d2f536c26b5`:
no local psql/postgres/initdb, Docker/Supabase CLI or PostgreSQL service was found.
The database harness exited with `spawn psql ENOENT`: **0 database checks ran**.
Consequently SQL parsing/execution, actual locking, transaction rollback, grants,
RLS, FK deletion and database-clock boundaries were inspected only, not proven.
No remote database was contacted to compensate. The follow-up evidence below
supersedes this local database blocker; real Supabase acceptance remains a gate.

Before hosting, require all of the following:

1. Local PostgreSQL harness execution is now recorded below. Verify real
   Supabase/PostgREST JWT identity, grants and RPC shape in an
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

The tables and failure receipts in this section are historical implementation
evidence from the baseline commit. Current follow-up receipts are recorded below.

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

## Follow-up verification — real disposable PostgreSQL, 2026-09-28

Starting branch and HEAD were verified as `codex/atomic-compiler-quota` and
`739f44005a694559f01f724c38b39d2f536c26b5`. Three unrelated untracked files and
branch/remote refs were recorded in `.verification/quota-real/baseline-*` before
editing. No remote database, paid model, remote policy, PR or deployment is used.

### PostgreSQL method and identity

No PostgreSQL/container binaries were on PATH; `wsl --list --quiet` reported WSL
uninstalled. Used the portable Windows archive linked by the
[official EDB binary page](https://www.enterprisedb.com/download-postgresql-binaries),
file ID `1260569`: `https://sbp.enterprisedb.com/getfile.jsp?fileid=1260569`.
Downloaded archive SHA-256:
`b9424ee7bc60b52450ff910a3630225df32e633f3cb29c1d126d9299d59aea28`.
This is a recorded download fingerprint, not an independently published vendor
checksum. The executable reports PostgreSQL 17.11, MSVC 19.44.35228, x86-64 Windows.
Only `pgsql/bin`, `pgsql/lib` and `pgsql/share` were extracted. No service, system
installation, global PATH, shared cluster or machine configuration was changed.

All paths below resolve from `C:\codex-projects\PromptSuno`. Download/extraction
receipts and initialized cluster are ignored under `.verification/quota-real/`.
Commands actually used (PowerShell):

```powershell
Invoke-WebRequest 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260569' -OutFile .verification/quota-real/postgresql-binaries.zip -TimeoutSec 180
Get-FileHash .verification/quota-real/postgresql-binaries.zip
# Extraction used System.IO.Compression.ZipFile, restricted to bin/lib/share.
$pgBin = Join-Path $PWD '.verification/quota-real/portable/pgsql/bin'
$pgData = Join-Path $PWD '.verification/quota-real/pgdata'
$probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,55439)
$probe.Start()
$probe.Stop()
& "$pgBin\initdb.exe" -D $pgData -U postgres -A trust -E UTF8 --locale=C
Add-Content -LiteralPath "$pgData\postgresql.conf" -Value "`nlisten_addresses = '127.0.0.1'`nport = 55439`ncluster_name = 'promptsuno-disposable-quota'"
& .verification/quota-real/portable/pgsql/bin/pg_ctl.exe -D "$PWD\.verification\quota-real\pgdata" -l "$PWD\.verification\quota-real\postgres.log" -w -t 20 start
& .verification/quota-real/portable/pgsql/bin/createdb.exe -h 127.0.0.1 -p 55439 -U postgres promptsuno_quota_test
$env:PATH = "$PWD\.verification\quota-real\portable\pgsql\bin;$env:PATH"
$env:LOCAL_QUOTA_TEST_PORT = '55439'
npm.cmd run test:quota-db
```

Startup inside the sandbox failed with `could not create restricted token: error
code 87`; its harness attempt reported connection refused, **0 checks executed**
(`database-first.log`). Retrying `pg_ctl start` outside that Windows sandbox
restriction succeeded against the same isolated directory and loopback port.
Trust authentication applies only to this temporary fixture cluster; no app
credential was created. The final harness's database identity was:

| Attribute | Actual value |
| --- | --- |
| PostgreSQL | 17.11 on x86_64-windows, compiled by msvc-19.44.35228, 64-bit |
| Database / user | `promptsuno_quota_test` / `postgres` |
| Address / port | `127.0.0.1` / `55439` |
| Data directory | `C:/codex-projects/PromptSuno/.verification/quota-real/pgdata` |
| Cluster name | `promptsuno-disposable-quota` |
| Transaction isolation | `read committed` |

Each rerun used this exact disposable database reset, never another cluster:

```powershell
& .verification/quota-real/portable/pgsql/bin/dropdb.exe -h 127.0.0.1 -p 55439 -U postgres promptsuno_quota_test
& .verification/quota-real/portable/pgsql/bin/createdb.exe -h 127.0.0.1 -p 55439 -U postgres promptsuno_quota_test
npm.cmd run test:quota-db
```

The first connected run stopped after **2 passed checks** on CRLF versus LF in a
two-row text comparison (`database-first-running.log`). The harness now waits
for drained process output (`close`) and normalizes psql CRLF. The next run
passed **17 checks** (`database-second.log`). After adding Supabase-like default
grants and the post-deletion FK assertion, the final run passed **17 checks,
0 failed, 0 skipped**, exit 0 (`database-final.log`). It applies the actual
migration bytes with `ON_ERROR_STOP=1`; no simulated RPC response substitutes
for these database checks. Migration SHA-256 is unchanged:
`bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`.

### Database coverage and security findings

- First use: 32 concurrent connections across two users allowed exactly 6 and
  denied 26; each user's persisted counters were `3,3`.
- Existing rows: 24 concurrent connections starting at `1,1` allowed exactly 4
  and denied 20 across two users; both ended at `3,3`.
- Burst-only, sustained-only and both-window exhaustion retain counts; a full
  row comparison proves burst denial does not alter stored expiries. Both-window
  denial reports the later reset, with integer ceiling Retry-After.
- Independent expiry, simultaneous rollover and epoch alignment passed. A row
  held across expiry was eligible only after its lock was released, confirming
  wall-clock evaluation after acquisition. The test does not inject a clock or
  pretend to sample an exact nanosecond equality with the database clock.
- Explicit rollback and row-lock timeout leave counters unchanged. A blocked
  user's row did not block the other user's successful reservation.
- Backend termination while a transaction was open rolled its reservation back;
  termination after commit retained `1,1`. The harness waits for a known backend
  phase and intentionally does not deliver a successful RPC result to its caller.
  This is real PostgreSQL ambiguous-outcome evidence, not proof of HTTP-abort
  semantics in hosted PostgREST.
- Lowered allowance applies immediately. Changing durations preserves active
  expiries and applies each new duration at its own next rollover.
- Missing policy before first use and policy deletion for existing users fail
  closed. Invalid, null, zero and inconsistent policy values are rejected.
- Supabase-like table/function/schema default grants are installed **in the
  disposable fixture only** before migration. Actual ACL inspection proves
  `authenticated` alone can execute the public RPC; PUBLIC, anon and service_role
  cannot. All three client roles lack private-schema USAGE and the inspected
  SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER table permissions.
- Both tables have RLS and no client policies. Diagnostic transactions grant
  temporary SELECT/INSERT: reads see zero rows and inserts are rejected by RLS.
  All temporary grants are rolled back. Function/table ownership is `postgres`;
  the function has zero arguments, SECURITY DEFINER, empty search_path and 3s
  lock_timeout. Application security and ownership requirements remain unchanged.
- Account deletion cascades only that account's row; attempting to reserve with
  its deleted subject fails the FK and leaves the other account's row intact.

No migration SQL defect was exposed and no migration/security assertion was
relaxed. The harness's numerical fixtures are isolated test data, not a seeded
launch allowance. **3/60 seconds and 20/86,400 seconds remain an unapproved pilot
recommendation**, with no production entitlement or remote policy applied.

### Auth shim / real Supabase and PostgREST gap

The fixture supplies `request.jwt.claim.sub` under a local role and implements
`auth.uid()` as a simple GUC-to-UUID SQL function. Its two-row `auth.users` table
contains only UUIDs. A trusted local superuser can supply any subject; this is
not JWT validation, real Auth lifecycle, or an application credential.
Real [PostgREST transactions](https://docs.postgrest.org/en/stable/references/transactions.html)
set transaction role/settings, including verified claims in `request.jwt.claims`;
the target's actual `auth.uid()` implementation and JSON-claim compatibility must
be inspected. Real [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts),
signatures, issuer/audience, expiry, refresh/revocation, Auth deletion lifecycle,
authenticator membership, project grants/defaults, schema exposure/cache, RPC
JSON shape and statement/HTTP timeout behavior remain **unverified locally**.
The fixture's superuser object owner is not evidence of the real target owner.

Browser tests still use loopback HTTP Auth/quota/model fixtures. They test the
built route's ordering and rejection behavior; they do not couple the browser
to this PostgreSQL cluster or validate real JWTs. Database and browser evidence
are separate, complementary receipts. No real paid model request was made.

### Browser defect corrections

Before edits, `login-diagnostic.log` reproduced **5 failures / 3 passes** across
eight fresh contexts: all four WebKit sign-ins had an empty email after `fill`,
and the first Chromium workspace stalled on a blocked Troika CDN font-index
request. The diagnostic uses bounded 30s waits; it is not the full-suite receipt.

Login now disables SSR controls until hydration using `useSyncExternalStore`.
The shared browser helper waits for enabled inputs, asserts their values, signs
in normally, and waits up to 30s for URL, collection controls and Canvas. It uses
DOMContentLoaded rather than networkidle; all interaction assertions remain.
Canvas labels now load an unmodified, local Geist TTF plus its OFL license,
avoiding the default external resolver for current catalog labels. Physics,
raycast and mutable animation ownership are unchanged.

The focused WebKit command exercised the actual sign-in/revocation flow and the
complete selection/copy/export flow: **2 assertions-complete cases**, but its
sandboxed Windows fixture teardown hung. `taskkill /PID 16428 /T /F` returned
`ERROR: Access denied` (`teardown-sandbox.log`). A scoped elevated cleanup of
that confirmed diagnostic fixture tree succeeded (`teardown-cleanup.log`), after
which the runner exited 0 with 2 passed in 2.8m. This assisted diagnostic is not
claimed as an independently clean run. The full run uses normal Playwright
Windows cleanup with the necessary process permission, one worker and no retries.

The first browser build failed on 11 stale `.next/dev/types` errors generated by
the diagnostic dev launch (`build-browser.log`). Removing that task-generated
directory corrected the build: 8/8 static pages, 0 warnings, 0 errors
(`build-browser-corrected.log`). No TypeScript assertion or source check was
weakened. Earlier implementation failure receipts above are retained unchanged.

The first independent full follow-up run (`browser-full-final.log`,
`results-full-final/`, `report-full-final/`) exited normally with **20 passed,
1 failed, 0 skipped in 12.9m**, exit 1. The failure was the mobile WebKit quota UI
case: provider-error and exhausted-quota/focus assertions passed, but an
artifact-only `scrollIntoViewIfNeeded()` consumed **72,416ms** in the trace and
exhausted the unchanged 120s deadline. Missing-policy/store-error browser checks
in that case were not reached; they were unverified in this full-run receipt.
Its trace, screenshot and error context are retained unchanged.

Correction: frame that screenshot with immediate DOM `scrollIntoView` and give
screenshot capture a 10s limit. No state, focus, security, quota assertion or
test deadline was removed or increased. The subsequent focused WebKit quota case
passed **1/1, 0 failed, 0 skipped**, 10.5s test / 16.1s run, exit 0
(`browser-quota-diagnostic.log`). The subsequent independent full-suite receipt
below, rather than aggregation with that focused result, governs the clean-suite
claim.

The next full run (`browser-full-clean.log`, `results-full-clean/`,
`report-full-clean/`) exited normally with **20 passed, 1 failed, 0 skipped in
14.8m**, exit 1. All six quota cases passed, including the repaired WebKit case.
The remaining mobile Chromium raycast case passed every collection/removal
assertion, then failed during context teardown: the trace records **114,483ms**
in the context fixture. It is still a failed case and this is still a failed
full-suite receipt. The failure trace/screenshot/error context are retained.

A two-variant blank-canvas renderer diagnostic reported real WebGL2 and the
SwiftShader Vulkan renderer with both current and explicit software flags
(`renderer-diagnostic.log`). No browser flags, pixel ratio, or rendering assertions
were changed. The workspace fixture now navigates the completed page to
`about:blank` with a 10s deadline before context disposal, so its active Canvas
stops first. Cleanup failure remains observable as test failure; there is no
catch-and-ignore or force-kill inside the test.

Two independent mobile Chromium raycast repetitions with that cleanup passed
**2/2, 0 failed, 0 skipped**, in 2.9m, exit 0
(`browser-drag-diagnostic.log`). This diagnoses teardown without replacing the
full-suite requirement or changing browser rendering flags, pixel ratio,
application behavior, collection/removal assertions or the 120s test deadline.

The third full diagnostic (`browser-full-3.log`, `results-full-3/`,
`report-full-3/`) exited normally with **20 passed, 1 failed, 0 skipped in
17.0m**, exit 1. The desktop Chromium drag case exhausted its deadline while
searching a moving scene. Its selected-count assertion passed; the chip identity,
disabled Generate and removal assertions were not reached. A subsequent fixture
edit occurred while this diagnostic's remaining WebKit cases were running, so
this receipt is also explicitly **not** final-source verification.

A bounded browser-side pointer discovery experiment (`browser-raycast-scan.log`)
recorded **1 passed, 2 failed, 0 skipped**, exit 1: desktop discovery became stale
as the nodes moved; mobile Canvas layout disappeared during asynchronous text
loading. Adding controlled animation time (`browser-raycast-clock.log`) recorded
**2 passed, 1 failed, 0 skipped**, exit 1, with only that mobile layout race left.
The final focused drag run (`browser-raycast-ready.log`) passed **3/3, 0 failed,
0 skipped**, in 25.2s, exit 0.

The drag fixture installs [Playwright Clock](https://playwright.dev/docs/clock)
before application scripts, holds animation between pointer actions, and advances
the real animation callbacks for the native drag. A bounded 30s readiness poll
advances frames until the asynchronously loaded Canvas has a layout box. Pointer
discovery dispatches actual pointer events; native mouse hover revalidates each
candidate before the native mouse drag. No scene reference, physics callback,
collection handler or selected record is mocked. All identity, collection,
disabled-control and removal assertions remain; application animation code and
the global 120s deadline are unchanged. The fixture clock is restricted to this
drag test and is unrelated to the real database clock tests.

The disposable PostgreSQL process was stopped after the database receipt:

```powershell
& .verification/quota-real/portable/pgsql/bin/pg_ctl.exe -D "$PWD\.verification\quota-real\pgdata" -m fast -w -t 20 stop
```

`postgresql-stop.log` records **server stopped, exit 0**. The ignored cluster and
all failed-run evidence are retained locally; no shared process was stopped.

The fourth full run (`browser-full-4.log`, `results-full-4/`, `report-full-4/`)
exited normally with **20 passed, 1 failed, 0 skipped in 9.9m**, exit 1. All
three drag cases passed. The first mobile Chromium quota UI case instead
received 503 where the provider-failure fixture required 502; subsequent quota
exhaustion/missing-policy/store-error assertions were not reached in that case.
The trace records about **20,007ms** for that request. The trace alone does not
prove whether the quota request timed out or another upstream failure caused
the fail-closed response. It remains a failed receipt, with trace, screenshot
and error context preserved; the expectation was not changed to accept 503.

The quota UI fixture now also installs the browser clock before application
scripts and holds unrelated Canvas animation while exercising real HTTP calls
and UI feedback. The server's 5s quota deadline, 30s provider deadline, database
clock and expected 502/429/503 responses remain wall-clock and unchanged. The
concurrent real-route API test and session-security tests use no paused clock.
No RPC, route response or model-call assertion was replaced by a new mock.

The first clock diagnostic (`browser-quota-clock.log`) stalled at an added,
unconditional `Response.body` read after the first provider response. One case
reached its 120s deadline; the remaining diagnostic was interrupted by terminating
only its confirmed runner PID 16056 and children (`quota-clock-stop.log`). It is
an **aborted diagnostic, not a passing suite**. Its partial traces are preserved
in `results-quota-clock/`. That response-body read was removed; the original
strict status assertion remains. Quota fixture cleanup now stops its page via
bounded `about:blank` navigation before resetting HTTP fixture state.

The next quota repetitions (`browser-quota-clock-corrected.log`) exited normally
with **5 passed, 1 failed, 0 skipped in 59.8s**, exit 1. The failure occurred
before provider submission: `clock.pauseAt` rejected the runner's wall-clock
timestamp as earlier than the browser's virtual time. Both controlled-clock
fixtures now obtain their pause timestamp from `Date.now()` **inside the browser**.
This changes only the test clock anchor, not server/database time or any expected
quota outcome. All these failed receipts remain distinct from final verification.

After that clock-anchor correction, both quota UI and native drag tests ran twice
per browser project: **12 passed, 0 failed, 0 skipped in 2.1m**, exit 0
(`browser-clock-aligned.log`, `results-clock-aligned/`, `report-clock-aligned/`).
Exact command:

```powershell
$env:PLAYWRIGHT_HTML_OUTPUT_DIR = '.verification/quota-real/report-clock-aligned'
npm.cmd run test:e2e -- --grep='quota and provider|real raycast' --repeat-each=2 --output=.verification/quota-real/results-clock-aligned
```

This focused diagnostic does not replace the independent full-suite receipt.

The fifth full run (`browser-full-5.log`, `results-full-5/`, `report-full-5/`)
exited normally with **20 passed, 1 failed, 0 skipped in 4.3m**, exit 1. The
mobile Chromium drag case failed at `clock.pauseAt` before attempting a drag;
all collection/identity/removal assertions in that case were unverified. A
browser-derived timestamp still became stale during the protocol round trip
under rendering load. Its trace/screenshot/error context are retained.

A pre-navigation pause experiment (`browser-clock-before-app.log`) reported two
failures before it was interrupted: the first quota case exhausted 120s at its
initial control click; the drag case could not initialize its login/Canvas in
35.2s. Initial layout/actionability callbacks were held along with animation.
This is another **aborted diagnostic**, not a completed suite. The confirmed
runner PID 17344 and its children alone were stopped (`clock-before-app-stop.log`);
its partial traces/error contexts remain in `results-clock-before-app/`.

The final setup follows [Playwright's documented clock lifecycle](https://playwright.dev/docs/api/class-clock#clock-pause-at):
install before navigation, let page loading run normally, then pause at a
browser-derived timestamp buffered by one virtual minute. `pauseAt` fires due
timers at most once; it does not wait a real minute or extend the deadline.
That buffer prevents a busy renderer's protocol round trip overtaking the pause
timestamp. Explicit `runFor` drives the real readiness/drag animation afterward.
The fixture's hour-long simulated session remains valid; these two tests do not
claim real JWT-expiry coverage. Session-security tests and all server/database
clocks remain unaffected. No timeout or assertion was relaxed.

The affected tests with this final buffer (`browser-clock-buffered.log`,
`results-clock-buffered/`, `report-clock-buffered/`) passed **6/6, 0 failed,
0 skipped in 2.8m**, exit 0. Exact command:

```powershell
$env:PLAYWRIGHT_HTML_OUTPUT_DIR = '.verification/quota-real/report-clock-buffered'
npm.cmd run test:e2e -- --grep='quota and provider|real raycast' --output=.verification/quota-real/results-clock-buffered
```

### Staging application assessment

Local PostgreSQL execution found no SQL migration defect. The unchanged migration
is a candidate for a **separately authorized staging application**, after review
of the named target's migration owner, role/default ACLs, private-schema exposure,
`auth.uid()` claim compatibility and operational timeout/rollback plan. That is
not authorization to apply it or seed a policy. No remote SQL or entitlement was
changed here.

Staging must then verify actual Supabase/PostgREST/JWT behavior and real-account
acceptance, including RPC schema-cache/JSON shape, rejection paths, refresh and
revocation, deletion and ambiguous HTTP outcomes. Hosting additionally requires
an approved numerical policy, spend/abuse controls and independent deployment
authorization. **3/60 seconds and 20/86,400 seconds are still only an unapproved
pilot recommendation.** Local/browser fixture evidence does not close those
gates, physical-device or assistive-technology acceptance, or paid-model acceptance.

### Final fixture corrections before the final receipt

The sixth full run (`browser-full-6.log`, `results-full-6/`, `report-full-6/`)
exited normally with **19 passed, 2 failed, 0 skipped in 5.6m**, exit 1:

- Desktop Chromium session-security: a fixture-only `GET /__fixture/stats`
  failed with `read ECONNRESET`. The trace proves the reset, not its packet-level
  cause. Stale keep-alive reuse after a long software-rendered UI step is the
  working diagnosis. Fixture responses now send `Connection: close`, removing
  idle-socket reuse from this disposable HTTP fixture. No request retry, status
  allowance, application deadline or production networking change was added.
- WebKit drag: the duplicate 5s Canvas visibility assertion ran before the
  already existing bounded font/frame-readiness poll; asynchronous Text loading
  hid the Canvas during that assertion. The same visibility assertion now runs
  **after** that poll, before target discovery and dragging. It was preserved,
  not removed or given a longer assertion timeout.

Both failure traces/screenshots/error contexts are retained. Hosted connection
pooling, idle socket handling and HTTP abort semantics remain real PostgREST /
hosting gates; fixture `Connection: close` does not verify them.

The corrected session-security and drag cases passed **6/6, 0 failed, 0 skipped
in 2.0m**, exit 0 (`browser-fixture-final.log`, `results-fixture-final/`,
`report-fixture-final/`):

```powershell
$env:PLAYWRIGHT_HTML_OUTPUT_DIR = '.verification/quota-real/report-fixture-final'
npm.cmd run test:e2e -- --grep='browser session reaches|real raycast' --output=.verification/quota-real/results-fixture-final
```

### Final full-suite receipt — one independent run

```powershell
$env:PLAYWRIGHT_HTML_OUTPUT_DIR = '.verification/quota-real/report-full-7'
npm.cmd run test:e2e -- --output=.verification/quota-real/results-full-7
```

`browser-full-7.log` records **21 passed, 0 failed, 0 skipped in 3.5m**, exit 0.
All seven cases passed in each project: Pixel 7 mobile Chromium, desktop Chromium
at 1440×1000, and iPhone 13 mobile WebKit. Configuration remains one worker,
zero retries and a 120s test deadline. Windows runner and fixture cleanup exited
normally, with no assisted kill for this receipt. `results-full-7/.last-run.json`
reports `passed` and no failed tests. HTML report: `report-full-7/index.html`.
These are ignored local evidence under `.verification/quota-real/`, not committed
or hosted artifacts.

The source manifest `browser-full-7-source-hashes.json` was captured before the
run. Final application, migration, configuration and test source hashes still
match it; only subsequent documentation changes differ. This clean-suite claim
comes from this single complete run, **not** combined focused or failed runs.
No case in the final suite remains unverified. Earlier six full follow-up runs,
failed focused runs and aborted experiments remain separately retained above.

The run exercises actual sign-in/navigation, quota/provider/store errors,
concurrent real-route requests, rejected sessions/intent, loading/retry,
clarification, edited copy/export, keyboard removal/focus, native raycast
dragging and synchronized removal. Page/runtime assertions and overflow checks
passed. Expected negative-fixture Auth/provider errors and Node's NO_COLOR /
FORCE_COLOR warning remain in the log; they are not unexpected application
page errors. Desktop/mobile full workspace screenshots and the mobile WebKit
quota screenshot were inspected: notes, selected records, output/actions and
keyboard focus/retry copy are visible without horizontal page overflow. Canvas
perspective/physics remain the existing design; this task adds no visual redesign.

### Final serial application and security checks

After the complete browser runner exited, the following commands ran serially.
Build/type generation used process-local fixture configuration:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:3132'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-fixture-placeholder'
$env:NEXT_TELEMETRY_DISABLED = '1'
```

| Command | Exact result / local receipt |
| --- | --- |
| `npm.cmd run test:quota-db` | PostgreSQL 17.11: 17 passed, 0 failed, 0 skipped; exit 0; `database-final.log` (before cluster stop) |
| `npm.cmd run test:e2e -- --output=.verification/quota-real/results-full-7` | 21 passed, 0 failed, 0 skipped; 3.5m; exit 0; `browser-full-7.log` |
| `npm.cmd run lint` | 0 errors, 2 existing warnings; exit 0; `lint-final.log` |
| `npm.cmd run typecheck` | route type generation and TypeScript passed; exit 0; `typecheck-final.log` |
| `npm.cmd test` | 3 files / 95 tests passed; 0 failed, 0 skipped; 17.53s; exit 0; `unit-final.log` |
| `npm.cmd run build` | 8/8 static pages generated; 0 build warnings, 0 errors; exit 0; `build-final.log` |
| `node --check tests/db/compiler-quota.mjs` | exit 0; `db-syntax-final.log` |
| `node --check tests/e2e/server.mjs` | exit 0; `server-syntax-final.log` |
| `node .verification/quota-real/security-scan.mjs` | 75 files / 14 browser JS chunks scanned; 1 configured private credential value checked without printing it; 0 exposed values, 0 server-only quota/credential markers in client chunks; exit 0; `security-final.log` |
| `git diff --check` | no whitespace errors |
| `node .verification/quota-real/scan-staged.mjs` | exactly 14 scoped files, 0 exposed credential values, all staged text LF, migration not staged; exit 0; `staged-security-final.log` |
| `git diff --cached --check` | passed after trimming the new license copy's one trailing space; `staged-whitespace-final.log` |

The lint warnings are unchanged unused variables: `options` in `middleware.ts:22`
and `error` in `src/lib/supabase/server.ts:20`. They were not hidden or reclassified
as errors. The local security scan reads configured private credential values
only for comparison against tracked/new source and generated client chunks;
it does not print, serialize or commit those values. The scan script and all
receipts remain ignored local evidence. No privileged application credential,
client-controlled quota identity/limit, retry/refund or launch allowance was added.

The first staged whitespace check identified one trailing space in the newly
copied OFL license. Only that trailing space was trimmed; font bytes and license
terms are unchanged. The final staged whitespace check passed. This is a
documentation-format correction after the browser receipt, not runtime source.

No new hosted CI, real Supabase/PostgREST/JWT, paid-model, physical-device,
assistive-technology, staging or production acceptance was run. The local SQL,
browser and application checks close this work package's local verification
requirements only; the staging/hosting gates above remain.

### Scoped files and preservation

| Changed file(s) | Purpose |
| --- | --- |
| `src/app/login/page.tsx` | prevent pre-hydration controlled-input edits being lost |
| `src/components/SoundBrainCanvas.tsx` | use a local label font; no physics/animation ownership change |
| `public/fonts/Geist-Regular.ttf`, `public/fonts/OFL.txt`, `public/fonts/README.md` | unmodified font, license and provenance |
| `tests/db/compiler-quota.mjs` | real identity, drained portable output, concurrency/window/outcome/ACL/RLS/deletion coverage |
| `tests/e2e/login.ts` | shared bounded hydration-aware browser sign-in |
| `tests/e2e/compiler-quota.spec.ts` | bounded artifacts, controlled unrelated animation, page cleanup |
| `tests/e2e/compiler-security.spec.ts` | use real browser sign-in helper; retain security assertions |
| `tests/e2e/workspace.spec.ts` | bounded readiness/native raycast search and real frame driving; clean page disposal |
| `tests/e2e/server.mjs` | close disposable HTTP fixture connections to avoid stale idle-socket reuse |
| `README.md`, `docs/authority/PromptSuno-Development-Handoff-v1.md`, this report | actual local evidence, corrected rollback and remaining authority/hosting gates |

The SQL migration itself, package/configuration files and launch recommendation
are unchanged. The follow-up commit is limited to these **14 files**, on
`codex/atomic-compiler-quota`, directly after the verified starting HEAD
`739f44005a694559f01f724c38b39d2f536c26b5`.

Preservation receipts prove all three unrelated untracked file hashes and all
recorded branch/remote refs match baseline before commit. An initial all-ref
comparison exposed additional `refs/codex/turn-diffs/*` checkpoints outside that
branch/remote export; these were recorded and preserved, not deleted or rewritten.
Only the authorized current branch advances for the scoped commit. No source
ZIP, unrelated file, existing PR/ref, failure receipt or database evidence was
cleaned away. There was no push, PR creation/update, merge, Vercel link, remote
migration/policy application, deployment or real paid model request.
