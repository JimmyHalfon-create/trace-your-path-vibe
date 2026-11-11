type Verdict = { id: string; offensive: boolean; reason: string | null };
type Analyse = (key: string, items: { id: string; message: string }[]) => Promise<unknown>;

/** Reject uncertain moderation before inserting anything; never default to safe. */
export async function textModeration(key: string | undefined, message: string, analyse: Analyse) {
  if (!key) return null;
  try {
    const output = await analyse(key, [{ id: "new", message }]);
    if (!output || typeof output !== "object" || !("results" in output)) return null;
    if (!Array.isArray(output.results) || output.results.length !== 1) return null;
    const row: unknown = output.results[0];
    if (!row || typeof row !== "object" || !("id" in row) || row.id !== "new"
      || !("offensive" in row) || typeof row.offensive !== "boolean"
      || !("reason" in row) || !(row.reason === null || typeof row.reason === "string")) return null;
    const verdict = row as Verdict;
    return {
      moderated_at: new Date().toISOString(),
      moderation_flag: verdict.offensive,
      moderation_reason: verdict.offensive ? (verdict.reason ?? "Contenu signalé").slice(0, 80) : null,
      hidden: verdict.offensive,
    };
  } catch {
    return null;
  }
}