# Minimum PR checks

`.github/workflows/ci.yml` runs on every pull request (including drafts) and
pushes to `main`. One job installs from `package-lock.json` with `npm ci`, then
runs lint, types, the repository's automated tests, and a production build.
Browser tests run after a successful build when `test:e2e` exists. They install
Chromium and WebKit and retain failure reports, screenshots, and traces for
seven days. Independent checks continue after another check fails, while the
job still fails; there are no tolerated failures or disabled source rules.

Node 24.12.0 matches the inspected development runtime and supports the locked
dependencies. Actions are pinned to commit SHAs. The workflow has only
`contents: read`, does not persist Git credentials, and does not deploy.

## Secrets and fixtures

No repository or deployment secrets are read. Supabase's public URL and anon
key are local, nonfunctional fixture values matching PR #2's browser server.
The build step alone supplies a nonfunctional OpenAI placeholder because the
current `main` eagerly constructs the SDK when Next.js collects routes. No
provider request is made by the build. Unit and browser test steps have no
OpenAI key. This workflow does not verify live Supabase or OpenAI integration.

## Baseline versus PR #2

The base `main` revision, `1a919abd3591a9136b47582a1ef7d4bf3e2d36ad`, has only
`build` and `lint` scripts. Types are still checked using the installed
`next typegen` and `tsc --noEmit`. Missing test scripts are explicitly reported;
they do not establish test coverage or a passing test suite.

Draft PR #2 at `dc6e36ad2666c207561fe3282ed6bc5a669a615c` introduces
`typecheck`, `test`, and `test:e2e`. The same workflow automatically uses these
commands when those changes are present, without duplicating test tooling or
copying the bridge into this infrastructure branch.

Fresh baseline local checks found 15 lint errors and four warnings in the
existing API, canvas, Workspace, and Supabase/middleware helpers. These precede
this workflow; the bridge already contains its scoped lint repairs. They remain
visible rather than being suppressed by infrastructure. Do not call the CI PR
green while this baseline fails. Application changes and branch protection are
outside this CI PR.

After human review and merge authorization for the infrastructure, incorporate
the approved workflow into PR #2 and obtain checks on its resulting exact head.
Verify its hosted preview and review gates separately before considering a
bridge merge. Neither a local pass nor a green infrastructure run proves the
bridge's hosted gate. No branch-protection or Vercel configuration change is
included here.
