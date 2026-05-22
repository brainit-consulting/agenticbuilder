# AgenticBuilder — brainstorm handoff (2026-05-22)

This document captures a brainstorming session that was started in `h:\cashdash`
and handed off to this new repo so it can continue cleanly in a fresh Claude
Code session. **The design is not finished — see "What's still open" below.**

## Project goal

Build a generic Next.js quickstart / boilerplate at `h:\AgenticBuilder`, based
on the proven stack and conventions from `h:\cashdash`. Will be made
open-source on GitHub later. Users clone it for any new SaaS / web app.

Original name was going to be `dreamforgebuilder`, but that folder turned out
to be an existing knowledge-graph project of Emile's
(`brainit-consulting/dreamforgebuilder`). New name: **AgenticBuilder**.

## Decisions made (interview Q&A)

| # | Question | Answer |
|---|----------|--------|
| 1 | Boilerplate flavor | **Lean core + opt-in modules** |
| 2 | Core auth | **Better-Auth** (same as CashDash post-swap) |
| 3 | Core DB | **Drizzle + Neon Postgres** |
| 4 | Universal modules | Stripe billing, AI SDK (Vercel `ai`), Vercel Blob, Email (Resend) |
| 5 | Heavy modules | Vitest scaffold, Role gates + owner-bypass, Admin dashboard scaffold (background jobs skipped) |
| 6 | Conventions | AGENTS.md + CLAUDE.md template, /plans/ + plan-progress discipline, /docs/ + status doc pattern, .claude/settings.json |
| 7 | Module mechanism | `/modules/<name>/` self-contained folders + per-module README (no codemod scripts) |
| 8 | Demo content in trunk | One-feature reference (a `notes` feature exercising the whole stack) |

## New requirement added mid-brainstorm

Ship a **post-clone onboarding skill** at `.claude/skills/agenticbuilder-onboarding/`
that auto-loads when a user opens this repo in Claude Code. The skill interviews
them about:
- Project name (rename `package.json`, README, etc.)
- Which opt-in modules to install
- Env vars to provision (Stripe keys, Neon URL, Resend key, etc.)
- Owner email for the owner-bypass pattern
- Then walks them through each chosen `modules/<name>/README.md` to wire it in.

This replaces a custom CLI — the skill IS the CLI, but smarter because it has
context.

## Section 1 — Repo layout (presented, NOT YET APPROVED)

```
h:/AgenticBuilder/
├── .claude/
│   ├── settings.json              ← permission allowlist + optional hooks
│   └── skills/
│       └── agenticbuilder-onboarding/   ← post-clone interview skill
├── docs/
│   └── _status-template.md
├── plans/
│   ├── README.md
│   ├── _template.html
│   └── _template.md
├── modules/
│   ├── README.md
│   ├── stripe/
│   ├── ai-sdk/
│   ├── blob/
│   ├── email-resend/
│   ├── vitest/
│   ├── role-gates/
│   └── admin-scaffold/
├── src/
│   ├── app/
│   │   ├── (auth)/                ← login / signup / reset
│   │   ├── (app)/                 ← protected layout + navbar
│   │   │   ├── dashboard/
│   │   │   └── notes/             ← one-feature reference (the demo)
│   │   ├── api/auth/[...all]/     ← Better-Auth handler
│   │   ├── layout.tsx
│   │   └── page.tsx               ← landing
│   ├── components/ui/             ← button, input, card, etc.
│   ├── lib/
│   │   ├── auth/                  ← Better-Auth client + server
│   │   ├── db/                    ← Drizzle client + schema + queries
│   │   └── env.ts                 ← typed env access (zod)
│   └── proxy.ts                   ← Next.js 16 middleware
├── drizzle/migrations/
├── public/
├── scripts/
├── AGENTS.md
├── CLAUDE.md                      ← @AGENTS.md
├── README.md
├── drizzle.config.ts, eslint.config.mjs, next.config.ts,
│   postcss.config.mjs, tsconfig.json, vitest.config.ts, vercel.json
├── package.json                   ← lean deps only; modules add their own
└── .env.example
```

## What's still open

- [ ] **Section 1 approval** — user was reviewing the repo tree when the
      session ended. Confirm or change.
- [ ] **Section 2** — Core trunk: which exact files, what's in `package.json`
- [ ] **Section 3** — Module shelf contract: what each module's README
      structure looks like
- [ ] **Section 4** — Conventions content: what `AGENTS.md` actually says
- [ ] **Section 5** — Demo feature shape: the `notes` feature spec
- [ ] **Section 6** — Bootstrap workflow: how user creates a project from this
- [ ] **Section 7 (NEW)** — Onboarding skill design
- [ ] Final design doc → user approval → invoke `superpowers:writing-plans`

## Resolved upstream versions (snapshot from h:\cashdash)

- Next.js **16.2.6**, React **19.2.4**
- TypeScript **5**, Tailwind **v4**
- Better-Auth **1.6.11**, bcryptjs **3.0.3**
- Drizzle ORM **0.45.2** + `@neondatabase/serverless` **1.1.0**
- Drizzle-kit **0.31.10**
- Stripe **22.1.1**
- Vercel Blob **2.4.0**
- AI SDK (`ai`) **6.0.185**
- Vitest **4.1.7**
- ESLint **9** + eslint-config-next **16.2.6**
- Sharp **0.34.5** (for image processing)
- Zod **4.4.3**, nanoid **5.1.11**

## Global skills available (user-scope, auto-load in new session)

**Frontend / UI:**
- `frontend-design` — production-grade UI from anthropics/skills
- `apple-hig-compliance` — iOS / Safari polish
- `vercel-react-best-practices` — 69-rule perf checklist
- `vercel-composition-patterns` — compound components, React 19
- `vercel-react-view-transitions` — native `<ViewTransition>`
- `web-design-guidelines` — UI audit against Vercel WIG

**Next.js / Vercel:**
- `vercel:nextjs`, `vercel:next-cache-components`, `vercel:routing-middleware`
- `vercel:vercel-functions`, `vercel:vercel-storage`, `vercel:env-vars`
- `vercel:auth`, `vercel:shadcn`, `vercel:turbopack`
- `vercel:ai-sdk`, `vercel:ai-gateway`, `vercel:chat-sdk`
- `vercel:workflow`, `vercel:runtime-cache`, `vercel:vercel-firewall`
- `vercel-optimize` (needs Vercel CLI v53+, user is on v52)

**Stripe:** `stripe:stripe-best-practices`, `stripe:stripe-projects`,
`stripe:upgrade-stripe`, `stripe:test-cards`, `stripe:explain-error`

**Process:** `superpowers:brainstorming` (in use),
`superpowers:writing-plans` (next), `superpowers:writing-skills`
(for the onboarding skill), `superpowers:test-driven-development`,
`superpowers:verification-before-completion`

## Carry-over conventions from h:\cashdash (these become AGENTS.md content)

- Owner-bypass pattern: master admin (`dutoit.emile@gmail.com`) bypasses every
  tier gate. Bake this into role-gates module.
- No UUIDs in UI: always resolve to human-readable labels.
- Plans track progress: when a plan item is completed, update the plan file
  in the same turn — don't wait for the user to ask.
- Read `node_modules/next/dist/docs/` before writing Next.js code (this version
  has breaking changes vs training data).
- Vercel CLI is installed and authenticated; use it freely.
- Next.js 16 modern API: `middleware.ts` → `proxy.ts`,
  `<SignedIn>`/`<SignedOut>` → `<Show>` component (Clerk-specific but the
  pattern matters).

## Kick-off prompt for the new Claude Code session

Open Claude Code in `h:\AgenticBuilder` and paste:

> Read `docs/brainstorm-handoff-2026-05-22.md`. We're mid-brainstorm on this
> repo — pick up where it left off. Confirm Section 1 (the repo tree) with me
> and continue presenting Sections 2–7. When the design is approved, write
> the final spec to `docs/superpowers/specs/2026-05-22-agenticbuilder-design.md`,
> then invoke the `superpowers:writing-plans` skill.

---

*Handoff written by Claude Opus 4.7 in h:\cashdash session on 2026-05-22.*
