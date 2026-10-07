# Aggregate AI protection and social sign-in

This implementation is reviewable while staging stays keyless, protected and closed to new accounts. It does not activate a budget, apply a live migration, configure a provider, install a credential or permit a paid test.

## Shared reservation

Both `/api/generate` and `/api/workspace-assist` require `AI_SPEND_ENABLED=true` before invoking `reserve_ai_attempt`. The new migration is `20261007022852_aggregate_ai_spend_guard.sql`; the applied per-user migration is unchanged. A single private policy row is locked across all accounts and both actions. Existing per-user quota is reserved inside the same transaction. A denial changes neither budget. Every accepted reservation is retained, including provider failure, invalid output, cancellation, timeout and unknown caller outcomes. There is no refund endpoint or automatic retry. Deleting an account does not reset aggregate usage.

The row has an explicit enabled flag, pricing revision/expiry, full input/output prices, daily and lifetime ceilings, UTC daily usage and monotonic lifetime reservations. All amounts use integer micro-USD (1 USD = 1,000,000 micro-USD). Price columns are micro-USD **per million tokens**. Every call reserves `ceil((131072 × input_rate + 2048 × output_rate) / 1000000)`. The server permits one text-only completion, the existing exact model, an output cap of 2048 and at most 96 KiB of serialized request, including schema and instructions. Unrecognized provider parameters fail closed. Full input rate is used even for cached input.

This is a hard ceiling on application reservations under the configured accounting contract, not an unconditional provider billing guarantee. The 131072 input envelope includes byte-based text sizing plus protocol overhead allowance; it is not an authoritative model tokenizer. Before activation, verify the existing model's availability, pricing, billing/token semantics (including schema overhead and reasoning), and that this bound dominates every permitted request. If that cannot be established, leave disabled and revise the contract under approval. No price or allowance is inferred from the historical $10 provider setting, and that provider setting is not represented here as a proven enforcement mechanism. Requests made outside these application routes are outside this ledger.

Missing migration/policy, disabled flag, expired pricing, insufficient ceiling, RPC timeout and incompatible responses all block the provider. Storage contains no song text, account identifiers, provider credentials or event history. Existing RLS/private-schema boundaries remain unchanged. Authenticated clients can call the narrow reservation RPC and thereby consume only bounded quota/allowance; they cannot choose price, identity, time, model, token counts or refund. Such calls can cause bounded denial of service, not unreserved application AI usage.

## Owner approval needed before live activation

1. Approve applying the new migration to the named Supabase project `mtzrvekmsmpflbsqgpcc`; review its checksum/diff and rollback strategy first. It seeds no row and grants no schema/table access.
2. Separately approve exact daily/lifetime ceilings, verified prices, pricing revision and expiry. An operator inserts the one policy row with `enabled=false`; existing per-user policy stays unchanged. Do not reset lifetime reservations when changing prices or ceilings. Decreasing a ceiling below usage blocks future reservations.
3. Authorize any temporary credential installation and paid traffic separately, using existing restricted/expiring-key procedures. Only then set the server flag and durable enabled flag and deploy approved source. Assistance still also requires `WORKSPACE_ASSIST_ENABLED=true`.
4. Durable pause after approval: `update compiler_quota_private.ai_spend_policy set enabled=false where singleton;`. The update takes the same row lock; after it commits no new reservation is accepted. Already reserved/in-flight calls may finish and remain charged. Removing the server flag/credential is additional protection, not a refund.

No live policy SQL with guessed numeric values is supplied. Disposable database tests use deliberately synthetic prices and cannot accept a remote host.

## Google and Facebook setup (owner enters secrets)

Read-only public Supabase settings checked on 2026-10-07 reported Google disabled, Facebook disabled, and `disable_signup=true`. No provider secrets were read. App availability requires both server enablement and current public Supabase settings. Settings timeout/error or a mismatch between `AUTH_SIGNUP_ENABLED` and `disable_signup` disables both providers. No deployment flag defaults to enabled.

After specific approval, the owner configures:

- **Google:** a Web application OAuth client in the intended Google Cloud project, consent/audience/authorized-domain details, approved test users where required, and only `openid email profile`. Set the approved application origin where Google requests authorized origins. Set the provider redirect URI exactly to `https://mtzrvekmsmpflbsqgpcc.supabase.co/auth/v1/callback`. Enter client ID and client secret directly into Supabase Authentication → Sign In / Providers → Google. Do not paste the secret into chat, repository files, Vercel or screenshots. The local button PNG is Google's unchanged pre-approved light pill asset from its official download bundle.
- **Facebook:** a Meta app with the Facebook Login use case, Website configuration, appropriate app domain, privacy/data-deletion details and required development/app-role access. Configure `public_profile` and `email` as required by Supabase; the app explicitly requests email. Use the **same Supabase provider callback above** as the valid OAuth redirect URI. Owner enters App ID and App Secret directly into Supabase's Facebook provider fields. Public availability/review requirements depend on the actual app configuration; do not switch to Live mode or invite users under this build task.
- **Supabase redirect allowlist:** add only the specifically approved app callback `https://<approved-protected-preview-host>/auth/callback`. This is the **second redirect**, from Supabase to PromptSuno; it is different from the provider callback above. Avoid broad wildcard domains. Preserve the existing Site URL and other security settings. Immutable preview changes may require a separately approved exact callback entry.
- **Server flags:** after provider configuration is approved and verified, enable only the intended `SOCIAL_AUTH_GOOGLE_ENABLED` / `SOCIAL_AUTH_FACEBOOK_ENABLED` flag. Keep `AUTH_SIGNUP_ENABLED` absent/false and Supabase signup disabled. Social sign-in can then serve eligible existing identities, subject to Supabase's verified-identity linking behavior. New account creation requires separate public-signup approval and matching changes on both sides; this code alone does not authorize it.

Supabase's existing SSR client owns PKCE verifier cookies and code exchange. `/auth/social` accepts a bounded same-origin POST, ignores arbitrary redirect inputs, and checks the Supabase authorization destination. Callback destinations are fixed local paths; cancellation and expired/reused codes produce generic messages. A ten-minute HTTP-only correlation cookie plus same-tab session marker permit starter adoption only after a matching initiated flow and verified user response. The marker holds no creative text. Existing account-owned starter/draft isolation remains in force. Cookies/verifiers/tokens never enter URLs or logs; the opaque non-authenticating handoff UUID is removed from the browser URL on completion.

Live provider login, consent, account linking and public signup are **not accepted by mocked tests**. After configuration approval, verify cancellation, existing-account login, intended linking behavior, closed-signup denial and same-song continuity with owner-approved accounts. Vercel Authentication may require the owner's existing protected-preview browser session throughout the redirect.

## Sources checked

- [Supabase Google integration](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Facebook integration](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google sign-in branding and pre-approved assets](https://developers.google.com/identity/branding-guidelines)
- [Meta manual login flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/) — direct retrieval was rate-limited (429); app-specific current Meta review requirements still need confirmation in the owner's dashboard before activation.
- [Supabase changelog](https://supabase.com/changelog.md) — current entries checked; no relevant breaking change to this existing SSR/Auth route approach identified.
