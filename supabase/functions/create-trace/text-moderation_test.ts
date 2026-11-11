import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { textModeration } from "./text-moderation.ts";

Deno.test("text is refused when AI throws or returns an invalid verdict", async () => {
  assertEquals(await textModeration("test", "Bonjour", async () => { throw new Error("offline"); }), null);
  assertEquals(await textModeration("test", "Bonjour", async () => ({ results: [] })), null);
  assertEquals(await textModeration(undefined, "Bonjour", async () => ({ results: [] })), null);
});
Deno.test("a validated offensive verdict hides the trace", async () => {
  const result = await textModeration("test", "message", async () => ({ results: [{ id: "new", offensive: true, reason: "Menace" }] }));
  assertEquals(result?.hidden, true);
});