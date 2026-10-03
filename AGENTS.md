# AGENTS.md — PromptSuno

Read this at the start of every task. Prompts give you an outcome and a done
condition. This file holds the rules, so prompts don't repeat them.

## How to work

- Finish the milestone in one pass: implement, run the existing checks, fix what
  breaks, deploy to staging when the prompt says so.
- Decide small things yourself and note each in one line. Ask only when an action
  is irreversible, falls under Hard gates, or the prompt contradicts the repo.
- Verification is part of the work, never a separate task. Don't re-prove state
  an earlier task already established unless this task changes it.
- One branch per milestone, named `codex/<milestone-slug>`. No branch per step.
- Log work by appending a dated entry to `docs/implementation/OPS-LOG.md` in the
  same commit as the work. Don't create receipt files unless the prompt asks.
- Preserve unrelated untracked files and worktrees. No destructive git commands
  (reset --hard, clean, force-push, branch or worktree deletion) unless the
  prompt names them.

## Hard gates — stop and ask, every time

- Production: deploying to it, DNS, canonical-domain or alias changes.
- Turning on public signup or any public or paid traffic.
- Merging to main, unless the prompt authorizes it and lists the conditions.
- Creating, installing, or exposing any provider credential. Provider keys exist
  only through an explicitly authorized task: restricted, request-only,
  expiring, deleted afterward.
- Changing the spend cap, alerts, model allowlist, rate limits, the OpenAI
  service account, or quota policy values.
- Any action that could spend money outside the capped OpenAI project.

## Secrets

Never print, log, commit, or write secrets, tokens, cookies, keys, or user
emails and IDs into files, docs, or replies. Dashboard fields that need a secret
pasted (Google client secret, provider keys) are the owner's job: give the exact
steps and stop.

## Safe without asking

Code, tests, new migration files, local and `codex/*` or `docs/*` branches,
pushing those branches, and draft PRs. All deployments require explicit approval.

## Testing policy

- Run the existing unit and browser suites before declaring done. Fix failures
  you caused.
- Add tests only where a silent failure would be costly: auth and session
  handling, redirect handling, quota, anything touching another user's data.
  Skip tests for layout, copy, and styling.
- No paid provider calls unless the prompt authorizes one.

## Report format

Final message under 15 lines:

```
Done:      1-3 lines
Changed:   branch, commit, key files
Checks:    suites run, counts, pass/fail
Try it:    the click path that shows it working
Needs you: only if blocked
```

No PASS/FAIL banners, no "SAFE TO..." lines, no restating of the fixed facts.

## Fixed facts

- Staging migration, quota activation, spend controls and the paid smoke are complete; never repeat them without the owner's explicit request.
- No Vercel project has Git connected; every deploy, including any future production deploy, is an explicit CLI action that needs the owner's approval.
- Stack: Next.js 16 App Router, Supabase Auth and Postgres, Vercel, PWA with a
  service worker. Build with `next build --webpack`.
- Staging: Vercel project `promptsuno-signin-staging`
  (`prj_3MzWlBvUpiOPkBtBMbkL2rKh6ZcU`), Vercel Authentication on, stable alias
  `https://promptsuno-signin-staging.vercel.app`. Staging deploys come from a
  clean detached worktree at an exact SHA, not the working checkout. Staging is
  keyless by default.
- Supabase project ref: `mtzrvekmsmpflbsqgpcc`. Private schema: RLS on its
  tables, no policies, no `authenticated` schema or table access, no `anon` RPC
  execute. Don't loosen any of it.
- Quota: 3 requests per 60 s burst and 20 per 86,400 s sustained, per account,
  from a single-row policy. Per-plan policy is a later milestone.
- OpenAI project `promptsuno` (`proj_pBrkpocbPAtAPt6v7RAQy1EU`): only
  `gpt-5.6-luna` allowed, $10 hard cap, alerts at $5, $8, $10.
- Protected routes (`/workspace`, `/api/generate`, and every auth route) send
  `Cache-Control: private, no-store`, are network-only in the service worker, and
  go through the middleware same-origin check (403 on hostile origin). Any new
  authenticated or auth-flow route does the same.
- Migrations are checksummed. Preserve exact bytes and LF line endings, add new
  files, never edit applied ones. State the target Supabase project in the log
  entry whenever you apply one.
- Host is Windows. Repo at `C:/codex-projects/PromptSuno`. Use PowerShell-safe
  commands.

## Commands

- Install: `npm.cmd ci --no-audit --no-fund`
- Dev: `npm.cmd run dev`
- Build: `npm.cmd run build` (`next build --webpack`)
- Typecheck: `npm.cmd run typecheck`
- Lint: `npm.cmd run lint`
- Unit: `npm.cmd test`
- E2E: `npm.cmd run test:e2e`
- Local quota database: `npm.cmd run test:quota-db`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
