# Compiler quota staging migration approval packet

## Current Decision B execution receipt - 2026-10-01

**DECISION B COMPLETE: YES.**
**QUOTA POLICY ACTIVE AND VERIFIED: YES.**
**SAFE TO ADVANCE TO PROVIDER/SPEND-CONTROL PREFLIGHT: YES.**
**SAFE TO ENABLE PAID TRAFFIC: NO.**

This receipt supersedes the Decision A stop state immediately below while
preserving it as historical evidence. It records only the explicitly authorized
private-pilot policy activation and quota acceptance on Supabase staging project
`mtzrvekmsmpflbsqgpcc`. The application remains at source commit
`c85d037d3b1aa0fb69050302611cedb6b8500109`; no runtime, migration, provider,
Vercel, production, traffic, PR-promotion or merge change was made.

### Activation receipt

- Final read-only preflight reconfirmed exactly one remote migration-history row
  for version `202609280001`; the expected policy, usage and zero-argument RPC
  objects; `postgres` ownership; `SECURITY DEFINER`; empty `search_path`;
  `lock_timeout=3s`; RLS with zero private-table policies; no authenticated
  private schema/table access; authenticated-only RPC EXECUTE; and no private
  PostgREST schema exposure.
- The operator inserted exactly one singleton policy row, transactionally, with
  `(singleton, burst_limit, burst_window_seconds, sustained_limit,
  sustained_window_seconds) = (true, 3, 60, 20, 86400)`. The dashboard reported
  success on 2026-10-01 before the first verified reservation at
  `2026-10-01T17:54:57Z`. The table has no insertion timestamp, so this receipt
  does not invent finer server-side timing.
- Immediate and final privileged reads each found one policy row and one exact
  tuple match. No overwrite, update, counter reset, truncate, timestamp change,
  data deletion or rollback occurred.
- Three authorized disposable staging accounts were used and are referred to
  only as A, B and C. No credential, token, cookie, email address or account UUID
  was printed, persisted in the repository or included in this receipt.

### Direct authenticated RPC acceptance

- **Burst exhaustion:** in one fresh UTC-aligned window, account A received
  `allowed=true` three times, followed by `allowed=false` with integer
  `retry_after_seconds=44`. The private aggregate remained burst 3 and sustained
  4 after denial, proving the rejected call incremented neither counter.
- **Burst rollover:** after the natural minute boundary, A was allowed again and
  the aggregate became burst 1, sustained 5. No counter or timestamp was changed
  administratively.
- **Concurrent serialization:** in a fresh window at `2026-10-01T18:37:00Z`,
  four concurrent calls for B produced exactly three allows and one denial, with
  integer retry 59. All responses were HTTP 200 RPC results; there was no 5xx,
  deadlock, timeout or unexpected shape. An earlier bounded batch that completed
  during client-side observation uncertainty was reconciled rather than erased;
  final B usage is therefore sustained 7, burst 3.
- **Cross-account isolation:** immediately after B exhausted its burst, parallel
  calls for A and C were both allowed. B remained exhausted; one account's lock
  and counters did not block or consume another account's allowance.
- **Sustained exhaustion:** C reached exactly 20 allowed reservations across
  natural UTC minute boundaries. Its immediate 21st call at
  `2026-10-01T18:44:24Z` returned `allowed=false` and integer
  `retry_after_seconds=18936`. The final private read shortly afterward found C
  still at sustained 20 and burst 2, with approximately 18,914 sustained seconds
  versus 14 burst seconds remaining. This proves the denial was governed by the
  later sustained-window expiry and did not increment either counter.
- Final private aggregates contained exactly three usage rows, classified without
  identifiers as A sustained 6, B sustained 7 and C sustained 20. The extra A
  reservation is the successful isolation call. The result is consistent with
  every accepted direct-RPC receipt and contains no unexplained increment.

### Security, application and provider regression

- Authenticated direct SELECT and UPDATE attempts against both private tables,
  plus an authenticated direct INSERT to usage, were rejected at the PostgREST
  boundary with `PGRST106`. Anonymous RPC execution was rejected with HTTP 401 /
  SQLSTATE `42501`. Supplying a nonexistent `user_id` argument was rejected with
  HTTP 404 / `PGRST202`; the public RPC remains zero-argument and caller-bound.
- Static ACL/RLS verification remained consistent after activation:
  authenticated has RPC EXECUTE but no private schema/table access, anon has no
  RPC EXECUTE, both private tables retain RLS and zero policies, and the private
  schema remains outside exposed API schemas.
- A fresh authenticated same-origin `/api/generate` request returned application
  JSON 503 with `Cache-Control: private, no-store` because `OPENAI_API_KEY`
  remains absent. Private aggregates were unchanged by that request, confirming
  provider absence is checked before reservation. Provider calls made: **0**.
- A fresh authenticated `/workspace` fetch returned 200 with
  `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` and
  `X-Robots-Tag: noindex, nofollow, noarchive`. The active service worker had
  zero protected-route cache entries while a public homepage cache entry
  remained. Exact-head accepted hostile-Origin 403, signed-out 401 and offline
  stale-workspace denial remain authoritative and were not rerun because this
  operation changed only database policy data and did not redeploy the app.
- The transient in-page acceptance helper and its disposable session material
  were explicitly removed after verification. No browser storage export, HAR,
  trace, screenshot or raw network diagnostic containing session material was
  created.

### Final state and stop gate

The singleton policy is active and verified at `(true, 3, 60, 20, 86400)`.
Rollback was **not required**: no material quota or security defect was observed.
The approved fail-closed mechanism remains deletion of only the singleton policy
row after traffic is quiesced, but it was not invoked.

Stop here. Decision B does not authorize adding a provider credential, changing
provider/project spend controls, making paid calls, enabling pilot or public
traffic, deploying or promoting an application, merging PR #4, or changing
production. The next permissible action is a separately authorized
provider/spend-control preflight. It is not traffic authorization.

## Current Decision A execution receipt - 2026-10-01

**DECISION A COMPLETE: YES.**
**SAFE TO REQUEST DECISION B POLICY ACTIVATION: YES.**
**DECISION B IS NOT AUTHORIZED OR ACTIVE.**

This receipt supersedes older current-looking Decision A status in this packet.
Historical receipts remain evidence of their own observations and limitations.
The authorized schema-only migration was applied to Supabase staging project
`mtzrvekmsmpflbsqgpcc` from source commit
`c85d037d3b1aa0fb69050302611cedb6b8500109`. The exact migration was
`supabase/migrations/202609280001_compiler_quota.sql`, version
`202609280001`, SHA-256
`bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`,
4,700 bytes with committed LF line endings. The existing `main` checkout was
not used or changed.

### Application receipt

- Pinned Supabase CLI 2.118.0 operated from an isolated temporary runner linked
  only to `mtzrvekmsmpflbsqgpcc`; the runner contained the one byte-verified
  migration and no seed, custom role or Vault input.
- Immediate read-only preflight confirmed database `postgres`, PostgreSQL 17.6,
  effective operator `postgres` with the required privileges, no migration
  history table, no quota schema/tables/RPC collision and no private-schema API
  exposure. No Auth user records were read.
- The pre-application `db push --linked --skip-vault --dry-run` listed exactly
  `202609280001_compiler_quota.sql`, with no seeds, roles, Vault changes or
  unrelated migration. The interactive application then reported that exact
  migration applied successfully. No ambiguous transport failure occurred.
- Post-application CLI history lists one local/remote version,
  `202609280001`. A final `--skip-vault --dry-run` reports the remote database
  up to date with empty migration, seed and role lists.
- Remote history contains exactly one row for version `202609280001`, name
  `compiler_quota`, with 13 registered statements matching the reviewed
  migration statement heads. No unrelated migration was applied.

### Post-application database verification

- `compiler_quota_private.policy`, `compiler_quota_private.usage` and
  zero-argument `public.reserve_compiler_attempt()` exist and are owned by
  `postgres`. The private tables have their expected primary-key indexes.
- The function is `SECURITY DEFINER`, has `search_path=""` and
  `lock_timeout=3s`, uses `auth.uid()`, contains static schema-qualified SQL and
  contains no dynamic `EXECUTE`.
- RLS is enabled on both private tables and each has zero policies. PUBLIC,
  `anon`, `authenticated` and `service_role` have no private schema/table access.
  Only `authenticated` has RPC EXECUTE; PUBLIC and `anon` do not.
- An anonymous direct function call was rejected with SQLSTATE `42501`. An
  authenticated direct private-table read was rejected with SQLSTATE `42501`;
  static ACL verification also confirmed no authenticated UPDATE privilege.
- `compiler_quota_private` remains outside the exposed PostgREST schemas. A
  schema reload completed, and linked type generation resolves
  `reserve_compiler_attempt` with `Args: never` and `Returns: Json`.
- Policy row count is 0 and usage row count is 0. No prompt, relationship-note,
  IP, cookie or provider-result columns/data exist, and no account-history table
  was created.
- A direct RPC through the disposable account's real signed browser session
  resolved the argument-free PostgREST binding and returned HTTP 500 with
  SQLSTATE `55000`, `Compiler quota is not configured`. No JWT, cookie, account
  identifier or credential was returned, logged or persisted. This is the
  required missing-policy fail-closed result; no reservation or provider call
  occurred.

### Protected staging regression and stop state

- The accepted deployment remains at the same application SHA. A fresh
  authenticated workspace reload retained the session and returned HTTP 200
  with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.
- With the service worker bypassed and the browser forced offline, `/workspace`
  reached `ERR_INTERNET_DISCONNECTED`; protected workspace content was not
  served from a browser cache. Normal online navigation recovered the
  authenticated workspace.
- A fresh authenticated same-origin `/api/generate` request returned application
  JSON 503 with `Cache-Control: private, no-store` because `OPENAI_API_KEY`
  remains absent. A credential-free request returned 401 at the protected
  deployment boundary. The previously accepted exact-deployment hostile-Origin
  application 403, signed-out application 401, secure host-only/Lax/path `/`
  cookie attributes and PWA boundary remain authoritative; the database-only
  migration did not change or redeploy those application paths.
- Vercel environment inspection still shows only the two public Supabase
  variables and no `OPENAI_API_KEY`. Paid/provider calls made during Decision A:
  0. Compiler traffic remains quiesced.
- The policy table is empty, so the deployed schema is already fail-closed. The
  approved future emergency-disable mechanism remains deletion of the singleton
  policy row after traffic is quiesced; no rollback, drop, truncate or counter
  reset was executed.

Stop here. Do not insert `(true, 3, 60, 20, 86400)`, add provider credentials,
enable traffic, promote or merge PR #4, or perform any Decision B action without
a separate explicit authorization.

## Current authentication gate decision - conditional design approval

**AUTHENTICATION PREREQUISITES ARE CLOSED: NO.**
**SAFE TO PROCEED TO STAGING MIGRATION + QUOTA ACTIVATION: NO.**

The user's continuation instruction approves the package **design only**:
`supabase/migrations/202609280001_compiler_quota.sql`, SHA-256
`bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`,
policy `(true, 3, 60, 20, 86400)`, and the designated OpenAI PromptSuno project
proposal of a $10 hard monthly limit, $5/$8 alerts and Luna-only model access
where supported. This supersedes earlier wording that no design decision had
been received. It grants no execution permission: migration, policy activation,
provider provisioning, spend-setting changes and paid/public traffic remain
unperformed. A separate explicit next-gate approval is required before migration
or activation, even after authentication prerequisites close. PR #4 remains draft.

This receipt supersedes earlier current-looking acceptance status only where
explicitly stated. Historical observations and failures below are preserved.
The clean isolated checkout started on `codex/atomic-compiler-quota` at
`ad783c29bf18ab08ed018056c569cefe9650ba83`, matching the live draft PR. Its two
required jobs remained successful in run 36594264073: PostgreSQL 17/17;
unit/API/component 95/95 in 3 files; browser 21/21; typecheck/build successful;
lint 0 errors and 2 existing warnings. These are hosted fixture checks, not live
staging acceptance. The deployed application remains frozen at
`41bf9fc7cc30ff8fc35cd83e5f1994d408957e22`. Comparing that SHA with the starting
head shows only this documentation file changed. No runtime fix was justified
or made; no assertion, test, origin/session guard or quota behavior changed.

### Authentication acceptance matrix

PASS entries explicitly identify fresh versus previously accepted live evidence.
A failed inspection tool is recorded as BLOCKED, not an application failure or
PASS. No new application defect was demonstrated in this continuation.

| Acceptance item | Status | Evidence or exact blocker |
| --- | --- | --- |
| Authorized application robots/cache headers | BLOCKED | Chrome exposes no network-response API. CLI login probes again returned 302, with no robots header on stable and only `noindex` on generated. These do not establish authorized application `noindex, nofollow, noarchive` or `private, no-store` |
| Authenticated hostile-Origin application 403 | BLOCKED | Synthetic hostile-Origin CLI POST returned 401, without the application's expected auth-rejection JSON. No valid application session can be attached through the supported request API without exporting credentials; this does not test the authenticated 403 path |
| Missing application session 401 | BLOCKED | Fresh CLI synthetic/missing-session POST returned 401, but not the expected application JSON. No application-level PASS inferred from protected-deployment status alone |
| Malformed application session 401 | BLOCKED | Same CLI boundary as missing session; malformed input was synthetic, with no private credential read |
| Forged application session 401 | BLOCKED | Same CLI boundary; only a synthetic invalid signature/session shape was used, with no real JWT or refresh token exported |
| Signed-out application API 401 | PASS, retained live evidence | Previously accepted real-browser POST `/api/generate` at epoch milliseconds `1790678859107`; user accepted this observation in the continuation. Not rerun in this receipt |
| Signed-in same-origin missing-provider 503 | PASS, retained live evidence | Previously accepted browser POST `/api/generate` at `1790678670612`, combined with absent provider key and frozen route ordering; no quota/provider work. Not rerun in this receipt |
| Session persistence/server recognition | PASS, fresh live evidence | After browser recovery, stable-origin reload stayed on `/workspace` with Sign Out present and no overflow; runtime GET 304 at `1790700378332`. This does not prove token rotation |
| Actual cookie metadata and sign-out deletion | BLOCKED | Advertised Chrome capabilities remain viewport/pageAssets plus DOM/screenshot/console APIs; no cookie metadata, cookie mutation or response-header inspection. No cookie values or profiles read. Installed SSR expectations below remain source-only |
| Expiry refresh/rotation | BLOCKED | Continued navigation is not proof of token rotation; no supported session lifecycle observation API and no token export/replay |
| Revoked-session rejection | BLOCKED | No safe in-place revoke-and-observe/replay capability for the existing tester. No administrative revocation or new account/session credentials created |
| Mobile validation/keyboard order | PASS, fresh live evidence | At 390x844, generated-origin empty form kept `/login`, both required fields were missing and focus moved to email. Synthetic malformed email produced typeMismatch with no redirect. Remeasured Email -> Password -> Sign In sequence passed with no overflow. No password entered or Auth submission made |
| Mobile successful submitting/loading transition and virtual keyboard | BLOCKED | Prior user-reported submission reached the workspace, but transient states were not captured. Desktop viewport emulation does not establish physical virtual-keyboard behavior. No additional real credential submission was performed |
| Mobile resulting focus/layout and desktop layout | PASS, retained live evidence | 390x844 result had BODY focus, loading complete and no horizontal overflow; 1366x900 workspace had no horizontal overflow. No new screenshot or fresh layout PASS claimed |
| Stable/generated host isolation | PASS, fresh live evidence | Stable-origin reload stayed signed in; a new generated-origin `/workspace` navigation reached its own `/login` with Sign In present and Sign Out absent. Runtime records generated workspace GET 307 at `1790700390291`, then login GET 200 at `1790700390410`. Stable workspace remained signed in after closing the generated test tab |
| Disabled public signup | PASS, fresh settings read | Redacted designated-project Auth settings read at `2026-09-29T16:48:49.809Z`: signup disabled, email enabled, global auto-confirm disabled |
| Protected/frozen staging and provider absence | PASS, fresh settings read | Same receipt confirms target identity, All Deployments protection, READY frozen SHA, only two public Supabase variables, no OpenAI key, no Git integration and Vercel-only domains |
| No automation bypass | PASS, fresh settings/probe read | Project inspection and the CLI helper find no existing automation bypass; no bypass was created or supplied. No shareable-access-link tool invoked |
| Credential-form evidence handling | FAIL | Unexpected autofill exposed an account field in an emitted screenshot. Both new local capture files were removed; the tool preview cannot be retracted here. No identifier appears in this packet. No further form screenshot taken; prior evidence preserved |

### Bounded attempts and preserved evidence

The Vercel connector exposes a URL-only authenticated fetch operation; it has no
custom method/header/session arguments for these POST cases. A read-only fetch
of the designated `/login` returned a connector `INVALID_ARGUMENT` error before
an application response. Only the error class/booleans were retained; no raw
connector output or authenticated URL was published. Its separate share-link
operation explicitly creates temporary access and was not used.
[Vercel's tool reference](https://vercel.com/docs/agent-resources/vercel-mcp/tools)
documents these distinct operations. This attempt neither establishes application
headers nor supplies a supported authenticated POST/session inspection facility.

Chrome's supported inventory located a stable-origin `/workspace` tab, but the
claim/DOM inspection timed out before command dispatch. After reading the
browser troubleshooting guidance, an existing-tab handle retry had the same
failure. The documented accessibility fallback also timed out while enabling
focus emulation. Inventory alone is not fresh server recognition. The user was
asked to foreground the existing tab and confirm the browser connection; no
credential entry was requested. After the user confirmed readiness, the documented
DOM API recovered. Fresh reload/host-isolation and credential-free native-form
checks above then succeeded. No browser-profile access, DevTools workaround or
alternative automation channel was used. Cookie/network/session capabilities
remain unavailable despite the recovered DOM interaction.

The protected CLI probes used explicit deployments, an unlinked temporary cwd,
no tracing, and synthetic invalid inputs. Stable/generated login returned 302;
hostile-Origin, missing, malformed and forged POSTs returned 401 without the
expected application auth-rejection JSON. The numeric status is therefore
insufficient for an application acceptance claim. No fixture result substitutes
for any blocked live case. Source inspection of the exact deployed SHA confirms
`auth.getUser()` precedes Origin/body checks, missing provider key precedes quota
RPC, and quota precedes OpenAI construction. An unauthenticated hostile request
cannot prove the authenticated 403 branch; weakening this ordering is not a fix.

Local uncommitted redacted receipts are preserved under the shared checkout's
`.verification/private-staging/`: `auth-gate-config-start-redacted.json`,
`auth-gate-config-final-redacted.json`, `auth-gate-protected-http-redacted.json`,
`auth-gate-runtime-redacted.json`, `auth-gate-mobile-redacted.json`, and the new
`auth-gate-probes-safe.mjs` / `auth-gate-runtime-safe.mjs` helpers.
Existing evidence and unrelated homepage/Learn work remain untouched. The shared
checkout remains on its independently selected `main`; all tracked edits for
this task occur in the managed `staging-auth-receipt` quota checkout.

A first mobile keyboard/capture attempt had a transient viewport disturbance and
an overflow reading, so it was not accepted. A fresh 390x844 remeasurement of
both keyboard transitions reported no horizontal overflow. An initial locator
used Email instead of the observed Email address label; it matched nothing and
was corrected from DOM label metadata. No test assertion was changed. Browser
autofill unexpectedly exposed an account field in the subsequent screenshot.
Both new local capture files were removed immediately. The preview had already
been emitted to the tool transcript; deleting local files does not retract that
preview. No identifier is repeated in this packet or committed evidence. Redacted
metadata and this failure explanation preserve the incident. Earlier verification
evidence was not removed. No further credential-form screenshots were taken.
The generated review tab was closed, the viewport override reset, and the user
stable-origin workspace remained signed in. These checks did not observe a real
login submission/loading transition or a physical virtual keyboard.

### Decision and next gate

The missing application header/cache, authenticated hostile-Origin, invalid-session
and cookie/lifecycle evidence concerns the security boundary itself. It cannot
be classified as a demonstrated non-critical limitation merely because source
and fixture tests pass. The authentication stop gate is therefore **not closed**.

Resume with a supported facility that inspects
headers/cookie metadata and exercises requests within the existing authorized
session while returning only allowlisted metadata/booleans, without credential
export, a new bypass or protection changes. Physical virtual-keyboard behavior
needs an observable device session. Until the security hold points close, keep
migration/policy/provider access and paid traffic disabled. No new execution
approval is requested on the strength of this partial evidence.

## Current decision receipt - 2026-09-29 protected acceptance follow-up

**PARTIAL: redirect correction verified; live authentication acceptance remains
incomplete. No migration, policy, provider key, spend change or traffic approval.**
This section and its approval block supersede older current-looking status and
decision language below. Earlier receipts remain historical evidence, including
their failures and limitations; they are not additional approval requirements.

Starting branch/head were verified as `codex/atomic-compiler-quota` /
`0967bd6c13dd0f0feee162619139913258f9c0bb`. Tracked/index changes were absent;
the two unrelated duplicate catalog/matrix JSON files and `desktop.ini` were
untracked, so the whole working tree was **not** clean. All three are preserved.
Draft PR #4 was OPEN/DRAFT at that exact head, with both required jobs successful
in [run 36530069525](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36530069525).
PR #2/#3 retain the heads recorded below. This follow-up changes documentation
only; its final exact-head CI receipt belongs in the PR description and handoff.

### Saved configuration and protected live checks

Only Supabase staging project `mtzrvekmsmpflbsqgpcc` and Vercel project
`promptsuno-signin-staging` / `prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU` were used.
The application remains frozen at
`41bf9fc7cc30ff8fc35cd83e5f1994d408957e22`; no redeployment occurred.

| Check | Fresh observation / evidence limit |
| --- | --- |
| Site URL | Changed from localhost to exactly `https://promptsuno-signin-staging.vercel.app`; Save completed, then reload and a fresh field read confirmed the saved value |
| Redirect allowlist | Reload confirmed one entry, exactly `https://promptsuno-signin-staging.vercel.app/auth/callback`; no wildcard or generated-origin entry added |
| Signup | Independent Auth settings read confirmed public signup disabled, email enabled, global auto-confirm disabled |
| Vercel boundary | Read-only booleans confirmed All Deployments authentication, READY frozen deployment, only public Supabase environment variables, no OpenAI key, only Vercel domains and no Git integration |
| Existing real session | New stable-origin workspace navigation was recognized server-side. This is live Supabase Auth, not fixture interception |
| Same-origin compiler | Synthetic Piano intent through the real browser UI produced runtime POST `/api/generate` 503; editable node/notes survived and focus returned to Generate Prompt |
| Signed-out compiler | UI Sign Out reached `/login`; the retained synthetic workspace then produced runtime POST `/api/generate` 401. This is an application receipt behind the authenticated Vercel viewer |
| Signed-out navigation | A fresh stable-origin `/workspace` navigation reached `/login` |
| Host isolation | While the stable origin was signed in, fresh generated-origin `/workspace` redirected to its own `/login`; no stable-origin application session was transferred |
| Mobile | 390x844 workspace loading, disabled compiler feedback and retained signed-out intent observed with no horizontal overflow. Login keyboard sequence Email -> Password -> Sign In checked; the credential-entry tab was independently measured at 390x844 |
| Mobile credential retry | User reported submission in the secure tab previously measured at 390x844; post-submit inspection confirmed `/workspace`, Sign Out present, Sound Brain loading complete, no horizontal overflow and focus on BODY. Reload at 390x844 retained server recognition. Transient validation/submitting/loading states and virtual-keyboard behavior during private entry were not captured; no credential values or account fields were read |
| Desktop | After the mobile retry, the signed-in workspace was inspected at 1366x900 with Sign Out present and no horizontal overflow. This verifies the resulting desktop workspace, not a separate desktop credential submission. Earlier signed-out login layout remains verified |
| Console | Review-tab warning/error capture contained only the known THREE.Clock deprecation warning; no additional warning/error category was captured |
| No quota/provider call | Environment inspection confirms key absent; the frozen route checks verified Auth, then request validity, then missing provider key, before quota RPC or OpenAI construction. Runtime statuses plus that code ordering establish these exercised rejection paths; this is not remote quota acceptance |

Redacted runtime receipt records the signed-in POST 503 at epoch milliseconds
`1790678670612` and signed-out POST 401 at `1790678859107`. Reload/navigation
alone does **not** prove expiry-driven token rotation. No refresh token or old
access token was copied for replay, and no session was administratively revoked.

### Secure mobile retry follow-up

After the user reported submission, the existing restricted tester reached the
stable-origin workspace at 390x844. A fresh reload stayed on `/workspace`; the
redacted runtime receipt records workspace GET 304 responses at epoch
milliseconds `1790696891040` and `1790697097313`. This confirms continued server
recognition, not token rotation or a newly observed HTTP 200. The resulting
workspace was also inspected at 1366x900. Both sizes had no horizontal document
overflow. Post-submit focus was BODY; the transient validation, submitting and
loading sequence during private credential entry was not observed. The earlier
Email -> Password -> Sign In keyboard-order check does not establish virtual
keyboard behavior during this retry. The signed-in tab remains open for the user.

A fresh read-only configuration check at `2026-09-29T15:56:07.817Z` reconfirmed
All Deployments protection, the READY frozen SHA, no OpenAI key, only the two
public Supabase variables, no Git integration, Vercel-only domains, disabled
public signup and no automation bypass. An initial restricted-network check
failed without a detailed receipt; the approved network-enabled retry succeeded.
No settings changed during this retry. No additional compiler POST was needed.

The shared checkout had independently moved to `main`. Documentation follow-up
therefore uses a managed isolated checkout of `codex/atomic-compiler-quota` at
`6ff5cf783ba54c890c54e3f464a48048a01810e9`; the shared checkout and unrelated work
are preserved. Only this approval packet changes. Prior exact-head hosted run
36558621322 attempt 1 retained its mobile-WebKit drag failure (20 passed, 1 failed,
0 skipped); attempt 2 passed both jobs with 21/21 browser tests. New final-head
hosted results belong in the PR description and handoff, not in this historical
receipt. The quota/spend approval block below remains unchanged and conditional.

Retry artifacts are local and uncommitted under `.verification/private-staging/`:
`mobile-retry-workspace.png`, `desktop-retry-workspace.png`, the latest boolean
configuration/runtime receipts, and the preserved `config-initial-redacted.json`
and `runtime-initial-redacted.json`. They contain no credential or account fields.

### Exact live blockers, without fixture substitution

Vercel CLI 60.1.3 protected-request support was inspected and exercised with an
explicit deployment and an unlinked temporary working directory. Tracing/debug
were disabled; stdout/stderr stayed in memory and only allowlisted status/header
fields and booleans were saved. No raw authenticated commands were recorded.
The first attempts failed with curl exit 2 because the wrapper forwarded
`--non-interactive` as a curl option; removing that argument resolved the local
runner error. The failed attempt receipt is retained separately.

The project has **no existing automation bypass**. The safe invocation did not
create one. Stable/generated login probes returned 302; missing, malformed and
synthetically forged session probes returned 401 without the application's
expected JSON rejection. These are Vercel-boundary results, **not** live
application acceptance for those three session states. The generated challenge
had `X-Robots-Tag: noindex`; the stable challenge had none. Neither establishes
the required authorized application header `noindex, nofollow, noarchive`.

The connected Chrome API exposes DOM interaction, screenshots, console entries
and viewport control, but no cookie metadata, network response inspection,
authenticated request interception/replay or session-control capability.
Its page evaluation is read-only DOM scope. Consequently authenticated hostile
Origin 403, authorized response headers, missing/malformed/forged application
401, expiry/rotation and revoked-session replay remain **unverified live**.
Transferring browser credentials, creating a project-wide automation bypass,
changing protection or substituting fixture evidence was not used to close gaps.
Resume with a supported credential-redacting request/cookie inspection facility
that preserves protection and the existing tester; otherwise retain these gates.

An automatic approval review rejected the older receipt scripts because they
emitted account/team identifiers. Revised scripts were approved and emit only
timestamps, HTTP status, fixed paths, permitted robots headers and booleans.
The rejected scripts were not executed for this acceptance run.

### Cookie metadata: implementation comparison, not a live cookie audit

Installed `@supabase/ssr` is 0.12.7. The application supplies no cookie option
overrides. Source reviewed: `src/lib/supabase/client.ts`,
`src/lib/supabase/server.ts`, `middleware.ts`, installed SSR
`src/utils/constants.ts`, `src/cookies.ts`, `src/createServerClient.ts`, and
Supabase JS storage-key construction. No application fix is justified by a
demonstrated live cookie defect in this run, so no runtime code was changed.

| Metadata | Installed implementation expectation | Actual stored-cookie observation |
| --- | --- | --- |
| Name class | `sb-<project-ref>-auth-token`, possibly chunk suffixes | Unavailable; no values read |
| Host/domain | No Domain override; host-only expected | Stable/generated session isolation observed; attribute not inspected |
| Path | `/` | Unverified |
| Secure | No Secure override/default in the reviewed options | Unverified; HTTPS operation alone does not prove Secure |
| SameSite | `lax` | Unverified |
| HttpOnly | `false` | Unverified |
| Expiry | Cookie maxAge 400 days; distinct from JWT expiry | Unverified |
| Refresh | SSR writes changed session/chunks on TOKEN_REFRESHED | Fresh navigation recognized session; actual rotation unverified |
| Sign-out deletion | Removal writes empty cookies with maxAge 0 and clears stale chunks | Application rejection after sign-out observed; actual cookie deletion unverified |

[Supabase's official SSR guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
explains that the browser client needs refresh-token access, recommends Lax as
a default and generally Secure for HTTPS, and distinguishes cookie lifetime
from server session validity. Do not force HttpOnly in this client-side flow.
Later inspect actual metadata without values, including refresh responses and
cache behavior; do not label inferred defaults as production observations.

### One concrete approval block for the next task

**PROPOSED - requires the user's explicit decision; nothing below is approved
or executed by this receipt. Authentication gaps above remain hold points.**

> Approve a staging-only, gated quota and spend-control work package for
> `mtzrvekmsmpflbsqgpcc` and the existing protected PromptSuno staging project.
> Apply only `202609280001_compiler_quota.sql`, SHA-256
> `bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`,
> using the pinned/rehearsed runner below, including migration-history
> initialization/registration and schema-cache refresh. First close the live
> authentication hold points, verify the exact runner connection and target,
> collision-free history, file inventory, operator privileges and recoverability.
> Keep compiler traffic quiesced and the OpenAI key absent. Stop on discrepancies.
>
> After schema/ACL/RLS/ownership/history verification and real authenticated
> missing-policy rejection, insert exactly `(true, 3, 60, 20, 86400)` into the
> singleton policy using INSERT, never an overwrite. Authorize bounded direct
> authenticated quota-only checks for the existing restricted tester, without
> a model call: identity binding, denied table access, burst exhaustion,
> Retry-After and rollover. Retain consumed counters. Multi-account isolation,
> sustained-window exhaustion, account deletion and destructive/fault injection
> tests need a separately reviewed plan; do not claim them from one tester.
>
> Configure only the designated OpenAI PromptSuno funding project with a
> **$10 monthly limit and hard enforcement enabled**, plus **$5 and $8 alerts**
> (50% and 80% of $10). Restrict allowed models to **gpt-5.6-luna only where
> supported**, including review of any future-model default. Verify saved
> settings through fresh read-only inspection, without a paid call. If a true
> project hard limit or model restriction is unavailable, stop and report the
> exact limitation; do not substitute a notification budget or broaden model
> access. Do not change unrelated organization/project settings.
>
> Proposed response owner is the project owner operating this restricted pilot:
> review spend before each test session; at $5 review usage and remaining tests;
> at $8 stop new compiler traffic until reviewed; at the hard limit or unexpected
> spend stop traffic and investigate. Confirm owner/coverage before enablement.
>
> Rollback order: keep traffic stopped, remove only the singleton policy row
> under the approved operator, verify new reservations fail closed and observe
> already-authorized work. Preserve schema, history and usage counters; do not
> truncate, refund, drop objects or remove route guards. Restoration requires a
> separate decision. On ambiguous migration/transport failure inspect history
> and objects before retrying. Destructive reversal is a separate migration gate.
>
> **Traffic remains disabled after this package.** Present fresh authentication,
> remote quota, saved spend-control and rollback evidence for a separate
> traffic-enablement decision. Only that later decision may authorize secure
> server-side key provisioning with verified funding-project binding, a bounded
> paid smoke test and monitored private traffic. Keep All Deployments protection,
> closed signup and exact redirects; no PromptSuno.com, public rollout, merge,
> PR-ready transition or new deployment is implied.

[OpenAI's official spend-limit guidance](https://developers.openai.com/api/docs/guides/spend-limits)
distinguishes alerts from enforcement: hard limits reject affected requests but
propagation can allow slight overshoot. The $10 proposal is not a guarantee of
exactly zero overshoot. Existing account spend settings were not reconfigured
or reinspected in this task; older dashboard observations below are historical.

Local receipts remain ignored under `.verification/private-staging/`:
`acceptance-config-booleans.json`, `protected-http-redacted.json`,
`protected-http-attempt2-redacted.json`, `runtime-acceptance-redacted.json`, and
`acceptance-mobile-signedout.png`. The three local helpers ending in `-safe.mjs`
are also ignored and uncommitted. No account identifiers, tokens, cookie values,
passwords, bypass values or keys were added to this receipt or new artifacts.

Documentation validation: `git -c core.autocrlf=false diff --check` succeeded;
`Get-FileHash supabase/migrations/202609280001_compiler_quota.sql -Algorithm SHA256`
matched the immutable hash; `node .verification/quota-real/security-scan.mjs`
scanned 78 files and 14 existing browser chunks with zero exposed credential
values or server-only markers. `node --check` succeeded for each new local
redacting helper. No local application build/unit/browser/database suite was
rerun for this documentation-only change. Required hosted jobs at the final
documentation head remain mandatory and are reported in PR #4's current body.

## Real staging session receipt - 2026-09-29

**Partial sign-in acceptance:** the user completed private administrator
onboarding and reported successful sign-in. A real signed-in workspace was
observed; fresh server recognition, refresh, disabled compiler response,
host-session isolation and application signed-out rejection were exercised.
The user subsequently completed re-login in a separate Chrome tab observed at
965x384. Fresh navigation and reload in the 390x844 review tab recognized that
restored session. Credential submission specifically at 390x844 was not observed
and is not claimed. No account record, email, identifier, credential, JWT or
cookie value was extracted into evidence.
This receipt supersedes the pending real-session statements in earlier receipts
only for the checks explicitly listed below; historical records stay intact.

The test used the unchanged protected production deployment
`dpl_4xfWpEcmY7D5ML3s5e2r7km9SGs7` at source
`41bf9fc7cc30ff8fc35cd83e5f1994d408957e22`. The user's original workspace and
its four existing selections were preserved. All test intent was synthetic and
entered into separate review tabs. Sign-out changes the shared Auth session;
the original page remains open with its local selections. The user has restored
the shared stable-origin session through secure re-login.

| Check | Observed result |
| --- | --- |
| User-controlled account/login | Private admin password flow completed by the user; signed-in workspace observed without reading identity fields |
| Fresh server recognition | Separate HTTPS GET `/workspace` stayed on the workspace with Sign Out present; Vercel runtime receipt records HTTP 200. Reviewed middleware gates this path with real Supabase `auth.getUser()` |
| Session persistence | Reload stayed on `/workspace` with Sign Out present; no fixture Auth or route interception |
| Disabled compiler | Synthetic Piano selection and notes submitted through the deployed UI. Runtime POST `/api/generate` returned 503; error feedback retained the node and notes. Environment recheck shows no OPENAI_API_KEY; reviewed missing-key guard precedes quota RPC/provider construction |
| Signed-out API | Sign Out in a separate review tab completed to `/login`. Retained workspace UI then submitted synthetic intent; runtime POST `/api/generate` returned 401 and error feedback retained editable intent. Vercel viewer authorization remained available; this is separate from anonymous Vercel edge challenge evidence |
| Signed-out workspace | Fresh reload redirected `/workspace` to `/login`; runtime records 307 followed by login response |
| Cookie/origin behavior | Stable HTTPS origin carried the real session through server navigation, refresh and same-origin JSON POST. While stable host was signed in, a fresh generated-host workspace request redirected to its login. Sign-out invalidated application access across stable-origin tabs |
| Mobile layout | 390x844 signed-in workspace, disabled-call feedback and signed-out failure inspected; no horizontal overflow; synthetic notes retained and removal control enabled |
| Desktop layout | 1366x900 signed-in workspace/error feedback inspected; no horizontal overflow; notes retained; fresh session reload successful |
| Mobile login form and restored session | Signed-out form hydrated with enabled controls and empty inputs; keyboard sequence Email -> Password -> Sign In verified. User re-login completed in a separate 965x384 tab. Fresh navigation and reload at 390x844 then stayed on the signed-in workspace without horizontal overflow; credential submission specifically at 390x844 was not observed |
| Browser diagnostics | Captured review-page console contains a THREE.Clock deprecation warning; no other warning/error entries captured. HTTP 503/401 are intentional rejection outcomes, not a clean paid-compiler success |

Read-only Vercel recheck confirmed All Deployments Authentication, only the two
production public Supabase variables, no OpenAI key and no custom domain.
Staging `/auth/v1/settings` independently reconfirmed disabled public signup,
email enabled and global auto-confirm disabled at 2026-09-29T06:05:39Z. The
single exact callback entry remains as recorded below. No invitation-link flow
was used; localhost Site URL remains a gap for future email fallback flows.

Evidence scope: normal public-origin acceptance and host-session isolation were
verified live. An authenticated forged-Origin POST returning 403, forged/expired
JWT rejection, token-expiry refresh/rotation, replay after server revocation,
and actual Set-Cookie attribute/authorized X-Robots-Tag response inspection
remain unverified live. Existing hosted browser fixtures cover hostile Origin
and forged/expired sessions; they do not replace real-project evidence. Source
inspection of installed SSR defaults shows path `/`, SameSite Lax, HTTPOnly
false and no Secure override in application client configuration; these are
source observations, not an inspection of stored production-cookie attributes.
No session credential was exported to obtain these checks. Do not claim full
JWT/cookie hardening, email invitation acceptance or production traffic approval.

Redacted receipts remain ignored in `.verification/private-staging/`:
`runtime-redacted.json` contains only timestamp/method/status/path/source/level;
`auth-settings-redacted.json` contains target and configuration booleans.
Account-free synthetic screenshots: `session-mobile-disabled.png`,
`session-desktop-disabled.png`, `session-mobile-signedout.png`,
`session-mobile-restored.png`. The restored-session screenshot and desktop
synthetic error screenshot were visually reviewed. Temporary viewport override
was reset after verification. Runtime request logs were parsed in memory;
account/header/message/identifier data was not saved.
Quota RPC/JWT database binding still requires the separately approved remote
migration and policy. Neither was applied, no quota reservation or paid model
call was made by this verification, and spend controls remain unchanged.

## One restricted staging tester - 2026-09-29

The user's follow-up explicitly authorizes one administrator-created tester for
their own email in `mtzrvekmsmpflbsqgpcc`, private user-entered credentials, public
signup disabled, and the single exact staging callback allowlist entry. This
supersedes the earlier no-account/no-Auth-setting boundary only for this work.
Quota migration/policy, OpenAI keys or paid calls, spend changes, merge and draft
promotion remain prohibited. At this preparation checkpoint, real-session
acceptance was **pending**; the newer real-session receipt above supersedes that
status for its explicitly observed checks.

Current repository and hosted state were rechecked: branch
`codex/atomic-compiler-quota`, head
`d2e91cbb7ca0b745f21a2b5d9094285393896745`, PR #4 OPEN/DRAFT, both required
jobs successful in [36521672689, attempt 2](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36521672689).
Its earlier failed browser attempt and unsuccessful/reverted local setup
experiments remain preserved as recorded in the PR. This pending documentation
edit does not change the frozen deployed application at
`41bf9fc7cc30ff8fc35cd83e5f1994d408957e22`.

### Account flow chosen from the actual implementation

`src/app/login/page.tsx` calls `signInWithPassword`. The callback route only
accepts a query `code` and calls `exchangeCodeForSession`; it has no invitation
token/hash verification or password-setup screen. Installed Supabase Auth source
and [official invitation documentation](https://supabase.com/docs/reference/python/auth-admin-inviteuserbyemail)
state that admin invitations do not support PKCE. A default invitation is not
treated as a verified compatible flow for this application.

Use the supported dashboard **Add user -> Create new user** password flow,
with the individual **Auto confirm user?** option selected. The user's email
and staging-only password are to be entered and submitted by the user in the
secure dashboard, then used in the protected application's Sign In form.
This administrator-only onboarding keeps public signup disabled and requires no
new application authentication flow. No invitation was sent, no credential was
entered by Codex. At this checkpoint account creation had not been confirmed;
the blank form was handed off. The newer receipt records the subsequent
user-controlled login and real server session without reading account records.

### Fresh staging configuration evidence

- Public signup was initially **enabled**, contrary to the desired restriction.
  It was turned off and saved under the user's follow-up authority. Reload
  confirmed it stayed off; an independent credential-redacted GET of staging
  `/auth/v1/settings` returned `disable_signup=true`, email enabled and
  `mailer_autoconfirm=false` at 2026-09-29T05:48:21Z. No signup request was sent.
  Anonymous sign-in and manual linking stay off; global Confirm email stays on.
  Individual admin auto-confirm does not disable the global confirmation rule.
- Added exactly **`https://promptsuno-signin-staging.vercel.app/auth/callback`**.
  Save and reload confirmed the allowlist contains one URL, without wildcards.
  Site URL remains `http://localhost:3000`; it was not changed. Password login
  does not use an email redirect. Email flows not explicitly targeting this
  callback still have a localhost fallback and are not accepted by this receipt.
- Vercel API reconfirmed `ssoProtection.deploymentType=all`, the same test project,
  only production-scoped public Supabase URL/anon-key variables, no OpenAI key,
  and no custom domain. The existing production deployment remains READY.
  Fresh credential-free checks across generated URL and both production aliases
  returned Vercel 302 for `/login` and Vercel 401 for POST `/api/generate`.
  These boundary challenges still do not prove the application-level Auth 401.
- Redacted settings receipt and account-free preparation screenshots remain
  ignored under `.verification/private-staging/`: `auth-settings-redacted.json`,
  `signup-disabled.png`, `callback-allowlist.png`, `tester-create-empty.png`.
  No email, user identifier, password, OTP, token, session cookie or service-role
  credential is included in repository evidence.

After the user's secure sign-in, resume server `auth.getUser()` recognition,
application signed-out rejection behind Vercel, cookie/origin behavior and
mobile/desktop signed-in flow, and replace the pending status with observed
redacted results. No quota reservation is permitted: the missing OpenAI key
prevents quota RPC/provider construction; remote quota migration and policy
remain separately approved gates. No runtime application code was changed or
redeployed for this preparation.

## Protected deployment receipt and remaining human gates - 2026-09-29

**Partial acceptance: protected deployment ready; real staging sign-in remains
pending user-controlled existing-account sign-in.** No session, token, account
record or password was acquired for this receipt.

| Item | Fresh observed evidence |
| --- | --- |
| Vercel project | `promptsuno-signin-staging`, `prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU` |
| Team / plan | `prompt-suno`, `team_ID2vravvKgQ3XBHYVmHPHoPz`, active Hobby; no upgrade or paid add-on |
| Protected sign-in URL | https://promptsuno-signin-staging.vercel.app/login |
| Final deployment | `dpl_4xfWpEcmY7D5ML3s5e2r7km9SGs7`, production, READY, aliases assigned |
| Generated URL | https://promptsuno-signin-staging-7r8l1kzr2-prompt-suno.vercel.app |
| Deployed commit | `41bf9fc7cc30ff8fc35cd83e5f1994d408957e22`, `codex/atomic-compiler-quota` |
| Exact-head CI | [36520702019](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36520702019), both required jobs completed/success |
| CI totals | PostgreSQL 17: 17 checks; units: 95 tests / 3 files; browsers: 21 tests; zero failed/skipped; types successful; build 8/8 pages, zero build warnings/errors; lint zero errors/two existing warnings |
| Protection before first deployment | API readback `ssoProtection.deploymentType=all` with zero deployments; dashboard saved All Deployments / Require Log In |
| Anonymous HTTP checks after READY | Generated URL and both production aliases: GET `/login` returns 302 to `https://vercel.com/sso-api`; POST `/api/generate` returns Vercel 401 before application access |
| Authorized viewer | Existing authenticated Vercel Chrome viewer opened `/login`; enabled Email address, Password and Sign In controls visible |
| Environment | Production-scoped public Supabase URL and anon key only; endpoint/ref and decoded anon role verified without printing values; no OPENAI_API_KEY or privileged Supabase key |
| Domains | Only `*.vercel.app`; no PromptSuno.com or public custom domain |
| Noindex | Wildcard `X-Robots-Tag: noindex, nofollow, noarchive` config shipped; generated URL and team-qualified alias challenges return noindex. Stable alias authentication challenge has no robots header; authorized application-response header remains unverified |
| Login presentation | Captured 390x844 mobile and 1366x900 desktop; form present at both sizes. Real sign-in, error/refresh/revocation, keyboard and cookie/origin acceptance remain incomplete |

Both hosted receipts were downloaded and reviewed. Fixture Auth/provider errors
in tests are expected rejection scenarios, not real staging acceptance. CI
runtime/action deprecation and browser environment notices remain preserved.
PR #4 is still draft/unmerged; PR #2/#3 heads remain respectively
`3d44bfdb6ee4e6f44a65faf4c30cea26df58861a` and
`443f9f474bbee60ccdcd6a1da3d0434d46efd0a1`; unrelated untracked files preserved.

Deployment provenance correction: first protected deployment
`dpl_7ca4cK6zq8qMwucDmbaxyi7jqj2Y` exported the same commit with Windows CRLF
conversion. A raw-byte comparison failed; this is not exact-byte acceptance.
The corrected archive used `git -c core.autocrlf=false archive`; all 63 CLI
upload-manifest files then matched exact Git blob bytes. No local environment,
unrelated source copy or verification artifact was included. The final protected
deployment above uses that verified archive. CLI metadata says `gitDirty=1`
because the archive is inside the outer repository's ignored verification folder;
this marker was retained, not rewritten. The reviewed upload manifest and byte
receipt establish the shipped source independently of that marker. Earlier
deployment/export receipts are retained separately.

### Supabase Auth redirect decision - no setting changed

Fresh read-only dashboard inspection of `mtzrvekmsmpflbsqgpcc` shows Site URL
`http://localhost:3000` and **No Redirect URLs**. The deployed login code sets
email redirect to `${location.origin}/auth/callback`. For the designated stable
protected sign-in origin, the exact required allowlist entry is:

**`https://promptsuno-signin-staging.vercel.app/auth/callback`**

Reason: email-link callbacks must reach the deployed code-exchange route rather
than fall back to localhost. Proposed Site URL, if approved for staging email
fallbacks/templates: **`https://promptsuno-signin-staging.vercel.app`**.
No wildcard or other origin is proposed. Generated-host sign-in would need that
host's separate exact callback entry; use the stable designated origin instead.
Stop before saving either remote setting; approval is required by the current
user instruction. Existing-account `signInWithPassword` uses a direct Auth
request followed by client navigation to `/workspace`, so its acceptance does
not depend on an email redirect change. No account was created and signup
settings were not changed. User-controlled sign-in was handed off in the secure
Chrome UI; real server-side `auth.getUser()` recognition, signed-out application
401 behind the Vercel boundary, cookie/origin checks and mobile/desktop signed-in
flow are still unverified. Do not equate the Vercel 401 challenge with the
application's signed-out 401.

Quota RPC still requires separately approved remote migration and policy; neither
was applied. No remote reservation or paid model invocation occurred. OpenAI
spend settings, signup settings, merge and ready-for-review state are unchanged.
Do not enable paid traffic from this protected sign-in deployment receipt.

Redacted local receipts under `.verification/private-staging/`: final
`deployment-status.json`, `protection-receipt-lf.log`, `artifact-verification.json`,
`project-predeploy.json`, `ci-41bf9fc.json`, `ci-41bf9fc.log`, upload manifest
`deploy-inputs-lf.json`; account-free login screenshots `login-mobile.png` and
`login-desktop.png`, and protection screenshot `protection-all.png`. These ignored
artifacts are not committed. This documentation update does not change or
redeploy the frozen application commit; its own PR head needs fresh CI.

## Protected sign-in staging authorization and preparation - 2026-09-29

The user's 2026-09-29 deployment instruction supersedes this packet's earlier
no-Vercel authorization boundary only for a separate protected sign-in test
project. Remote quota migration/policy, Auth setting changes, signup changes,
paid compiler calls, spend changes, PR promotion and merge remain prohibited.

Verified branch `codex/atomic-compiler-quota`, local head
`c88770594c42a789f0a95b44d9fab58c8c66e24d`, descends from draft PR #4's prior
head `90848ad6249262144c3894eddc5a694db43304cd`. The existing documentation
commits were pushed without changing PR #2/#3. Both required hosted jobs passed
at c887705 in [run 36520259446](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36520259446):
PostgreSQL 17 integration 17/17, unit/API/component 95/95, browser 21/21,
zero failed/skipped tests; build 8/8 pages, zero build warnings/errors;
types successful, lint zero errors/two existing warnings. Action/runtime
deprecation and browser environment notices remain in the local receipt.
These are isolated fixtures, not real staging session or RPC acceptance.

Verified Vercel account `thelostquarryrocks-8642`, team **PromptSuno** / `prompt-suno`
(`team_ID2vravvKgQ3XBHYVmHPHoPz`), active Hobby plan. The connected Vercel
connector returned a different team and was not used for mutations.
Created separate project **promptsuno-signin-staging**,
`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`, without a Git integration or deployment.
Before any deployment, API readback verified `ssoProtection.deploymentType=all`,
zero deployments and zero protection exceptions. No custom domain attached.
All Deployments Vercel Authentication is free on every plan per the
[2026-09-09 announcement](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan);
no plan upgrade/add-on or recurring charge was accepted.

`vercel.json` adds `X-Robots-Tag: noindex, nofollow, noarchive` on all paths for
this staging deployment. Production does not receive Vercel's automatic preview
noindex guarantee. The deployment must use only designated Supabase target
`mtzrvekmsmpflbsqgpcc`, its public URL/anon key, and **no OPENAI_API_KEY**;
no service-role/admin credential belongs in the app. Actual runtime protection,
authorized-viewer login, response headers, session recognition and redirect
acceptance remain pending deployment. Missing OpenAI configuration returns 503
after verified auth/input and before quota RPC/provider construction.

Local redacted receipts: `.verification/private-staging/ci-c887705.json` and
`ci-c887705.log`. Credentials, account data, JWTs and cookies must stay out of
receipts. The immutable migration hash was reverified unchanged. Quota RPC
acceptance still requires separate schema and policy approvals.

Updated 2026-09-29 02:20 UTC (2026-09-28 evening America/New_York). **STOP: preflight is partial;
remote migration and policy approval are not yet requested.**
This packet authorizes no mutating SQL execution, project creation, entitlement setting,
paid model calls, Vercel linking/deployment, promotion or merge.

## Target and observed facts

The user explicitly designated this staging target on 2026-09-28:

- Project ref: **`mtzrvekmsmpflbsqgpcc`**.
- Project endpoint: [designated Supabase target](https://mtzrvekmsmpflbsqgpcc.supabase.co).
- Dashboard: [exact project](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc).
- Project name: **promptsuno**; organization: **thelostquarryrocks-prog's Org**
  (`gattjolcitbrzqvxxhsa`); region: **us-east-1**, East US (North Virginia).
- Dashboard branch label: **main / PRODUCTION**. Supabase documents this default
  label on projects without a GitHub integration, which matches the inspected
  target. The user's explicit staging designation remains authoritative; the
  label alone is not a conflicting environment designation. See the
  [dashboard branching documentation](https://supabase.com/docs/guides/deployment/branching/dashboard).

Historical access receipt, superseded by the authenticated inspection below:
the exact dashboard redirected to Supabase sign-in
with this project as its return target. A credential-free GET to `/rest/v1/`
on the designated endpoint returned HTTP 401, `No API key found in request`.
This proves a responding protected API gateway, not project ownership or SQL
configuration. No API key was supplied and no RPC/model/mutation was invoked.
The operator was asked to sign in through the UI without sharing credentials.

**Fresh authenticated receipt:** existing Chrome operator authentication reached
the exact target. Owner access and database role `postgres` were observed. Seven
explicit read-only SQL transactions and dashboard inspection established target
identity, PostgreSQL 17.6, relevant owners/default ACLs/memberships/RLS,
`auth.uid()` JSON-claim compatibility, API exposure and configured deadlines,
Auth settings and the Supabase spend cap. The latest catalog batch refreshed
operator identity, required privileges and absence of history/quota collisions
through the user-selected Chrome SQL Editor. Authenticated OpenAI inspection
also reached the newly designated funding project. See the
[redacted receipt](Compiler-Quota-Staging-Preflight-2026-09-28.md) for facts,
sources, exact limitations and the distinction between configuration and real
JWT acceptance. No migration, RPC reservation or policy insertion ran remotely.

The migration-history table and all quota objects are absent. Existing
`profiles`, `prompts` and `handle_new_user` are present; this is not an empty
application database. No observed ACL/ownership/collision difference requires
editing the migration. The API exposes `public` and `graphql_public`, and the
authenticated statement timeout is configured as 8s; the route aborts at 5s.
`auth.uid()` compatibility does not prove signature verification or revocation.

The user selected Chrome's authenticated Supabase SQL Editor for **read-only
migration-runner preflight**. That access path and its effective `postgres`
identity are verified; CLI authentication is not required to complete these
dashboard checks. This selection does not authorize migration execution or
establish a dashboard migration-history registration procedure.

Application decision remains withheld because real-JWT preflight is unavailable:
the user explicitly has **no designated staging sign-in URL yet**. No application
session was obtained, created or extracted. The separately proposed CLI
application procedure below remains a proposal, with connection checks required
if it is selected for execution. OpenAI funding project
`proj_pBrkpocbPAtAPt6v7RAQy1EU` is now designated and inspected: project name
`promptsuno`, organization display name `Personal`; no project spend limit,
organization $100/month soft budget with hard enforcement off, alerts at
80%/$80 and 100%/$100. Signup is open, CAPTCHA is off, and redirects are
local-only. Traffic approval remains separate and blocked.

Publication evidence: [stacked draft PR #4](https://github.com/thelostquarryrocks-prog/promptsuno/pull/4)
contains the exact base/head and reviewed CI receipts. The initial
[hosted CI run](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36445287563)
passed real PostgreSQL 17.11 17/17, units 95/95 and browsers 21/21; build and
typecheck passed. Final-head evidence is maintained in the draft PR description.
Fresh GitHub inspection confirmed PR #4 still OPEN/DRAFT at
`90848ad6249262144c3894eddc5a694db43304cd`, with
[CI 36447718209](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36447718209)
completed/success. No hosted fixture result establishes real staging Auth/SQL
acceptance. Any subsequent documentation commit has a different head and needs
its own CI evidence after separately authorized publication.

## Immutable migration and proposed policy

Migration: `supabase/migrations/202609280001_compiler_quota.sql`.
SHA-256: `bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`.
Introduced by `739f44005a694559f01f724c38b39d2f536c26b5`; unchanged in
`a294fe7c3da0cfd3d005fb065c94877161d48fa5` and this CI publication work.

The transactional additive migration creates `compiler_quota_private.policy`,
`compiler_quota_private.usage` and `public.reserve_compiler_attempt()`.
It seeds no policy. Both tables have RLS and no client policies; all private
schema/table access is revoked from PUBLIC, anon, authenticated and service_role.
Only authenticated receives RPC EXECUTE. The zero-argument SECURITY DEFINER RPC
uses `auth.uid()`, an empty search_path, static qualified SQL and a 3s lock timeout.
The migration operator owns its objects and must be a trusted role with the
necessary owner/RLS bypass behavior; verify actual ownership after application.

Proposed **private controlled-pilot policy**, subject to separate approval:

| Field | Value |
| --- | --- |
| singleton | true |
| burst_limit | 3 |
| burst_window_seconds | 60 |
| sustained_limit | 20 |
| sustained_window_seconds | 86400 |

For review only; execute only in the approved target's privileged operator session,
after the migration and missing-policy rejection have been verified:

```sql
begin;
insert into compiler_quota_private.policy
  (singleton, burst_limit, burst_window_seconds, sustained_limit, sustained_window_seconds)
values (true, 3, 60, 20, 86400);
commit;
```

Use INSERT rather than silently overwriting an existing policy. An unexpected
row/object or migration conflict stops the procedure for investigation. These
values are not final free/premium entitlements or a global dollar-spend cap.

## Read-only target preflight and remaining gaps

The linked receipt supersedes the earlier blanket access blocker. Items below
remain the pre-application checklist; observations are not guarantees about a
later operator connection or changed settings. Never read Auth user records,
JWTs, cookies or keys into an evidence artifact.

1. Record the operator-confirmed project name/ref, staging designation, region,
   dashboard identity and database identity; compare them in the same session.
   Verify database version, READ COMMITTED behavior and trusted migration role.
2. Inspect `supabase_migrations.schema_migrations` for existing versions and the
   proposed version `202609280001`. Check for existing private schema/tables/RPC
   and dependencies. Do not rerun an applied migration or resolve collisions by
   dropping objects. Record how the approved runner registers migration history.
3. Inspect schema/table/function owners, ACLs and default privileges for the
   migration role; role memberships for anon/authenticated/service_role and
   authenticator; RLS/policies and `auth.users` FK behavior. Review actual
   `auth.uid()` definition for verified JSON JWT claim compatibility.
4. Inspect PostgREST exposed schemas and search path in project API settings and
   role settings; `compiler_quota_private` must remain unexposed. Record RPC
   schema-cache refresh procedure, function EXECUTE grants and API statement
   timeout. Function-local `lock_timeout=3s` does not establish the PostgREST
   statement deadline; the application aborts the RPC at 5s without assuming rollback.
5. Review Auth signup/provider settings, email confirmation, redirect allowlist,
   rate limits/CAPTCHA/invitation controls, JWT issuer/audience/signing setup,
   refresh/session/revocation behavior. Record configuration without recording
   keys, JWTs, cookies, passwords or real account data.

## Proposed application and verification sequence (approval gated)

1. Preserve the verified dashboard runner receipt and finish real-JWT preflight
   after an approved staging sign-in surface is designated. Do not create an
   account, deploy an application or extract a token to bypass that prerequisite.
   Freeze the reviewed migration hash and approved target; retain a redacted
   preflight receipt. Keep compiler traffic quiesced and paid provider calls
   disabled. Establish operator access and the rollback path first. Record an
   operator-approved recoverability plan; the overview showed no backups.
2. Use the pinned runner procedure below; review the exact pending-file list and
   runner receipt before requesting **Decision A**. After that explicit approval,
   apply exactly the reviewed migration through that runner.
   Verify its history entry, object owner/ACLs, empty search_path, zero arguments,
   RLS/no client policies and private-schema exclusion. Stop on discrepancy.
3. Before policy insertion, verify a real verified account's RPC fails closed;
   the guarded route must return generic 503 and make no model call. Anonymous,
   expired, forged and missing sessions must not reserve or reach the provider.
4. Only after separate **Decision B**, insert the approved singleton row;
   inspect only approved numeric
   fields. Use disposable staging accounts and direct authenticated RPCs to test
   concurrency, isolation, 3-attempt burst exhaustion, sustained exhaustion,
   integer Retry-After, independent UTC-aligned rollovers and absence of direct
   table access. Direct RPC calls consume only the caller's own allowance.
5. Verify real PostgREST RPC JSON shape, verified identity, refresh/revocation,
   account deletion, outage/lock/statement timeouts, HTTP abort and ambiguous
   commit outcomes. Reservations persist after provider failure/disconnect;
   no automatic retry/refund or replay allowance is promised. Do not purge live
   counters to simplify testing; sustained-limit testing needs its own account
   and respects the burst window.
6. With separately authorized fixture-only hosting, verify route ordering,
   401/429/503, zero provider calls on rejection, secure origin/cookie behavior,
   retained intent/focus and mobile/desktop behavior. The current hosted browser
   suite uses loopback fixtures, not a deployed Supabase target.
7. Paid model smoke tests, measured token costs, physical devices/assistive
   technology, actual Suno/audio acceptance and deployment require their own
   later authority. This packet does not authorize them.

### Verified preflight access and proposed application runner

The read-only access path is Chrome > exact project > SQL Editor, effective
`postgres`, using explicit `BEGIN READ ONLY` / `ROLLBACK`. Latest result:
PostgreSQL 17.6, database `postgres`, required CREATE/REFERENCES/EXECUTE true,
BYPASSRLS true and SUPERUSER false; history table absent, quota schema absent,
zero RPC-name collisions. No migration-history initialization was attempted.
The SQL Editor requirement is satisfied for preflight. Do not require a CLI
sign-in merely to repeat these read-only dashboard facts.

For a later application, the following remains the locally rehearsed proposal
that registers history. It is **not** a claim of authenticated CLI target access.
If dashboard execution is instead selected for application, first prepare and
review its exact history-registration procedure separately; do not silently
paste the migration and leave history absent. The current user instruction
selects the SQL Editor for preflight only.

Supabase CLI **2.118.0**, Windows amd64, official release archive SHA-256
`e8eb5871b2a9e9b496d19f3fca4851d0c2a1bb8059613692d8906b5dc5fc2aad`.
Downloaded archive matched the release's checksums; `--version` returned 2.118.0.
[Release](https://github.com/supabase/cli/releases/tag/v2.118.0).
Use an isolated local runner directory containing only the byte-verified
`202609280001_compiler_quota.sql`, with generated local config and no seeds,
custom roles or Vault secret configuration. Do not add link metadata or secrets
to this repository. No global CLI installation or credential changes are needed.

The installed CLI help explicitly states that `db push` updates configured Vault
secrets unless `--skip-vault` is supplied. **Require `--skip-vault` on every
dry-run/application command.** Do not use `--include-all`, `--include-roles`,
`--include-seed`, `--debug`, `--create-ticket`, reset, repair or config push.

Proposed operator sequence, **not executed against the target**. All CLI commands
below use the pinned executable and the same isolated working directory; verify
that directory's linked ref is `mtzrvekmsmpflbsqgpcc` before each remote command.

1. Verify runner version/archive and migration hash again. The migration
   inventory must contain exactly one file, version `202609280001`.
2. Authenticate the existing operator in the CLI through user-controlled sign-in
   if necessary. Never transfer browser tokens or put passwords in command-line
   arguments/transcripts. A dashboard session alone does not prove CLI access.
3. In the isolated runner directory, explicitly link only
   `supabase link --project-ref mtzrvekmsmpflbsqgpcc`. Verify the resulting target
   ref and a read-only database identity/role receipt through that connection.
   Require effective `postgres`, the reviewed memberships/privileges, database
   identity and target. Stop for any role/ref/default-ACL difference.
4. Repeat collision/history checks and inspect the dry-run list using
   `supabase db push --linked --skip-vault --dry-run`.
   Stop if any file besides the pinned migration is pending, or any target object
   or history version now exists. Do not bootstrap/repair history during preflight
   merely to obtain a clean display.
5. Present the final runner receipt and request Decision A. Only after explicit
   approval, run
   `supabase db push --linked --skip-vault`.
   Read the interactive target/file confirmation; do not auto-confirm remotely.
   Supabase documents that the runner creates `supabase_migrations.schema_migrations`
   on first application and records successful versions. This metadata write
   must be part of Decision A; it is not contained in the immutable migration.
6. Inspect exactly one history entry for `202609280001`, expected name and stored
   statements against the reviewed file. Verify all migration objects and ACLs,
   then the schema-cache path and missing-policy rejection. On any ambiguous
   transport failure, query history and objects before retrying; never rerun or
   mark applied blindly. Dashboard SQL alone is not an equivalent runner.

Reference: [CLI migration/history behavior](https://supabase.com/docs/reference/cli/supabase-db-push),
[dashboard bypass of migration history](https://supabase.com/docs/guides/deployment/database-migrations).
These application instructions are a proposal; authenticated CLI target access
has not been established and is not needed for the completed dashboard checks.
The companion receipt records a successful local-only rehearsal:
dry-run left history/schema absent; application registered the sole version
with 13 statements, preserved expected function ACLs and seeded no policy.
The final disposable cluster shut down normally. Earlier launcher/fixture
failures are retained separately. This does not prove remote connection identity
or recovery from an interrupted history-registration step.

## Credentials, signup and global spend controls

Use the existing public Supabase URL/key plus the verified user session in the
application. Add no service-role/admin database credential to the app. Keep
OPENAI_API_KEY server/environment-only. Operator DB access and management tokens
stay in the privileged session or approved secret store; never put them in this
packet, CI, logs, screenshots, PR bodies or client bundles. CI uses only disposable
local fixture credentials and cannot make real paid calls.

Before any enabled pilot, approve invitation/closed signup or equivalent abuse
controls, confirmation requirements, CAPTCHA/rate limits, account-deletion and
multi-account response. Observed signup is open, confirmation on, CAPTCHA off;
Site URL is localhost and redirect allowlist empty. Approve exact HTTPS origins
and address these settings before traffic. No Auth change is authorized here.
Per-account quotas do not constrain account creation or total service spend.

Approve provider/project budget alerts, monitored thresholds, a named operator,
response times and a tested traffic/provider kill switch. Verify whether each
provider setting is a hard enforcement control or merely an alert. Supabase Free
spend cap is observed enabled. The designated OpenAI
[project limits](https://platform.openai.com/settings/proj_pBrkpocbPAtAPt6v7RAQy1EU/limits)
show no spend limit and therefore no project spend alerts. Its associated
[organization limits](https://platform.openai.com/settings/organization/limits)
show a $100 monthly budget, **Enforce a hard limit = false**, and alerts at
80% ($80) and 100% ($100). These are notifications, not an enforced $100 ceiling.
All current and future models are allowed. The repository's `gpt-5.6-luna`
model shows project limits of 500,000 TPM / 500 RPM, equal to the displayed
organization maxima; the organization also lists a 5,000,000 TPD batch queue
limit. Rate/queue limits are not aggregate financial caps. No setting was saved.
[Official OpenAI documentation](https://developers.openai.com/api/docs/guides/spend-limits)
describes optional hard limits separately from
alerts; verify the actual enforcement switch and allow for propagation overshoot.
No configured OpenAI hard dollar cap is established by this inspection. Resolve
an approved enforced aggregate limit, alert thresholds and response ownership;
verify server-side funding-project binding during later environment acceptance
without revealing the key. Designation alone does not prove an application key
belongs to the project. Keep the compiler disabled
until aggregate cost exposure is acceptable. Existing caps are maxRetries=0,
30s provider timeout and 2048 output tokens; input bytes do not measure token cost.

## Rollback and restoration (separate operator authority)

Quiesce compiler traffic, preserve the approved numeric policy and bounded usage
rows privately, then delete only the singleton policy row to block new
reservations. Zero limits are invalid. Policy deletion waits for reservations
holding its shared lock and cannot cancel model work already authorized.
Verify new attempts fail closed, observe in-flight work and confirm no new paid
calls. Leave the additive objects/counters in place. Do not truncate usage, remove
the route guard or drop data as an automatic rollback.

Restoration requires operator approval to reinsert the approved row and resume
traffic; retained counters/expiry times remain authoritative with no refund.
If a migration transaction fails, verify rollback and migration history before
retrying. Destructive schema reversal requires a separate reviewed migration,
dependency/data assessment and approval. Remote rollback has not been executed.

## Historical outstanding decision (superseded by current decision receipt)

**Do not request migration approval yet.** Authenticated dashboard SQL runner
preflight and designated provider-configuration inspection are complete to the
scope recorded above. Overall preflight remains partial: no designated staging
sign-in URL exists, so real signed-JWT propagation/rejection and application
refresh/revocation acceptance are unverified. The next required input is that
sign-in surface, followed by user-controlled sign-in if needed; never credentials
in chat. The proposed eventual application runner also requires its own
connection receipt before use. This packet does not claim all gates passed.

After those application-preflight gaps close, present two explicit choices:

- **Decision A - schema only:** approve applying only version `202609280001`,
  migration SHA-256 `bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`,
  to `mtzrvekmsmpflbsqgpcc` under the verified postgres operator, pinned CLI
  procedure (including migration-history initialization/registration and
  `--skip-vault`), with traffic quiesced, empty policy and no paid calls. Schema
  refresh and bounded post-application verification must be expressly included.
- **Decision B - private pilot policy:** separately approve insertion, only
  after Decision A and missing-policy rejection, of `(true, 3, 60, 20, 86400)`:
  three attempts per UTC-aligned 60-second window and twenty per UTC-aligned
  86,400-second window. No overwrite, entitlements or traffic enablement implied.
  Account creation, quota-consuming acceptance calls and cleanup/deletion need
  their own explicitly bounded staging-account authority.

Resolve signup, redirects, session acceptance, aggregate spend controls, operator
response and kill-switch verification before a separate traffic decision. No
production, paid-call, Vercel, deployment, PR promotion or merge permission is
implied by either decision.
