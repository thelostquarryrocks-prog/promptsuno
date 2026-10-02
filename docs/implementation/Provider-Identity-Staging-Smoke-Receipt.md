# Provider identity and protected-staging smoke receipt

Date: 2026-10-01 (America/New_York)

Status: **FAIL-CLOSED — NO PAID SMOKE SENT**

This receipt records the approved one-time provider activation attempt for
OpenAI project `proj_pBrkpocbPAtAPt6v7RAQy1EU` and Vercel staging project
`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`. It is intentionally redacted. No API-key
secret, cookie, token, account email, prompt content, user identifier, or
private quota identity is recorded here.

The attempt stopped during identity creation because the OpenAI web console
automatically generated a broad, non-expiring key and rendered its secret. That
contradicted the approved account-only, explicit-expiration, least-privilege,
write-only handling requirements. The key was never copied, transmitted,
installed, persisted, or used. It was revoked immediately after human
confirmation. No provider request or quota reservation was made.

## Authorized and verified boundary

| Control | Fresh evidence before activation | Post-containment evidence |
| --- | --- | --- |
| OpenAI project | `promptsuno`; exact project ID above | Same project selected |
| Spend limit | `$0.00 / $10.00`; requests fail at the limit | `$0.00 / $10.00`; hard stop still enabled |
| Spend alerts | `$5`, `$8`, `$10` | Unchanged |
| Allowed models | Only `gpt-5.6-luna` | Unchanged |
| Model rate limits | `500 RPM`, `500,000 TPM` | No limit change made |
| Supabase project | `mtzrvekmsmpflbsqgpcc` | No database write made |
| Quota policy | `(true, 3, 60, 20, 86400)` | No reservation or counter reset/refund |
| Vercel project | `promptsuno-signin-staging`; exact project ID above | Same project linked |
| Runtime source | Clean detached worktree at `c85d037d3b1aa0fb69050302611cedb6b8500109` | Fresh keyless deployment built from the same clean worktree |
| Vercel provider variable | `OPENAI_API_KEY` absent | Still absent after deployment |
| Vercel protection | Vercel Authentication enabled | Anonymous `/workspace` returned `302` to Vercel SSO with `Cache-Control: no-store, max-age=0` |
| Public/signup traffic | Disabled by the existing staging controls | Unchanged; no public paid traffic enabled |

The preflight quota read found naturally expired usage windows. Because no
application request was sent, no rollover, reservation, refund, reset, or other
quota mutation occurred during this attempt.

## Identity-creation outcome

One custom project role named `PromptSuno staging inference` was created. Its
only selected parent permission is `api.model.request` (displayed as Model
Capabilities `Request`); unrelated permission categories remained `None`.

One service account named `promptsuno-staging-paid-smoke` was then created. The
OpenAI web console did not provide the required account-only creation control.
Instead it automatically:

- assigned the preset `Member` role;
- generated one inherited key with broad read/write API-resource access;
- set the key to `Never` expire; and
- rendered the key secret in the browser dialog.

The secret rendering triggered the plan's mandatory secret-exposure stop. The
secret was not copied, placed on the clipboard, entered into Vercel, sent to the
application, written to disk, committed, or repeated in this receipt. The key's
tracking and service-account identifiers are recorded only as `[redacted]`.

After explicit action-time confirmation, the generated key was revoked. The
OpenAI key inventory then showed:

- name: `promptsuno-staging-paid-smoke`;
- status: `Revoked`;
- expiration: `Never` (the creation-time violation);
- permissions: `Inherited`;
- monthly spend: `$0.00`.

The now-keyless service account and custom role remain as audit metadata, as
specified by the preparation plan. Deleting either identity was not authorized
or required for containment.

## Fail-closed keyless deployment

The exact-SHA worktree was revalidated immediately before deployment:

```text
HEAD    c85d037d3b1aa0fb69050302611cedb6b8500109
status  clean
project prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU
team    team_ID2vravvKgQ3XBHYVmHPHoPz
name    promptsuno-signin-staging
```

Production-scoped environment-name inspection on this staging-only project
listed only:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`Config`, `Production`)
- `NEXT_PUBLIC_SUPABASE_URL` (`Config`, `Production`)

`OPENAI_API_KEY` was absent before and after the deployment. No secret value
was pulled.

Vercel CLI `62.1.0` created a forced fresh Production-target deployment of the
staging-only project:

| Field | Result |
| --- | --- |
| Deployment ID | `dpl_FoHhx81iSi46W8opxvnnZUuSEUNy` |
| Immutable URL | `https://promptsuno-signin-staging-mwrdyn2zb-prompt-suno.vercel.app` |
| Stable alias | `https://promptsuno-signin-staging.vercel.app` |
| State | `READY` |
| Protection | `vercel_authentication` |
| Build region | `iad1` |
| Build duration | `59s` |

The remote build detected Next.js `16.3.6`, ran `next build --webpack`, compiled
successfully, completed TypeScript, generated `8/8` static pages, emitted the
PWA service worker, and deployed the dynamic `/api/generate`, `/auth/callback`,
and `/workspace` routes. Build errors: `0`. The build emitted dependency
deprecation notices and reported two dependency install scripts not covered by
`allowScripts`; neither blocked the successful build.

An ordinary anonymous header-only request to the stable `/workspace` URL
returned `302 Found` to Vercel SSO with `Cache-Control: no-store, max-age=0`,
`Strict-Transport-Security`, and `X-Frame-Options: DENY`. No Vercel protection
bypass or `vercel curl` command was used.

## Paid-smoke and usage result

| Acceptance item | Result |
| --- | --- |
| Authenticated application request | **0** |
| Provider requests initiated by this activation | **0** |
| Quota reservations | **0** |
| Application response/schema acceptance | Not applicable; smoke was not sent |
| Provider model/project/key attribution | Not applicable; smoke was not sent |
| Created-key spend | `$0.00` |
| Project total spend | `$0.00` |
| Hard cap after containment | `$10`, still enforcing |

The project usage dashboard contained pre-existing historical request totals;
they were not treated as evidence of this activation. The newly created key's
own row showed `$0.00`, the key never entered a runtime environment, and the
paid route was never invoked.

## Scope and gates

- No second key was created.
- No retry or replacement key was attempted.
- No `OPENAI_API_KEY` variable was added, changed, removed, or retrieved.
- No paid smoke, cleanup probe, provider retry, quota RPC, quota reset, or quota
  refund occurred.
- No model, spend, alert, rate, signup, DNS, canonical-domain, production-site,
  other-project, PR, or merge change occurred.
- `promptsuno.com` and public paid traffic were untouched.

**PROVIDER IDENTITY / STAGING SMOKE RESULT: FAIL-CLOSED**

**PAID PROVIDER REQUESTS IN THIS ACTIVATION: 0**

**RETAINED QUOTA RESERVATIONS IN THIS ACTIVATION: 0**

**ACTIVE SMOKE KEY: NO**

**ACTIVE STAGING PROVIDER SECRET: NO**

**KEYLESS EXACT-SHA STAGING RESTORED: YES**

**SAFE TO RETRY UNDER THIS APPROVAL: NO**

**SAFE TO ENABLE PAID TRAFFIC: NO**

A future attempt requires a separate approval and a management surface that
can create the service account without an automatic key/default `Member` role,
then issue an explicitly expiring key without rendering its secret to
automation.
