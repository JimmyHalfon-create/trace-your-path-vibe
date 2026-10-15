// Admin-only: runs AI moderation on text traces not yet analysed and stores the verdict.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { moderate } from "../_shared/moderation.ts";

const BATCH = 40;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function transcribe(apiKey: string, blob: Blob, path: string): Promise<string | null> {
  const isMp4 = path.endsWith(".mp4") || path.endsWith(".m4a");
  const fd = new FormData();
  fd.append("model", "openai/gpt-transcribe");
  fd.append("stream", "true");
  fd.append("file", new Blob([blob], { type: isMp4 ? "audio/mp4" : "audio/webm" }), isMp4 ? "audio.mp4" : "audio.webm");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: fd,
  });
  if (!res.ok) { console.error("transcribe", res.status, await res.text().catch(() => "")); return null; }
  const raw = await res.text();
  let text = "", done: string | null = null;
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const d = line.slice(5).trim();
    if (!d || d === "[DONE]") continue;
    try {
      const ev = JSON.parse(d);
      if (ev.type === "transcript.text.delta") text += ev.delta ?? "";
      if (ev.type === "transcript.text.done") done = ev.text ?? null;
    } catch { /* ignore */ }
  }
  return (done ?? text).trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
  if (!user) return json({ error: "Non connecté" }, 401);
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Accès refusé" }, 403);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "Clé IA manquante" }, 500);

  const { data: rows } = await db
    .from("traces")
    .select("id, message, trace_type, audio_path")
    .is("moderated_at", null)
    .order("created_at", { ascending: false })
    .limit(BATCH);
  if (!rows?.length) return json({ analysed: 0, remaining: false });

  const now = new Date().toISOString();
  const tagIds = rows.filter((r) => r.trace_type === "tag").map((r) => r.id);
  if (tagIds.length) await db.from("traces").update({ moderated_at: now, moderation_flag: false }).in("id", tagIds);
  // Voice traces: transcribe first, then moderate the transcript like text.
  const voiceItems: { id: string; message: string }[] = [];
  for (const r of rows.filter((r) => r.trace_type === "voice")) {
    let transcript: string | null = null;
    if (r.audio_path) {
      const { data: file } = await db.storage.from("voice-traces").download(r.audio_path);
      if (file) transcript = await transcribe(apiKey, file, r.audio_path);
    }
    if (transcript === null) continue; // retry on next run
    if (!transcript) {
      await db.from("traces").update({ transcript: "", moderated_at: now, moderation_flag: false }).eq("id", r.id);
      continue;
    }
    await db.from("traces").update({ transcript: transcript.slice(0, 500) }).eq("id", r.id);
    voiceItems.push({ id: r.id, message: transcript.slice(0, 500) });
  }

  const texts = rows.filter((r) => r.trace_type === "text").map((r) => ({ id: r.id, message: r.message })).concat(voiceItems);
  if (texts.length) {
    const out = await moderate(apiKey, texts);
    if ("error" in out) return json({ error: out.error }, out.status ?? 502);
    const ids = new Set(texts.map((t) => t.id));
    await Promise.all(
      out.results.filter((r) => ids.has(r.id)).map((r) =>
        db.from("traces").update({
          moderation_flag: r.offensive,
          ...(r.offensive ? { hidden: true } : {}),
          moderation_reason: r.offensive ? (r.reason ?? "Contenu signalé").slice(0, 80) : null,
          moderated_at: now,
        }).eq("id", r.id)
      ),
    );
  }
  return json({ analysed: rows.length, remaining: rows.length === BATCH });
});
