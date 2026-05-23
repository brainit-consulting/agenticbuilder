# blob

## What this gives you

File uploads backed by [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
A typed `uploadBlob(userId, file)` / `deleteBlob(pathname)` helper, a
server-proxied POST `/api/upload` route gated by `requireSession()`, an
`attachment` table that records every upload (with an optional FK to a
`notes.id`), a drag-and-drop `<FileUpload>` client component with real
progress, and an `<Attachments>` server component rendered below the note
form on `/notes/[id]` so users can attach files to a note and re-open the
page to see them persisted.

Every blob path is forcibly prefixed with `agenticbuilder/<userId>/` inside
`uploadBlob`. There is no path-customization parameter exposed to the
client. This is the security boundary that lets the boilerplate safely
share a single Vercel Blob store across multiple unrelated projects
(`dreamforge-uploads`, etc.) without one project being able to read or
clobber another's files. `deleteBlob` similarly refuses to operate on any
path outside the `agenticbuilder/` namespace.

## Prerequisites

- The trunk's **role-gates** module (the `/api/upload` route calls
  `requireSession()` to redirect anonymous traffic to `/login`).
- A Vercel team with a Blob store. **Any existing Blob store works** —
  uploads are namespaced under `agenticbuilder/<userId>/` so they coexist
  with other projects sharing the same store.
- No external account-creation step beyond pulling the Read/Write token
  from the Vercel dashboard.

## Environment variables

| Key | Required | Where to get it | Example |
|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Dashboard → Storage → Blob → your store → Read/Write token (starts with `vercel_blob_rw_`) | `vercel_blob_rw_1aIRdrC8BpSbs6t9_…` |

## Install

1. `npm install @vercel/blob@^2.4.0`.

2. Add the token to the zod schema in `src/lib/env.ts`:

   ```diff
    const envSchema = z.object({
      DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
      BETTER_AUTH_SECRET: z
        .string()
        .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
      BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
      OWNER_EMAIL: z.string().email("OWNER_EMAIL must be a valid email"),
      RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY must start with re_"),
      EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
      AI_GATEWAY_API_KEY: z.string().startsWith("vck_", "AI_GATEWAY_API_KEY must start with vck_"),
   +  BLOB_READ_WRITE_TOKEN: z
   +    .string()
   +    .startsWith("vercel_blob_rw_", "BLOB_READ_WRITE_TOKEN must start with vercel_blob_rw_"),
    });
   ```

   And add a matching default to `src/test/setup.ts` so unit tests pass:

   ```diff
    process.env.AI_GATEWAY_API_KEY =
      process.env.AI_GATEWAY_API_KEY ?? "vck_test_default_for_unit_tests_only_padding_padding";
   +process.env.BLOB_READ_WRITE_TOKEN =
   +  process.env.BLOB_READ_WRITE_TOKEN ?? "vercel_blob_rw_test_default_token_for_unit_tests_only";
   ```

   And add `BLOB_READ_WRITE_TOKEN` to the valid-env fixture in
   `src/lib/env.test.ts`:

   ```diff
        const result = parseEnv({
          DATABASE_URL: "postgres://u:p@h/d",
          BETTER_AUTH_SECRET: "x".repeat(32),
          BETTER_AUTH_URL: "http://localhost:3000",
          OWNER_EMAIL: "owner@example.com",
          RESEND_API_KEY: "re_test_key",
          EMAIL_FROM: "no-reply@example.com",
          AI_GATEWAY_API_KEY: "vck_test_key_padding_padding_padding",
   +      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test_token_padding",
        });
   ```

3. Add the `attachment` table to `src/lib/db/schema.ts`:

   ```ts
   export const attachment = pgTable(
     "attachment",
     {
       id: text("id").primaryKey(),
       userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
       noteId: text("note_id").references(() => notes.id, {
         onDelete: "cascade",
       }),
       url: text("url").notNull(),
       pathname: text("pathname").notNull(),
       size: integer("size").notNull(),
       contentType: text("content_type").notNull(),
       createdAt: timestamp("created_at").notNull().defaultNow(),
     },
     (t) => ({
       byUserNote: index("attachment_by_user_note_idx").on(t.userId, t.noteId),
     }),
   );

   export type Attachment = typeof attachment.$inferSelect;
   export type NewAttachment = typeof attachment.$inferInsert;
   ```

   Make sure `integer` is imported from `drizzle-orm/pg-core` alongside the
   other column types at the top of the file. Extend the relations:

   ```diff
   -export const userRelations = relations(user, ({ many }) => ({
   -  notes: many(notes),
   -}));
   +export const userRelations = relations(user, ({ many }) => ({
   +  notes: many(notes),
   +  attachments: many(attachment),
   +}));

   -export const notesRelations = relations(notes, ({ one }) => ({
   +export const notesRelations = relations(notes, ({ one, many }) => ({
      user: one(user, { fields: [notes.userId], references: [user.id] }),
   +  attachments: many(attachment),
    }));
   +
   +export const attachmentRelations = relations(attachment, ({ one }) => ({
   +  user: one(user, { fields: [attachment.userId], references: [user.id] }),
   +  note: one(notes, { fields: [attachment.noteId], references: [notes.id] }),
   +}));
   ```

4. Add attachment helpers to `src/lib/db/queries.ts`:

   ```ts
   import { attachment, type Attachment } from "./schema";

   export async function listAttachmentsForNote(
     noteId: string,
     userId: string,
   ): Promise<Attachment[]> {
     return db
       .select()
       .from(attachment)
       .where(and(eq(attachment.noteId, noteId), eq(attachment.userId, userId)))
       .orderBy(desc(attachment.createdAt));
   }

   export async function createAttachment(input: {
     id: string;
     userId: string;
     noteId: string | null;
     url: string;
     pathname: string;
     size: number;
     contentType: string;
   }): Promise<Attachment> {
     const [row] = await db.insert(attachment).values(input).returning();
     return row;
   }

   export async function deleteAttachmentForUser(
     attachmentId: string,
     userId: string,
   ): Promise<Attachment | undefined> {
     const [row] = await db
       .delete(attachment)
       .where(and(eq(attachment.id, attachmentId), eq(attachment.userId, userId)))
       .returning();
     return row;
   }
   ```

5. Copy the module's source files into `src/`:

   ```bash
   mkdir -p src/lib "src/app/api/upload" "src/app/(app)/_components" "src/app/(app)/notes/[id]/_components"
   cp modules/blob/src/lib/blob.ts src/lib/blob.ts
   cp "modules/blob/src/app/api/upload/route.ts" "src/app/api/upload/route.ts"
   cp "modules/blob/src/app/(app)/_components/FileUpload.tsx" "src/app/(app)/_components/FileUpload.tsx"
   cp "modules/blob/src/app/(app)/notes/[id]/_components/Attachments.tsx" "src/app/(app)/notes/[id]/_components/Attachments.tsx"
   cp "modules/blob/src/app/(app)/notes/[id]/_components/AttachmentsUploader.tsx" "src/app/(app)/notes/[id]/_components/AttachmentsUploader.tsx"
   ```

6. Render `<Attachments>` under the note form in
   `src/app/(app)/notes/[id]/page.tsx`:

   ```diff
    import Link from "next/link";
    import { notFound } from "next/navigation";
    import { requireSession } from "@/lib/auth/roles";
    import { getNoteForUser } from "@/lib/db/queries";
    import { NoteForm } from "../_components/NoteForm";
    import { DeleteButton } from "../_components/DeleteButton";
   +import { Attachments } from "./_components/Attachments";

   …

        <NoteForm
          mode="edit"
          noteId={note.id}
          initialTitle={note.title}
          initialBody={note.body}
        />
   +    <Attachments noteId={note.id} userId={session.user.id} />
      </div>
    );
   ```

7. Run database migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

8. Append `BLOB_READ_WRITE_TOKEN` from `modules/blob/env.example` to your
   `.env.local`. Use the real `vercel_blob_rw_…` value from the Vercel
   dashboard.

## Verify

1. Start the dev server: `npx next dev -p 3010`.
2. Sign in as a verified user.
3. Visit `/notes`, open or create a note.
4. Drag-drop a small file (or click the upload zone). The progress bar
   shows %; on completion the file appears in the **Attachments** list.
5. Reload the page — the attachment persists.
6. Click the attachment — the file opens at the public Blob URL.
7. In your Vercel Blob store (e.g. `dreamforge-uploads`) confirm the file
   path begins with `agenticbuilder/<userId>/...`, proving namespace
   isolation. You can also query the DB:

   ```sql
   select pathname from attachment order by created_at desc limit 1;
   ```

8. `npm run typecheck && npm run lint && npm test && npm run build` all
   pass.

If an upload returns 500: the most common cause is the
`BLOB_READ_WRITE_TOKEN` lacking write scope on the store, or the dev
server not having reloaded after editing `.env.local`.

## Uninstall

1. Remove the copied source files:

   ```bash
   rm -rf src/lib/blob.ts "src/app/api/upload" \
          "src/app/(app)/_components/FileUpload.tsx" \
          "src/app/(app)/notes/[id]/_components"
   ```

2. Reverse the `<Attachments />` and import diff in
   `src/app/(app)/notes/[id]/page.tsx`.

3. Reverse the diffs in `src/lib/env.ts`, `src/test/setup.ts`, and
   `src/lib/env.test.ts` — drop the `BLOB_READ_WRITE_TOKEN` lines.

4. Reverse the `attachment` table, relations, and import diff in
   `src/lib/db/schema.ts`, and remove the attachment helpers from
   `src/lib/db/queries.ts`.

5. Run `npm run db:generate && npm run db:migrate` to drop the
   `attachment` table.

6. Remove `BLOB_READ_WRITE_TOKEN` from `.env.local` and any deployed
   environments.

7. `npm uninstall @vercel/blob`.

8. **Do not** delete files under `agenticbuilder/<userId>/` in the Vercel
   Blob store unless you really intend to lose them. Other AgenticBuilder
   installs may still be using that prefix.
