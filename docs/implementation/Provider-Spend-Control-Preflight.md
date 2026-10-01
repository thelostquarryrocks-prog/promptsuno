# Provider and aggregate spend-control preflight

Date: 2026-10-01

Status: **read-only account inspection complete; paid/provider calls remain 0**.

This receipt records the OpenAI API Platform and PromptSuno source state observed
before any paid compiler traffic. It does not authorize or perform a provider
credential change, billing/spend-control change, model-permission change,
rate-limit change, Vercel environment change, deployment, quota-policy change,
API request, public-signup change, production action, PR promotion or merge.

## Executive result

- Target organization: **VERIFIED** as the organization displayed as `Personal`;
  organization ID recorded only in redacted form as `org-...HTIt`.
- Target project: **VERIFIED** as the active dedicated project `promptsuno`,
  project ID `proj_pBrkpocbPAtAPt6v7RAQy1EU`. A separate default project exists,
  so `promptsuno` is not the default project.
- Project monthly spend: **$0.00 of $10.00** in the project control.
- Project enforcement: **HARD, enabled**. The control explicitly says requests
  will start to fail when the limit is reached.
- Project alerts: **$5 (50%), $8 (80%), and $10 (100%)**.
- Project model policy: allowlist containing **`gpt-5.6-luna` and
  `gpt-6-luna`**. This is not Luna-only.
- `gpt-5.6-luna` is visible in the project allowlist and rate-limit controls:
  **availability in project controls VERIFIED**. No paid inference was used to
  test runtime availability.
- Project identity inventory: one active user-owned project key exists with all
  permissions and no expiration; no project service account exists. No key value
  or identifying account field is recorded here.
- Organization usage tier: **Tier 1**. Current organization usage displayed as
  **$0.01**.
- Organization spend limit: **$100, soft**; hard enforcement is off. Alerts are
  **$80 (80%) and $100 (100%)**.
- Provider calls made by this preflight: **0**.

## Material discrepancy with the approval packet

The approval packet described the $10 project limit and $5/$8 alerts as proposed
and not yet applied. Live read-only inspection found that those values were
already present before this task, with hard enforcement on. A third alert at
$10 was also present. This task did not apply, edit, remove or save any of them.

The model allowlist also already exists, but it contains `gpt-6-luna` in addition
to the required `gpt-5.6-luna`. The requested Luna-only posture is therefore not
currently satisfied. Before paid traffic, a human decision should ratify or
investigate the unexpected spend-control state and separately approve removal of
`gpt-6-luna` if Luna-only access remains the intended policy.

## Current organization and project state

| Scope | Observed state |
| --- | --- |
| Organization | Display name `Personal`; redacted ID `org-...HTIt`; signed-in context is Organization Owner |
| Approved usage tier | Tier 1. Official documentation currently lists Tier 1's approved usage limit as $100/month |
| Organization spend control | $100 monthly limit; hard enforcement off; $0.01 displayed current usage |
| Organization alerts | $80 and $100 |
| PromptSuno project | Active, dedicated, global-residency project `promptsuno`; ID `proj_pBrkpocbPAtAPt6v7RAQy1EU`; $0.00 displayed project usage |
| Project spend control | $10 monthly limit; hard enforcement on |
| Project alerts | $5, $8 and $10 |
| Project models | Allow only `gpt-5.6-luna` and `gpt-6-luna` |
| Target-model limits | Project editor showed 500,000 TPM and 500 RPM for `gpt-5.6-luna`; organization Tier 1 view also showed 5,000,000 batch tokens/day |
| Other allowed-model limits | Project editor showed 200,000 TPM and 500 RPM for `gpt-6-luna` |
| Project identities | One active user-owned project key with all permissions and no expiration; zero service accounts |
| Key governance | Project and organization currently permit both user-owned project keys and service-account keys; no maximum key lifetime is enabled |

The project rate-limit editor states that project limits inherit from the
organization unless overridden. The target-model values matched the organization
Tier 1 values; the UI did not establish whether they are explicit overrides or
inheritance. It exposed editable per-model TPM/RPM controls, so lower project
limits are technically configurable. The only shared-limit label shown for
`gpt-5.6-luna` named `gpt-5.6-luna` itself; no cross-model shared family was
identified for this target.

The spend-limit editors displayed "Resets in 30 days." Official documentation
defines a monthly cycle but does not specify the cycle's exact boundary or time
zone. The exact reset timestamp and time zone therefore remain **unverified**.
The organization editor also displayed a maximum configurable spend-limit value
that did not match the published Tier 1 approved-usage table; the published Tier
1 $100/month usage limit is used here, and the conflicting editor maximum is not
treated as an approved usage entitlement.

## Current OpenAI control semantics

Official OpenAI documentation distinguishes three controls:

- A spend alert only notifies; traffic continues after its threshold.
- A project hard spend limit stops affected project traffic with HTTP `429` and
  `error.code=project_spend_limit_exceeded`.
- An organization hard spend limit stops traffic across all organization
  projects with HTTP `429` and
  `error.code=organization_spend_limit_exceeded`.

Organization and project hard limits can both apply to one request. The current
organization limit is soft, so it does not provide automatic aggregate
enforcement. A project without hard enforcement can continue past its configured
budget and alert thresholds until another billing, credit, usage-tier or rate
limit blocks it.

Hard-limit enforcement is not instantaneous. OpenAI documents that a small
amount of additional usage can settle while enforcement state propagates, so a
recorded total can slightly exceed the configured cap. Raising or removing a
reached hard limit resumes traffic only after the update propagates; no bounded
propagation duration is documented. Otherwise, traffic resumes in the next
monthly cycle.

Current official sources:

- [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
- [Rate limits and usage tiers](https://developers.openai.com/api/docs/guides/rate-limits)
- [GPT-5.6 Luna model](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [Platform RBAC and project permissions](https://developers.openai.com/api/docs/guides/rbac)
- [Service accounts](https://developers.openai.com/api/docs/guides/terraform/service-accounts)
- [Production API-key practices](https://developers.openai.com/api/docs/guides/production-best-practices)

## Hard-cap conclusion

Project hard-cap capability: **YES**.

The exact control is **Project settings > Limits > Spend > Edit spend limit >
Enforce a hard limit**. A $10 project-level hard cap is technically supported
and is currently observed enabled. The organization also exposes the equivalent
control, but it is currently off. Enabling an organization-wide hard cap would
affect unrelated projects and is not recommended for PromptSuno containment
without a separate organization-wide blast-radius decision.

## Model and rate-limit conclusion

Project model restriction capability: **YES**. OpenAI supports project allowlists
and denylists; this project currently uses an allowlist. The required target
`gpt-5.6-luna` is present, but `gpt-6-luna` must be removed later if the approved
policy is truly Luna-only. Do not substitute another model.

The project can reduce relevant TPM/RPM settings below organization maxima.
These throughput controls are useful defense in depth but do not replace the
per-account Supabase quota or the dollar hard cap. The application route at
Decision B's source ancestor hard-codes `gpt-5.6-luna`, disables provider retries,
uses a 30-second timeout, and reserves quota before the provider call.

## Provider identity plan

Do not use the observed broad, non-expiring user-owned key for PromptSuno.
After separate approval, create one nonhuman service account owned by project
`proj_pBrkpocbPAtAPt6v7RAQy1EU`, assign a custom project role containing only the
model-request capability required by the current `/v1/chat/completions` route,
and issue an expiring project-scoped key with the narrowest supported key scopes.
API-key scopes may further restrict but cannot expand the service account's
project role.

Store the value only through the approved Vercel server-secret workflow for the
exact protected PromptSuno staging project. Keep it out of client code, browser
state, public runtime configuration, repository files, logs, screenshots,
transcripts and diagnostics. Project ownership of the identity and key binds the
workload to the PromptSuno project for permissions, limits and billing
attribution. Use a distinct production identity only after a separate production
decision; do not reuse unrelated project keys.

## Kill-switch sequence

1. **Automatic spend containment:** retain the project hard cap at the approved
   value. It is the only automatic dollar stop, with the documented small
   overshoot caveat. Keep pre-cap alerts as notification, not enforcement.
2. **Application/provider disablement:** the present application already fails
   closed with `503` before quota reservation when `OPENAI_API_KEY` is absent.
   For a planned shutdown after later activation, remove the secret from the
   exact Vercel staging environment and issue a fresh deployment so the active
   runtime is demonstrably keyless; verify the same pre-reservation `503`. No
   provider feature flag currently exists, and this preflight does not invent one.
3. **Emergency operator action:** revoke the dedicated PromptSuno service-account
   key immediately. If broader containment is necessary, remove
   `gpt-5.6-luna` from this project's allowlist. Do not use an organization-wide
   limit change as the PromptSuno emergency switch because it would affect
   unrelated projects.

## Future paid-smoke acceptance plan

Execute only after separate approvals for identity/key creation, model-policy
change, Vercel secret configuration and deployment, and exactly one paid staging
request.

1. Reverify the exact OpenAI organization/project, $10 hard cap, $5/$8 alerts,
   target-only model policy, current $0 project usage, Tier 1 limits, protected
   Vercel staging identity and absence of public signup/canonical production
   traffic. Decide explicitly whether to retain the extra $10 alert.
2. Create the dedicated service account and expiring least-privilege key. Move
   the key directly into the approved server-only secret workflow without
   printing or persisting it elsewhere.
3. Add the secret only to the exact protected staging environment and deploy the
   exact approved application SHA. Verify source/client bundles and public
   configuration contain no provider credential.
4. With one authorized authenticated staging account that has quota available,
   submit one minimal compiler request. Confirm one Supabase reservation, the
   hard-coded model `gpt-5.6-luna`, no SDK retry, and either a valid schema-bound
   response or bounded `502` provider failure. A provider failure retains the
   reservation and must not be automatically replayed.
5. After usage reporting settles, filter OpenAI usage by PromptSuno project,
   service-account key and model; record one request and its exact token/cost
   attribution without exposing the key or user data.
6. Return staging to provider-disabled state by removing the secret and issuing
   a fresh keyless deployment; verify authenticated compile returns the existing
   provider-absent `503` before a quota reservation. Revoke the smoke key if it
   was approved as one-use.

## Exact future approval gates

The following remain human-gated:

- ratify, modify or investigate the already-present $10 hard limit and
  $5/$8/$10 alerts;
- remove `gpt-6-luna` so the project becomes `gpt-5.6-luna`-only;
- lower project TPM/RPM limits, if desired;
- create the service account and API key, set its role/scopes/expiration, or
  rotate/revoke any key;
- add or remove `OPENAI_API_KEY` in Vercel;
- deploy a provider-enabled or provider-disabled build;
- make the single paid staging smoke request;
- enable any pilot/public traffic, public signup, canonical production traffic,
  production deployment, PR promotion or merge.

No organization-wide hard-cap change is proposed. Its unrelated-project blast
radius requires a separate organization-level decision.

## Unresolved caveats

- The actor and authorization that established the current $10 hard cap,
  $5/$8/$10 alerts and two-model allowlist were not established by this read-only
  inspection.
- The exact spend-cycle reset timestamp/time zone is not documented or exposed
  in the inspected controls.
- Spend-limit propagation is documented as non-instantaneous, but OpenAI
  publishes no exact delay bound.
- Runtime success for `gpt-5.6-luna` remains intentionally untested because that
  would be a paid API call.
- Current target-model TPM/RPM values match organization Tier 1; the UI did not
  distinguish explicit project override from inheritance.

**PROVIDER/SPEND PREFLIGHT COMPLETE: YES**

**SAFE TO REQUEST SPEND-CONTROL CONFIGURATION APPROVAL: YES**

**SAFE TO ENABLE PAID TRAFFIC: NO**
