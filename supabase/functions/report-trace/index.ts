// Public: one report per device per trace; every new report suspends until admin review.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Service indisponible" }, 500);
  const db = createClient(url, key);
  const { error } = await db.rpc("submit_trace_report", {
    _trace_id: id, _reporter_key: await hash(`device:${device}`), _reason: reason,
  });
  if (error) return json({ error: error.message === "Trace introuvable" ? "Trace introuvable" : "Signalement impossible" }, error.message === "Trace introuvable" ? 404 : 500);
  return json({ ok: true });
});
