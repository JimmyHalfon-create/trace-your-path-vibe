import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hash(s: string) {
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${s}`));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "invalid" }, 400); }
  const token = typeof b?.token === "string" ? b.token.trim() : "";
  const platform = b?.platform;
  const device = String(b?.device ?? "").toLowerCase();
  const lat = Number(b?.lat), lng = Number(b?.lng);
  if (!/^[A-Za-z0-9:_\-.]{32,4096}$/.test(token)) return json({ error: "token" }, 400);
  if (platform !== "ios" && platform !== "android") return json({ error: "platform" }, 400);
  if (!/^[0-9a-f-]{36}$/.test(device)) return json({ error: "device" }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ error: "coords" }, 400);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("push_devices").upsert({
    token, platform, author_key: await hash(`device:${device}`),
    // ~100 m precision is enough for alerts and keeps less exact location data.
    latitude: Math.round(lat * 1000) / 1000, longitude: Math.round(lng * 1000) / 1000,
    lang: b?.lang === "en" ? "en" : "fr", updated_at: new Date().toISOString(),
  });
  if (error) { console.error(error.message); return json({ error: "save" }, 500); }
  return json({ ok: true });
});
