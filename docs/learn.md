# PromptSuno LEARN

LEARN is the public, statically rendered teaching surface at `/learn`. It is intentionally isolated from the authenticated Workspace, compiler, Sound Brain internals, and future shared Song Intent state.

## Add a lesson

1. Add one `LearnPage` record to `src/content/learn/pages.ts`.
2. Compose it from the discriminated blocks in `src/content/learn/types.ts`.
3. Use a stable topic slug and connect it to existing lessons through `related`.
4. Provide both BUILD and FIX handoff links. These links carry context in the URL only; they do not imply shared state.
5. Add official sources only where they support a documented product feature. Keep observations, PromptSuno research, and untested vocabulary explicitly qualified.

`generateStaticParams` turns every record into crawlable HTML. Do not import the raw research catalog, matrix, PDFs, or other corpus artifacts into a page or client component.

## Monkey Methods

`MonkeyMethod` is the only LEARN client island. Static methods store a versioned opened marker. Rotating methods store a small list of seen tip indexes and do not repeat a tip until the bank is exhausted. Opening a method never requires authentication, a network call, or database persistence.

## Shared-shell integration point

`src/components/learn/LearnChrome.tsx` owns LEARN's temporary public header and footer so this branch does not edit the homepage or authenticated Workspace shell. When a shared public navigation shell becomes authoritative, replace `LearnHeader` and `LearnFooter` at `src/app/learn/layout.tsx`; the lesson routes, content model, blocks, and Monkey Methods should remain unchanged.
