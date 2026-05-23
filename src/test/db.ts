import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/lib/db/schema";

// `drizzle-orm/neon-serverless` uses a WebSocket-tunneled `Pool` (NOT the
// HTTP driver), which is the only Neon transport that supports real
// transactions. The trunk's `src/lib/db/client.ts` uses `drizzle-orm/neon-http`
// for low-latency single queries; integration tests need a parallel,
// transaction-capable client.
//
// Node 22+ ships a native `WebSocket` global, so we don't need the `ws`
// package. If you ever run these tests on Node <22, set:
//   neonConfig.webSocketConstructor = (await import("ws")).default;

// Allow native WebSocket on Node 22+; do nothing if it's already configured.
if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket as unknown as typeof WebSocket;
}

// `DATABASE_URL_TEST` is asserted in setup-integration.ts; this file imports
// AFTER that runs. The `!` is safe because the assertion threw otherwise.
const connectionString = process.env.DATABASE_URL_TEST!;

// Single pool per test process. Vitest creates one Node worker per test file,
// and our config sets `fileParallelism: false`, so this is a hot pool of one
// most of the time.
const pool = new Pool({ connectionString });

export const testDb = drizzle(pool, { schema });
export type TestDb = typeof testDb;
// The argument vitest tests get inside `withRolledBackTx` — Drizzle's
// transaction callback parameter, kept as a generic so importers don't have
// to spell out its full HKT-laden type.
export type TestTx = Parameters<Parameters<TestDb["transaction"]>[0]>[0];

class RollbackSentinel extends Error {
  constructor() {
    super("rollback sentinel — this is expected; the test body ran successfully");
    this.name = "RollbackSentinel";
  }
}

/**
 * Run `fn` inside a Postgres transaction that is GUARANTEED to roll back,
 * even when `fn` returns normally. Use this to give each integration test
 * its own clean slate without truncating the shared test branch.
 *
 *     await withRolledBackTx(async (tx) => {
 *       const user = await makeUser(tx);
 *       const rows = await tx.select().from(notesTable).where(...);
 *       expect(rows.length).toBe(0);
 *     });
 *
 * Caveat: the trunk's `src/lib/db/client.ts` exports a SINGLETON `db`. Any
 * code path that reaches for `db` directly (e.g. `listNotesForUser()`) will
 * read OUTSIDE this transaction — so it won't see uncommitted rows. For
 * end-to-end query coverage, either re-query through `tx` (as the example
 * test does) or have your queries accept a `db | tx` parameter via DI.
 */
export async function withRolledBackTx<T>(
  fn: (tx: TestTx) => Promise<T>,
): Promise<T | undefined> {
  let result: T | undefined;
  try {
    await testDb.transaction(async (tx) => {
      result = await fn(tx);
      throw new RollbackSentinel();
    });
  } catch (e) {
    if (e instanceof RollbackSentinel) return result;
    throw e;
  }
  return result;
}
