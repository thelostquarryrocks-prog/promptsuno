## Current status

As of 3 October 2026; this status supersedes historical pending gates in older documents.

- Main SHA at this status update (after PR #6): `40896ced062ea94a1ce580577477de248ae74123`; subsequent status edits are docs only.
- Staging quota migration applied and accepted (Decision A); quota activation and acceptance complete (Decision B).
- Provider controls verified: $10 hard cap, alerts at $5/$8/$10, and `gpt-5.6-luna` only.
- Exactly one paid smoke passed; temporary key revoked, provider variable removed, staging restored keyless.
- Signup remains closed; public paid traffic disabled; production untouched.
- Remaining gates: production identity repair/credential provisioning, signup or paid-traffic enablement, every CLI deployment, and production/DNS changes require explicit owner approval.
- No Vercel project has Git connected; merges do not deploy. Never repeat completed migration, activation, controls or paid smoke without an explicit owner request.
- Evidence and history: [operations log](docs/implementation/OPS-LOG.md); its dated inventories and pending gates are historical.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
