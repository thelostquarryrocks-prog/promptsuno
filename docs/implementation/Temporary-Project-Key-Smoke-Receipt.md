# Temporary project-key paid-smoke receipt

Date: 2026-10-02 (America/New_York)

Status: **PASS — ONE PAID SMOKE COMPLETED; STAGING RESTORED KEYLESS**

This receipt records the authorized one-time paid smoke for OpenAI project
`proj_pBrkpocbPAtAPt6v7RAQy1EU` and the protected, staging-only Vercel project
`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`. It is intentionally redacted. No API-key
secret, token, cookie, account email, user identifier, private quota identity,
or generated prompt body is recorded here.

Exactly one temporary user-owned project key was created, exactly one valid
compiler request was sent, and no retry was attempted. After evidence was
collected, the key was revoked, the Vercel provider variable was deleted, and
the same exact runtime was freshly deployed keyless.

## Fixed boundary and preflight

| Control | Fresh evidence before the smoke | Evidence after cleanup |
| --- | --- | --- |
| OpenAI project | `promptsuno`; exact project ID above | Same project selected |
| Spend limit | `$0.00 / $10.00`; requests fail at the limit | `$0.00 / $10.00`; hard stop unchanged |
| Spend alerts | `$5`, `$8`, `$10` | Unchanged |
| Allowed models | Only `gpt-5.6-luna` | Unchanged |
| Model rate limits | `500 RPM`, `500,000 TPM` | No rate-limit change made |
| Existing service account | Present, with zero active keys | Untouched and still keyless |
| Supabase project | `mtzrvekmsmpflbsqgpcc` | Same project |
| Quota policy | `(true, 3, 60, 20, 86400)` | Unchanged |
| Quota storage | 3 rows; every stored burst and sustained window expired | 3 rows; one row has one current retained reservation |
| Private quota boundary | 0 private-schema policies; 2 private tables with RLS; no `authenticated` schema/table read; no `anon` RPC execute | Unchanged |
| Vercel project | `promptsuno-signin-staging`; exact project ID above | Same project |
| Runtime source | Clean detached worktree at `c85d037d3b1aa0fb69050302611cedb6b8500109` | Same clean detached worktree and SHA |
| Vercel protection | Vercel Authentication enabled | Still enabled |
| Public/signup traffic | Disabled by existing staging controls | Unchanged; no public paid traffic enabled |

Fresh exact-runtime tests passed before activation: `69/69` across
`tests/generate-route.test.ts`, `tests/cache-policy.test.ts`, and
`tests/middleware.test.ts`.

The live pre-paid checks showed:

- an authenticated `/workspace` response of `200` with
  `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` and
  `X-Robots-Tag: noindex, nofollow, noarchive`;
- an unauthenticated compiler request rejected with `401`;
- malformed same-origin JSON rejected with `400` and
  `Cache-Control: private, no-store`, before quota or provider execution; and
- the deployed service worker contained the protected `/workspace` and
  `/api/generate` network-only exclusions.

A live hostile-origin request was not sent because the available browser
debugger did not support the required header override. The exact deployed SHA's
fresh middleware test suite passed its hostile-origin `403` case. This is a
recorded verification limitation, not a claim of a live hostile-origin probe.

## Temporary credential and provider-enabled deployment

The OpenAI dashboard created one user-owned key with these verified properties:

```text
name        promptsuno-project-key-smoke-2026-10-02
owner       user-owned project key
expiration  2026-10-03 (24-hour maximum)
permissions Restricted; Model capabilities Request only
```

Every unrelated permission category was `None`. The existing service account
and its revoked historical key were not changed. The temporary value was
transferred directly from the OpenAI creation dialog into the Vercel masked
secret field without being read, logged, printed, written to disk, placed in a
repository file, or reproduced in this receipt. The clipboard was cleared
immediately after the transfer.

Vercel stored `OPENAI_API_KEY` as a project-level **Secret**, scoped only to
Production on the staging-only project. No Preview, Development, or shared
scope was selected.

A forced fresh deployment from the exact runtime created the provider-enabled
staging deployment:

| Field | Result |
| --- | --- |
| Deployment ID | `dpl_HZoqbbLpZAcjYi3D63uzwAot2T13` |
| Immutable URL | `https://promptsuno-signin-staging-8bdwi4t0b-prompt-suno.vercel.app` |
| Stable alias | `https://promptsuno-signin-staging.vercel.app` |
| State | `READY` |
| Target | Production target of the staging-only project |
| Protection | `vercel_authentication` |

The build ran Vercel CLI `62.1.0`, detected Next.js `16.3.6`, ran
`next build --webpack`, completed TypeScript, generated `8/8` static pages,
emitted the service worker, and deployed the dynamic compiler, auth callback,
and workspace routes. Build errors: `0`. Non-blocking output consisted of
dependency deprecation notices and two dependency install scripts not covered
by `allowScripts`.

## The single paid smoke

One authenticated, same-origin `POST /api/generate` was sent with the required
nodes `piano`, `aggressive`, and `dreamy-ambient`, plus the approved relationship
note directing piano to remain foregrounded while aggressive energy contrasts
with a dreamy ambient atmosphere.

No retry, replay, refresh resend, cleanup probe, or second valid compiler call
was made.

| Acceptance item | Result |
| --- | --- |
| HTTP response | `200` |
| Cache policy | `private, no-store` |
| Content type | `application/json` |
| Schema version | `1.0.0` |
| Status | `ready` |
| Coverage | Exactly the 3 requested node IDs, each `preserved`, with no duplicate |
| Styles | Non-empty; foreground piano and the requested aggressive/dreamy-ambient contrast preserved |
| Interpretations | Empty |
| Questions | Empty |
| Unsupported additions | No invented BPM, key, meter, weights, hidden Suno behavior, or unrelated musical concept |

The response therefore met the route's `ready` contract. Its generated prompt
body is intentionally omitted from this receipt.

## Quota, provider attribution, and cost

Before the request, all three stored quota rows had expired burst and sustained
windows. After the request, exactly one row had a current burst window with
`burst_used = 1` and a current sustained window with `sustained_used = 1`; the
other two rows remained expired and unchanged. This is one retained quota
reservation. The expired row's window rollover means the evidence is the one
new active `1/1` tuple, not a misleading aggregate arithmetic increment across
historical counters.

The OpenAI project usage dashboard settled from `4` to `5` model requests and
from `1,845` to `3,076` input tokens. The smoke delta is therefore exactly one
provider request and `1,231` input tokens. The model grouping was
`gpt-5.6-luna`; the project allowlist permitted no other model. The revoked
temporary key disappeared from the active-key filter after cleanup, while the
dashboard's aggregate still retained the fifth request. This agrees with the
single application call and the single quota reservation.

Both the key inventory and the project spend control displayed `$0.00` after
the smoke. That is the dashboard's currency precision; it does not prove that
the metered request had literally zero sub-cent cost. The verified conclusion
is one bounded request under an unchanged `$10` hard cap, with displayed
incremental spend of `$0.00` and no finer cost precision available in the UI.

## Mandatory cleanup and keyless restoration

After explicit action-time confirmation:

1. the temporary OpenAI key was revoked and its inventory status changed from
   `Active` to `Revoked`;
2. only `OPENAI_API_KEY` was deleted from the Vercel staging project;
3. the Vercel environment inventory returned to the two existing public
   Supabase configuration names; no provider secret remained; and
4. the clean detached exact-SHA worktree was force-deployed again without the
   provider variable.

The fresh keyless deployment is:

| Field | Result |
| --- | --- |
| Deployment ID | `dpl_8Ev9Qjye6wJ6dN7WvybzpaoAuF9r` |
| Immutable URL | `https://promptsuno-signin-staging-5suzd7exx-prompt-suno.vercel.app` |
| Stable alias | `https://promptsuno-signin-staging.vercel.app` |
| Runtime SHA | `c85d037d3b1aa0fb69050302611cedb6b8500109` |
| State | `READY` |
| Target | Production target of the staging-only project |
| Protection | `vercel_authentication` |

The keyless build completed successfully with the same route and PWA output;
build errors were `0`, with the same dependency deprecation and install-script
notices. A fresh authenticated Chrome tab reached `/workspace` and showed the
signed-in application. An ordinary anonymous request to the stable
`/workspace` returned `302` to `vercel.com/sso-api` with
`Cache-Control: no-store, max-age=0`. No Vercel protection bypass and no
`vercel curl` command was used.

No second valid compiler request was sent to test the keyless deployment.

## Scope and remaining gates

- Temporary keys created: **1**
- Paid provider requests: **1**
- Retained quota reservations: **1**
- Provider retries: **0**
- Active smoke key after cleanup: **NO**
- Active staging provider secret after cleanup: **NO**
- Service-account changes: **NONE**
- Spend, model, alert, rate-limit, signup, DNS, or canonical-domain changes:
  **NONE**
- Public paid traffic enabled: **NO**
- Production site touched: **NO**
- Merge performed: **NO**

The narrow temporary project-key mechanism is now demonstrated on protected
staging. This does not repair the production identity architecture, authorize a
credential migration, enable public paid traffic, authorize production
deployment, or authorize merge.

**TEMPORARY PROJECT-KEY PAID SMOKE COMPLETE: YES**

**STAGING RETURNED KEYLESS: YES**

**SAFE TO PLAN PRODUCTION IDENTITY REPAIR: YES**

**SAFE TO ENABLE PUBLIC PAID TRAFFIC: NO**
