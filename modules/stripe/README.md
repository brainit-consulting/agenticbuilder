# stripe

## What this gives you

Stripe Checkout Sessions for self-serve subscription start and the Stripe Customer Portal for self-serve plan changes/cancellation. Defines three plans (`free` / `pro` / `team`); a `/billing` page lets the signed-in user upgrade. A webhook keeps a local `subscription` table in sync with Stripe so the app can read the current plan without a round-trip. A Better-Auth `user.create.after` hook provisions a Stripe customer + free-tier subscription row for every new signup.

## Prerequisites

- A Stripe account (test mode is enough for dev).
- Three Products created in the Stripe dashboard: **Free** (no recurring price), **Pro** (recurring monthly price, e.g. $20), **Team** (recurring monthly price, e.g. $50). Copy the Pro and Team price IDs.
- The Stripe CLI installed locally for webhook forwarding (`stripe listen`). Without it you can still install the module, but you won't be able to exercise the webhook locally.
- This module assumes the **role-gates** module is already installed (it uses `requireSession()` from `@/lib/auth/roles`). The trunk includes role-gates as of commit `1c834ee`.

## Environment variables

| Key | Required | Where to get it | Example |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | yes | Stripe dashboard → Developers → API keys (test mode) | `sk_test_51Abc…` |
| `STRIPE_WEBHOOK_SECRET` | yes | `stripe listen --forward-to localhost:3010/api/stripe/webhook` prints it; or the dashboard endpoint's signing secret | `whsec_1a2b3c…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes | Stripe dashboard → Developers → API keys (test mode) | `pk_test_51Abc…` |
| `STRIPE_PRICE_PRO` | yes | Stripe dashboard → Products → Pro → recurring price ID | `price_1NxxxPro` |
| `STRIPE_PRICE_TEAM` | yes | Stripe dashboard → Products → Team → recurring price ID | `price_1NxxxTeam` |

## Install

1. `npm install` — `stripe@22.1.1` is already a trunk dependency in `package.json`, so this is a no-op. `deps.json` records the requirement.

2. Add the five Stripe keys to the zod schema in `src/lib/env.ts`:

   ```diff
    const envSchema = z.object({
      DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
      BETTER_AUTH_SECRET: z
        .string()
        .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
      BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
      OWNER_EMAIL: z.string().email("OWNER_EMAIL must be a valid email"),
   +  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
   +  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
   +  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_"),
   +  STRIPE_PRICE_PRO: z.string().startsWith("price_", "STRIPE_PRICE_PRO must start with price_"),
   +  STRIPE_PRICE_TEAM: z.string().startsWith("price_", "STRIPE_PRICE_TEAM must start with price_"),
    });
   ```

3. Add the `subscription` table to `src/lib/db/schema.ts` (after the `notes` table, before `userRelations`):

   ```diff
    export const notes = pgTable(
      "notes",
      {
        // … existing notes columns …
      },
      (t) => ({
        byUserCreated: index("notes_by_user_created_idx").on(t.userId, t.createdAt),
      }),
    );

   +export const subscription = pgTable("subscription", {
   +  id: text("id").primaryKey(),
   +  userId: text("user_id")
   +    .notNull()
   +    .unique()
   +    .references(() => user.id, { onDelete: "cascade" }),
   +  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
   +  stripeSubscriptionId: text("stripe_subscription_id").unique(),
   +  plan: text("plan").notNull().default("free"),
   +  status: text("status").notNull().default("active"),
   +  currentPeriodEnd: timestamp("current_period_end"),
   +  createdAt: timestamp("created_at").notNull().defaultNow(),
   +  updatedAt: timestamp("updated_at").notNull().defaultNow(),
   +});
   +
   -export const userRelations = relations(user, ({ many }) => ({
   +export const userRelations = relations(user, ({ many, one }) => ({
      notes: many(notes),
   +  subscription: one(subscription, { fields: [user.id], references: [subscription.userId] }),
    }));

    export const notesRelations = relations(notes, ({ one }) => ({
      user: one(user, { fields: [notes.userId], references: [user.id] }),
    }));

    export type User = typeof user.$inferSelect;
    export type Note = typeof notes.$inferSelect;
    export type NewNote = typeof notes.$inferInsert;
   +export type Subscription = typeof subscription.$inferSelect;
   ```

4. Add subscription query helpers to `src/lib/db/queries.ts`:

   ```diff
    import { eq, desc, and } from "drizzle-orm";
    import { db } from "./client";
   -import { notes, user, type Note, type User } from "./schema";
   +import { notes, subscription, user, type Note, type Subscription, type User } from "./schema";

    // … existing helpers unchanged …
   +
   +export async function getSubscriptionForUser(userId: string): Promise<Subscription | undefined> {
   +  const rows = await db.select().from(subscription).where(eq(subscription.userId, userId)).limit(1);
   +  return rows[0];
   +}
   +
   +export async function createSubscriptionForUser(input: {
   +  id: string;
   +  userId: string;
   +  stripeCustomerId: string;
   +}): Promise<Subscription> {
   +  const [row] = await db.insert(subscription).values({ ...input, plan: "free", status: "active" }).returning();
   +  return row;
   +}
   +
   +export async function upsertSubscription(input: {
   +  stripeCustomerId: string;
   +  stripeSubscriptionId: string;
   +  plan: string;
   +  status: string;
   +  currentPeriodEnd: Date;
   +}): Promise<void> {
   +  await db.update(subscription)
   +    .set({
   +      stripeSubscriptionId: input.stripeSubscriptionId,
   +      plan: input.plan,
   +      status: input.status,
   +      currentPeriodEnd: input.currentPeriodEnd,
   +      updatedAt: new Date(),
   +    })
   +    .where(eq(subscription.stripeCustomerId, input.stripeCustomerId));
   +}
   +
   +export async function setSubscriptionStatus(
   +  stripeSubscriptionId: string,
   +  patch: { plan: string; status: string; currentPeriodEnd: Date },
   +): Promise<void> {
   +  await db.update(subscription)
   +    .set({ ...patch, updatedAt: new Date() })
   +    .where(eq(subscription.stripeSubscriptionId, stripeSubscriptionId));
   +}
   ```

5. Add an `after` hook in `src/lib/auth/server.ts`'s `databaseHooks.user.create` block to provision a Stripe customer + free-tier subscription row for every new signup. This composes with the role-gates `before` hook already in trunk:

   ```diff
      databaseHooks: {
        user: {
          create: {
            before: async (data) => {
              if (data.email === env.OWNER_EMAIL) {
                return { data: { ...data, role: "admin" } };
              }
              return { data: { ...data, role: "user" } };
            },
   +        after: async (user) => {
   +          const { stripe } = await import("@/lib/stripe/server");
   +          const { createSubscriptionForUser } = await import("@/lib/db/queries");
   +          const { nanoid } = await import("nanoid");
   +          const customer = await stripe.customers.create({
   +            email: user.email,
   +            name: user.name,
   +            metadata: { userId: user.id },
   +          });
   +          await createSubscriptionForUser({
   +            id: nanoid(),
   +            userId: user.id,
   +            stripeCustomerId: customer.id,
   +          });
   +        },
          },
        },
      },
   ```

   Dynamic `await import()` is used so the Stripe SDK isn't loaded on cold start of every request — only when a user actually signs up.

6. Copy the module's source files into `src/`:

   ```bash
   mkdir -p src/lib/stripe \
            "src/app/api/stripe/checkout" \
            "src/app/api/stripe/portal" \
            "src/app/api/stripe/webhook" \
            "src/app/(app)/billing/_components"
   cp modules/stripe/src/lib/stripe/server.ts src/lib/stripe/server.ts
   cp modules/stripe/src/lib/stripe/plans.ts src/lib/stripe/plans.ts
   cp modules/stripe/src/app/api/stripe/checkout/route.ts "src/app/api/stripe/checkout/route.ts"
   cp modules/stripe/src/app/api/stripe/portal/route.ts "src/app/api/stripe/portal/route.ts"
   cp modules/stripe/src/app/api/stripe/webhook/route.ts "src/app/api/stripe/webhook/route.ts"
   cp "modules/stripe/src/app/(app)/billing/page.tsx" "src/app/(app)/billing/page.tsx"
   cp "modules/stripe/src/app/(app)/billing/_components/PlanCard.tsx" "src/app/(app)/billing/_components/PlanCard.tsx"
   ```

7. Append the keys from `modules/stripe/env.example` to `.env.local` (and to `.env.example` for the next contributor). Fill in real test-mode values from the Stripe dashboard.

8. Generate and apply the migration for the new `subscription` table:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

9. Provision Stripe test products (one-time setup, can be skipped if already done):

   1. In the Stripe dashboard (test mode), create three Products: **Free** (no price), **Pro** (recurring monthly), **Team** (recurring monthly).
   2. Copy the Pro and Team **price IDs** (start with `price_`) into `.env.local` as `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM`.
   3. Get a webhook signing secret:
      - **Local dev**: run `stripe listen --forward-to localhost:3010/api/stripe/webhook`. The CLI prints a `whsec_…` value — set this as `STRIPE_WEBHOOK_SECRET` in `.env.local`.
      - **Production**: in the Stripe dashboard, create a webhook endpoint pointing at `https://<your-domain>/api/stripe/webhook`, subscribe it to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`, and copy its signing secret.

## Verify

1. In one terminal: `stripe listen --forward-to localhost:3010/api/stripe/webhook` (keep running).
2. In another terminal: `npx next dev -p 3010`.
3. Sign up as a new user (any email other than `OWNER_EMAIL`).
4. Visit `/billing`. The page shows three plan cards; "Current plan: Free" is displayed.
5. Click "Upgrade to Pro". You're redirected to Stripe Checkout. Use test card `4242 4242 4242 4242` with any future expiry and any 3-digit CVC. Complete checkout.
6. Stripe redirects back to `/billing?status=success`. The `stripe listen` terminal shows webhook delivery for `checkout.session.completed`.
7. Reload `/billing` — "Current plan: Pro" is shown and the "Manage billing in Stripe" button is visible.
8. Click "Manage billing in Stripe" → you're redirected to the Customer Portal. Cancel the subscription there.
9. Return to `/billing`. Within ~5 seconds (after the `customer.subscription.deleted` webhook fires), the current plan reverts to **Free**.
10. `npm run typecheck && npm run lint && npm test && npm run build` all pass.

If any step fails, check the `stripe listen` output for webhook errors, then your dev server logs for handler errors.

## Uninstall

1. Remove the copied source files:

   ```bash
   rm -rf src/lib/stripe \
          "src/app/api/stripe" \
          "src/app/(app)/billing"
   ```

2. Reverse the diff in `src/lib/env.ts` — delete the five Stripe lines from the zod schema.

3. Reverse the diff in `src/lib/db/schema.ts` — delete the `subscription` table, drop the `subscription` field from `userRelations` (and revert `({ many, one })` back to `({ many })`), and delete the `Subscription` type export.

4. Reverse the diff in `src/lib/db/queries.ts` — delete `getSubscriptionForUser`, `createSubscriptionForUser`, `upsertSubscription`, and `setSubscriptionStatus`. Drop `subscription` and `Subscription` from the schema import.

5. Reverse the diff in `src/lib/auth/server.ts` — delete the `after` hook from `databaseHooks.user.create`.

6. Remove the five Stripe env keys from `.env.local` and `.env.example`.

7. Generate a drop-migration for the `subscription` table:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

8. Do **not** `npm uninstall stripe` — `stripe@22.1.1` is in the trunk's pinned dependencies and other modules (or the cashdash baseline) may rely on it being available. Leave it in `package.json`.
