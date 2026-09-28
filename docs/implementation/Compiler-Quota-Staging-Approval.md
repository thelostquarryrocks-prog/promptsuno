# Compiler quota staging migration approval packet

Prepared 2026-09-28. **STOP: remote migration and policy approval required.**
This packet authorizes no SQL execution, project creation, entitlement setting,
paid model calls, Vercel linking/deployment, promotion or merge.

## Target and observed facts

The user explicitly designated this staging target on 2026-09-28:

- Project ref: **`mtzrvekmsmpflbsqgpcc`**.
- Project endpoint: [designated Supabase target](https://mtzrvekmsmpflbsqgpcc.supabase.co).
- Dashboard: [exact project](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc).
- Human-readable project name, organization and region: **not observed**.

Observed read-only access: the exact dashboard redirects to Supabase sign-in
with this project as its return target. A credential-free GET to `/rest/v1/`
on the designated endpoint returned HTTP 401, `No API key found in request`.
This proves a responding protected API gateway, not project ownership or SQL
configuration. No API key was supplied and no RPC/model/mutation was invoked.
The operator was asked to sign in through the UI without sharing credentials.

Repository inspection found only `supabase/migrations/`, no Supabase config/link
metadata, no local `.env*`, no Supabase CLI on PATH, and no Supabase/database
credential environment variable names. No Supabase connector is available.
Authenticated inspection is blocked by the dashboard sign-in and absent
management/database access. Migration history, object ownership/default ACLs,
exposed schemas, Auth/JWT setup, authenticator memberships, grants, database
version and region remain **unverified**, rather than assumed from local tests.
Approval is incomplete until read-only preflight confirms the designated target.
Local PostgreSQL 17 uses an Auth shim and cannot establish these target facts.

Publication evidence: [stacked draft PR #4](https://github.com/thelostquarryrocks-prog/promptsuno/pull/4)
contains the exact base/head and reviewed CI receipts. The initial
[hosted CI run](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36445287563)
passed real PostgreSQL 17.11 17/17, units 95/95 and browsers 21/21; build and
typecheck passed. Final-head evidence is maintained in the draft PR description.
No hosted fixture result establishes real staging Auth/SQL acceptance.

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

## Read-only target preflight required before execution

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

1. Freeze the reviewed migration hash and approved target; retain a redacted
   preflight receipt. Keep compiler traffic quiesced and paid provider calls
   disabled. Establish operator access and the rollback path first.
2. Apply exactly the reviewed migration through the agreed migration runner.
   Verify its history entry, object owner/ACLs, empty search_path, zero arguments,
   RLS/no client policies and private-schema exclusion. Stop on discrepancy.
3. Before policy insertion, verify a real verified account's RPC fails closed;
   the guarded route must return generic 503 and make no model call. Anonymous,
   expired, forged and missing sessions must not reserve or reach the provider.
4. Insert the approved singleton row separately; inspect only approved numeric
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

## Credentials, signup and global spend controls

Use the existing public Supabase URL/key plus the verified user session in the
application. Add no service-role/admin database credential to the app. Keep
OPENAI_API_KEY server/environment-only. Operator DB access and management tokens
stay in the privileged session or approved secret store; never put them in this
packet, CI, logs, screenshots, PR bodies or client bundles. CI uses only disposable
local fixture credentials and cannot make real paid calls.

Before any enabled pilot, approve invitation/closed signup or equivalent abuse
controls, confirmation requirements, CAPTCHA/rate limits, account-deletion and
multi-account response. Actual target signup settings remain unobserved.
Per-account quotas do not constrain account creation or total service spend.

Approve provider/project budget alerts, monitored thresholds, a named operator,
response times and a tested traffic/provider kill switch. Verify whether each
provider setting is a hard enforcement control or merely an alert; no observed
provider configuration or hard dollar cap is claimed. Keep the compiler disabled
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

Complete authenticated read-only preflight for project `mtzrvekmsmpflbsqgpcc`
first. Then explicitly approve application of migration SHA-256
`bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`
to that exact target and, separately, insertion of `(true, 3, 60, 20, 86400)` under the
reviewed operator, verification and rollback procedure. Resolve signup/global
spend controls before enabling traffic. No production, entitlement, paid-call,
Vercel, PR promotion or merge permission is implied.
