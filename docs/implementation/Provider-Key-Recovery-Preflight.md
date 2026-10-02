# Provider credential recovery preflight

Date: 2026-10-01 (America/New_York)

Status: **FAIL-CLOSED — CREDENTIAL PATH NOT READY FOR APPROVAL**

This receipt records a read-only recovery preflight after the API Platform web
console created an unacceptable broad, non-expiring service-account key during
the earlier paid-smoke attempt. It creates no credential, changes no role or
control, adds no Vercel variable, deploys nothing, and makes no provider or paid
request. No secret value, session material, account email, service-account ID,
user ID, cookie, token, or private quota identity is recorded.

The supported API mechanics are real, but the end-to-end path is not safe to
approve yet. The existing service account is still assigned the preset
`Member` role instead of the intended custom role, and the narrowest Admin-key
write option exposed by this account is organization-wide management Read plus
Write. OpenAI's documented service-account-key response and project-key
metadata do not return the requested `scopes`, so the requested scope cannot be
fail-closed verified from Administration API metadata alone before transfer.

## Read-only result

| Question | Result | Fresh evidence |
| --- | --- | --- |
| Existing service account still exists | **YES** | API Platform project Members view listed `promptsuno-staging-paid-smoke` as a service account |
| Service account belongs to `promptsuno` | **YES** | Member detail named project `promptsuno`; selected project ID was `proj_pBrkpocbPAtAPt6v7RAQy1EU` |
| Service account has intended custom project role | **NO** | Its role dialog had preset `Member` selected and `PromptSuno staging inference` unselected |
| Custom role still exists | **YES** | Project Roles view listed `PromptSuno staging inference` with Model capabilities `Request` and all unrelated categories `None` |
| Custom role assigned through a user or group | **NO** | Role Assignments showed `No users found` and `No groups found` |
| Active keys owned by this service account | **ZERO** | Project key inventory showed its only key as `Revoked`, `Never`, `Inherited`, `$0.00`; the other active key is user-owned and unrelated |
| API Platform Admin-key capability exposed | **YES** | Organization Admin keys page was accessible and exposed `Create new Admin key` |
| Current user authorized to open Admin-key creation | **YES** | The creation dialog opened without an authorization error; no submission occurred |
| Existing Admin keys | **ZERO** | Admin keys inventory showed `0 results` |
| Current PromptSuno spend controls | **UNCHANGED** | Project Limits showed `$0.00 / $10.00`, hard-fail wording, and alerts at `$5`, `$8`, and `$10` |
| Allowed model | **UNCHANGED** | Project Limits showed only `gpt-5.6-luna` |
| Provider calls made by this preflight | **0** | No OpenAI model endpoint or application compiler endpoint was called |
| Additional spend | **$0.00** | Project spend remained `$0.00 / $10.00`; the revoked service-account key remained `$0.00` |

The prior receipt remains authoritative for the keyless protected staging
deployment `dpl_FoHhx81iSi46W8opxvnnZUuSEUNy` at runtime
`c85d037d3b1aa0fb69050302611cedb6b8500109`. This preflight did not inspect or
alter any secret value and did not redeploy.

## Supported service-account key API

The current official Administration API and CLI support creating an additional
API key for an **existing** service account:

```text
POST /v1/organization/projects/{project_id}/service_accounts/{service_account_id}/api_keys

openai admin:organization:projects:service-accounts:api-keys create
```

The request accepts `name`, `expires_in_seconds`, and `scopes`.
`expires_in_seconds` accepts `1` through `31536000`; therefore an explicit
24-hour lifetime is supported. The exact future request body for this workflow
is:

```json
{
  "name": "promptsuno-staging-paid-smoke-recovery",
  "expires_in_seconds": 86400,
  "scopes": ["api.model.request"]
}
```

The path parameters must be the already verified PromptSuno project ID and the
existing service-account ID obtained read-only at execution time. The ID must
not be copied into this repository receipt.

Official references:

- [Create an API key for a service account](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/service_accounts/subresources/api_keys/methods/create)
- [OpenAI CLI Admin APIs](https://developers.openai.com/api/docs/libraries/openai-cli)
- [Least-privilege service accounts](https://developers.openai.com/api/docs/guides/terraform/service-accounts)

### Exact inference scope

The deployed route at `c85d037d...` calls
`openai.chat.completions.create`, which sends `POST /v1/chat/completions`; it
does not call the Responses API. OpenAI's current RBAC table assigns
`/v1/chat/completions` to Model capabilities Request, whose accepted API-key
scope is `api.model.request` (legacy alias `model.request`).

`api.responses.write` is a separate Responses API resource permission. It is
used by current Responses/Agents examples, but it is not the narrow permission
for this repository's Chat Completions call and must not be added.

- [OpenAI RBAC permission table](https://developers.openai.com/api/docs/guides/rbac)

## Minimum temporary Admin-key permission

The live Admin-key form supports `All`, `Restricted`, and `Read only`. Under
`Restricted`, it exposes four categories. Only **Organization Administration**
is relevant to project/service-account/key management. Choosing its `Write`
option selected two underlying permissions:

```text
api.management.read
api.management.write
```

The future bootstrap selection would therefore be:

```text
Expiration: Custom, 1 day
Permissions: Restricted
Fine-tuning Checkpoints: None
Audit Logs Scope: None
Usage API Scope: None
Organization Administration: Write
Selected permissions: 2
```

The form permits a custom minimum of one day, so a 24-hour Admin-key expiry is
available. No Admin key was created in this preflight.

This is the narrowest live Admin-key write choice, but it is **not narrowly
limited to the target project or service-account key lifecycle**. OpenAI's RBAC
documentation describes Organization Admin as management of organization
users, projects, invites, Admin API keys, and rate limits. The form exposes no
service-account-key-only or single-project management scope. This breadth
triggers the requested fail-closed rule; it is recorded as the minimum exposed
permission, not as an approved credential grant.

The Admin-key create API supports `expires_in_seconds`, but it requires an
already valid Admin key. With zero existing Admin keys, the first temporary key
must be bootstrapped in the human-controlled dashboard. The future workflow
must not assume that an Admin key can reliably delete itself; the organization
owner should delete it through the dashboard after the service-account-key
step, then verify the Admin-key inventory returns to zero.

- [Create an Admin API key](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/admin_api_keys/methods/create)
- [Admin APIs](https://developers.openai.com/api/docs/guides/admin-apis)

## Metadata verification gap

The service-account-key creation response documents:

```text
id, name, object, created_at, value, expires_at
```

The documented project-key list/retrieve object likewise exposes identity,
owner, redacted value, timestamps, and owner access, but not `scopes`. The
Administration API can therefore verify that `expires_at` is present and no
later than creation plus 86,400 seconds, but its documented metadata cannot
attest that the server applied only `api.model.request`.

- [List project API keys](https://developers.openai.com/api/reference/java/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/list)

A future approved attempt must pause before Vercel transfer and inspect the new
key in the API Platform dashboard. Continue only if that independent view shows
an expiring Restricted key whose sole permission is Model capabilities
`Request`. If the dashboard does not expose exact key permissions, shows
`Inherited`, shows any broader permission, or conflicts with the requested
expiry, revoke the key immediately and remain keyless. The request body alone
is not sufficient acceptance evidence.

## Future direct-to-Vercel sequence

This is a design only. Every credential/security mutation, deployment, and
paid request remains behind a new explicit approval.

1. Recheck exact project identity, `$10` hard cap, `$5/$8/$10` alerts,
   `gpt-5.6-luna`-only allowlist, `500 RPM / 500,000 TPM`, provider usage and
   spend baseline, zero active service-account keys, and zero Admin keys.
2. Stop unless the service account's preset `Member` assignment has been
   removed under separate authorization and its only effective project role is
   `PromptSuno staging inference` with `api.model.request`.
3. In a human-controlled dashboard, create one temporary Admin key with Custom
   one-day expiration and Restricted Organization Administration `Write`; keep
   every other category `None`. Hand the once-shown value directly to a masked,
   no-history operator process. Automation must not read the browser value.
4. Keep the Admin key only in process memory. Use it to re-list the exact
   project, service account, role assignments, and active-key count. Stop on
   any mismatch.
5. POST the exact service-account-key body above. Parse the response only in
   memory. Require the expected object type/name and an `expires_at` no later
   than `created_at + 86400`; never print or log `value` or a raw response.
6. Before transmitting the new value, inspect dashboard key metadata. Require
   an active expiring Restricted key with only Model capabilities `Request`.
   If exact scope is not visible or is broader than requested, revoke it and
   stop.
7. From the already verified Vercel project linkage, have the same operator
   process pass the in-memory service-account key only through stdin to
   `vercel env add OPENAI_API_KEY production --sensitive`. Do not use `echo`, a
   command argument, shell history, environment export, clipboard capture,
   temporary file, `.env*`, `vercel env pull`, `vercel env run`, debug output,
   trace, HAR, or screenshot. In the current Vercel dashboard terminology this
   is a project-level **Secret** (formerly Sensitive), not a readable Config
   variable.
8. Verify only allowlisted metadata: exact project ID, key name
   `OPENAI_API_KEY`, Secret/Sensitive type, Production-only target, and no
   Preview/Development/team sharing. Never retrieve the value.
9. Immediately delete the temporary Admin key in the human-controlled API
   Platform dashboard and verify the Admin-key inventory returns to zero. Its
   one-day expiry is a backstop, not the cleanup mechanism.
10. Create a fresh deployment from a clean detached worktree at exact runtime
    `c85d037d3b1aa0fb69050302611cedb6b8500109`; verify the exact protected
    staging project, READY state, alias, protection, source receipt, and absence
    of canonical/public domains.
11. Run the prior pre-paid security checks only: signed-out `401`, hostile
    origin `403`, malformed same-origin `400`, private/no-store headers,
    protected PWA exclusion, exact quota policy, and read-only pre-smoke counter
    tuple. Do not call the reservation RPC.
12. Make exactly one authenticated same-origin paid smoke. Never retry, replay,
    refresh, or resend on timeout or uncertainty.
13. Verify exactly one retained quota reservation and exactly one OpenAI request
    attributed to the PromptSuno project, dedicated service-account key, and
    `gpt-5.6-luna`; verify bounded spend and tokens.
14. Stop. Under the separately approved cleanup package, revoke the smoke key,
    remove only the Vercel `OPENAI_API_KEY`, redeploy the same exact runtime
    keyless, and verify the active deployment is again keyless. Do not send a
    second valid compiler request to prove cleanup.

Vercel documents that the CLI reads an environment-variable value from stdin,
`--sensitive` creates a non-readable protected value, and environment changes
apply only to new deployments:

- [Vercel CLI environment variables](https://vercel.com/docs/cli/env)
- [Vercel Secret/Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel environment-variable deployment behavior](https://vercel.com/docs/environment-variables)

## Fail-closed handling

| Condition | Mandatory action before any paid request |
| --- | --- |
| Admin key cannot be limited below organization-wide management Read+Write | Do not create it under this preflight. Record the scope floor and require a new human risk decision; remain keyless. |
| Existing service account retains preset `Member` or any role beyond the intended custom role | Do not create a service-account key. Remediate role assignment only under separate credential/security authorization, then rerun this preflight. |
| Account loses Admin API capability or owner authorization | Stop. Create no credential and make no paid request. |
| Service-account-key API rejects `expires_in_seconds` or `scopes` | Do not retry with omitted fields. If a key may have been created, identify and revoke it; keep Vercel keyless. |
| Create response omits/invalidates expiry or returns expiry beyond 24 hours | Revoke the created key immediately; do not transfer it. |
| Exact scope cannot be independently verified | Revoke the created key immediately; do not transfer it. Request-body intent is not proof. |
| Dashboard/API metadata shows `Inherited`, extra scopes, or any broader permission | Revoke immediately; do not transfer or test it. |
| Secret appears in console output, logs, command arguments/history, clipboard capture, file, environment, screenshot, trace, HAR, chat, or repository | Treat as exposed. Revoke immediately, contain the artifact without copying the value, remove any Vercel variable if written, redeploy exact staging keyless if necessary, and make no paid request. |
| Direct Vercel stdin handoff or Secret/Production-only verification is uncertain | Revoke the service-account key, remove any possibly written variable, restore exact staging keyless if necessary, and stop. |
| Any pre-paid auth/origin/cache/PWA/quota check fails | Revoke/remove/redeploy keyless and stop; do not weaken protection or consume the one paid request. |

## Gates

- Admin or service-account key created: **NO**
- Role or permission changed: **NO**
- Vercel variable added/changed/removed: **NO**
- Deployment created/promoted/rolled back: **NO**
- OpenAI/provider request made: **0**
- Additional provider spend: **$0.00**
- Quota reservation or database write: **0**
- Production, DNS, public signup, or public traffic touched: **NO**
- Merge performed: **NO**

**RECOVERY CREDENTIAL PATH VERIFIED: NO**

**SAFE TO REQUEST ADMIN-API PROVISIONING APPROVAL: NO**

**SAFE TO ENABLE PAID TRAFFIC: NO**

The smallest next action is a new, explicitly scoped security decision covering
both removal of the service account's preset `Member` role and acceptance or
rejection of the organization-wide `api.management.read` plus
`api.management.write` temporary Admin-key blast radius. Even with that
decision, execution must remain blocked unless exact created-key scope can be
independently attested before Vercel transfer.
