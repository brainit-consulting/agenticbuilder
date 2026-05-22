# AgenticBuilder — design spec

**Date:** 2026-05-22
**Status:** Approved (brainstorm → spec)
**Author:** Emile du Toit + Claude Opus 4.7
**Next step:** implementation plan via `superpowers:writing-plans`

## 0. Summary

AgenticBuilder is an open-source Next.js 16 quickstart / boilerplate that
distils the proven stack and conventions from the `cashdash` project into a
clean starter repo. A new project starts by using AgenticBuilder as a GitHub
template (or cloning it), then a Claude Code skill at
`.claude/skills/agenticbuilder-onboarding/` interviews the developer to
rename the project, pick opt-in modules, provision env vars, and wire
everything up.

### Design pillars
- **Lean trunk** — runs without any module installed. Just auth + DB + a
  demo feature.
- **Self-service module shelf** — opt-in capabilities live in
  `modules/<name>/`, each a self-contained instructions packet (README +
  source + deps + env example + migrations).
- **Conventions over code** — `AGENTS.md` codifies the working rules that
  made `cashdash` productive; the demo feature shows them in practice.
- **Skill IS the CLI** — instead of a `create-agenticbuilder` script, a
  Claude Code skill performs the onboarding with full repo context.

## 1. Repo layout

```
h:/AgenticBuilder/
├── .claude/
│   ├── settings.json
│   └── skills/
│       └── agenticbuilder-onboarding/
│           ├── SKILL.md
│           ├── references/
│           │   ├── module-catalog.md
│           │   ├── env-key-sources.md
│           │   └── rename-checklist.md
│           └── scripts/
│               └── apply-module.md
├── .github/
│   └── template-cleanup.yml
├── docs/
│   ├── _status-template.md
│   └── superpowers/
│       ├── specs/
│       └── plans/
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
│   │   ├── (auth)/{login,signup,reset}/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── notes/
│   │   │       ├── README.md
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       ├── [id]/page.tsx
│   │   │       ├── _actions.ts
│   │   │       └── _components/{NoteForm,NoteList,DeleteButton}.tsx
│   │   ├── api/auth/[...all]/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/ui/{button,input,card,label}.tsx
│   ├── lib/
│   │   ├── auth/{client,server}.ts
│   │   ├── db/{client,schema,queries}.ts
│   │   ├── env.ts
│   │   └── utils.ts
│   └── ...
├── drizzle/migrations/
├── public/
├── scripts/
├── proxy.ts                       (Next.js 16 middleware; root, not src/)
├── AGENTS.md
├── CLAUDE.md                      (one line: @AGENTS.md)
├── README.md
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── vitest.config.ts               (added by vitest module; trunk omits)
├── vercel.json
├── package.json
└── .env.example
```

### Pinned versions (from `cashdash` snapshot)

| Package | Version |
|---|---|
| next | 16.2.6 |
| react / react-dom | 19.2.4 |
| typescript | ^5 |
| tailwindcss | ^4 |
| better-auth | 1.6.11 |
| bcryptjs | 3.0.3 |
| drizzle-orm | 0.45.2 |
| @neondatabase/serverless | 1.1.0 |
| drizzle-kit | 0.31.10 |
| stripe | 22.1.1 (module) |
| @vercel/blob | 2.4.0 (module) |
| ai | 6.0.185 (module) |
| vitest | 4.1.7 (module) |
| eslint / eslint-config-next | ^9 / 16.2.6 |
| sharp | 0.34.5 (as needed) |
| zod | 4.4.3 |
| nanoid | 5.1.11 |

## 2. Core trunk

### `package.json` (lean)

```jsonc
{
  "name": "agenticbuilder",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "better-auth": "1.6.11",
    "bcryptjs": "3.0.3",
    "drizzle-orm": "0.45.2",
    "@neondatabase/serverless": "1.1.0",
    "zod": "4.4.3",
    "nanoid": "5.1.11",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bcryptjs": "^2",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8",
    "drizzle-kit": "0.31.10",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "dotenv": "^16",
    "vitest": "4.1.7",
    "@vitest/coverage-v8": "4.1.7"
  }
}
```

### Core files

| Path | Purpose |
|---|---|
| `proxy.ts` | Next.js 16 middleware. Reads Better-Auth session cookie; redirects unauthenticated requests to `(app)/*` → `/login`. |
| `src/lib/env.ts` | Zod-validated env access. Exports a typed `env` object. Throws at boot if required vars missing. |
| `src/lib/auth/server.ts` | `betterAuth({...})` instance bound to Drizzle adapter using core tables. |
| `src/lib/auth/client.ts` | `createAuthClient()` for React. |
| `src/lib/db/client.ts` | Neon serverless + Drizzle client. |
| `src/lib/db/schema.ts` | Better-Auth tables (`user`, `session`, `account`, `verification`) + `notes` table for the demo. |
| `src/lib/db/queries.ts` | Helpers used by both the demo and (later) by modules: `getUserById`, `getNotesForUser`, etc. |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge). |
| `src/app/api/auth/[...all]/route.ts` | Better-Auth Next.js handler. |
| `src/app/(auth)/{login,signup,reset}/page.tsx` | Auth flows wired to the Better-Auth client. |
| `src/app/(app)/layout.tsx` | Protected layout: navbar (home, notes, signout), session-aware. |
| `src/app/(app)/dashboard/page.tsx` | Stub landing for logged-in users. |
| `src/app/(app)/notes/*` | Demo feature (Section 5). |
| `src/app/page.tsx` | Public landing. |
| `src/app/layout.tsx` | Root layout, fonts, globals.css. |
| `src/components/ui/{button,input,card,label}.tsx` | Minimal Tailwind primitives. No shadcn install in trunk — onboarding skill offers `npx shadcn add` if user wants more. |
| `.env.example` | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OWNER_EMAIL`. |
| `.gitignore` | Standard Next.js ignores (`.next/`, `node_modules/`, `.env*.local`) **plus `.claude/worktrees/`** so parallel-agent worktrees created by Claude Code's `claude agents` view aren't committed. |
| `drizzle.config.ts` | Schema at `src/lib/db/schema.ts`, output `drizzle/migrations/`. |
| `vercel.json` | Region pinning + empty function config. |
| `vitest.config.ts` | Vitest config for pure-logic unit tests (env schema, utils). Trunk ships with a small test surface; the `vitest` module expands scaffolding (component tests, integration tests with test DB, e2e). |
| `src/test/setup.ts` | Vitest setup file: loads `.env.test` if present, sets `NODE_ENV=test`. |
| `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` | Standard Next.js 16 + Tailwind v4 setup. |

### Trunk acceptance criteria
- `npm install && npm run dev` works against a fresh Neon database after
  setting two env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`).
- A user can sign up at `/signup`, land on `/dashboard`, navigate to
  `/notes`, create/edit/delete notes.
- `npm run typecheck` and `npm run lint` both pass.
- No module has to be installed for any of the above to work.

## 3. Module shelf contract

### Folder layout

```
modules/<name>/
├── README.md           ← THE contract
├── src/                ← files copied into src/ during install
│   └── ...
├── env.example         ← keys appended to .env.example
├── deps.json           ← { "dependencies": {...}, "devDependencies": {...} }
└── migrations/         ← optional drizzle migrations
```

### README.md required structure (parsed by the onboarding skill)

Every module's README MUST contain these H2 sections in this order:

```markdown
# <Module Name>

## What this gives you
<one paragraph; concrete user-facing capabilities>

## Prerequisites
- <other modules that must be installed first>
- <external accounts needed>

## Environment variables
| Key | Required | Where to get it | Example |
|---|---|---|---|

## Install
1. `npm install <pkg>`            (from deps.json)
2. Copy `modules/<name>/src/<file>` → `src/<dest>`
3. Add to `src/lib/env.ts`:        (verbatim diff)
4. Add to `src/lib/db/schema.ts`:  (verbatim diff)
5. Run `npm run db:generate && npm run db:migrate`
6. Wire into existing file:        (verbatim diff)

## Verify
<a specific user-visible thing to do that proves it works>

## Uninstall
<reverse steps, listed explicitly>
```

### The seven modules

| Module | What it adds | Depends on |
|---|---|---|
| `stripe` | `src/lib/stripe/`, `/api/stripe/webhook`, `/billing` page, separate `subscription` table (FK → `user.id`) | — |
| `ai-sdk` | `src/lib/ai/`, `/api/chat` streaming route, `<Chat>` component, model picker via Vercel AI Gateway | — |
| `blob` | `src/lib/blob.ts`, `/api/upload` signed URL route, `<FileUpload>` component | — |
| `email-resend` | `src/lib/email/`, template dir, `sendEmail()` helper, optional Better-Auth email-verification hook | — |
| `vitest` | Expanded testing scaffold on top of trunk's minimal vitest: integration tests with a real test DB (testcontainers or transactional rollback), React Server Component testing helpers, sample e2e Playwright config, CI workflow stub | — |
| `role-gates` | `role` column on `user` (`'user' \| 'admin'`), `requireRole()` server helper, `<RequireRole>` client gate, **owner-bypass keyed on `OWNER_EMAIL`** | — |
| `admin-scaffold` | `(app)/admin/*` routes (users list, role editor) | `role-gates` |

## 4. Conventions

### `CLAUDE.md`
One line, so it works across AI tools:

```
@AGENTS.md
```

### `AGENTS.md` outline

```markdown
# AgenticBuilder — Agent Operating Manual

## 1. Project shape
- Next.js 16 App Router on Vercel. Better-Auth + Drizzle + Neon Postgres.
- Trunk runs without any module. modules/ is a self-service shelf.
- Demo feature: src/app/(app)/notes/ — read it before adding new features.

## 2. Before you touch Next.js code
Read node_modules/next/dist/docs/ first. This repo pins Next.js 16.2.6;
its API differs from training-data Next.js in concrete ways:
- middleware lives in proxy.ts (root), not middleware.ts
- Cache Components: 'use cache' directive + cacheLife / cacheTag
- React 19 APIs (use(), Actions, <form action={fn}>)

## 3. Working rules
- Plans: non-trivial work goes through plans/<NNN>-<slug>.md first.
  When you complete a checklist item, update the plan in the same turn.
  Don't wait to be asked.
- Status docs: ongoing initiatives get a doc in docs/<topic>.md using
  docs/_status-template.md. Update it when state changes.
- No UUIDs in UI: always resolve IDs to human-readable labels before
  rendering. If you can't, the data model is wrong.
- Owner bypass: OWNER_EMAIL (env) bypasses every role/tier gate
  unconditionally. Test this path whenever you add a gate.
- Env vars: add to src/lib/env.ts (zod schema) AND .env.example.
  Never read process.env.X directly in app code.
- DB changes: edit src/lib/db/schema.ts, then
  npm run db:generate && npm run db:migrate. Commit the generated SQL.
- Parallel agents (optional): this repo is friendly to parallel agent
  workflows — .claude/worktrees/ is gitignored so tools like Claude Code's
  `claude agents` view can isolate sessions out of the box. Use it if you
  like; no convention here depends on it.

## 4. Verification discipline
Before claiming "done":
- npm run typecheck passes
- npm run lint passes
- npm test passes (if vitest module is installed)
- For UI work: open the page in a browser and use the feature.
  Type-checking is not feature-checking.

## 5. Module installation
Modules live in modules/<name>/. Each has its own README — follow it
step-by-step. The onboarding skill at
.claude/skills/agenticbuilder-onboarding/ automates this for new clones.

## 6. Vercel
The Vercel CLI is expected to be installed and authenticated. Use it freely
for vercel env pull, vercel deploy, etc. Never commit .env.local.

## 7. Tone
Terse. Code over prose. No emojis unless asked.
```

### Other convention files

- `plans/README.md` — explains the plan format, references `_template.md`.
- `plans/_template.md` — checklist plan format used by writing-plans skill.
- `plans/_template.html` — same content, browser-printable.
- `docs/_status-template.md` — frontmatter (status, owner, last-updated) +
  sections (context, decisions, open questions).
- `.claude/settings.json` — permission allowlist for common dev commands
  (`npm`, `npx`, `git`, `vercel`, `drizzle-kit`), plus onboarding skill
  registration.

## 5. Demo feature — `notes`

### Purpose
`src/app/(app)/notes/` is the single canonical reference for "how we build
a feature in this stack." Every pattern a new feature would need is
exercised exactly once.

### Pattern coverage

| Pattern | File |
|---|---|
| Drizzle schema with FK to user | `src/lib/db/schema.ts` — `notes` table |
| Typed query helpers | `src/lib/db/queries.ts` |
| Server-only data access with auth check | `src/app/(app)/notes/_actions.ts` |
| Server Component list page | `src/app/(app)/notes/page.tsx` |
| Server Component detail + edit | `src/app/(app)/notes/[id]/page.tsx` |
| React 19 `<form action={serverAction}>` + `useFormStatus` | `_components/NoteForm.tsx` |
| Client interactivity (delete confirm) | `_components/DeleteButton.tsx` |
| Boundary validation with zod | inside each Server Action |
| Error surfaces | per-route `error.tsx` + `loading.tsx` |
| Empty state | `<NoteList>` |
| Cache invalidation | `revalidatePath('/notes')` after mutations |
| No-UUIDs rule | IDs are `nanoid` strings; UI shows titles |

### `notes` schema

```ts
notes: {
  id: text (nanoid, PK)
  userId: text (FK → user.id, on delete cascade)
  title: text not null
  body: text not null default ''
  createdAt: timestamp default now()
  updatedAt: timestamp default now()
}
```

### Routes
- `/notes` — list (Server Component)
- `/notes/new` — create form
- `/notes/[id]` — detail + edit form
- Delete handled via Server Action from `/notes/[id]`

### Out of scope
Sharing, tagging, search, markdown rendering, attachments. The demo stays
minimal so the patterns shine through.

### Self-documentation
`src/app/(app)/notes/README.md` — one page explaining "this is the
reference feature; here's what each file teaches."

## 6. Bootstrap workflow

### Skill-driven path (default)

```
1. Use the template
   - GitHub: click "Use this template" → user's own repo
   - Local:  git clone … && rm -rf .git && git init

2. Open in Claude Code
   - .claude/skills/agenticbuilder-onboarding/ auto-loads
   - Skill greets: "Looks like a fresh AgenticBuilder clone. Onboard?"

3. Skill performs Section 7 flow (see below)

4. First run
   - npm run dev
   - Sign up at /signup → /dashboard → use /notes
   - Run each installed module's "Verify" step

5. First deploy
   - vercel deploy (skill offers; user can defer)
   - Reminder to set production env vars
```

### Manual path

The trunk `README.md` documents:
- Prereqs (Node 22+, a Neon account, optional Vercel account).
- 4 commands: clone → `npm i` → fill `.env.local` from `.env.example`
  → `npm run db:migrate` → `npm run dev`.
- "For each module you want, follow `modules/<name>/README.md`."

### Template-cleanup action

`.github/template-cleanup.yml` (small GitHub Action) wipes
`docs/brainstorm-handoff-*.md` and any seed plan files on first commit to
a template-derived repo. Cosmetic; the onboarding skill does it more
thoroughly.

## 7. Onboarding skill

### Location
`.claude/skills/agenticbuilder-onboarding/`

### Structure

```
.claude/skills/agenticbuilder-onboarding/
├── SKILL.md                  ← entry point, frontmatter + flow
├── references/
│   ├── module-catalog.md     ← copy of each module's "What this gives you" para
│   ├── env-key-sources.md    ← per-module: which dashboard/page to get keys from
│   └── rename-checklist.md   ← every file that mentions "agenticbuilder"
└── scripts/
    └── apply-module.md       ← reusable sub-routine: install module <name>
```

### Trigger
Skill type: rigid. Auto-discovered because it lives in `.claude/skills/`.
Frontmatter `description` triggers on: "set up", "onboard", "configure",
"rename", "install module", or when the marker file
`.agenticbuilder-onboarded` is absent at repo root.

### Flow (7 steps)

```
STEP 1 — Detect state
  - Read .agenticbuilder-onboarded marker. If present, ask "re-run onboarding?"
  - Confirm package.json name === "agenticbuilder"

STEP 2 — Project rename
  - Ask kebab-case project name (package.json) + Title Case (README)
  - Update: package.json, README.md, .env.example header, vercel.json
  - Offer to git init + initial commit

STEP 3 — Owner email
  - Ask for OWNER_EMAIL (default: git config user.email)
  - Write to .env.local

STEP 4 — Database (required)
  - Ask: do you have a Neon DATABASE_URL?
    a) Yes → paste
    b) Create one → point at console.neon.tech
    c) Vercel marketplace → vercel link + vercel marketplace add neon
       + vercel env pull .env.local
  - Generate BETTER_AUTH_SECRET (32-byte hex)
  - npm install if node_modules missing
  - npm run db:generate && npm run db:migrate
  - Verify: npm run dev, /signup, create test account

STEP 5 — Module selection
  - Show module-catalog.md as a checklist; user picks any subset
  - For each chosen module, in dependency order
    (admin-scaffold after role-gates), run apply-module.md:
      1. Read modules/<name>/README.md
      2. Append modules/<name>/env.example to .env.local with placeholders
      3. Walk user through getting each env key (env-key-sources.md)
      4. Merge modules/<name>/deps.json → package.json, npm install
      5. Copy modules/<name>/src/* → src/
      6. Apply schema/env.ts patches (shown verbatim in module README)
      7. If module has migrations: db:generate + db:migrate
      8. Run the module's "Verify" step with the user

STEP 6 — Vercel link (optional)
  - Offer vercel link. If yes, offer vercel env add for non-secret vars
    (skill never types secrets — user pastes into Vercel UI).

STEP 7 — Finalize
  - Write .agenticbuilder-onboarded (timestamp + selected modules)
  - Delete docs/brainstorm-handoff-*.md
  - Keep the skill itself (user may add modules later)
  - Suggest git commit -m "chore: complete onboarding"
  - Print summary: installed modules + next command
```

### Anti-patterns (baked into `SKILL.md`)
- Never echo a secret back to the user (paste prompts only).
- Never run destructive ops (`rm`, `git reset --hard`) without explicit
  confirmation.
- On step failure (e.g., migration error), stop and surface the error —
  don't barrel ahead.
- Always run env writes through `src/lib/env.ts` first (add the zod key
  before the `.env.local` value).

### Re-entrance
Running the skill after onboarding short-circuits to STEP 5 with the
catalog filtered to "not installed yet" (detected by inspecting
`.agenticbuilder-onboarded`'s recorded module list).

## 8. Acceptance criteria for the project as a whole

The implementation is complete when:

- [ ] A fresh clone with `DATABASE_URL` and `BETTER_AUTH_SECRET` set can
      run `npm run db:migrate && npm run dev`, sign up, and use `/notes`
      with zero modules installed.
- [ ] All seven modules can be installed via their README without code
      changes outside the documented diffs.
- [ ] The onboarding skill performs all seven steps on a fresh clone
      and writes `.agenticbuilder-onboarded` at the end.
- [ ] `npm run typecheck` and `npm run lint` pass on trunk and after
      installing every module.
- [ ] `AGENTS.md` content is followed by the trunk implementation (no
      `process.env.X` reads outside `env.ts`, no UUIDs in UI, etc.).
- [ ] Repo is ready to publish as a GitHub template.

## 9. Out of scope (explicit non-goals)

- Background jobs / queues (deferred).
- Codemod scripts (the skill plays this role).
- Storybook, monorepo support, multi-tenancy.
- Replacing user-scope skills with repo-scope copies.
- A `create-agenticbuilder` npm CLI.
