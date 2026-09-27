# PromptSuno

PromptSuno.com is a mobile-first creative companion for people using Suno.

The product is organized around three jobs:

- **LEARN** — understand how to do something
- **BUILD** — create something
- **FIX** — diagnose and improve something

The most developed current feature is **Sound Brain**, a visual WebGL environment for collecting musical concepts and compiling them into an editable Suno Styles prompt.

## Current status

This repository is the canonical PromptSuno codebase. SunoV6.wiki is historical/reference material unless explicitly migrated into this repository.

Current immediate engineering target: complete the Sound Brain → structured selected nodes → relationship notes → LLM compiler → clarification/output → copy/export bridge.

See:

- [Product Authority](docs/PRODUCT_AUTHORITY.md)
- [Implementation Baseline](docs/IMPLEMENTATION_BASELINE.md)
- [Research & Migration Policy](docs/RESEARCH_MIGRATION_POLICY.md)
- [Sound Brain Compiler Bridge Contract](docs/SOUNDBRAIN_COMPILER_BRIDGE.md)

## Development

```bash
npm install
npm run dev
```

Before changing Next.js architecture, follow the repository's `AGENTS.md` instructions and consult the version-matched docs shipped with the installed Next.js package.

## Core stack

Next.js App Router, React, TypeScript, Tailwind CSS, Three.js / React Three Fiber, OpenAI SDK, Supabase auth infrastructure, and PWA support.
