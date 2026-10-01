# Provider spend-control approval receipt

Date: 2026-10-01

Status: **approved provider/spend-control configuration completed and verified; paid/provider calls remain 0**.

This receipt records the user-ratified PromptSuno project spend controls and the
single approved model-permission change. It is based on preflight commit
`dd006d22556b9adb49ec7844868f0ee9bbd4012a` and does not authorize or perform
provider identity creation, API-key changes, Vercel secret configuration,
deployment, provider traffic, Supabase changes, public signup, production
traffic, or merge/promotion work.

## Approval and target

- User approval: **VERIFIED** for the exact control state recorded below.
- OpenAI organization: **VERIFIED** as the intended `Personal` organization.
- Project: **VERIFIED** as the active dedicated project `promptsuno`.
- Project ID: `proj_pBrkpocbPAtAPt6v7RAQy1EU`.
- The separate default project remained distinct; no other project was edited.

## Final verified controls

| Control | Final state | Result |
| --- | --- | --- |
| Project monthly spend limit | $10 | **RATIFIED / VERIFIED** |
| Project hard enforcement | On; requests fail when the limit is reached | **RATIFIED / VERIFIED** |
| Project spend alert | $5 (50%) | **RATIFIED / VERIFIED** |
| Project spend alert | $8 (80%) | **RATIFIED / VERIFIED** |
| Project spend alert | $10 (100%) | **RATIFIED / VERIFIED** |
| Project model policy | Allow only selected models | **VERIFIED** |
| `gpt-5.6-luna` | Allowed | **VERIFIED** |
| `gpt-6-luna` | Blocked / removed from the allowlist | **VERIFIED** |
| `gpt-5.6-luna` RPM | 500 | **UNCHANGED / VERIFIED** |
| `gpt-5.6-luna` TPM | 500,000 | **UNCHANGED / VERIFIED** |

The spend controls already matched the approved state, so they were ratified
without an unnecessary edit. The only material OpenAI control mutation was
turning off `gpt-6-luna` in the project's existing allow-only model policy.
After the save completed, the project summary listed only `gpt-5.6-luna`; a
fresh editor check showed `gpt-5.6-luna` allowed and `gpt-6-luna` blocked.

The platform notes that model-permission changes may take time to apply to API
requests. No paid request was made to test propagation; verification is limited
to the persisted project control state, as required by the stop boundary.

## Unchanged organization controls

Post-change inspection verified the organization controls remained:

- monthly spend limit: **$100**;
- hard enforcement: **off** (soft limit);
- spend alerts: **$80** and **$100**;
- `gpt-5.6-luna` organization limits: **500 RPM**, **500,000 TPM**, and the
  existing batch-token control remained present.

No organization-level value was edited.

## Identity, runtime, and traffic boundaries

- Service account created: **NO**. The PromptSuno project service-account
  inventory remained empty.
- API key created, rotated, or revoked: **NO**.
- `OPENAI_API_KEY` configured: **NO**. A read-only search of the exact protected
  Vercel staging project `promptsuno-signin-staging` returned no matching
  project environment variable. No value was revealed or pulled.
- Vercel environment variable changed: **NO**.
- Deployment performed: **NO**. The deployment inventory showed no deployment
  from this task.
- Provider/API request made: **NO**.
- Paid/provider calls made by this task: **0**.
- Supabase configuration changed: **NO**.
- Supabase quota counters reset: **NO**.
- Public signup or production traffic enabled: **NO**.

No API key value, cookie, token, session export, or unrelated account data was
captured in this receipt.

## Evidence and next gate

Verification used the live OpenAI project and organization control surfaces,
the live PromptSuno identity inventory, and read-only Vercel environment and
deployment metadata. Official OpenAI documentation treats project model
permissions, rate limits, spend alerts, spend limits, service accounts, and API
keys as distinct project resources, matching the narrow scope used here.

Next gate: **provider identity creation plus staging smoke-test preparation**.
That future gate still requires separate authorization for identity/key
creation, Vercel secret configuration, deployment, and any paid provider
request. Paid traffic is not authorized.

**SPEND CONTROLS RATIFIED AND VERIFIED: YES**

**LUNA-ONLY PROJECT RESTRICTION VERIFIED: YES**

**SAFE TO ADVANCE TO PROVIDER IDENTITY / STAGING SMOKE PREPARATION: YES**

**SAFE TO ENABLE PAID TRAFFIC: NO**
