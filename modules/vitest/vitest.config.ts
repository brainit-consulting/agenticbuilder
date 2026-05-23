import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Splits the trunk's vitest run into two projects:
//   - `unit`        : pure unit tests (env schema, utils, zod schemas, smoke).
//                     Runs against fake/default env vars. No DB required.
//   - `integration` : exercises real Drizzle queries against the static
//                     Neon `test` branch (URL from DATABASE_URL_TEST).
//                     Each test wraps its body in `withRolledBackTx()` so the
//                     branch state is identical between runs.
//
// `npm test` runs BOTH projects. Use `--project unit` or `--project integration`
// to scope a run, or the npm scripts `test:unit` / `test:integration`.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
          },
        },
        test: {
          name: "unit",
          environment: "node",
          globals: false,
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/**/*.integration.test.ts", "node_modules", "modules"],
        },
      },
      {
        resolve: {
          alias: {
            "@": resolve(__dirname, "./src"),
          },
        },
        test: {
          name: "integration",
          environment: "node",
          globals: false,
          setupFiles: ["./src/test/setup-integration.ts"],
          include: ["src/**/*.integration.test.ts"],
          // Integration tests hit a remote DB; allow them more time and run
          // them serially so concurrent tests don't fight for the branch.
          testTimeout: 30_000,
          hookTimeout: 30_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
