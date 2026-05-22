# AgenticBuilder — Trunk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable lean Next.js 16 + Better-Auth + Drizzle/Neon trunk with a `notes` demo feature, conventions docs (AGENTS.md, plans/docs templates), the module shelf framework (no modules yet), and GitHub template wiring. Acceptance: clone → `npm i` → set 2 env vars → `npm run db:migrate` → `npm run dev` → sign up → use `/notes`.

**Architecture:** Next.js 16 App Router (Server Components + Server Actions + React 19), Better-Auth bound to a Drizzle/Neon Postgres adapter, Tailwind v4. The `notes` feature is a single-tenant per-user CRUD that demonstrates every pattern a future feature needs (schema, query helpers, server actions with zod validation, cache invalidation, empty/error states). Modules and the onboarding skill are deferred to Plans B and C.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, TypeScript 5, Tailwind v4, Better-Auth 1.6.11, Drizzle ORM 0.45.2 + `@neondatabase/serverless` 1.1.0, Zod 4.4.3, nanoid 5.1.11, Vitest 4.1.7 (pure-logic tests only — full test scaffolding lives in the vitest module).

**Scope split:**
- **This plan:** AgenticBuilder v0.1 trunk + module-shelf framework spec + GitHub template wiring.
- **Future Plan B:** Implement the seven modules.
- **Future Plan C:** Onboarding skill.

**Out of scope (per spec §9):** background jobs, codemod CLI, Storybook, monorepo support, multi-tenancy.

**Pre-flight:**
- Node 22+ installed (`node -v`).
- A Neon Postgres URL is NOT required to start — only Task 17 (Acceptance) needs it. The engineer should obtain one from `console.neon.tech` before Task 17.
- The repo at `h:\AgenticBuilder/` currently contains `README.md` and `docs/`. Everything else is created by this plan.

---

## Task 1: Initialize repo + package.json + install dependencies

**Files:**
- Create: `package.json`
- Create: `.git/` (via `git init`)

- [ ] **Step 1: Initialize git**

```bash
cd h:/AgenticBuilder
git init -b main
```

Expected: `Initialized empty Git repository in h:/AgenticBuilder/.git/`

- [ ] **Step 2: Write `package.json`**

Create `package.json` with this exact content:

```jsonc
{
  "name": "agenticbuilder",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  },
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

- [ ] **Step 3: Install**

```bash
npm install
```

Expected: completes without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 4: Sanity-check the install**

```bash
npx next --version
```

Expected: prints `16.2.6` (or a string containing it).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize package.json with pinned core deps"
```

---

## Task 2: Configs — TypeScript, Next.js, ESLint, Tailwind v4, PostCSS

**Files:**
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`

- [ ] **Step 1: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

- [ ] **Step 3: `eslint.config.mjs`**

```js
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "drizzle/migrations/**"],
  },
];
```

- [ ] **Step 4: `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: `src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

html, body {
  background: var(--background);
  color: var(--foreground);
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 6: Verify typecheck still passes (no source files yet, so nothing to fail)**

```bash
npm run typecheck
```

Expected: no errors (may print "No inputs were found in config file" — that's OK at this stage; ignore it or move forward to source files).

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs src/app/globals.css
git commit -m "chore: add TypeScript, Next.js, ESLint, Tailwind v4 configs"
```

---

## Task 3: Vitest setup + smoke test

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`

- [ ] **Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: `src/test/setup.ts`**

```ts
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test", quiet: true });

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? "test-secret-32-bytes-ok-for-tests";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
process.env.OWNER_EMAIL = process.env.OWNER_EMAIL ?? "owner@example.com";
```

- [ ] **Step 3: Smoke test — `src/test/smoke.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });

  it("loads test env", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/test/smoke.test.ts
git commit -m "chore: add minimal Vitest setup for pure-logic unit tests"
```

---

## Task 4: Non-config root files — .gitignore, .env.example, vercel.json, .claude/settings.json

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `vercel.json`
- Create: `.claude/settings.json`

- [ ] **Step 1: `.gitignore`**

```gitignore
# dependencies
node_modules/
.pnp
.pnp.*

# next.js
.next/
out/
next-env.d.ts

# testing
coverage/

# production
build/

# misc
.DS_Store
*.pem
.idea/
.vscode/
*.tsbuildinfo

# env files
.env
.env*.local
.env.test

# vercel
.vercel/

# drizzle
drizzle/meta/_journal.json.bak

# claude code parallel-session worktrees (claude agents view)
.claude/worktrees/
```

- [ ] **Step 2: `.env.example`**

```bash
# Required: Neon Postgres connection string (pooled). Get one at https://console.neon.tech
DATABASE_URL="postgres://user:pass@host/dbname?sslmode=require"

# Required: 32-byte hex secret for Better-Auth session signing.
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET=""

# Required: Base URL for Better-Auth callbacks. Localhost in dev; your prod URL in prod.
BETTER_AUTH_URL="http://localhost:3000"

# Required: The "owner" email — this user bypasses every role/tier gate (see AGENTS.md §3).
OWNER_EMAIL=""
```

- [ ] **Step 3: `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["iad1"],
  "framework": "nextjs"
}
```

- [ ] **Step 4: `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(drizzle-kit:*)",
      "Bash(vercel:*)"
    ]
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example vercel.json .claude/settings.json
git commit -m "chore: add gitignore, env example, vercel config, claude allowlist"
```

---

## Task 5: Conventions docs — AGENTS.md, CLAUDE.md, README, plans/, docs/ templates, .github/

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `README.md` (overwrites existing stub)
- Create: `plans/README.md`
- Create: `plans/_template.md`
- Create: `plans/_template.html`
- Create: `docs/_status-template.md`
- Create: `docs/superpowers/specs/.gitkeep`
- Create: `docs/superpowers/plans/.gitkeep`
- Create: `.github/template-cleanup.yml`

- [ ] **Step 1: `AGENTS.md`**

```markdown
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
```

- [ ] **Step 2: `CLAUDE.md`**

```markdown
@AGENTS.md
```

- [ ] **Step 3: `README.md` (replaces existing stub)**

```markdown
# AgenticBuilder

A lean Next.js 16 + Better-Auth + Drizzle/Neon quickstart for new SaaS apps.

Trunk: auth, DB, a working `notes` demo feature, conventions. Modules:
opt-in Stripe billing, Vercel AI SDK, Vercel Blob, Resend email, expanded
testing, role gates, admin dashboard.

## Quick start (manual)

1. Use this template (GitHub) or `git clone … && rm -rf .git && git init`
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill in:
   - `DATABASE_URL` — a Neon Postgres URL (https://console.neon.tech)
   - `BETTER_AUTH_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `BETTER_AUTH_URL` — `http://localhost:3000` for dev
   - `OWNER_EMAIL` — your email (bypasses every role/tier gate)
4. `npm run db:generate && npm run db:migrate`
5. `npm run dev` and visit http://localhost:3000

## Quick start (Claude Code)

Open this repo in Claude Code. The onboarding skill at
`.claude/skills/agenticbuilder-onboarding/` auto-loads and walks you
through renaming, env setup, module selection, and verification. (Skill
lands in a later release; see `docs/superpowers/specs/`.)

## Modules

Each `modules/<name>/` is a self-contained instructions packet (README +
source + deps + env example + migrations). Open the README for install
steps. See `modules/README.md` for the shelf contract.

## Conventions

See [AGENTS.md](./AGENTS.md). `CLAUDE.md` aliases to it.

## Stack

Next.js 16.2.6 · React 19.2.4 · TypeScript 5 · Tailwind v4 · Better-Auth
1.6.11 · Drizzle ORM 0.45.2 · Neon serverless 1.1.0 · Zod 4 · Vitest 4

## License

MIT (set at publish time).
```

- [ ] **Step 4: `plans/README.md`**

```markdown
# Plans

Non-trivial work in this repo starts with a plan here.

- Use `_template.md` (markdown) or `_template.html` (printable) as the starting point.
- File naming: `NNN-<slug>.md`, where `NNN` is a zero-padded sequence number.
- Plans are living documents: when you complete a checklist item, update the file
  in the same turn. Don't wait for someone to ask.
- See AGENTS.md §3 for the working rules around plans.

Spec → plan flow:
1. Brainstorm produces a spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
2. The `superpowers:writing-plans` skill turns the spec into an executable plan at
   `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`.
3. Tactical follow-ups live here in `plans/`.
```

- [ ] **Step 5: `plans/_template.md`**

````markdown
# <NNN> — <Title>

**Status:** draft | in-progress | done | abandoned
**Owner:** <name>
**Last updated:** YYYY-MM-DD

## Goal

One sentence. What does "done" look like?

## Why

Context the reader needs to evaluate the plan.

## Approach

2–3 sentences. The shape of the solution.

## Tasks

### Task 1: <name>

- [ ] **Step 1:** …
- [ ] **Step 2:** …

### Task 2: <name>

- [ ] **Step 1:** …

## Acceptance

- [ ] <observable check>
- [ ] <observable check>

## Risks / open questions

- …
````

- [ ] **Step 6: `plans/_template.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Plan: &lt;Title&gt;</title>
    <style>
      body { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; }
      h1, h2, h3 { margin-top: 1.5em; }
      code, pre { font: 13px/1.4 ui-monospace, monospace; }
      pre { background: #f5f5f5; padding: 0.75rem; border-radius: 4px; overflow-x: auto; }
      ul { padding-left: 1.25rem; }
      input[type="checkbox"] { margin-right: 0.5rem; }
    </style>
  </head>
  <body>
    <h1>&lt;NNN&gt; — &lt;Title&gt;</h1>
    <p><strong>Status:</strong> draft · <strong>Owner:</strong> &lt;name&gt; · <strong>Last updated:</strong> YYYY-MM-DD</p>
    <h2>Goal</h2>
    <p>One sentence.</p>
    <h2>Tasks</h2>
    <h3>Task 1: &lt;name&gt;</h3>
    <ul>
      <li><input type="checkbox" disabled /> Step 1</li>
      <li><input type="checkbox" disabled /> Step 2</li>
    </ul>
    <h2>Acceptance</h2>
    <ul>
      <li><input type="checkbox" disabled /> &lt;observable check&gt;</li>
    </ul>
  </body>
</html>
```

- [ ] **Step 7: `docs/_status-template.md`**

```markdown
---
status: active | paused | shipped | dropped
owner: <name>
last-updated: YYYY-MM-DD
---

# <Topic>

## Context

Why this exists; what problem it addresses.

## Decisions

- 2026-XX-XX: <decision> — <one-line reason>

## Open questions

- <question>

## Links

- Spec: `docs/superpowers/specs/…`
- Plan: `docs/superpowers/plans/…`
```

- [ ] **Step 8: `docs/superpowers/specs/.gitkeep` and `docs/superpowers/plans/.gitkeep`**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
touch docs/superpowers/specs/.gitkeep docs/superpowers/plans/.gitkeep
```

(Spec and plan files already exist in these directories from the
brainstorm; this just guarantees the directories themselves are tracked.)

- [ ] **Step 9: `.github/template-cleanup.yml`**

```yaml
# Runs ONCE on the first commit to a repo created via "Use this template".
# Removes seed content the template creator left behind.
name: Template cleanup
on:
  push:
    branches: [main]

jobs:
  cleanup:
    if: ${{ github.run_number == 1 && github.event.head_commit.message == 'Initial commit' }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - name: Remove seed content
        run: |
          rm -f docs/brainstorm-handoff-*.md
          rm -f docs/superpowers/specs/2026-05-22-agenticbuilder-design.md
          rm -f docs/superpowers/plans/2026-05-22-agenticbuilder-trunk.md
          rm -f .github/template-cleanup.yml
      - name: Commit cleanup
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git diff --cached --quiet || git commit -m "chore: template cleanup"
          git push
```

- [ ] **Step 10: Commit**

```bash
git add AGENTS.md CLAUDE.md README.md plans/ docs/ .github/
git commit -m "docs: AGENTS.md, README, plans/docs templates, template-cleanup action"
```

---

## Task 6: Env validation + utils (with tests)

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/utils.ts`
- Test: `src/lib/env.test.ts`
- Test: `src/lib/utils.test.ts`

- [ ] **Step 1: Write failing test — `src/lib/env.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("env schema", () => {
  it("parses a valid env object", async () => {
    const { parseEnv } = await import("./env");
    const result = parseEnv({
      DATABASE_URL: "postgres://u:p@h/d",
      BETTER_AUTH_SECRET: "x".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      OWNER_EMAIL: "owner@example.com",
    });
    expect(result.DATABASE_URL).toBe("postgres://u:p@h/d");
    expect(result.OWNER_EMAIL).toBe("owner@example.com");
  });

  it("throws when DATABASE_URL is missing", async () => {
    const { parseEnv } = await import("./env");
    expect(() =>
      parseEnv({
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
        OWNER_EMAIL: "owner@example.com",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("throws when BETTER_AUTH_SECRET is too short", async () => {
    const { parseEnv } = await import("./env");
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgres://u:p@h/d",
        BETTER_AUTH_SECRET: "tooshort",
        BETTER_AUTH_URL: "http://localhost:3000",
        OWNER_EMAIL: "owner@example.com",
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("rejects an invalid OWNER_EMAIL", async () => {
    const { parseEnv } = await import("./env");
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgres://u:p@h/d",
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
        OWNER_EMAIL: "not-an-email",
      }),
    ).toThrow(/OWNER_EMAIL/);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test -- src/lib/env.test.ts
```

Expected: FAIL — module `./env` doesn't exist.

- [ ] **Step 3: Implement `src/lib/env.ts`**

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  OWNER_EMAIL: z.string().email("OWNER_EMAIL must be a valid email"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${formatted}`);
  }
  return result.data;
}

export const env: Env = parseEnv(process.env);
```

- [ ] **Step 4: Run env tests — expect pass**

```bash
npm test -- src/lib/env.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Write failing test — `src/lib/utils.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
```

- [ ] **Step 6: Run test — expect failure**

```bash
npm test -- src/lib/utils.test.ts
```

Expected: FAIL — module `./utils` doesn't exist.

- [ ] **Step 7: Implement `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 8: Run utils tests — expect pass**

```bash
npm test
```

Expected: all tests pass (smoke + env + utils = 9 tests).

- [ ] **Step 9: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts src/lib/utils.ts src/lib/utils.test.ts
git commit -m "feat(lib): add zod-validated env + cn() utility, with unit tests"
```

---

## Task 7: DB client + schema + drizzle.config

**Files:**
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/schema.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: `src/lib/db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export type Db = typeof db;
```

- [ ] **Step 2: `src/lib/db/schema.ts`**

```ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────────────────────────
// Better-Auth core tables (names + column shapes match Better-Auth's
// Drizzle adapter expectations as of v1.6.11).
// ──────────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ──────────────────────────────────────────────────────────────────
// Demo feature — notes
// ──────────────────────────────────────────────────────────────────

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byUserCreated: index("notes_by_user_created_idx").on(t.userId, t.createdAt),
  }),
);

export const userRelations = relations(user, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(user, { fields: [notes.userId], references: [user.id] }),
}));

export type User = typeof user.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
```

- [ ] **Step 3: `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  // Allow drizzle-kit to run for codegen (`db:generate`) without DATABASE_URL,
  // but `db:migrate` requires it and will fail with a clearer error from
  // drizzle-kit if it isn't set.
  console.warn("drizzle.config: DATABASE_URL not set (.env.local missing or empty).");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl ?? "" },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 4: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Verify `drizzle-kit generate` runs (does not require live DB)**

```bash
npm run db:generate
```

Expected: creates `drizzle/migrations/0000_*.sql` and `drizzle/migrations/meta/_journal.json`. (If it complains about `.env.local` missing, that's OK — the file content itself is generated from the schema.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/ drizzle.config.ts drizzle/
git commit -m "feat(db): drizzle client, schema (better-auth + notes), initial migration"
```

---

## Task 8: DB queries

**Files:**
- Create: `src/lib/db/queries.ts`

- [ ] **Step 1: `src/lib/db/queries.ts`**

```ts
import { eq, desc, and } from "drizzle-orm";
import { db } from "./client";
import { notes, user, type Note, type User } from "./schema";

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0];
}

export async function listNotesForUser(userId: string): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt));
}

export async function getNoteForUser(
  noteId: string,
  userId: string,
): Promise<Note | undefined> {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function createNote(input: {
  id: string;
  userId: string;
  title: string;
  body: string;
}): Promise<Note> {
  const [row] = await db.insert(notes).values(input).returning();
  return row;
}

export async function updateNoteForUser(
  noteId: string,
  userId: string,
  patch: { title?: string; body?: string },
): Promise<Note | undefined> {
  const [row] = await db
    .update(notes)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return row;
}

export async function deleteNoteForUser(
  noteId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return rows.length > 0;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/queries.ts
git commit -m "feat(db): typed query helpers for user + notes"
```

---

## Task 9: Better-Auth wiring (server, client, route handler)

**Files:**
- Create: `src/lib/auth/server.ts`
- Create: `src/lib/auth/client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: `src/lib/auth/server.ts`**

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh once per day
  },
});

export type Auth = typeof auth;
```

- [ ] **Step 2: `src/lib/auth/client.ts`**

```ts
"use client";

import { createAuthClient } from "better-auth/react";
import { env as _env } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: _env.BETTER_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

- [ ] **Step 3: `src/app/api/auth/[...all]/route.ts`**

```ts
import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/ src/app/api/auth/
git commit -m "feat(auth): wire Better-Auth (server, react client, route handler)"
```

---

## Task 10: Proxy middleware

**Files:**
- Create: `proxy.ts`

- [ ] **Step 1: `proxy.ts` (Next.js 16 middleware at repo root)**

```ts
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/notes"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // Better-Auth's session cookie is `better-auth.session_token` in dev and
  // `__Secure-better-auth.session_token` in prod (HTTPS). Presence is a
  // cheap gate; full validation happens in Server Components / Server
  // Actions via auth.api.getSession().
  const hasSession =
    req.cookies.has("better-auth.session_token") ||
    req.cookies.has("__Secure-better-auth.session_token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*"],
};
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add Next.js 16 proxy.ts gating (app) routes"
```

---

## Task 11: UI primitives (button, input, label, card)

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/card.tsx`

- [ ] **Step 1: `src/components/ui/button.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
  ghost:
    "bg-transparent text-neutral-900 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", size = "md", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
```

- [ ] **Step 2: `src/components/ui/input.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm",
        "placeholder:text-neutral-500",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-neutral-700 dark:focus-visible:outline-white",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 3: `src/components/ui/label.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 4: `src/components/ui/card.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm",
        "dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex items-center", className)} {...props} />;
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): minimal Tailwind primitives (button, input, label, card)"
```

---

## Task 12: Root layout + public landing

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenticBuilder",
  description: "Lean Next.js + Better-Auth + Drizzle quickstart.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">AgenticBuilder</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          A lean Next.js 16 quickstart. Auth, DB, and a working notes demo —
          modules optional.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button>Get started</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat(app): root layout + public landing page"
```

---

## Task 13: Auth pages (login, signup, reset)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/reset/page.tsx`

- [ ] **Step 1: `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      {children}
    </main>
  );
}
```

- [ ] **Step 2: `src/app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn.email({ email, password });
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? "Sign in failed.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <Link href="/reset" className="underline">Forgot password?</Link>
            {" · "}
            <Link href="/signup" className="underline">Create an account</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: `src/app/(auth)/signup/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signUp.email({ name, email, password });
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? "Sign up failed.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Get started in 30 seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password (min 8 chars)</Label>
            <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </Button>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: `src/app/(auth)/reset/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ResetPage() {
  // Password reset flow ships with the email-resend module (Plan B), which
  // wires Better-Auth's email-verification hook. Until then this is a stub.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Password reset by email lands with the <code>email-resend</code> module.
          For now, contact the project owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className="text-sm underline">← Back to sign in</Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)"
git commit -m "feat(auth): add login, signup, reset pages wired to better-auth client"
```

---

## Task 14: Protected (app) layout + dashboard

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/_components/Navbar.tsx`
- Create: `src/app/(app)/_components/SignOutButton.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: `src/app/(app)/_components/SignOutButton.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
```

- [ ] **Step 2: `src/app/(app)/_components/Navbar.tsx`**

```tsx
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export function Navbar({ userName }: { userName: string }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-semibold">AgenticBuilder</Link>
          <Link href="/notes" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">Notes</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">{userName}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: `src/app/(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { Navbar } from "./_components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <Navbar userName={session.user.name} />
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </>
  );
}
```

- [ ] **Step 4: `src/app/(app)/dashboard/page.tsx`**

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Layout already redirects when null; this assertion is just for the types.
  const userName = session?.user.name ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {userName}.</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          You're signed in. Try the notes demo to see how features are built in this stack.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notes (demo feature)</CardTitle>
          <CardDescription>The reference feature — every pattern lives here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/notes">
            <Button>Open notes</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/layout.tsx" "src/app/(app)/_components" "src/app/(app)/dashboard"
git commit -m "feat(app): protected layout, navbar, dashboard"
```

---

## Task 15: Notes demo — actions, pages, components, error/loading, README

**Files:**
- Create: `src/app/(app)/notes/_actions.ts`
- Create: `src/app/(app)/notes/_components/NoteList.tsx`
- Create: `src/app/(app)/notes/_components/NoteForm.tsx`
- Create: `src/app/(app)/notes/_components/DeleteButton.tsx`
- Create: `src/app/(app)/notes/page.tsx`
- Create: `src/app/(app)/notes/new/page.tsx`
- Create: `src/app/(app)/notes/[id]/page.tsx`
- Create: `src/app/(app)/notes/error.tsx`
- Create: `src/app/(app)/notes/loading.tsx`
- Create: `src/app/(app)/notes/README.md`
- Test: `src/app/(app)/notes/_actions.test.ts`

- [ ] **Step 1: `src/app/(app)/notes/_actions.ts`**

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import {
  createNote,
  updateNoteForUser,
  deleteNoteForUser,
} from "@/lib/db/queries";

const noteInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(50_000).default(""),
});

export type NoteActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session.user.id;
}

export async function createNoteAction(formData: FormData): Promise<NoteActionResult> {
  const userId = await requireUserId();
  const parsed = noteInputSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const id = nanoid();
  await createNote({ id, userId, title: parsed.data.title, body: parsed.data.body });
  revalidatePath("/notes");
  redirect(`/notes/${id}`);
}

export async function updateNoteAction(
  noteId: string,
  formData: FormData,
): Promise<NoteActionResult> {
  const userId = await requireUserId();
  const parsed = noteInputSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const updated = await updateNoteForUser(noteId, userId, parsed.data);
  if (!updated) {
    return { ok: false, error: "Note not found." };
  }
  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return { ok: true };
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const userId = await requireUserId();
  await deleteNoteForUser(noteId, userId);
  revalidatePath("/notes");
  redirect("/notes");
}

// Re-export the schema for tests.
export const _noteInputSchema = noteInputSchema;
```

- [ ] **Step 2: Test — `src/app/(app)/notes/_actions.test.ts`**

```ts
import { describe, it, expect } from "vitest";

// We only test the input schema here (pure logic). End-to-end action
// behavior with auth + DB is exercised by acceptance (Task 17) and, more
// thoroughly, by the future vitest module's integration suite.

describe("note input schema", () => {
  it("requires a non-empty title", async () => {
    const { _noteInputSchema } = await import("./_actions");
    const r = _noteInputSchema.safeParse({ title: "  ", body: "" });
    expect(r.success).toBe(false);
  });

  it("accepts a valid note", async () => {
    const { _noteInputSchema } = await import("./_actions");
    const r = _noteInputSchema.safeParse({ title: "hello", body: "" });
    expect(r.success).toBe(true);
  });

  it("rejects titles longer than 200 chars", async () => {
    const { _noteInputSchema } = await import("./_actions");
    const r = _noteInputSchema.safeParse({ title: "x".repeat(201), body: "" });
    expect(r.success).toBe(false);
  });

  it("defaults body to empty string when absent", async () => {
    const { _noteInputSchema } = await import("./_actions");
    const r = _noteInputSchema.safeParse({ title: "ok" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body).toBe("");
  });
});
```

- [ ] **Step 3: Run notes test — expect pass**

```bash
npm test -- src/app/
```

Expected: 4 tests pass.

- [ ] **Step 4: `src/app/(app)/notes/_components/NoteForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createNoteAction, updateNoteAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode =
  | { mode: "create" }
  | { mode: "edit"; noteId: string; initialTitle: string; initialBody: string };

export function NoteForm(props: Mode) {
  const router = useRouter();
  const [title, setTitle] = useState(props.mode === "edit" ? props.initialTitle : "");
  const [body, setBody] = useState(props.mode === "edit" ? props.initialBody : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);

    if (props.mode === "create") {
      // createNoteAction redirects on success; if it returns, it failed.
      const res = await createNoteAction(fd);
      if (res && !res.ok) {
        setError(res.error);
        setPending(false);
      }
      return;
    }

    const res = await updateNoteAction(props.noteId, fd);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={10}
          className="flex w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-700 dark:focus-visible:outline-white"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : props.mode === "create" ? "Create note" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: `src/app/(app)/notes/_components/DeleteButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { deleteNoteAction } from "../_actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ noteId }: { noteId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Sure?</span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await deleteNoteAction(noteId);
        }}
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: `src/app/(app)/notes/_components/NoteList.tsx`**

```tsx
import Link from "next/link";
import type { Note } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <Card>
        <div className="space-y-3 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            No notes yet. Notes are the demo feature — write one to see the full
            create / edit / delete loop in action.
          </p>
          <Link href="/notes/new">
            <Button>Create your first note</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {notes.map((n) => (
        <li key={n.id}>
          <Link
            href={`/notes/${n.id}`}
            className="flex flex-col gap-1 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <span className="font-medium">{n.title}</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {n.updatedAt.toLocaleString()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 7: `src/app/(app)/notes/page.tsx`**

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { listNotesForUser } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { NoteList } from "./_components/NoteList";

export default async function NotesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Layout already guards, but TS doesn't know that.
  const userId = session!.user.id;
  const notes = await listNotesForUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Link href="/notes/new">
          <Button>New note</Button>
        </Link>
      </div>
      <NoteList notes={notes} />
    </div>
  );
}
```

- [ ] **Step 8: `src/app/(app)/notes/new/page.tsx`**

```tsx
import Link from "next/link";
import { NoteForm } from "../_components/NoteForm";

export default function NewNotePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/notes" className="text-sm underline">
          ← Back to notes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New note</h1>
      </div>
      <NoteForm mode="create" />
    </div>
  );
}
```

- [ ] **Step 9: `src/app/(app)/notes/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { getNoteForUser } from "@/lib/db/queries";
import { NoteForm } from "../_components/NoteForm";
import { DeleteButton } from "../_components/DeleteButton";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const note = await getNoteForUser(id, session!.user.id);
  if (!note) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <div>
        <Link href="/notes" className="text-sm underline">
          ← Back to notes
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{note.title}</h1>
          <DeleteButton noteId={note.id} />
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Last edited {note.updatedAt.toLocaleString()}
        </p>
      </div>
      <NoteForm
        mode="edit"
        noteId={note.id}
        initialTitle={note.title}
        initialBody={note.body}
      />
    </div>
  );
}
```

- [ ] **Step 10: `src/app/(app)/notes/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("notes error boundary:", error);
  }, [error]);

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong loading notes.</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {error.message || "Unknown error."}
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: `src/app/(app)/notes/loading.tsx`**

```tsx
export default function NotesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-24 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
```

- [ ] **Step 12: `src/app/(app)/notes/README.md`**

```markdown
# Notes — the demo feature

This is the reference feature for AgenticBuilder. Every pattern a new
feature would need is exercised here exactly once. New contributors: read
this folder before adding features of your own.

## What each file teaches

| File | Pattern |
|---|---|
| `../../../lib/db/schema.ts` (notes table) | Drizzle schema with FK to user, default values, composite index |
| `../../../lib/db/queries.ts` | Typed query helpers (`listNotesForUser`, `getNoteForUser`, `createNote`, `updateNoteForUser`, `deleteNoteForUser`) |
| `_actions.ts` | Server Actions with auth check + zod validation at the boundary; redirects + `revalidatePath` for cache busting |
| `page.tsx` | Server Component list page |
| `new/page.tsx` | Pure Server Component wrapping a client form |
| `[id]/page.tsx` | Dynamic-segment page with `notFound()` for missing rows |
| `_components/NoteForm.tsx` | Client component that calls Server Actions with `FormData` |
| `_components/NoteList.tsx` | Empty-state pattern |
| `_components/DeleteButton.tsx` | Inline confirm pattern (no modal lib) |
| `error.tsx` / `loading.tsx` | Per-route React 19 boundaries |

## What's NOT in here (and why)

- Markdown rendering — would add a dependency for no extra pattern.
- Sharing / collaboration — would require multi-tenancy and a permissions
  pattern not yet in trunk.
- Search — out of scope for the demo; a real feature uses Postgres FTS or
  pg_trgm and lives in its own module.
- Tagging — adds another join table without teaching anything new.

## No-UUIDs rule

`id` is a `nanoid` string but the UI shows the title. If you find yourself
writing a UUID into UI text, the data model is wrong (see AGENTS.md §3).
```

- [ ] **Step 13: Verify typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: both pass, 0 errors.

- [ ] **Step 14: Commit**

```bash
git add "src/app/(app)/notes"
git commit -m "feat(notes): demo feature (list/new/detail, actions, components, README)"
```

---

## Task 16: Module shelf framework — modules/README.md

**Files:**
- Create: `modules/README.md`

- [ ] **Step 1: `modules/README.md`**

````markdown
# AgenticBuilder modules

This folder is a **shelf** of opt-in capabilities. Each `modules/<name>/`
is a self-contained instructions packet: a README with verbatim install
steps, source files to drop into `src/`, declared deps, env keys, and any
DB migrations the module owns. **No codemod scripts** — the README is the
contract.

## Why not codemod scripts?

A codemod is opaque and breaks the moment a host project's file shape
drifts. A README + verbatim diffs is something a human (or the onboarding
skill at `.claude/skills/agenticbuilder-onboarding/`) can follow,
debug, and reverse.

## Folder shape

```
modules/<name>/
├── README.md           ← THE contract
├── src/                ← files copied into src/ during install
├── env.example         ← keys appended to .env.example
├── deps.json           ← { "dependencies": {...}, "devDependencies": {...} }
└── migrations/         ← optional drizzle migrations
```

## Required README structure

Every module's `README.md` MUST contain these H2 sections in this order so
the onboarding skill can parse it deterministically:

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

## The seven modules (planned)

| Module | What it adds | Depends on |
|---|---|---|
| `stripe` | `src/lib/stripe/`, `/api/stripe/webhook`, `/billing` page, separate `subscription` table (FK → `user.id`) | — |
| `ai-sdk` | `src/lib/ai/`, `/api/chat` streaming route, `<Chat>` component, model picker via Vercel AI Gateway | — |
| `blob` | `src/lib/blob.ts`, `/api/upload` signed URL route, `<FileUpload>` component | — |
| `email-resend` | `src/lib/email/`, template dir, `sendEmail()` helper, optional Better-Auth email-verification hook | — |
| `vitest` | Expanded testing scaffold on top of trunk's minimal vitest: integration tests with a real test DB, RSC test helpers, Playwright e2e, CI workflow stub | — |
| `role-gates` | `role` column on `user` (`'user' \| 'admin'`), `requireRole()` server helper, `<RequireRole>` client gate, **owner-bypass keyed on `OWNER_EMAIL`** | — |
| `admin-scaffold` | `(app)/admin/*` routes (users list, role editor) | `role-gates` |

Modules themselves are implemented in **Plan B** (see
`docs/superpowers/plans/`).

## Installing a module manually

1. `cd` to the project root.
2. Open `modules/<name>/README.md` and follow the numbered steps verbatim.
3. After installation, run the **Verify** step.

If you have Claude Code installed, prefer the onboarding skill (Plan C)
which automates this with context about your repo.
````

- [ ] **Step 2: Commit**

```bash
git add modules/README.md
git commit -m "docs(modules): module shelf contract (README structure + planned modules)"
```

---

## Task 17: Acceptance — provision DB, set env, migrate, sign up, use notes

This is the only task that requires a live Neon Postgres connection. If
the engineer doesn't have a Neon URL yet, pause here, create one at
`console.neon.tech` (free tier is fine), and resume.

**Files (created at runtime, not committed):**
- Create: `.env.local`

- [ ] **Step 1: Generate `BETTER_AUTH_SECRET`**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-char hex string for the next step.

- [ ] **Step 2: Create `.env.local`**

Copy `.env.example` to `.env.local` and fill in the real values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
DATABASE_URL="postgres://...neon.tech/...?sslmode=require"
BETTER_AUTH_SECRET="<paste the 64-char hex from Step 1>"
BETTER_AUTH_URL="http://localhost:3000"
OWNER_EMAIL="your-real-email@example.com"
```

- [ ] **Step 3: Run migrations against the live DB**

```bash
npm run db:migrate
```

Expected: applies migrations from `drizzle/migrations/`. Output mentions
`Created table user`, `session`, `account`, `verification`, `notes`. If
this fails with a connection error, fix `DATABASE_URL` and retry.

- [ ] **Step 4: Start the dev server**

```bash
npm run dev
```

Expected: Next.js dev server starts and reports `ready` on
`http://localhost:3000`. Keep this terminal open.

- [ ] **Step 5: End-to-end manual verification**

In a browser:

1. Open `http://localhost:3000` — see the landing page with "Get started" and "Sign in" buttons.
2. Click **Get started** → `/signup` form appears.
3. Sign up with name, email, password (8+ chars).
4. You should be redirected to `/dashboard` and the navbar shows your name.
5. Click **Notes** in the navbar → empty-state card with "Create your first note" CTA.
6. Click the CTA → `/notes/new` shows the form.
7. Enter a title and body, click **Create note** → redirected to `/notes/<id>` showing the new note.
8. Edit the body, click **Save changes** → page refreshes with the new body.
9. Click **Delete** → confirm → redirected back to `/notes` with the list now empty.
10. Sign out from the navbar → you land on `/` (the landing page).
11. Navigate directly to `http://localhost:3000/notes` while signed out → you're redirected to `/login` (this verifies the proxy gate).

Expected: every step works as described.

- [ ] **Step 6: Run the full verification suite**

In a second terminal (leave dev server running, or stop it first):

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all four pass cleanly. (`build` is the strongest signal — it
exercises the full RSC graph + Tailwind v4 + TypeScript paths.)

- [ ] **Step 7: Commit any final fixes**

If any verification step revealed an issue, fix it (typically a typo,
missing import, or wrong env key), then:

```bash
git add -A
git commit -m "fix: address acceptance verification issues"
```

If nothing needed fixing, skip this step.

- [ ] **Step 8: Tag v0.1.0**

```bash
git tag -a v0.1.0 -m "AgenticBuilder v0.1 — runnable trunk + module shelf framework (no modules)"
```

(Pushing to a remote is out of scope for this plan; do that when you're
ready to publish the template.)

---

## Acceptance — full plan

- [ ] `npm install` completes from a fresh clone.
- [ ] With only `DATABASE_URL` and `BETTER_AUTH_SECRET` set, `npm run db:migrate && npm run dev` works.
- [ ] A user can sign up, sign in, sign out.
- [ ] A signed-in user can create / view / edit / delete notes.
- [ ] An anonymous request to `/notes` or `/dashboard` redirects to `/login`.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] `AGENTS.md`, `CLAUDE.md`, `modules/README.md`, `plans/_template.md`, `docs/_status-template.md` are present and accurate.
- [ ] `.gitignore` excludes `.claude/worktrees/`.
- [ ] `.github/template-cleanup.yml` exists.
- [ ] `git tag v0.1.0` exists on the final commit.

## Out of scope (deferred to Plans B + C)

- The seven actual modules (Plan B).
- The onboarding skill at `.claude/skills/agenticbuilder-onboarding/` (Plan C).
- Production deploy on Vercel (engineer can run `vercel deploy` ad-hoc; not part of trunk plan).
- Replacing the password-reset stub at `(auth)/reset/page.tsx` with a real
  flow (lands with the `email-resend` module).
