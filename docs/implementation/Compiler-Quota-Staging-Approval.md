# Compiler quota staging migration approval packet

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

## Exact outstanding decision

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
