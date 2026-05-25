# CHANGELOG

## v0.3.1 — 2026-05-25

Polish PR addressing friction surfaced by the apptracker smoketest
(see `apptracker/docs/onboarding-smoketest-notes.md`) and deferred
items from Plan C Task 7's self-test.

### Skill improvements

- STEP 4: pre-flight Neon project count via Neon MCP; offer
  branch-on-existing-project fallback when near Hobby plan limit (F5).
- STEP 6: explicit secret/non-secret key list to prevent secrets from
  being pushed via `vercel env add` (deferred item).
- Re-entrance: natural-language `--force` detection ("re-run from
  scratch", "start over", etc.) — Claude Code skills don't take argv
  so NL is the only signal (deferred item).
- Resume-from-partial onboarding: marker now tracks per-step progress
  so retries skip already-completed steps (deferred item).
- Rename checklist: extended with `package-lock.json`, `AGENTS.md`,
  `notes/README.md`. Final verification grep added (F4).

### Docs

- AGENTS.md: client/server constants pattern (G1) +
  drizzle-kit non-interactive workaround (G2).
- `modules/email-resend/README.md`: "Known limitations" — Resend
  sandbox + session staleness (G3).

### Cleanup

- DROPPED `.github/workflows/template-cleanup.yml` — never fired in
  practice; the skill's STEP 7 cleanup is the canonical path (F1).
- F2 (gate `.github/workflows/test.yml` behind onboarded marker)
  **attempted and reverted**. `hashFiles('.agenticbuilder-onboarded')`
  at job-level `if:` evaluates BEFORE `actions/checkout`, so the
  workspace is empty and the file is never seen — all jobs were
  skipped which GitHub reports as "workflow file issue". Deferred to
  v0.4.0 to find a working pattern (likely a step-level checkout +
  conditional + neutral-exit). Fresh template clones will get one
  failure email from the first push; that's acceptable for now since
  the onboarding skill walks the user through setting
  `DATABASE_URL_TEST` immediately after.
- The `.agenticbuilder-onboarded` self-marker on the canonical repo
  stays (it's still meaningful — STEP 1 of the skill checks it, and
  a future v0.4.0 gating pattern will use it).
- `tsconfig.json`: adopt Next.js 16's preferred shape (`jsx: react-jsx`,
  `.next/dev/types` include) to stop the auto-rewrite-then-revert dance.

### Bumped

- `package.json` version: `0.3.0` → `0.3.1`.

### Deferred to v0.4.0

- **F3 + F6 lean refactor.** v0.3.0+ ships with all 6 modules INSTALLED
  in the trunk. The skill's STEP 5 was designed for module-ADD (lean
  trunk), so the design and the artifact don't match. Two paths
  forward, decision deferred to v0.4.0:
  - Revert Plan B's trunk installs; modules stay as
    `modules/<name>/` artifacts only.
  - Reframe STEP 5 as module-REMOVE.
  In the meantime, users wanting LEAN should clone at `v0.1.0` tag
  and run the skill from there (the skill works either way; STEP 5's
  module-ADD path lights up against a lean trunk).
