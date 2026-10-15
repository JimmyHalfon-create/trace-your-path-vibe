// Shared AI moderation (Lovable AI Gateway).
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

const INSTRUCTIONS = `Tu es modérateur pour TraceOn, une app de courts messages anonymes déposés dans des lieux.
Pour chaque message, indique offensive=true s'il contient : insulte, harcèlement, menace, haine/discrimination, contenu sexuel explicite, incitation à la violence, données personnelles d'un tiers (nom complet, téléphone, adresse), ou spam/arnaque. Messages dans n'importe quelle langue, argot et fautes inclus.
Ne signale pas un simple langage familier sans cible ni une opinion polie.
reason : quelques mots en français si offensive=true (ex. "Insulte", "Menace"), sinon null. Réponds pour chaque id reçu.`;

export async function moderate(apiKey: string, items: { id: string; message: string }[]) {
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

