import { expect, test } from "bun:test";
import { textModeration } from "../../../supabase/functions/create-trace/text-moderation.ts";

test("missing AI configuration refuses text without calling AI", async () => {
  let called = false;
  expect(await textModeration(undefined, "Bonjour", async () => { called = true; })).toBeNull();
  expect(called).toBe(false);
});
test("AI transport failure refuses text", async () => {
  expect(await textModeration("test", "Bonjour", async () => { throw new Error("offline"); })).toBeNull();
});
test("AI error response refuses text", async () => {
  expect(await textModeration("test", "Bonjour", async () => ({ error: "failure" }))).toBeNull();
});
test("missing, mismatched or malformed verdicts refuse text", async () => {
  for (const results of [[], [{ id: "other", offensive: false, reason: null }], [{ id: "new", offensive: "false", reason: null }], [{ id: "new", offensive: false }]]) {
    expect(await textModeration("test", "Bonjour", async () => ({ results }))).toBeNull();
  }
});
test("offensive text stays hidden pending admin review", async () => {
  const verdict = await textModeration("test", "message", async () => ({ results: [{ id: "new", offensive: true, reason: "Menace" }] }));
  expect(verdict?.hidden).toBe(true);
  expect(verdict?.moderation_flag).toBe(true);
});
test("only a valid safe verdict allows public text", async () => {
  const verdict = await textModeration("test", "Bonjour", async () => ({ results: [{ id: "new", offensive: false, reason: null }] }));
  expect(verdict?.hidden).toBe(false);
  expect(verdict?.moderation_flag).toBe(false);
});