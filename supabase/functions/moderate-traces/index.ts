// Admin-only: runs AI moderation on text traces not yet analysed and stores the verdict.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BATCH = 40;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "offensive", "reason"],
        properties: {
          id: { type: "string" },
          offensive: { type: "boolean" },
          reason: { type: ["string", "null"] },
        },
      },
    },
  },
};

const INSTRUCTIONS = `Tu es modérateur pour TRACE, une app de courts messages anonymes déposés dans des lieux.
Pour chaque message, indique offensive=true s'il contient : insulte, harcèlement, menace, haine/discrimination, contenu sexuel explicite, incitation à la violence, données personnelles d'un tiers (nom complet, téléphone, adresse), ou spam/arnaque. Messages dans n'importe quelle langue, argot et fautes inclus.
Ne signale pas un simple langage familier sans cible ni une opinion polie.
reason : quelques mots en français si offensive=true (ex. "Insulte", "Menace"), sinon null. Réponds pour chaque id reçu.`;

async function moderate(apiKey: string, items: { id: string; message: string }[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: INSTRUCTIONS,
      input: JSON.stringify(items),
      text: { format: { type: "json_schema", name: "moderation", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    let msg = "Analyse IA impossible";
    try { const b = await res.json(); msg = b?.error?.message ?? b?.message ?? msg; } catch { /* ignore */ }
    return { status: res.status, error: msg };
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") return { status: 502, error: "Analyse IA échouée" };
      } catch { /* partial */ }
    }
  }
  try {
    return { results: JSON.parse(text).results as { id: string; offensive: boolean; reason: string | null }[] };
  } catch {
    return { status: 502, error: "Réponse IA illisible" };
  }
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
    .select("id, message, trace_type")
    .is("moderated_at", null)
    .order("created_at", { ascending: false })
    .limit(BATCH);
  if (!rows?.length) return json({ analysed: 0, remaining: false });

  const now = new Date().toISOString();
  // Voice traces have no text to analyse: mark them so they are not re-queued.
  const voice = rows.filter((r) => r.trace_type !== "text");
  if (voice.length)
    await db.from("traces").update({ moderated_at: now, moderation_flag: null }).in("id", voice.map((r) => r.id));

  const texts = rows.filter((r) => r.trace_type === "text").map((r) => ({ id: r.id, message: r.message }));
  if (texts.length) {
    const out = await moderate(apiKey, texts);
    if ("error" in out) return json({ error: out.error }, out.status ?? 502);
    const ids = new Set(texts.map((t) => t.id));
    await Promise.all(
      out.results.filter((r) => ids.has(r.id)).map((r) =>
        db.from("traces").update({
          moderation_flag: r.offensive,
          moderation_reason: r.offensive ? (r.reason ?? "Contenu signalé").slice(0, 80) : null,
          moderated_at: now,
        }).eq("id", r.id)
      ),
    );
  }
  return json({ analysed: rows.length, remaining: rows.length === BATCH });
});
