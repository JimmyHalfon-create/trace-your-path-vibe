import { expect, test } from "bun:test";
import { reserveRead } from "../../../supabase/functions/trace-content/read-limit.ts";
import { readFileSync, readdirSync } from "node:fs";

test("read reservations fail closed on errors", async () => {
  expect(await reserveRead(async () => ({ data: null, error: "offline" }))).toBe("unavailable");
  expect(await reserveRead(async () => { throw new Error("offline"); })).toBe("unavailable");
  expect(await reserveRead(async () => ({ data: null, error: null }))).toBe("unavailable");
});
test("read reservation respects database denial", async () => {
  expect(await reserveRead(async () => ({ data: false, error: null }))).toBe("limited");
  expect(await reserveRead(async () => ({ data: true, error: null }))).toBe("allowed");
});
const dir = new URL("../../../supabase/migrations/", import.meta.url);
const sql = readdirSync(dir).sort().reverse().map(name => readFileSync(new URL(name, dir), "utf8")).find(s => s.includes("FUNCTION public.reserve_trace_read"));
test("the short read limit is exactly 60 in 10 minutes", () => {
  expect(sql).toContain("interval '10 minutes'");
  expect(sql).toContain("recent_count >= 60");
  expect(sql).toContain("61st read allowed");
});
test("the daily read limit is exactly 300 in 24 hours", () => {
  expect(sql).toContain("interval '24 hours'");
  expect(sql).toContain("daily_count >= 300");
  expect(sql).toContain("301st daily read allowed");
});