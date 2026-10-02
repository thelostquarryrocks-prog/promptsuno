# Paid compiler API security

Status: authentication and bounded input implementation; **HOSTING BLOCKED**.
This is not production acceptance, merge authorization or deployment approval.

Current quota update (2026-09-28): the authorized local successor branch
`codex/atomic-compiler-quota` implements the proposal below. See
[Atomic-Compiler-Quota.md](Atomic-Compiler-Quota.md) for corrections, migration,
configuration, verification limits and hosting gates. The remaining sections
record the authentication work at `54dd77ff63f0b1a21d176af5f2e6bedf73c60b2e`;
their statements that quota is unimplemented describe that historical base.
No remote migration or deployment has been performed.

## Scope and authority

- Base: `codex/sound-brain-compiler-bridge` at exact green PR #2 head
  `3d44bfdb6ee4e6f44a65faf4c30cea26df58861a`.
- Head branch: `codex/paid-compiler-auth`; separate local commit(s), no changes to
  PR #2 or PR #3. No Vercel project/link, deployment, merge or protection change.
- User's 2026-09-28 security work package plus current project instructions,
  Product and Architecture, and Development Handoff govern this implementation.
- Source inspection found one paid entry point: POST `/api/generate`, containing
  the only model call. No server action or alternate compiler route exists.
- Preserve the model, system/developer prompts, catalog, matrix, UI and bridge
  request shape `{ nodes, relationship_notes }`.

## Request boundary

1. Create the existing Supabase SSR client from request cookies. Verify through
   `auth.getUser()` against the Auth server. Never authorize from `getSession()`
   user data, a decoded cookie alone, a body ID, a header ID, or browser state.
   A successful result must have a user ID and no error.
2. Missing/invalid/expired sessions return JSON 401 before reading the body or
   constructing OpenAI. Auth client/verification exceptions return safe 503.
   Supabase can legitimately refresh an expired access token when its refresh
   session is still valid; expiration with an invalid refresh session is denied.
3. Middleware passes this route directly to its own guard, avoiding duplicate
   refresh requests and middleware errors/redirects in place of API JSON errors.
   The existing SSR cookie adapter continues to write refreshed cookies.
4. Require application/json (415 otherwise). Reject a present nonmatching or
   opaque Origin and cross-site Fetch Metadata (403). Originless non-browser
   JSON is allowed only after session verification. Compare the origin to the
   request Host and URL protocol, since Next can use an internal URL hostname;
   never trust an arbitrary forwarded-host override. Do not add permissive CORS.
5. Cap actual streamed bytes at 256 KiB, including absent or dishonest
   Content-Length. Oversize returns 413. Reject invalid UTF-8/JSON and shape with
   400. JSON must have exactly nodes and relationship_notes. All node IDs, labels
   and categories must match unique catalog records; all 899 current catalog
   records remain eligible. Bound node count by catalog size before traversal.
6. Cap notes at 16 KiB of UTF-8, reject instead of truncating or normalizing.
   These are application resource budgets, not claims about Suno syntax, prompt
   length, numeric weighting, punctuation or output adherence. Authored Unicode,
   whitespace, numbers and punctuation pass unchanged when within the bounds.
7. Keep the existing 2,048 completion-token cap. Disable SDK automatic retries
   and set its request timeout to 30 seconds to bound automatic amplification.
   A timeout does not prove the provider stopped processing or charging.
8. Mark all route responses private/no-store. Keep credentials server-side and
   return only generic auth/provider failures. Do not log user notes or session
   tokens. Verified identity is not sent to the model. Matrix data is excluded.

Supabase documents [getUser](https://supabase.com/docs/reference/javascript/auth-getuser)
as an Auth-server verification request and warns against trusting session user
data in server code. Installed Next.js 16.3.6 route/auth/cookie guides and the
installed Supabase SSR implementation were inspected for this integration.

## Durable rate limiting decision — approval required

Repository and environment inspection found only Supabase authentication
plumbing, no database schema/migrations, rate-limit RPC, durable counter adapter,
Redis dependency or configured limiter/database credentials. No real Supabase
URL/key is configured in this checkout; browser tests supply local placeholders.
No live database was available to inspect. An OpenAI environment key is present;
its value was never printed or committed, and tests override it with a fixture.

Per the explicit work-package boundary, no migration, external service,
credential provisioning or access-policy change was attempted. **There is no
rate limiter, quota accounting, or 429 quota response in this change.** Local
fixture counters only assert model-call counts during tests; they are not
application controls or production protection.

Concrete implementation choice for approval: retain Supabase and add a private
Postgres quota table plus a narrowly granted atomic RPC, called with the verified
user's Supabase session before every model request. Derive the key inside SQL
from `auth.uid()`; accept no client-supplied identity, limit or clock. Deny direct
table access. Use a carefully scoped SECURITY DEFINER function with a fixed safe
search_path and only the minimum execute privileges. A single transaction must
lock/upsert per-user minute and daily counters in a consistent order, use the
database clock, and reserve an attempt only if both approved budgets permit it.
Concurrent requests across instances must contend on the same durable rows.
Keep reservations on provider failures/timeouts to prevent retry abuse.

The human decision is approval of this migration/access policy and numerical
minute/daily budgets based on model cost and desired free/premium economics.
Those values are deliberately not invented here. The future API must return
429 plus Retry-After when denied, and fail closed with 503 on quota-store failure.
Before hosting, test simultaneous requests from multiple connections, isolation
between users, forged identity attempts, window rollover, retention cleanup,
transaction rollback, provider failure, store outage, and zero model calls on
every denied reservation. Review grants/RLS and the deployed migration evidence.

## Residual exposure and hosting gates

- Any valid signed-in user can currently make repeated/concurrent model calls.
  Authentication plus input/output bounds do not cap aggregate cost. There is
  no subscription entitlement check; no billing contract was introduced.
- Self-signup and multiple accounts can evade a per-user budget alone. Approve
  signup policy and operational/global provider spend controls before hosting.
- Body bytes are bounded in the handler, but inbound bandwidth, slow upload,
  auth traffic and distributed abuse require hosting/edge controls. No WAF or
  security-sensitive provider configuration was changed.
- Verify real Supabase sign-in, cookie refresh, expired/invalid/revoked sessions,
  sign-out and actual Vercel-origin behavior in a separately authorized staging
  environment. Local simulated Auth is not real-account acceptance.
- Real model behavior and Suno audio acceptance are not established by fixtures.
- **Not ready for a first production-class Vercel deployment.** Finish approved
  durable limiting, real-account acceptance and cost configuration, then request
  the separate hosting/deployment approval. No hosting action is authorized here.

## Verification

Local evidence is retained under the ignored `.verification/paid-compiler-auth/`
directory. The browser harness binds Auth and
model fixtures to loopback, always overrides inherited provider credentials and
base URL, and refuses to reuse an unknown existing application server.

Unit tests cover auth absence/expiry/invalidity, successful verification, thrown
verification failures, client identity spoofing, invalid payloads, byte limits,
UTF-8, cross-origin rejection, unchanged notes/IDs, provider failures and output
validation. Rejection tests assert no model call; auth rejection also asserts
the body was not read and the model client was not constructed.

New browser cases use the production Next route, real Supabase SDK cookie logic,
simulated Auth HTTP responses and a simulated model HTTP endpoint. They do not
intercept the compiler API. Cases cover absent/forged/expired/revoked sessions,
malformed/oversized/cross-origin requests, authenticated compile, exact payload
fidelity, request counts, note retention, keyboard focus and responsive overflow.
The earlier nine UI cases retain controlled compiler responses for their existing
loading/error/clarification/copy/export/drag coverage.

Final local commands and evidence (2026-09-28):

| Command/check | Result | Evidence within `.verification/paid-compiler-auth/` |
| --- | --- | --- |
| `npm.cmd run lint` | 0 errors, 2 baseline unused-variable warnings in middleware and Supabase server helper | `lint-final.log` |
| `npm.cmd run typecheck` | Successful route type generation and TypeScript check | `typecheck-final.log` |
| `npm.cmd test` | 72 passed, 0 failed, 0 skipped; 3 test files, including 35 API cases | `unit-serial.log` |
| `npm.cmd run build` | 8/8 static pages, 0 build warnings, 0 build errors | `build-final.log` |
| `npm.cmd run test:e2e -- --output=.verification/paid-compiler-auth/browser-results-final` | 15 passed, 0 failed, 0 skipped in 4.8 minutes; mobile Chromium, desktop Chromium, mobile WebKit | `browser-final.log`, `browser-results-final/`, `playwright-report-final/` |
| Credential and line-ending scan | No exact environment key value in 52 tracked/staged files or 14 client JS chunks; no OPENAI_API_KEY marker in client chunks; all 11 staged blobs use LF | `credential-scan-final.log` |
| `git diff --check` and catalog/matrix diff | No whitespace errors; canonical catalog and matrix unchanged | Git inspection |

The build used process-local `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3132`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY=local-fixture-placeholder` and
`NEXT_TELEMETRY_DISABLED=1`. The browser commands used
`PLAYWRIGHT_HTML_OUTPUT_DIR` for their corresponding ignored report directory.
There was no locked dependency change or installation in this work package.
New-head hosted CI was not run: this branch is local and unpublished. Base-head
CI was independently confirmed successful via GitHub run `36367052696`.
No real signed-in Supabase check, real model call, physical-device test or hosted
acceptance was performed. No rate-limit tests/429 claims apply because durable
limiting stopped at the requested approval boundary.

The final browser run was serial against the rebuilt corrected route, with
network access for the existing font resources. All six new security cases and
all nine existing interaction cases passed. Auth/model behavior was simulated
at HTTP boundaries; the new security cases exercised the real built route.
The mobile rejected-session screenshot was visually inspected: selection and
authored notes remain, with a visible keyboard focus outline. Expected 401
console responses are classified explicitly; no unexpected browser console or
page errors were observed by the security flow assertions.

Earlier failures are retained, not counted as successful final verification:

- The first `npm.cmd run test:e2e -- --output=.verification/paid-compiler-auth/browser-results`
  attempt ran inside the network sandbox. One API case passed; the next case
  timed out while existing Three.js font fetches were denied with
  `ERR_NETWORK_ACCESS_DENIED`. The task-owned runner tree was then stopped.
  This incomplete attempt is in `browser.log` and `browser-results/`.
- The network-enabled `npm.cmd run test:e2e -- --output=.verification/paid-compiler-auth/browser-results-network`
  run completed with 11 passed, 4 failed, 0 skipped. Two Chromium security
  failures exposed the incorrect request-URL origin comparison; Host comparison
  and unit regression cases repaired it. The other failures were desktop drag
  readiness and WebKit login timeouts while other validation was running.
  Evidence: `browser-network.log`, `browser-results-network/`,
  `playwright-report-network/`.
- An overlapping `npm.cmd test` run had 70 passed, 2 failed, 0 skipped; two
  unchanged component cases exceeded their existing five-second timeout. The
  subsequent serial run passed all 72 without weakening assertions or timeouts.
  Evidence: `unit-final.log` (failure) and `unit-serial.log` (success).
- Baseline Three.js CommonJS test deprecation and browser-runner NO_COLOR /
  FORCE_COLOR warnings remain. Expected Supabase SDK `Invalid fixture refresh
  token` diagnostics occur during deliberately invalid-session cases. These
  fixtures contain no real credentials or accounts.

## Changed files

| File | Purpose |
| --- | --- |
| `README.md` | Put the hosting block ahead of the scaffold's deployment instructions |
| `src/app/api/generate/route.ts` | Verified session guard, safe JSON errors, no-store responses and bounded SDK attempts |
| `src/lib/compiler-request.ts` | JSON/origin/streamed byte validation and application resource budgets |
| `src/lib/sound-brain-catalog.ts` | Bound node count and UTF-8 notes while preserving identity validation |
| `middleware.ts` | Delegate compiler API authentication to its route guard |
| `tests/generate-route.test.ts` | Auth, rejection/no-call, transport and input boundary coverage |
| `tests/e2e/compiler-security.spec.ts` | Built API and browser session security checks |
| `tests/e2e/server.mjs` | Valid/invalid/revoked Auth fixture and model HTTP fixture with call-count evidence |
| `playwright.config.ts` | Require a task-owned fixture server, never silently reuse an unknown server |
| `docs/authority/PromptSuno-Development-Handoff-v1.md` | Current implementation update and explicit hosting block |
| `docs/implementation/Paid-Compiler-Security.md` | Security decision, verification and residual exposure |
