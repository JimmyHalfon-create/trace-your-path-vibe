// Public: a user flags a trace. One report per device per trace; 2 reports hide it until admin review.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const HIDE_AT = 2;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hash(v: string) {
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${v}`));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: { id?: unknown; device?: unknown; reason?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const id = String(body.id ?? ""), device = String(body.device ?? "");
  const uuid = /^[0-9a-f-]{36}$/;
  if (!uuid.test(id) || !uuid.test(device)) return json({ error: "Requête invalide" }, 400);
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 80) : null;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: trace } = await db.from("traces").select("id").eq("id", id).maybeSingle();
  if (!trace) return json({ error: "Trace introuvable" }, 404);

  const { error } = await db.from("trace_reports").insert({ trace_id: id, reporter_key: await hash(`device:${device}`), reason });
  if (error && error.code !== "23505") return json({ error: "Signalement impossible" }, 500);

  const { count } = await db.from("trace_reports").select("id", { count: "exact", head: true }).eq("trace_id", id);
  await db.from("traces").update({ report_count: count ?? 0, ...((count ?? 0) >= HIDE_AT ? { hidden: true } : {}) }).eq("id", id);
  return json({ ok: true });
});
