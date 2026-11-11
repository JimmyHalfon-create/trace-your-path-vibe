import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { UNLOCK_RADIUS_METERS, distanceMeters } from "../traces.ts";

test("the app unlock radius is 25 metres", () => {
  expect(UNLOCK_RADIUS_METERS).toBe(25);
  const origin = { lat: 0, lng: 0 };
  const atDistance = (meters) => ({ lat: meters / 6371000 * 180 / Math.PI, lng: 0 });
  expect(distanceMeters(origin, atDistance(24.99)) <= UNLOCK_RADIUS_METERS).toBe(true);
  expect(distanceMeters(origin, atDistance(25.01)) <= UNLOCK_RADIUS_METERS).toBe(false);
});

test("the server accepts 25 metres and rejects distances above 25 metres", () => {
  const source = readFileSync(new URL("../../../supabase/functions/trace-content/index.ts", import.meta.url), "utf8");
  const radius = Number(source.match(/const RADIUS_M = (\d+);/)?.[1]);
  const rule = source.match(/if \((d [><=]+ RADIUS_M)\)/)?.[1];
  expect(radius).toBe(25);
  expect(rule).toBeDefined();
  const denies = new Function("d", "RADIUS_M", `return ${rule};`);
  expect(denies(25, radius)).toBe(false);
  expect(denies(25.01, radius)).toBe(true);
});
