// Returns a trace's content only if the caller's reported position is within 50 m.
// NOTE: the position is supplied by the device and can be spoofed (fake GPS apps,
// modified requests). This check raises the bar; it is not proof of presence.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RADIUS_M = 50;
const SIGNED_URL_SECONDS = 120;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function distance(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371e3, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const { id } = body ?? {};
  const lat = Number(body?.lat), lng = Number(body?.lng);
  if (typeof id !== "string" || !UUID.test(id)) return json({ error: "id invalide" }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return json({ error: "Coordonnées invalides" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: t } = await db
    .from("traces")
    .select("id, message, latitude, longitude, trace_type, audio_path, drawing, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!t) return json({ error: "Trace introuvable" }, 404);

  const d = distance(lat, lng, Number(t.latitude), Number(t.longitude));
  if (d > RADIUS_M) return json({ error: "Trop loin", distance: Math.round(d) }, 403);

  let audio_url: string | null = null;
  if (t.trace_type === "voice" && t.audio_path) {
    const { data } = await db.storage.from("voice-traces").createSignedUrl(t.audio_path, SIGNED_URL_SECONDS);
    audio_url = data?.signedUrl ?? null;
  }
  return json({
    id: t.id,
    trace_type: t.trace_type,
    message: t.trace_type === "text" ? t.message : null,
    audio_url,
    drawing: t.trace_type === "tag" ? t.drawing : null,
    created_at: t.created_at,
  });
});
