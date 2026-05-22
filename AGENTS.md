# AgenticBuilder — Agent Operating Manual

## 1. Project shape
- Next.js 16 App Router on Vercel. Better-Auth + Drizzle + Neon Postgres.
- Trunk runs without any module. `modules/` is a self-service shelf.
- Demo feature: `src/app/(app)/notes/` — read it before adding new features.

## 2. Before you touch Next.js code
Read `node_modules/next/dist/docs/` first. This repo pins Next.js 16.2.6;
its API differs from training-data Next.js in concrete ways:
- middleware lives in `proxy.ts` (root), not `middleware.ts`
- Cache Components: `'use cache'` directive + `cacheLife` / `cacheTag`
- React 19 APIs (`use()`, Actions, `<form action={fn}>`)

## 3. Working rules
- **Plans**: non-trivial work goes through `plans/<NNN>-<slug>.md` first.
  When you complete a checklist item, update the plan in the same turn.
  Don't wait to be asked.
- **Status docs**: ongoing initiatives get a doc in `docs/<topic>.md` using
  `docs/_status-template.md`. Update it when state changes.
- **No UUIDs in UI**: always resolve IDs to human-readable labels before
  rendering. If you can't, the data model is wrong.
- **Owner bypass**: `OWNER_EMAIL` (env) bypasses every role/tier gate
  unconditionally. Test this path whenever you add a gate.
- **Env vars**: add to `src/lib/env.ts` (zod schema) AND `.env.example`.
  Never read `process.env.X` directly in app code.
- **DB changes**: edit `src/lib/db/schema.ts`, then
  `npm run db:generate && npm run db:migrate`. Commit the generated SQL.
- **Parallel agents (optional)**: this repo is friendly to parallel agent
  workflows — `.claude/worktrees/` is gitignored so tools like Claude
  Code's `claude agents` view can isolate sessions out of the box. Use
  it if you like; no convention here depends on it.

## 4. Verification discipline
Before claiming "done":
- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes (trunk has a small test surface; the vitest module
  expands it)
- For UI work: open the page in a browser and use the feature.
  Type-checking is not feature-checking.

## 5. Module installation
Modules live in `modules/<name>/`. Each has its own README — follow it
step-by-step. The onboarding skill at
`.claude/skills/agenticbuilder-onboarding/` automates this for new clones
(skill ships when modules ship; see Plan C).

## 6. Vercel
The Vercel CLI is expected to be installed and authenticated. Use it freely
for `vercel env pull`, `vercel deploy`, etc. Never commit `.env.local`.

## 7. Tone
Terse. Code over prose. No emojis unless asked.
