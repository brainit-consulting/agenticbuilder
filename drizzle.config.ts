import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  // Allow drizzle-kit to run for codegen (`db:generate`) without DATABASE_URL,
  // but `db:migrate` requires it and will fail with a clearer error from
  // drizzle-kit if it isn't set.
  console.warn("drizzle.config: DATABASE_URL not set (.env.local missing or empty).");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl ?? "" },
  verbose: true,
  strict: true,
});
