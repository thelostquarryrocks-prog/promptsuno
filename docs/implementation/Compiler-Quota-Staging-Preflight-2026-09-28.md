# Compiler quota authenticated staging preflight receipt

Observed 2026-09-28 evening America/New_York (2026-09-29 UTC). This is a
redacted configuration receipt, not migration execution or traffic acceptance.
**PARTIAL: authenticated inspection succeeded; application approval is withheld.**

## Scope and provenance

- Only Supabase project `mtzrvekmsmpflbsqgpcc` and its owning organization's
  subscription controls were inspected on Supabase. No other Supabase project
  was used. Follow-up at 2026-09-29 02:20 UTC also inspected the explicitly
  designated OpenAI project `proj_pBrkpocbPAtAPt6v7RAQy1EU` and its associated
  organization's limits through existing Chrome authentication.
- Existing Chrome operator authentication was available. No new sign-in,
  credential extraction, API-key reveal, account creation or paid call was needed.
- The signed-in operator has project **Owner** access; SQL queries ran with
  `session_user = current_user = postgres`. Personal account identifiers are
  omitted. This identifies the access role, not a transferable credential.
- Seven catalog/configuration/claim-extraction SQL batches ran in explicit
  `BEGIN READ ONLY` / `ROLLBACK` transactions. No application/user rows were
  selected. One batch used synthetic, transaction-local JWT claim settings and
  `SET LOCAL ROLE authenticated`; it changed no persistent Auth configuration.
- Dashboard controls were inspected without saving changes. Query editor text
  may be managed by dashboard autosave; no migration or policy SQL was submitted.
- Initial live GitHub inspection: [PR #4](https://github.com/thelostquarryrocks-prog/promptsuno/pull/4)
  OPEN, DRAFT, unmerged; head `90848ad6249262144c3894eddc5a694db43304cd`, branch
  `codex/atomic-compiler-quota`; base `codex/sound-brain-compiler-bridge` at
  `3d44bfdb6ee4e6f44a65faf4c30cea26df58861a`.
- Local head matched. Migration SHA-256 matched exactly:
  `bf5b5ca0a2a6b4519a53e786975e489a809d995d84601d78b95e9d502a3bbd19`.
- [CI 36447718209](https://github.com/thelostquarryrocks-prog/promptsuno/actions/runs/36447718209)
  was freshly reported completed/success for that head. Prior detailed test totals
  in the PR are historical receipts; this preflight did not rerun those suites.

## Target identity and designation

| Item | Observed fact |
| --- | --- |
| Project ref / name | `mtzrvekmsmpflbsqgpcc` / `promptsuno` |
| Organization | `thelostquarryrocks-prog's Org`, Free plan |
| Organization ref | `gattjolcitbrzqvxxhsa` |
| Region | `us-east-1`, East US (North Virginia) |
| Branch badge | `main / PRODUCTION`; no additional branches shown |
| User designation | The user designated this exact ref as staging |
| Label interpretation | Supabase's default main-branch label does not override the user's explicit staging designation; no repeated designation approval is required |
| Database / owner | `postgres` / `postgres` |
| Server | PostgreSQL 17.6, aarch64 Linux, gcc 15.2.0, 64-bit |
| Dashboard service versions | Postgres `17.6.1.166`; PostgREST `14.5`; Auth `2.197.0` |
| SQL session | `postgres`, READ COMMITTED; read-only transaction confirmed `on`; statement timeout `2min` |
| SQL search path | literal `"\$user", public, extensions` |
| Availability | Healthy, NANO; no backups shown on overview |

Sources: [overview](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc),
[general settings](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/settings/general),
and catalog batch Q1. These observations do not establish absence of production
consumers. Follow-up review of [Supabase's dashboard branching documentation](https://supabase.com/docs/guides/deployment/branching/dashboard)
confirms that projects without GitHub integration display the same main/PRODUCTION
label. The target overview showed no connected repository. The earlier receipt's
inference that this label itself required a second staging confirmation was too
strong and is superseded here. The exact user-designated target remains fixed;
no project, branch, consumer or setting was changed.

## Migration history, ownership and access

Q7 follow-up (2026-09-29 02:20 UTC) used the user-selected authenticated Chrome
SQL Editor in the exact project. It independently refreshed the operator and
collision facts in `BEGIN READ ONLY` / `ROLLBACK`. The one-row catalog result
contained only configuration: database/current_user/session_user all `postgres`,
server version 17.6, read_only `on`, statement_timeout `2min`, SUPERUSER false,
BYPASSRLS true; CREATE on public, REFERENCES on auth.users and EXECUTE on auth.uid
all true; auth.uid without claims NULL. History table remained NULL, quota
schema absent and RPC-name collision count zero. The initial Run click timed
out before results appeared; the visible editor still had no result. The
editor's Ctrl+Enter command produced the successful read-only result, reviewed
again at the end. No mutating SQL, application rows or secret values were used.
This is authenticated **dashboard runner preflight**, not a remote CLI receipt
or migration application. No CLI sign-in is needed for these dashboard checks.

Q1: `to_regclass('supabase_migrations.schema_migrations')` returned NULL;
`compiler_quota_private` did not exist; its object list was empty; no function
named `reserve_compiler_attempt` existed in any schema, including overloads.
The [Migrations page](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/database/migrations)
showed **Run your first migration**. Version `202609280001` is not registered in
the absent history table. This is not a claim that the database has never been
changed manually: existing application objects are present.

Q2/Q3 inspected `pg_roles`, `pg_auth_members`, `pg_namespace`, `pg_default_acl`,
`pg_class`, `pg_proc`, `pg_constraint`, `pg_policy` and `pg_db_role_setting`:

- `postgres` is LOGIN, INHERIT, CREATEDB, CREATEROLE, BYPASSRLS, not SUPERUSER.
  It owns the database and can CREATE database objects and public-schema objects,
  use `auth`, REFERENCES `auth.users`, and EXECUTE `auth.uid()` (all checked true).
- `anon` and `authenticated`: NOLOGIN, INHERIT, no superuser/create-role/create-db/
  bypass-RLS. No direct memberships were returned for either. `service_role`
  likewise has no direct memberships but has BYPASSRLS.
- `authenticator`: LOGIN, NOINHERIT, no superuser/create-role/create-db/bypass-RLS.
  It can SET ROLE anon/authenticated/service_role, with no ADMIN or inherited
  membership. `postgres` can SET/INHERIT those roles and authenticator with ADMIN;
  it also has pg_monitor, pg_signal_backend, pg_read_all_data and
  pg_create_subscription with ADMIN/INHERIT/SET, and supabase_privileged_role with
  INHERIT/SET but no ADMIN.
- `public` belongs to `pg_database_owner`; that role has USAGE/CREATE. PUBLIC,
  postgres, anon, authenticated and service_role have USAGE. `auth` belongs to
  supabase_admin; anon/authenticated/service_role/postgres have USAGE;
  supabase_admin, supabase_auth_admin and dashboard_user have USAGE/CREATE.
- For objects created by postgres in `public`, default ACLs grant all table
  privileges, function EXECUTE, and sequence SELECT/UPDATE/USAGE to postgres,
  anon, authenticated and service_role. The same public defaults exist for
  supabase_admin-created objects; postgres also has these defaults in `storage`.
  No global postgres default ACL entry was returned. The migration's explicit
  revokes cover the observed public function defaults and PUBLIC's implicit
  EXECUTE. No extra untrusted grantee was observed in these relevant defaults.
- `auth.users` owner is supabase_auth_admin; RLS on, FORCE RLS off, zero policies.
  ACLs: owner all table privileges; dashboard_user all except grant option;
  postgres all with grant option on INSERT. UUID `id` is the primary key;
  the operator has REFERENCES for the migration's cascading FK.
- `auth.uid()` belongs to supabase_auth_admin, is SQL/STABLE, and is executable
  by PUBLIC (plus owner/dashboard_user explicit grants). Its definition casts
  `coalesce(nullif(request.jwt.claim.sub,''), nullif(request.jwt.claims,'')::jsonb
  ->> 'sub')` to UUID. SQL without claims returned NULL. It performs no JWT
  signature verification by itself.

Q5 inspected existing configuration only. `public.profiles` and `public.prompts`
belong to postgres, have RLS on / FORCE RLS off, and table grants to postgres,
anon, authenticated and service_role. Profiles have own-ID SELECT/UPDATE policies;
prompts have own-user_id SELECT/UPDATE/DELETE and INSERT WITH CHECK policies,
all using `auth.uid()` and addressed to PUBLIC. The enabled
`auth.users.on_auth_user_created` trigger calls `public.handle_new_user()`.
That existing function is SECURITY DEFINER, owned by postgres, has no local
configuration/search_path, and EXECUTE for PUBLIC/anon/authenticated/service_role.
Its hardening is a separate existing-schema concern; no change was made and it
does not collide with the quota function. Preserve its behavior during account
acceptance tests.

## Data API, JWT claims and deadlines

[Data API settings](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/integrations/data_api/settings):
API installed/enabled; exposed schemas `public`, `graphql_public`; extra search
path `public`, `extensions`; max rows 1000; pool size unset/automatic. Two of two
tables and one of one functions exposed, the latter `public.handle_new_user`.
Automatically expose new tables is on. The absent private schema is not exposed;
recheck exclusion and effective ACLs after migration, because current absence
does not prove future isolation.

Q3 found role settings: anon statement timeout 3s; authenticated 8s;
authenticator statement timeout 8s and lock timeout 8s. No allowlisted pgrst
schema/search-path/pre-request/audience/role-claim/channel overrides were returned.
This is configuration evidence, not a measured live RPC timeout. The application
aborts at 5s; PostgreSQL may still commit before its 8s deadline. No refund/retry
or guaranteed rollback may be inferred from the HTTP abort.

Q4 inspected enabled event triggers `pgrst_ddl_watch` / `pgrst_drop_watch` and
their `extensions` function definitions. Relevant CREATE/ALTER/COMMENT/drop
events send `NOTIFY pgrst, 'reload schema'`. The automatic path is installed;
listener delivery and new RPC visibility require post-application verification.
The [documented manual refresh](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema)
is the same NOTIFY command; it was **not run**. Config reload is distinct from
schema reload. Role deadlines follow the [timeout documentation](https://supabase.com/docs/guides/database/postgres/timeouts).

Q6, in a read-only transaction with SET LOCAL ROLE authenticated, an empty legacy
sub and a synthetic JSON claims UUID, returned `authenticated | on | true` for
role / read-only / expected auth.uid match. All session-local changes rolled
back. This verifies JSON-sub compatibility and function access, **not** a signed
JWT, real account, signature algorithm enforcement or PostgREST identity binding.

[JWT settings](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/settings/jwt)
show current ECC P-256 and previous legacy HS256, with the previous key still
usable for verification. No key values or identifiers are retained here.
Third-party Auth providers: none listed. Auth hooks: none configured. Actual
accepted issuer/audience, forged/expired-token rejection, live `sub` propagation,
and revocation behavior have **not** been verified through real PostgREST/Auth
requests. No approved application-user session is available in this workspace;
the dashboard operator session is not an application JWT. In the follow-up,
the user explicitly confirmed that a PromptSuno sign-in URL connected to
staging is **not designated yet**. That missing application surface is the
precise remaining real-session acceptance blocker. Do not create accounts,
deploy a surface, mint a substitute token or collect credentials to bypass it.

## Auth configuration

| Setting | Observed value |
| --- | --- |
| New signup | Enabled |
| Confirm email | Enabled |
| Manual linking / anonymous sign-in | Disabled / disabled |
| Providers | Email enabled; displayed phone, SAML, Web3 and social providers disabled |
| CAPTCHA | Disabled |
| Leaked-password protection | Disabled |
| Access-token lifetime | 3600 seconds |
| Refresh replay detection/revocation | Enabled |
| Refresh reuse interval | 10 seconds |
| Single session | Disabled; control unavailable on Free |
| Time-box / inactivity timeout | 0 / 0, never; controls unavailable on Free |
| Refresh requests | 150 per 5 minutes per IP |
| Verification requests | 30 per 5 minutes per IP |
| Signup/sign-in requests | 30 per 5 minutes per IP |
| SMS | 30/hour, disabled control |
| Anonymous sign-ins | 30/hour/IP, disabled control |
| Web3 signup/sign-in | 30 per 5 minutes/IP, disabled control |
| Email delivery rate | Disabled control; value redacted by inspection surface, not claimed |
| IP forwarding for rate limits | Disabled |
| Site URL | `http://localhost:3000` |
| Redirect allowlist | Empty |

Sources: project Auth [providers](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/auth/providers),
[sessions](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/auth/sessions),
[rate limits](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/auth/rate-limits),
[protection](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/auth/protection),
[redirects](https://supabase.com/dashboard/project/mtzrvekmsmpflbsqgpcc/auth/url-configuration).
No settings were altered. Supabase documents that issued access JWTs can remain
valid until expiry after session termination; do not promise immediate
PostgREST revocation without testing the application's verification path.
See [session semantics](https://supabase.com/docs/guides/auth/sessions).

## Spend controls and traffic blockers

- Owning organization [billing configuration](https://supabase.com/dashboard/org/gattjolcitbrzqvxxhsa/billing):
  Free plan, spend cap **enabled**, constrained to included usage. UI states no
  extra usage charge and warns projects may become unresponsive/read-only on
  quota exhaustion. This is a quota enforcement control, not just an alert, and
  is neither a configurable aggregate OpenAI dollar cap nor an availability SLA.
- Supabase's [cost-control guide](https://supabase.com/docs/guides/platform/cost-control)
  describes exclusions for explicitly opted-in predictable costs. No upgrade,
  add-on purchase or cap change was made. No configured custom alert threshold
  was observed; none is claimed.
- The user subsequently designated OpenAI funding project
  **`proj_pBrkpocbPAtAPt6v7RAQy1EU`**. Authenticated Chrome inspection of its
  [project Limits page](https://platform.openai.com/settings/proj_pBrkpocbPAtAPt6v7RAQy1EU/limits)
  showed project name **promptsuno**, organization display name **Personal**,
  and **No spend limit set** / set a limit to enable alerts. Thus no project
  budget or project spend alerts were configured on this page. This supersedes
  the earlier provider-designation/access gap; no key was inspected or revealed.
- The associated [organization Limits page](https://platform.openai.com/settings/organization/limits)
  showed Usage tier 1, a **$100 monthly spend limit** and alerts at **80% ($80)**
  and **100% ($100)**. Opening its edit dialog for inspection confirmed the
  existing amount 100 and **Enforce a hard limit: aria-checked=false**. Cancel
  closed the unchanged dialog. This is a **soft budget with notifications**,
  not an enforced $100 cap. The hard-enforcement control is available but off.
  No billing/payment details or actual expenditure are retained in this receipt.
- Project model access is **Allow all models** (selected): all current and
  future models allowed, subject to organization/system restrictions. The
  inspection dialog was cancelled without saving. The project rate-limit
  panel states limits inherit from the organization unless overridden. For
  the exact model in `src/app/api/generate/route.ts`, **gpt-5.6-luna**, the
  displayed project values equal the organization maxima: **500,000 TPM** and
  **500 RPM**. Organization batch queue limit: **5,000,000 TPD**. These are
  throughput/queue controls, not an aggregate dollar cap. No distinct lower
  project rate was observed for this model; no settings were changed.
- Current [official OpenAI spend-limit documentation](https://developers.openai.com/api/docs/guides/spend-limits)
  distinguishes alerts (requests continue) from optional organization/project
  hard enforcement (429 after tracked threshold, with possible propagation
  overshoot). Availability in documentation does not prove this project's
  configuration. A budget field alone does not prove enforcement is enabled.

Before traffic: resolve closed/invitation-only signup or equivalent approved
abuse controls, confirmation, CAPTCHA and endpoint limits; approve exact HTTPS
site/redirect origins; assess multi-account/account-deletion abuse. The
designated OpenAI project's controls are now inspected; approve aggregate
enforced exposure plus alerts,
operator response ownership and a tested kill switch. Retain quotas as per-user
fixed windows, not a financial guarantee. Resolve existing session and JWT
acceptance gaps. These are separate from permission to install an empty-policy
schema while traffic is quiesced. Also verify later that the server-side
deployment credential is bound to the designated funding project without
exposing it. The user's funding designation and dashboard selection do not
prove the application environment's key binding.

## Comparison and outstanding decisions

### Local runner rehearsal (separate from target evidence)

Pinned official Supabase CLI 2.118.0 Windows amd64 archive matched its published
SHA-256 `e8eb5871b2a9e9b496d19f3fca4851d0c2a1bb8059613692d8906b5dc5fc2aad`.
Its actual help revealed that `db push` also updates Vault secrets from config
unless `--skip-vault` is specified. The proposed procedure now always uses this
flag and an isolated runner with only the unchanged migration.

Executed a fresh disposable PostgreSQL 17.11 cluster bound only to
`127.0.0.1:55441`, database `promptsuno_runner_test`. Bootstrap was a separate
fixture_admin; migration operator postgres was a non-superuser with BYPASSRLS,
CREATE privileges, auth.users REFERENCES and representative observed defaults.
The Auth shim used the observed legacy/JSON-sub extraction. No real accounts,
tokens, provider configuration or remote connection were involved.

Commands actually run through the ignored rehearsal script:

- Official CLI `--version`, `db push --help`, `init --help`.
- `supabase init --workdir <isolated local runner>`.
- Existing portable PostgreSQL `initdb`, hidden `pg_ctl start`, `createdb`, and
  `psql -X -w -v ON_ERROR_STOP=1` for the disposable fixture and catalog checks.
- `supabase db push --workdir <isolated local runner> --db-url <loopback fixture URL> --skip-vault --dry-run`.
- The same local-only command with `--yes` instead of `--dry-run`.
- `pg_ctl -m fast -w stop`, with normal shutdown confirmed in the database log.

Reviewed success-path results: dry-run listed only
`202609280001_compiler_quota.sql`, and left history/quota schema absent.
Application exited 0 and recorded exactly one history row, version
`202609280001`, name `compiler_quota`, 13 stored statements. Function owner
postgres, SECURITY DEFINER, zero arguments, empty search_path, lock_timeout 3s,
ACL `{postgres=X/postgres,authenticated=X/postgres}`. Policy and usage each
contained zero rows. anon/authenticated/service_role lacked private-schema
USAGE; RPC EXECUTE was false/true/false respectively. This is one successful
runner rehearsal, not another execution of the repository's 17-test DB suite.
Crash/transport-failure atomicity of history registration was not established.

Local receipts (ignored, not committed): `.verification/quota-preflight/`.
`rehearsal-final.log` and `runner-final/{runner-dry-run,after-dry-run,runner-apply,
runner-verification,postgres}.log` contain the successful run and shutdown.
Earlier attempts remain: `rehearsal.log` (launcher did not return, interrupted),
`rehearsal-retry.log` plus `retry/fixture.log` (fixture attempted to remove
SUPERUSER from PostgreSQL's bootstrap role; rejected; cluster stopped). The final
fixture corrected this by using a separate bootstrap role. Initial sandboxed CLI
help failed on its telemetry-file write; elevated help succeeded. An npm version
lookup stalled and was cancelled; official release metadata supplied the pin.
None of these failures involved the designated remote target or was reclassified
as a successful test.

### Remaining gates

No observed collision, owner, relevant default ACL or JSON-sub compatibility
difference requires changing the pinned migration. PostgreSQL 17.6 differs from
the CI fixture's 17.11; real-target migration behavior remains unexecuted.
No migration bytes were changed or substituted under the original hash.

The user selected Chrome's SQL Editor for read-only migration-runner preflight;
Q7 verifies that path and the effective operator. This supersedes any inference
that a CLI login was required just to complete dashboard preflight. Browser
authentication does not establish CLI access, but no CLI credentials are
requested for this read-only work.

The locally rehearsed pinned CLI remains a **proposed later application runner**
because it registers migration history. Require `--skip-vault` if that proposal
is selected, and verify the identity/role/pending list of that future connection
before application approval. If dashboard execution is chosen instead, first
prepare and review its exact history-registration procedure; do not silently
paste the migration and leave history absent. The current user instruction
authorizes SQL Editor queries only. No remote runner initialization, history
repair or DDL was attempted. Portable CLI and local rehearsal receipts remain
ignored local artifacts; no linked project metadata or secrets were added.

Application approval remains withheld pending real-JWT preflight evidence from
a designated staging sign-in surface and the eventual application runner's
connection receipt. Dashboard runner preflight and provider configuration
inspection succeeded; they do not establish real application-session behavior
or enforced aggregate spend protection. The exact migration and the private
policy `(true,3,60,20,86400)` are
separate decisions; neither is approved or executed by this receipt. See the
[approval packet](Compiler-Quota-Staging-Approval.md) for sequence and gates.

## Documentation delivery and CI boundary

Follow-up provenance: started from local documentation head
`a6afc09822cdaf7ab982a8d04b03e8dfa1ea219f`. Fresh GitHub inspection again confirmed
PR #4 OPEN/DRAFT/unmerged at the original required head
`90848ad6249262144c3894eddc5a694db43304cd`, with unchanged base/head branches.
The migration hash was freshly rechecked and matched. This continuation changes
only the same three documentation files; it does not publish them. The final
local commit SHA is reported in the handoff. Runtime suites were not rerun for
these documentation changes; the required new-head CI jobs below remain pending
separately authorized publication.

This follow-up changes only this receipt, the staging approval packet and a
supersession note in Atomic-Compiler-Quota.md. Runtime code, tests, workflow and
migration bytes are unchanged. The local commit is not pushed; PR #4 remains at
the reviewed original head. The resulting local SHA is reported in the handoff.

Local document validation: `git -c core.autocrlf=false diff --check`,
`git diff --cached --check`, exact migration SHA-256 verification, final scoped
diff review and `node .verification/quota-real/security-scan.mjs`. The staged
scan included the new receipt: 77 files and 14 existing built client chunks,
zero exposed configured credential values and zero server-only client markers.
Both whitespace checks found no errors; the migration hash remained unchanged.
No build, lint, unit, full database suite or browser suite was rerun for these
documentation-only changes; no new test totals or build results are claimed.

After separately authorized publication, both repository CI jobs must run on
the resulting exact head: **PostgreSQL 17 quota integration (17 checks)** and
**Build, types, lint and tests**. Their earlier green result does not cover a new
commit. Native staging/JWT/paid-provider/physical-device acceptance remains
distinct from these fixture-based hosted checks.
