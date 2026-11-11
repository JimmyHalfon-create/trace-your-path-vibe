import { describe, expect, mock, test } from "bun:test";
const calls = [];
let failure = null;
mock.module("@/integrations/supabase/client", () => ({ supabase: { rpc: async (name, args) => { calls.push([name, args]); return { error: failure }; } } }));
mock.module("@/lib/i18n", () => ({ t: { locale: "fr-FR" } }));
const { approveTrace } = await import("../traces");
describe("admin restoration", () => {
  test("restores using the atomic admin RPC for the selected trace", async () => {
    await approveTrace("11111111-1111-4111-8111-111111111111");
    expect(calls).toEqual([["restore_trace", { _trace_id: "11111111-1111-4111-8111-111111111111" }]]);
  });
  test("does not report success when restoration is refused", async () => {
    failure = new Error("Accès refusé");
    await expect(approveTrace("11111111-1111-4111-8111-111111111111")).rejects.toThrow("Accès refusé");
  });
});
