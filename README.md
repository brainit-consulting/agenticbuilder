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
