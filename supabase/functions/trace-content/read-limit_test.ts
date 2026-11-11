import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { reserveRead } from "./read-limit.ts";

Deno.test("reservation refuses database errors and malformed replies", async () => {
  assertEquals(await reserveRead(async () => ({ data: null, error: "offline" })), "unavailable");
  assertEquals(await reserveRead(async () => ({ data: null, error: null })), "unavailable");
  assertEquals(await reserveRead(async () => { throw new Error("offline"); }), "unavailable");
});
Deno.test("reservation maps a reached limit to refusal", async () => {
  assertEquals(await reserveRead(async () => ({ data: false, error: null })), "limited");
  assertEquals(await reserveRead(async () => ({ data: true, error: null })), "allowed");
});