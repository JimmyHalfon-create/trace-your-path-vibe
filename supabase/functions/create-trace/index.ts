import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { moderate } from "../_shared/moderation.ts";
import { audioDuration, sniffKind } from "./audio.ts";

const MAX_TEXT = 70;
const MAX_SECONDS = 8;
const DURATION_TOLERANCE = 0.5; // encoder padding
const MAX_BYTES = 200 * 1024;
const MIN_BYTES = 500;
// Anti-flood (per hashed IP + global)
const PER_IP_10MIN = 5;
const PER_IP_DAY = 30;
const GLOBAL_HOUR = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hashIp(ip: string) {
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ---- Rate limit ----
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await hashIp(ip);
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const count = async (filter: (q: any) => any) => {
    const { count } = await filter(db.from("trace_rate_limits").select("id", { count: "exact", head: true }));
    return count ?? 0;
  };
  const [c10, cDay, cGlobal] = await Promise.all([
    count((q) => q.eq("ip_hash", ipHash).gte("created_at", since(10 * 60_000))),
    count((q) => q.eq("ip_hash", ipHash).gte("created_at", since(86_400_000))),
    count((q) => q.gte("created_at", since(3_600_000))),
  ]);
  if (c10 >= PER_IP_10MIN || cDay >= PER_IP_DAY) return json({ error: "Trop de traces déposées, réessayez plus tard." }, 429);
  if (cGlobal >= GLOBAL_HOUR) return json({ error: "Service saturé, réessayez plus tard." }, 429);

  // ---- Parse & validate ----
  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "Requête invalide" }, 400); }
  const device = String(form.get("device") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(device)) return json({ error: "Appareil invalide" }, 400);
  const authorKey = await hashIp(`device:${device}`);
  const { data: banned } = await db.from("banned_authors").select("author_key").eq("author_key", authorKey).maybeSingle();
  if (banned) return json({ error: "Compte bloqué pour non-respect des règles." }, 403);
  const type = form.get("type");
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  if (type !== "text" && type !== "voice" && type !== "tag") return json({ error: "Type invalide" }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return json({ error: "Coordonnées invalides" }, 400);

  let message = "Message vocal";
  let audioPath: string | null = null;
  let drawing: number[][] | null = null;

  if (type === "text") {
    const raw = form.get("message");
    if (typeof raw !== "string") return json({ error: "Message manquant" }, 400);
    message = raw.trim();
    if (!message || [...message].length > MAX_TEXT) return json({ error: `1 à ${MAX_TEXT} caractères` }, 400);
    if (form.get("audio")) return json({ error: "Une trace texte ne contient pas d'audio" }, 400);
  } else if (type === "tag") {
    if (form.get("message") || form.get("audio")) return json({ error: "Un tag ne contient que le dessin" }, 400);
    message = "Tag";
    try {
      const raw = JSON.parse(String(form.get("drawing") ?? ""));
      if (!Array.isArray(raw) || raw.length < 1 || raw.length > 60) throw 0;
      let points = 0;
      for (const s of raw) {
        if (!Array.isArray(s) || s.length < 2 || s.length % 2) throw 0;
        for (const v of s) if (!Number.isInteger(v) || v < 0 || v > 200) throw 0;
        points += s.length / 2;
      }
      if (points < 2 || points > 1500) throw 0;
      drawing = raw;
    } catch { return json({ error: "Dessin invalide" }, 400); }
  } else {
    if (form.get("message")) return json({ error: "Une trace audio ne contient pas de texte" }, 400);
    const file = form.get("audio");
    if (!(file instanceof File)) return json({ error: "Audio manquant" }, 400);
    if (file.size < MIN_BYTES || file.size > MAX_BYTES) return json({ error: "Taille audio invalide" }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffKind(bytes);
    if (!kind) return json({ error: "Format audio non autorisé (webm ou mp4)" }, 400);
    const seconds = audioDuration(bytes, kind);
    if (seconds === null) return json({ error: "Durée audio illisible" }, 400);
    if (seconds > MAX_SECONDS + DURATION_TOLERANCE) return json({ error: `Audio trop long (${seconds.toFixed(1)} s)` }, 400);

    audioPath = `trace_${Date.now()}_${crypto.randomUUID()}.${kind}`;
    const { error } = await db.storage.from("voice-traces").upload(audioPath, bytes, {
      contentType: kind === "webm" ? "audio/webm" : "audio/mp4",
      upsert: false,
    });
    if (error) return json({ error: "Envoi audio impossible" }, 500);
  }

  // Objectionable-content filter: flagged text is hidden until an admin reviews it.
  let moderation: Record<string, unknown> = {};
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (type === "text" && apiKey) {
    const out = await moderate(apiKey, [{ id: "new", message }]);
    if (!("error" in out)) {
      const r = out.results[0];
      moderation = {
        moderated_at: new Date().toISOString(),
        moderation_flag: !!r?.offensive,
        moderation_reason: r?.offensive ? (r.reason ?? "Contenu signalé").slice(0, 80) : null,
        hidden: !!r?.offensive,
      };
    }
  }

  await db.from("trace_rate_limits").insert({ ip_hash: ipHash });

  const { data, error } = await db
    .from("traces")
    .insert({ latitude: lat, longitude: lng, message, trace_type: type, audio_path: audioPath, drawing, author_key: authorKey, ...moderation })
    .select("id")
    .single();
  if (error) {
    if (audioPath) await db.storage.from("voice-traces").remove([audioPath]);
    return json({ error: "Trace refusée" }, 400);
  }

  // Housekeeping: forget rate-limit entries older than 1 day.
  await db.from("trace_rate_limits").delete().lt("created_at", since(86_400_000));

  return json({ id: data.id });
});
