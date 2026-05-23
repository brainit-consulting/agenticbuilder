---
name: agenticbuilder-onboarding
description: >-
  Onboard a fresh AgenticBuilder clone: rename the project, set up the
  database and auth secret, choose opt-in modules from modules/, link
  Vercel, and write the .agenticbuilder-onboarded marker. Use whenever
  the user says "set up", "onboard", "configure", "rename project",
  "install module", or whenever the .agenticbuilder-onboarded marker
  file is ABSENT at the repo root and the package.json name is still
  "agenticbuilder".
---

# AgenticBuilder onboarding

You are running inside a fresh (or re-entrant) AgenticBuilder clone.
Walk the developer through the seven-step onboarding flow defined
below. Stop on any failure; never echo a secret value back to the chat;
never run destructive ops without explicit confirmation.

## Anti-patterns (read these first; they apply to every step)

1. **Never echo a secret.** Write secrets to `.env.local` or pipe them
   via stdin to `vercel env add`. Never include `BETTER_AUTH_SECRET`,
   `DATABASE_URL`, or any module secret value in a chat response, code
   block, or status message.
2. **Never run destructive ops without explicit confirmation.** `rm`,
   `git reset --hard`, `git clean -fd`, and any non-undo-able operation
   require the user to type the literal word `yes` in response to a
   one-line preview. "Sure" / "ok" / "go ahead" do not count.
3. **Halt on failure.** Any non-zero exit code from `npm`, `vercel`,
   `node`, or `drizzle-kit` stops the flow. Print stderr verbatim and
   ask the user what to do. Do not retry, skip, or work around.
4. **Env writes go through `src/lib/env.ts` first.** When a module
   adds an env key, apply the zod-schema diff in `src/lib/env.ts`
   BEFORE writing the value into `.env.local`. This guarantees
   `npm run dev` either succeeds or fails with a precise zod error.
5. **Module mutations come from the README, not from this skill.** If
   `modules/<name>/README.md` says "Add line X to src/proxy.ts", apply
   that diff verbatim. If the README is wrong, fix the README — not
   this skill.

## STEP 1 — Detect state

Read `.agenticbuilder-onboarded` at the repo root.

- **If present:** parse `installed_modules:`. Greet the user with:
  > "You're already onboarded. Want to add more modules?"
  On `yes`, skip to STEP 5 with the catalog filtered to NOT-installed
  modules. On `no`, exit quietly.

- **If absent:** check `package.json#name`.
  - If it equals `"agenticbuilder"`, proceed to STEP 2.
  - Otherwise, warn: "This doesn't look like a fresh template clone
    (package name is already <X>). Continue anyway? (yes/no)"

## STEP 2 — Project rename

Ask the user for two names:

1. kebab-case slug for `package.json#name` and `vercel.json` (suggest
   the current directory's basename, lowercased and hyphenated).
2. Title Case display name for `README.md` and metadata.

Read `@references/rename-checklist.md`. For each entry under "Files to
rewrite", apply the rename. Do NOT touch any file listed under "Files
to LEAVE ALONE".

Offer:
> "Want me to `git init && git add -A && git commit -m 'chore: initial
> commit from agenticbuilder template'`? (yes/no)"

Only run on `yes`.

**Success criterion:** every file in the rename checklist no longer
contains the literal `agenticbuilder` (case-insensitive), EXCEPT files
under `modules/`, `.claude/skills/`, `docs/superpowers/`, and the
"leave alone" list.

## STEP 3 — Owner email

Verify `src/lib/env.ts` has `OWNER_EMAIL` in its zod schema (trunk
ships with it). If missing, halt and ask the user to restore the trunk
env schema before continuing.

Ask: "What's your OWNER_EMAIL? (default: `$(git config user.email)`)"

Append to `.env.local`:

```
OWNER_EMAIL="<value>"
```

If `.env.local` doesn't exist yet, create it by copying `.env.example`
first, then write the value.

## STEP 4 — Database + auth secret

### 4a — DATABASE_URL

Ask:
> "How do you want to set up Postgres?
>  1. Paste an existing Neon URL
>  2. Create a new Neon project (open https://console.neon.tech)
>  3. Provision via Vercel Marketplace"

On choice 3, run (stop on any non-zero exit):

```bash
vercel link
vercel marketplace add neon
vercel env pull .env.local
```

On choices 1 or 2, prompt the user to paste the Neon connection string
(starts with `postgres://`). Write it to `.env.local` as
`DATABASE_URL="<value>"` without echoing the value back.

### 4b — BETTER_AUTH_SECRET

Generate:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Capture stdout. Append `BETTER_AUTH_SECRET="<hex>"` to `.env.local`.
**Do not** print the hex back to the chat.

### 4c — BETTER_AUTH_URL

Append `BETTER_AUTH_URL="http://localhost:3000"` to `.env.local`.

### 4d — Install + migrate

```bash
test -d node_modules || npm install
npm run db:generate
npm run db:migrate
```

If `db:migrate` fails, halt and surface stderr.

### 4e — Verify sign-up

Tell the user:
> "I'll start the dev server. In a browser:
>  1. Open http://localhost:3000
>  2. Click Get started, sign up with a test account
>  3. Confirm you land on /dashboard
>  4. Stop the dev server (Ctrl+C) and reply 'verified' or 'failed: <reason>'"

Run `npm run dev` in the foreground. Wait for the user's response. On
`failed`, halt. On `verified`, proceed.

## STEP 5 — Module selection

Read `@references/module-catalog.md`. Render it as a numbered
checklist. If `.agenticbuilder-onboarded` exists and lists installed
modules, filter them out and rename the section header to "Add more
modules".

Ask: "Pick any subset by number (e.g., `1, 3, 6`) or `none`."

Topologically sort the chosen modules using each module's
`Prerequisites:` line from the catalog (e.g., admin-scaffold comes
after role-gates).

For each module, in order, dispatch to
`@scripts/apply-module.md` with the module name. If any module fails,
halt and report which one — do not proceed to the next.

## STEP 6 — Vercel link (optional)

Ask: "Link this repo to a Vercel project now? (yes/later)"

On `yes`:

```bash
vercel link
```

Then for each NON-secret key in `.env.local` (`BETTER_AUTH_URL`,
`OWNER_EMAIL`), ask the user whether to push it:

```bash
echo "<value>" | vercel env add <KEY> production
```

For SECRET keys (`DATABASE_URL`, `BETTER_AUTH_SECRET`, any module
secrets), print the list and instruct the user to paste them into the
Vercel dashboard directly:
> "Paste these into https://vercel.com/<team>/<project>/settings/environment-variables :
>  - DATABASE_URL
>  - BETTER_AUTH_SECRET
>  - <module secrets>"

(In a re-entrant run reaching STEP 5 from the marker, skip STEP 6.)

## STEP 7 — Finalize

Write `.agenticbuilder-onboarded` at repo root:

```
# AgenticBuilder onboarding marker — do not delete.
# Touching this file disables the onboarding skill's auto-greet on next open.
onboarded_at: <ISO 8601 UTC timestamp>
project_name: <kebab-case slug>
project_title: <Title Case name>
installed_modules:
  - <module-1>
  - <module-2>
```

Ask:
> "The brainstorm handoff at `docs/brainstorm-handoff-2026-05-22.md` is
> template-author scratch. Delete it? (type 'yes' to confirm — anything
> else keeps it)"

On literal `yes`, run `rm docs/brainstorm-handoff-*.md`. Otherwise
leave it.

Print:
```bash
git add -A
git commit -m "chore: complete onboarding (<modules>)"
```

(Do NOT run this commit yourself — let the user.)

Print the summary:
> "Onboarding complete.
>  Project: <Title Case> (<kebab-case>)
>  Modules installed: <list, or 'none'>
>  Next: `npm run dev` and open http://localhost:3000
>  To add more modules later, just say 'install module <name>'."

## Re-entrance

`.agenticbuilder-onboarded` is the durable state file.

- After onboarding, the skill auto-greet is suppressed (the marker is
  present, so the auto-trigger condition in the frontmatter is false).
- When the user says "install module <name>" or "add more modules",
  the skill activates, STEP 1 detects the marker, and the flow jumps
  to STEP 5 with the catalog filtered to NOT-installed modules.
- A re-entrant run skips STEPs 2, 3, 4, 6 and only updates
  `installed_modules:` in the marker at STEP 7.
- If the user genuinely wants to start over, they pass `--force`. The
  skill replies: "Re-running from scratch will overwrite your project
  name and re-prompt for all env vars. Are you sure? (type 'yes')".
