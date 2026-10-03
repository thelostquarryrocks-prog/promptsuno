# Provider identity and protected-staging paid-smoke plan

Date: 2026-10-01

Status: **read-only preparation complete; one-time activation and paid smoke are
not yet authorized**.

This plan is based on branch `codex/provider-smoke-prep` at base
`fa3b1c667ab1af85d4fe2aa7557f013aff555b79`. It inspects, but does not change,
the deployed runtime at `c85d037d3b1aa0fb69050302611cedb6b8500109`.
It creates no provider identity or key, changes no OpenAI/Vercel/Supabase
setting, deploys nothing, and makes no provider or paid request.

## Current verified state and evidence boundary

| Surface | Current state | Evidence used for this preparation |
| --- | --- | --- |
| OpenAI project | `promptsuno`, `proj_pBrkpocbPAtAPt6v7RAQy1EU` | User-designated verified state and the base branch's provider-control approval receipt |
| Spend controls | $10 monthly hard cap; $5/$8/$10 alerts | User-designated verified state; must be freshly rechecked immediately before activation |
| Model policy | allowlist contains only `gpt-5.6-luna` | User-designated verified state and approval receipt; no substitute model is permitted |
| Target limits | 500 RPM / 500,000 TPM | User-designated verified state; no limit change is part of this plan |
| Provider usage | 0 calls at the preparation baseline | User-designated verified state; this preparation made 0 calls |
| Supabase | `mtzrvekmsmpflbsqgpcc`; policy `(true, 3, 60, 20, 86400)` | Existing Decision B receipt; this preparation made no RPC call or counter change |
| Vercel project | `prompt-suno` / `promptsuno-signin-staging` / `prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU` | Fresh read-only project inspection and exact `.vercel/project.json` linkage |
| Vercel protection | Vercel Authentication still intercepts anonymous access | Fresh anonymous request returned a 302 to `vercel.com`; no bypass was created or used |
| Stable staging alias | `https://promptsuno-signin-staging.vercel.app` | Fresh `vercel inspect` resolution |
| Current deployment | `dpl_86LChkEb4pQpF23t8WDeb6qwCG9K`, READY | Fresh alias resolution to the same immutable deployment ID recorded by protected-staging acceptance |
| Runtime SHA | `c85d037d3b1aa0fb69050302611cedb6b8500109` | The immutable deployment ID above maps to this SHA in the redacted acceptance receipt; the current CLI summary does not itself return a Git SHA |
| Vercel environment names | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, both Production-scoped | Fresh name/scope-only `vercel env ls`; values were not pulled or revealed |
| Provider environment name | `OPENAI_API_KEY` absent in all listed scopes | Fresh name/scope-only `vercel env ls` |

No staging mismatch was detected. The stable alias still points to the exact
immutable deployment accepted at `c85d037d...`. The evidence limitation is
explicit: Vercel's current CLI summary returned the deployment ID, status and
aliases but not the Git SHA, so the deployment-ID-to-SHA binding comes from the
existing redacted acceptance receipt, not a newly returned remote SHA field.

## Runtime inspection at `c85d037d`

The only paid entry point is `POST /api/generate` in
`src/app/api/generate/route.ts`. The implementation and tests establish this
order:

1. Build the Supabase SSR client and verify the cookie-backed user with
   `auth.getUser()`. Missing, expired, forged or otherwise invalid sessions
   return `401`; verification outages return `503`. The body is not read and no
   quota/provider object is touched on this path.
2. Read and validate the request. This performs the same-origin/Fetch Metadata
   check first, then requires `application/json`, bounds actual streamed bytes,
   decodes strict UTF-8/JSON, and resolves exact catalog node records plus the
   bounded relationship note. Failures return `403`, `415`, `413` or `400`
   before quota or provider work.
3. Check server-only `process.env.OPENAI_API_KEY`. If absent, return generic
   `503` before quota reservation. The OpenAI client is constructed inside the
   authorized route, never at module load.
4. Call the authenticated, zero-argument `reserve_compiler_attempt` RPC with a
   five-second abort signal. A denial returns application `429` plus
   `Retry-After`; a missing, malformed, timed-out or failed quota result returns
   `503`. No provider call is made in either case. An ambiguous quota timeout is
   never retried because it may already have committed.
5. Only after a committed allowance, construct the provider client with
   `maxRetries: 0` and a 30-second timeout, then make one Chat Completions request
   with hard-coded model `gpt-5.6-luna`, `max_completion_tokens: 2048`, and a
   strict JSON schema.
6. Parse the response locally and accept only contract version `1.0.0`, the two
   allowed statuses, exact unique selected node IDs, and the appropriate
   styles/questions invariants. Any provider error, timeout, invalid JSON,
   malformed schema or mismatched identity returns a generic `502`.

Every JSON response is emitted with `Cache-Control: private, no-store`.
Provider errors are reduced to the static server log message
`Luna compiler request failed`; provider/user diagnostics, notes, tokens and
credentials are not logged or returned. The credential is passed only from the
server environment to the provider SDK. The verified user identity and quota
data are not sent to OpenAI.

Quota is a reservation, not success billing. Once step 4 allows the request, a
provider failure, timeout, disconnect or malformed response **retains one quota
reservation**. A manual retry would reserve again and is forbidden by the
one-request smoke boundary.

Relevant source evidence:

- `src/app/api/generate/route.ts:35-124`
- `src/lib/compiler-request.ts:11-54`
- `src/lib/compiler-quota.ts:7-19`
- `src/lib/compiler-contract.ts:32-52`
- `tests/generate-route.test.ts`, including check ordering, safe failures,
  no-retry behavior, retained reservations and private/no-store responses

## Narrow provider identity design

Create nothing until a human approves the complete activation, smoke and
cleanup package.

### Identity and project boundary

- Create exactly one nonhuman service account named
  `promptsuno-staging-paid-smoke` inside only project
  `proj_pBrkpocbPAtAPt6v7RAQy1EU`.
- Create the service account without a default `member` or `owner` role and
  without an automatic broad key (`create_service_account_only` / role `none`,
  where the selected management surface supports it).
- Create one custom **project** role named `PromptSuno staging inference` with
  only `api.model.request`. This is the Model Capabilities Request permission
  required by the current `/v1/chat/completions` route.
- Assign that role only to the dedicated service account. If the platform
  requires group-based service-account role assignment, use one dedicated group
  containing only this service account and assign only this project role.
- Issue one project-scoped service-account key with only the corresponding
  `api.model.request` scope. API-key scope may narrow but cannot expand the
  service account's effective role.
- Model specificity is enforced by the project's existing allowlist containing
  only `gpt-5.6-luna`; the RBAC permission itself is a model-request capability,
  not a per-model grant.

OpenAI's documented `api.model.request` permission is capability-wide: it
covers model requests at `/v1/chat/completions` and several other inference
endpoints. The cited RBAC table does not expose a Chat-Completions-only custom
permission. This is the irreducible platform permission floor, not permission
to add alternate application calls. The project model allowlist, hard spend
cap, short key lifetime, one-request procedure and server route are the
compensating boundaries. Do not add the separate `api.responses.write` or any
other resource permission.

Explicitly exclude all unneeded permissions: project/organization
administration, service-account/key management, usage/billing reads, model
listing, Responses API resource permissions, files, batches, assistants,
threads, vector stores, fine-tuning, evals, prompts, webhooks, hosted tools,
realtime management, and any owner/member preset role.

The route does not send an `OpenAI-Project` header. Correct project attribution
therefore depends on using the dedicated key created under the exact PromptSuno
project. A user-owned, organization-admin, default-project or unrelated-project
key is unacceptable even if it can call the same model.

Official control references:

- [OpenAI RBAC and project permissions](https://developers.openai.com/api/docs/guides/rbac)
- [OpenAI service-account least privilege](https://developers.openai.com/api/docs/guides/terraform/service-accounts)
- [OpenAI project service accounts and expiring keys](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects)
- [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [OpenAI production key practices](https://developers.openai.com/api/docs/guides/production-best-practices)

### Expiration, rotation and revocation

- Set an explicit key expiration at the end of the approved smoke window, no
  later than 24 hours after creation. Use a shorter supported lifetime when the
  activation window is known. Never create a non-expiring smoke key.
- Treat the key as single-purpose and non-reusable. Any later pilot or production
  stage requires a newly approved identity/key decision; production must never
  reuse this staging key.
- Rotation means create a replacement expiring key, place it through the same
  write-only staging-secret workflow, deploy and verify it, then revoke the old
  key. Never overwrite first and hope the new key works.
- Revoke immediately after the one-time smoke or on any fail-closed event. Do
  not rely only on expiration. OpenAI documents key revocation as taking effect
  within seconds, while other authentication-affecting updates can take up to
  15 minutes or longer; keep traffic stopped while propagation is confirmed.
- Preserve the now-keyless service-account/role metadata for audit unless a
  separate approval authorizes deleting the identity. Deleting the service
  account is not required to disable traffic once all of its keys are revoked.

Never reveal a key value in chat, command arguments, shell history, repository
files, environment exports, Terraform state/output, logs, docs, screenshots,
traces, HARs, browser storage, client output or support diagnostics.

## Vercel server-secret and exact-runtime deployment plan

The dedicated Vercel project is a protected staging project even though its
stable alias uses Vercel's `Production` target. Therefore the future provider
secret must be project-level, named exactly `OPENAI_API_KEY`, marked
**Sensitive**, and scoped only to **Production** on project
`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`. Do not select Preview or Development, do
not create a shared team variable, and never use a `NEXT_PUBLIC_` prefix.

Use a human-controlled secure Vercel input surface or an interactive
write-only CLI prompt. Do not use `echo`, command-line values, clipboard capture,
`vercel env pull`, `.env.local`, `vercel env run`, screenshots, traces, HARs or
diagnostic logging. After entry, verify only the variable name, Sensitive type
and Production scope; never retrieve or display the value.

Vercel environment changes do not alter an existing deployment. A fresh
deployment is required. Do not promote or roll back an old artifact expecting it
to acquire the new variable. The exact future deployment procedure is:

1. Create a new isolated, detached worktree at exact commit
   `c85d037d3b1aa0fb69050302611cedb6b8500109`; verify clean status and exact HEAD.
2. Verify `.vercel/project.json` contains exactly project
   `prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`, organization
   `team_ID2vravvKgQ3XBHYVmHPHoPz`, and project name
   `promptsuno-signin-staging`. Stop on any mismatch.
3. Verify the stable alias still points to the accepted deployment and Vercel
   Authentication is still enabled before changing the secret.
4. Add the Sensitive, Production-only `OPENAI_API_KEY` through the approved
   write-only workflow.
5. From the clean exact-SHA worktree, create a fresh Production-target deployment
   of this staging-only project. Record the resulting deployment ID and an
   allowlisted exact-SHA receipt without recording environment values.
6. Verify the stable staging alias resolves to the new READY deployment and the
   runtime source receipt still names `c85d037d...`. Do not touch a canonical
   production project/domain or `promptsuno.com`.

See [Vercel environment variables](https://vercel.com/docs/environment-variables)
for the new-deployment requirement and
[Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
for write-only storage behavior. Next.js 16.3.6 also keeps non-`NEXT_PUBLIC_`
variables server-only, while `NEXT_PUBLIC_` values are bundled for the browser.

## One-time activation order

Execute this sequence only under one explicit approval that covers identity/key
creation, the staging secret, exact-SHA deployment, exactly one paid request and
the cleanup actions. A failure at any step stops the sequence.

1. Freshly verify the exact OpenAI project ID; $10 hard cap is enforcing;
   $5/$8/$10 alerts remain; only `gpt-5.6-luna` is allowed; 500 RPM / 500,000
   TPM remain; project usage/call count is still the expected baseline; and no
   unexpected service account/key exists.
2. Create the dedicated role, service account and short-lived scoped key exactly
   as designed above. Move the value directly into the approved secret-entry
   surface without an intermediate file or recorded output.
3. Add `OPENAI_API_KEY` as a Sensitive, Production-only variable on the exact
   protected staging Vercel project.
4. Deploy the exact runtime `c85d037d...` through the exact-project procedure
   above. Stop if project, scope, protection, source or alias differs.
5. Before any paid request, verify:
   - deployment READY, Vercel Authentication enabled, signup disabled, and no
     public/canonical domain attached;
   - signed-out app request returns `401` before body/quota/provider work;
   - authenticated hostile-origin request returns `403` before quota/provider;
   - authenticated same-origin malformed input returns `400` before quota/provider;
   - `/workspace` and `/api/generate` retain private/no-store behavior;
   - service worker/PWA contains no protected route and public caching remains
     limited to public content;
   - Supabase policy is exactly `(true, 3, 60, 20, 86400)` and the smoke user's
     private counter tuple is captured read-only immediately before the smoke.
     Do not call the reservation RPC during this check and do not reset counters.
6. Make exactly one authenticated, same-origin `POST /api/generate` using the
   payload below. Disable UI double-submit and do not refresh, replay, retry or
   resend on timeout or uncertainty.
7. Verify the application response against the output acceptance criteria and
   retain only redacted status/schema/identity evidence.
8. Verify exactly one quota reservation by a privileged, identifier-free
   before/after read of the smoke user's private counter tuple. Run the smoke
   away from a window boundary: both `burst_used` and `sustained_used` must rise
   by exactly one and their window-end timestamps must remain unchanged. A
   rollover or ambiguous observation is not evidence of a clean delta and must
   not trigger another request.
9. After provider usage settles, verify one request is attributed to project
   `proj_pBrkpocbPAtAPt6v7RAQy1EU`, the dedicated service-account key and
   `gpt-5.6-luna`; verify bounded token/cost usage and that spend remains well
   below the approved hard cap. Do not record the key or prompt/user data.
10. **STOP all further requests.** Perform the pre-approved post-smoke cleanup:
    revoke the smoke key, remove the Vercel secret, deploy the same exact runtime
    keyless, and verify the active deployment is the new keyless artifact by
    deployment ID, exact-SHA receipt and environment-name absence. Do not send a
    second valid compiler request merely to prove cleanup. The inspected source
    and prior keyless acceptance already establish that key absence returns the
    pre-reservation `503`; any fresh live `503` probe is a separate explicit
    verification action, even though it would make no provider call or quota
    reservation after key removal.

## Minimal smoke payload

All three records below are stable catalog records in
`data/sound-brain/suno-style-catalog-v1.json` at the runtime SHA.

```json
{
  "nodes": [
    {
      "node_id": "piano",
      "label": "Piano",
      "category": "Instrument"
    },
    {
      "node_id": "aggressive",
      "label": "Aggressive",
      "category": "Energy"
    },
    {
      "node_id": "dreamy-ambient",
      "label": "Dreamy Ambient",
      "category": "Genre"
    }
  ],
  "relationship_notes": "Keep piano in the foreground while preserving the contrast between aggressive energy and a dreamy ambient atmosphere."
}
```

This payload is valid application JSON, contains no weights, BPM, key, meter,
voice/language, named artist, hidden-Suno claim or unrequested concept, and uses
one short authored relationship note. It is intentionally the same stable
three-node family already covered by route and workspace tests.

## Response and attribution acceptance

A successful smoke requires all of the following. Failure of any item ends the
one-request attempt; it never authorizes a retry.

- One client request, one quota reservation and one provider request only.
- HTTP `200` with `Cache-Control: private, no-store` and valid JSON.
- Exact top-level keys: `version`, `status`, `styles`, `coverage`,
  `interpretations`, and `questions`; `version` is `1.0.0`.
- Status is `ready`, or `needs_clarification` only when its one or two concise
  questions identify a real ambiguity in the supplied relationship. A
  clarification result has empty `styles`; a ready result has non-empty
  `styles` and no questions.
- Coverage has exactly one unique entry for each of `piano`, `aggressive` and
  `dreamy-ambient`, with no changed or invented IDs. A ready result marks all
  three `preserved`.
- The result preserves foreground piano plus the aggressive/dreamy-ambient
  contrast. It adds no instrument, voice, BPM, key, meter, exact song structure,
  weight, named-person imitation, hidden-Suno behavior or guaranteed adherence.
- At most three interpretations, each confined to the supplied nodes/note.
- OpenAI usage attributes exactly one request to the dedicated PromptSuno
  project/service-account key and model `gpt-5.6-luna`; spend and token usage are
  bounded and consistent with one short request.
- Supabase private counters show exactly one retained reservation for the smoke,
  including when the provider response is an accepted clarification.

The client response intentionally contains no provider project/key/model
metadata. Correct provider attribution must be established from the dedicated
project-scoped identity, hard-coded route source and provider usage controls,
not invented from the application JSON.

## Fail-closed matrix

| Condition | Expected observation | Mandatory action |
| --- | --- | --- |
| Invalid, expired or revoked key | One reserved attempt; provider auth failure becomes generic application `502`; no SDK retry | Stop. Do not retry. Revoke/replace only under a new approval, remove the Vercel secret, redeploy keyless staging, preserve redacted evidence and investigate identity/secret handling. |
| Model denied or unavailable | One reserved attempt; provider denial becomes generic `502` | Stop. Do not loosen the allowlist or substitute a model. Remove the secret, redeploy keyless, verify the exact model/project controls and investigate propagation. |
| Provider spend-limit `429` | One reserved attempt; provider `429` is hidden behind generic `502` | Stop. Do not raise the cap. Revoke the key, remove the secret, redeploy keyless and preserve spend/control evidence. |
| Application quota `429` | No provider call; denied RPC does not increment counters; application returns `Retry-After` | Stop the smoke. Do not reset quota, switch accounts or wait-and-retry under the one-request approval. Investigate readiness and request a new gate if another smoke is needed. |
| Provider timeout or transport uncertainty | Generic `502` after one reservation; provider may still finish or charge; no automatic retry | Stop and treat the paid request as possibly consumed. Wait for provider usage attribution, revoke the key/remove secret/redeploy keyless, and never replay automatically. |
| Malformed, invalid JSON or identity-mismatched provider response | Local parser returns generic `502`; one reservation and likely one paid provider call remain | Stop. Preserve only redacted response classification, disable the key/secret, and investigate prompt/schema/parser compatibility. No retry in this gate. |
| Wrong model or wrong project attribution | Dashboard/usage evidence differs from `gpt-5.6-luna` or `proj_pBrkpocbPAtAPt6v7RAQy1EU` | Critical stop: revoke key, remove secret, redeploy keyless, remove `gpt-5.6-luna` permission temporarily if containment needs defense in depth, preserve evidence, and investigate deployed source/key provenance before any reactivation. |
| Duplicate client/provider attempts | More than one request in provider usage, SDK/network evidence or UI action | Critical stop: revoke key, remove secret, redeploy keyless, remove model permission if calls continue, preserve counts/timestamps and investigate retries, double-submit, proxy or deployment behavior. |
| Quota anomaly | Counter delta is not exactly +1/+1 in unchanged windows, denial increments, or provider usage exists without a committed reservation | Critical stop. Revoke key, remove secret, redeploy keyless, preserve the private numeric evidence, and investigate route/database ordering. Never reset or refund counters to simplify the evidence. |
| Secret exposure or suspected exposure | Any key value reaches client output, source, Git, logs, docs, screenshot, trace, HAR, shell history or unauthorized viewer | Immediate revoke; stop traffic; remove the Vercel secret; redeploy keyless; remove model permission if needed; contain affected artifacts without copying the secret; preserve redacted incident evidence and investigate the full exposure path. |
| Auth, origin, cache or PWA regression | Vercel protection off, signup enabled, wrong `401/403`, protected content cacheable, protected route in service-worker cache, or missing private/no-store | Abort before the paid request when found. If found after activation, revoke key/remove secret/redeploy keyless and investigate runtime/project drift. Do not weaken protection or use a bypass. |
| Abnormal spend or usage | More than one request, unexpected tokens/cost, continued usage after stop, or unexplained movement toward alert/cap | Revoke key immediately, remove secret, redeploy keyless, remove model permission, keep the hard cap unchanged, preserve billing/usage evidence and investigate before any new approval. |

The generic application `502` deliberately does not disclose which provider
failure occurred. Diagnosis must use redacted provider control/usage evidence,
never raw provider errors that could include request or credential material.

## Kill switch

Use all applicable layers; do not treat any single layer as sufficient incident
containment:

1. Stop all user/test interaction with the compiler and keep public/signup
   traffic disabled.
2. Revoke the dedicated service-account key. If compromise or unexplained calls
   continue, remove `gpt-5.6-luna` from this project's allowlist temporarily.
3. Remove only `OPENAI_API_KEY` from the exact Vercel staging Production scope.
4. Build and deploy the same exact `c85d037d...` runtime keyless so the active
   server no longer has the old deployment environment snapshot.
5. Verify project/protection/source identity, key-name absence, key revocation,
   stopped provider usage and the route's inspected pre-reservation keyless
   `503` behavior. Do not send another valid compiler request unless separately
   approved as a non-paid cleanup check.
6. Preserve redacted deployment IDs, timestamps, status codes, quota deltas and
   provider project/model/count/cost evidence. Preserve existing quota rows; do
   not refund, truncate, reset or rewrite history.

The $10 project hard cap remains the final automatic dollar containment layer,
with the platform's documented propagation/settlement caveat. Alerts notify but
do not stop traffic. Do not change organization-wide controls to contain this
project without a separate blast-radius decision.

## Post-smoke boundary

The approved end state for a one-time smoke is:

- exactly one paid provider request and one retained quota reservation;
- smoke key revoked and not reusable;
- `OPENAI_API_KEY` absent from Vercel after a fresh keyless exact-SHA deployment;
- the dedicated service account may remain with no active key solely as audit
  metadata; deleting it requires separate approval;
- Vercel Authentication remains enabled, public signup remains disabled, and
  protected cache/PWA controls remain intact;
- project spend/model/rate controls remain $10 HARD, $5/$8/$10 alerts,
  `gpt-5.6-luna` only, 500 RPM / 500,000 TPM unless emergency model-permission
  removal was required;
- Supabase policy and all retained counters remain unchanged except the one
  expected smoke reservation;
- public paid traffic remains **DISABLED**;
- production, `promptsuno.com`, DNS, canonical domains, other Vercel projects,
  public signup and PR/merge state remain untouched.

Any pilot, additional smoke, public traffic, production identity, production
secret, production deployment or merge is a separate human gate.

## Preparation completion gates

- Provider identity/key created: **NO**
- Existing key rotated or revoked: **NO**
- Vercel secret added/changed/removed: **NO**
- Deployment created/promoted/rolled back: **NO**
- Supabase policy/counter changed: **NO**
- OpenAI/provider request made by this preparation: **0**
- Public paid traffic enabled: **NO**
- Production touched: **NO**
- Merge performed: **NO**

**PROVIDER IDENTITY / STAGING SMOKE PREPARATION COMPLETE: YES**

**SAFE TO REQUEST ONE-TIME ACTIVATION + PAID-SMOKE APPROVAL: YES**

**SAFE TO ENABLE PAID TRAFFIC: NO**
