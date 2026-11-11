import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

const directory = new URL("../../../supabase/migrations/", import.meta.url);
const migration = readdirSync(directory).sort().reverse().map((name) => readFileSync(new URL(name, directory), "utf8"))
  .find((sql) => sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.trace_rate_limits, public.trace_read_limits"));

test("network abuse counters are server-only", () => {
  expect(migration).toBeDefined();
  expect(migration).toContain("REVOKE ALL PRIVILEGES ON TABLE public.trace_rate_limits, public.trace_read_limits FROM PUBLIC, anon, authenticated;");
  expect(migration).toContain("GRANT ALL ON TABLE public.trace_rate_limits, public.trace_read_limits TO service_role;");
});

test("role records cannot be written by app users or read anonymously", () => {
  expect(migration).toContain("REVOKE ALL PRIVILEGES ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;");
  expect(migration).toContain("GRANT SELECT ON TABLE public.user_roles TO authenticated;");
  expect(migration).not.toMatch(/GRANT (?:ALL|INSERT|UPDATE|DELETE)[^;]*public\.user_roles TO authenticated/);
});

test("restoration keeps report resolution privileges without report insertion", () => {
  expect(migration).toContain("GRANT UPDATE (resolved_at) ON TABLE public.trace_reports TO authenticated;");
  expect(migration).toContain("REVOKE ALL PRIVILEGES ON TABLE public.trace_reports FROM PUBLIC, anon, authenticated;");
  expect(migration).not.toMatch(/GRANT (?:ALL|INSERT)[^;]*public\.trace_reports TO authenticated/);
});

test("public marker access remains explicit without public trace-table access", () => {
  expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.get_trace_markers() TO anon, authenticated, service_role;");
  expect(migration).toContain("REVOKE ALL PRIVILEGES ON TABLE public.traces FROM PUBLIC, anon, authenticated;");
  expect(migration).toContain("GRANT SELECT, UPDATE, DELETE ON TABLE public.traces TO authenticated;");
});