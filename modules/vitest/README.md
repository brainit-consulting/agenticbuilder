# vitest

## What this gives you

Expanded testing scaffold on top of the trunk's bare-bones vitest setup.
Adds a second vitest project (`integration`) that runs real Drizzle queries
against a static Neon `test` branch with per-test transactional rollback, a
factories module for spinning up users + notes, a Playwright e2e harness
configured for Chromium + iPhone 13, and a three-job GitHub Actions
workflow (unit / integration / e2e) that runs on every pull request and
push to `main`.

The integration runner uses `drizzle-orm/neon-serverless` (WebSocket
transport) — the only Neon transport that supports SQL transactions, which
is how each test rolls back so the shared `test` branch stays clean across
runs.

## Prerequisites

- A Neon project with an existing `main` branch. **No external CI service
  beyond GitHub Actions** is required.
- A static `test` branch on the same Neon project, created via the Neon
  Console → Branches → New branch (parent: `main`). The branch URL is
  reused across CI runs; the migrations already ran against `main` get
  inherited at branch-create time. Re-run `npm run db:migrate` against
  the test branch URL whenever you ship schema changes.
- Node 22+ locally and in CI (the `Pool` driver uses the native
  `WebSocket` global; if you must run on Node <22, install `ws` and set
  `neonConfig.webSocketConstructor`).
- Playwright browsers are NOT downloaded at `npm install`. Run
  `npx playwright install --with-deps chromium` before your first local
  `npm run test:e2e`. CI installs them in the `e2e` job.

## Environment variables

| Key                 | Required          | Where to get it                                                                                                | Example                                       |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL_TEST` | yes (integration) | Neon Console → your project → Branches → create `test` branch → Connection string → **Pooled connection**      | `postgresql://neondb_owner:...@ep-...-pooler.../neondb?sslmode=require` |
| `E2E_BASE_URL`      | no                | Set to point Playwright at a remote preview deploy instead of `http://localhost:3010`                          | `https://agenticbuilder-pr-42.vercel.app`    |

The test runner does NOT use `NEON_API_KEY` — the branch is created once
out-of-band, then reused. Tests roll back their writes so concurrent CI
runs against the same branch are safe (within reason).

## Install

1. `npm install -D @playwright/test@^1.50.0` (no runtime deps).

2. Copy the test scaffold files into `src/`:

   ```bash
   mkdir -p src/test/factories e2e .github/workflows
   cp modules/vitest/src/test/setup-integration.ts src/test/setup-integration.ts
   cp modules/vitest/src/test/db.ts src/test/db.ts
   cp modules/vitest/src/test/factories/index.ts src/test/factories/index.ts
   cp modules/vitest/src/test/example.integration.test.ts src/test/example.integration.test.ts
   cp modules/vitest/e2e/auth.spec.ts e2e/auth.spec.ts
   cp modules/vitest/playwright.config.ts playwright.config.ts
   cp modules/vitest/.github/workflows/test.yml .github/workflows/test.yml
   ```

3. **Replace** `vitest.config.ts` at the repo root with
   `modules/vitest/vitest.config.ts`. The new config defines two projects
   (`unit` and `integration`); `npm test` runs both.

4. Patch `package.json` — add three test scripts and the dev dep:

   ```diff
      "scripts": {
        ...
        "test": "vitest run --reporter=default",
   +    "test:unit": "vitest run --project unit --reporter=default",
   +    "test:integration": "vitest run --project integration --reporter=default",
   +    "test:e2e": "playwright test",
        "test:watch": "vitest",
        ...
      },
      "devDependencies": {
        ...
   +    "@playwright/test": "^1.50.0",
        ...
      }
   ```

5. Add `DATABASE_URL_TEST` from `modules/vitest/env.example` to your
   `.env.local`. Use the real pooled URL from the Neon Console for the
   `test` branch.

6. Add `DATABASE_URL_TEST` to your GitHub repo:
   Settings → Secrets and variables → Actions → New repository secret.
   Paste the same pooled URL. The workflow file references
   `secrets.DATABASE_URL_TEST`.

## Verify

1. `npm run test:unit` — the existing unit suite (env schema, utils, zod
   schemas, smoke) passes. No DB required.

2. `npm run test:integration` — connects to the Neon `test` branch, runs
   the sample integration test in a transaction, rolls back. Should print
   `1 passed` and no rows should remain on the branch (verify in the
   Neon Console SQL Editor: `SELECT count(*) FROM "user";` should be
   unchanged before and after the run).

3. `npm test` — runs BOTH projects. Total test count includes the existing
   13 unit tests plus the 1 integration test (and any new ones you add).

4. `npm run test:e2e` (optional — heavier, requires browser binaries) —
   `npx playwright install --with-deps chromium` once, then run
   `npm run test:e2e`. Playwright boots `next dev -p 3010`, drives the
   auth flow, asserts the user lands on a known surface
   (`/login` with `?next=/dashboard`, `/dashboard`, or `/signup`).

5. Push a branch and open a PR — the `test` workflow runs three jobs:
   `unit`, `integration` (uses the `DATABASE_URL_TEST` secret), and `e2e`.
   All three pass.

## Uninstall

1. Remove the test scaffold files:

   ```bash
   rm -rf src/test/setup-integration.ts src/test/db.ts \
          src/test/factories src/test/example.integration.test.ts \
          e2e playwright.config.ts .github/workflows/test.yml
   ```

2. Revert `vitest.config.ts` to the trunk's single-project version:

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
       alias: { "@": resolve(__dirname, "./src") },
     },
   });
   ```

3. Reverse the `package.json` diff: drop `test:unit`, `test:integration`,
   `test:e2e`, and `@playwright/test`.

4. `npm install` to prune `@playwright/test`. If you ran
   `npx playwright install`, also delete its cache:
   `npx playwright uninstall --all` (or just delete `~/.cache/ms-playwright`).

5. Remove `DATABASE_URL_TEST` from `.env.local` and from the GitHub repo's
   Actions secrets.

6. The Neon `test` branch itself is **not** deleted by this uninstall.
   Drop it from the Neon Console if you no longer want it.
