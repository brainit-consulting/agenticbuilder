import { describe, it, expect } from "vitest";
import { noteInputSchema } from "./_schema";

// We only test the input schema here (pure logic). End-to-end action
// behavior with auth + DB is exercised by acceptance (Task 17) and, more
// thoroughly, by the future vitest module's integration suite.

describe("note input schema", () => {
  it("requires a non-empty title", () => {
    const r = noteInputSchema.safeParse({ title: "  ", body: "" });
    expect(r.success).toBe(false);
  });

  it("accepts a valid note", () => {
    const r = noteInputSchema.safeParse({ title: "hello", body: "" });
    expect(r.success).toBe(true);
  });

  it("rejects titles longer than 200 chars", () => {
    const r = noteInputSchema.safeParse({ title: "x".repeat(201), body: "" });
    expect(r.success).toBe(false);
  });

  it("defaults body to empty string when absent", () => {
    const r = noteInputSchema.safeParse({ title: "ok" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body).toBe("");
  });
});
