import { config as loadEnv } from "dotenv";

// Load .env.local first (where DATABASE_URL_TEST lives in dev), then .env.test
// as a fallback. CI sets DATABASE_URL_TEST via secrets, so both dotenv calls
// no-op there.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env.test", quiet: true });

if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    "DATABASE_URL_TEST is not set.\n" +
      "Integration tests need a Neon `test` branch's pooled URL.\n" +
      "Add it to .env.local (or set the secret in CI). See modules/vitest/env.example.",
  );
}

// @ts-expect-error NODE_ENV is read-only but Vitest sets it
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

// Critical swap: every code path that reads DATABASE_URL (e.g. the trunk's
// `src/lib/db/client.ts` and any module that mirrors it) now points at the
// test branch, NOT the dev/prod branch.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

// Same defaults as src/test/setup.ts so env.ts's zod parse succeeds.
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-32-bytes-ok-for-tests";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
process.env.OWNER_EMAIL = process.env.OWNER_EMAIL ?? "owner@example.com";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test_key_for_tests";
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? "no-reply@example.com";
process.env.AI_GATEWAY_API_KEY =
  process.env.AI_GATEWAY_API_KEY ?? "vck_test_default_for_unit_tests_only_padding_padding";
process.env.BLOB_READ_WRITE_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ?? "vercel_blob_rw_test_default_token_for_unit_tests_only";
