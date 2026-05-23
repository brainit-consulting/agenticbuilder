import { describe, it, expect } from "vitest";
import { eq, desc } from "drizzle-orm";
import { withRolledBackTx } from "./db";
import { makeUser, makeNote } from "./factories";
import { notes } from "@/lib/db/schema";

// This is a self-contained smoke test for the integration scaffold. It:
//   1. Opens a tx against the static Neon `test` branch.
//   2. Inserts a user and two notes via factories.
//   3. Re-queries through the SAME tx so the uncommitted rows are visible.
//   4. Throws a RollbackSentinel on the way out so the branch ends clean.
//
// Why we re-query via `tx` and not `listNotesForUser(userId)`: the trunk's
// query helpers use the singleton `db` (HTTP transport), which can't see
// rows inside our WebSocket transaction. For true end-to-end coverage of
// query helpers, refactor them to accept `(db: Db | TestTx)` — for now,
// `tx.select()` proves the rollback machinery + factories are wired up.
describe("notes integration (rolled-back tx)", () => {
  it("makeNote inserts rows visible to the same tx, ordered by createdAt desc", async () => {
    await withRolledBackTx(async (tx) => {
      const u = await makeUser(tx);
      const first = await makeNote(tx, u.id, {
        title: "first",
        createdAt: new Date(Date.now() - 10_000),
      });
      const second = await makeNote(tx, u.id, {
        title: "second",
        createdAt: new Date(),
      });

      const rows = await tx
        .select()
        .from(notes)
        .where(eq(notes.userId, u.id))
        .orderBy(desc(notes.createdAt));

      expect(rows.map((r) => r.title)).toEqual(["second", "first"]);
      expect(rows.map((r) => r.id)).toEqual([second.id, first.id]);
    });
  });
});
