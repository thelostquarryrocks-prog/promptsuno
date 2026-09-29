# Compiler quota staging migration approval packet

Updated 2026-09-28 evening (2026-09-29 UTC). **STOP: preflight is partial;
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
- Dashboard branch label: **main / PRODUCTION**. User designation is staging;
  dedicated-staging use despite this label still needs owner confirmation.

Historical access receipt, superseded by the authenticated inspection below:
the exact dashboard redirected to Supabase sign-in
with this project as its return target. A credential-free GET to `/rest/v1/`
on the designated endpoint returned HTTP 401, `No API key found in request`.
This proves a responding protected API gateway, not project ownership or SQL
configuration. No API key was supplied and no RPC/model/mutation was invoked.
The operator was asked to sign in through the UI without sharing credentials.

**Fresh authenticated receipt:** existing Chrome operator authentication reached
the exact target. Owner access and database role `postgres` were observed. Six
explicit read-only SQL transactions and dashboard inspection established target
identity, PostgreSQL 17.6, relevant owners/default ACLs/memberships/RLS,
`auth.uid()` JSON-claim compatibility, API exposure and configured deadlines,
Auth settings and the Supabase spend cap. See the
[redacted receipt](Compiler-Quota-Staging-Preflight-2026-09-28.md) for facts,
sources, exact limitations and the distinction between configuration and real
JWT acceptance. No migration, RPC reservation or policy insertion ran remotely.

The migration-history table and all quota objects are absent. Existing
`profiles`, `prompts` and `handle_new_user` are present; this is not an empty
application database. No observed ACL/ownership/collision difference requires
editing the migration. The API exposes `public` and `graphql_public`, and the
authenticated statement timeout is configured as 8s; the route aborts at 5s.
`auth.uid()` compatibility does not prove signature verification or revocation.

Application decision remains withheld: reconcile the staging/PRODUCTION label,
verify the proposed runner's authenticated target identity and history behavior,
and resolve the stated JWT preflight gaps. Provider funding-project designation
and actual spend controls remain unavailable. Signup is open, CAPTCHA is off,
and redirects are local-only. Traffic approval remains separate and blocked.

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

1. Resolve the staging-label distinction and finish the missing preflight facts.
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

### Proposed runner and history procedure

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
These instructions are a proposal; authenticated CLI target access has not been
established. The companion receipt records a successful local-only rehearsal:
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
spend cap is observed enabled; OpenAI funding project and controls are unobserved.
[Official OpenAI documentation](https://developers.openai.com/api/docs/guides/spend-limits)
describes optional hard limits separately from
alerts; verify the actual enforcement switch and allow for propagation overshoot.
No configured OpenAI hard dollar cap is claimed. Keep the compiler disabled
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

**Do not request migration approval yet.** Authenticated dashboard access is
available, but dedicated-staging confirmation, runner connection verification
and the real-JWT preflight limitations are unresolved. The provider project is
also not identified for spend inspection. This packet is reviewable preparation,
not a claim that all preflight gates passed.

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
