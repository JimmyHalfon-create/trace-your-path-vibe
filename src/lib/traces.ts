import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export type TraceType = "text" | "voice" | "tag";

/** Tag drawing: strokes of flat [x,y,x,y…] integers on a 0–TAG_GRID square. */
export type TagDrawing = number[][];
export const TAG_GRID = 200;

/** Public marker data — never contains text or audio. */
export interface Trace {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: TraceType;
  /** Opaque author fingerprint, used only for local blocking. */
  author: string;
}

/** Content, delivered by the server only within the unlock radius. */
export interface TraceContent {
  id: string;
  trace_type: TraceType;
  message: string | null;
  audio_url: string | null; // short-lived signed URL
  drawing: TagDrawing | null;
  created_at: string;
}

/** Admin view (full row + signed audio URL + AI moderation verdict). */
export interface AdminTrace extends Trace {
  message: string;
  audio_path: string | null;
  drawing: TagDrawing | null;
  audio_url: string | null;
  moderation_flag: boolean | null;
  moderation_reason: string | null;
  moderated_at: string | null;
  transcript: string | null;
  hidden: boolean;
  author_key: string | null;
  report_count: number;
}

/** Runs AI moderation on not-yet-analysed traces (admin only). Loops over batches. */
export async function moderatePendingTraces(): Promise<number> {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase.functions.invoke("moderate-traces", { body: {} });
    if (error) throw await functionError(error, "Analyse IA impossible");
    total += data?.analysed ?? 0;
    if (!data?.remaining) break;
  }
  return total;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export const MAX_TEXT_LENGTH = 70;
export const MAX_VOICE_SECONDS = 8;
export const UNLOCK_RADIUS_METERS = 50;
const AUDIO_BUCKET = "voice-traces";

/** Haversine distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const traceDistance = (user: LatLng, t: Trace) =>
  distanceMeters(user, { lat: t.latitude, lng: t.longitude });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(t.locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

async function functionError(error: unknown, fallback: string): Promise<Error> {
  const ctx = (error as { context?: Response })?.context;
  try {
    const body = await ctx?.json();
    if (body?.error) return new Error(body.error);
  } catch { /* ignore */ }
  return new Error(fallback);
}

export async function fetchTraces(): Promise<Trace[]> {
  const { data, error } = await supabase.rpc("get_trace_markers");
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, latitude: Number(t.latitude), longitude: Number(t.longitude) })) as Trace[];
}

export async function fetchTraceContent(id: string, position: LatLng): Promise<TraceContent> {
  const { data, error } = await supabase.functions.invoke("trace-content", {
    body: { id, lat: position.lat, lng: position.lng },
  });
  if (error) throw await functionError(error, "Trace inaccessible");
  return data as TraceContent;
}

export async function createTrace(
  position: LatLng,
  input: { type: "text"; message: string } | { type: "voice"; audio: Blob } | { type: "tag"; drawing: TagDrawing }
): Promise<void> {
  const form = new FormData();
  form.append("type", input.type);
  form.append("device", deviceId());
  form.append("lat", String(position.lat));
  form.append("lng", String(position.lng));
  if (input.type === "text") form.append("message", input.message.trim().slice(0, MAX_TEXT_LENGTH));
  else if (input.type === "tag") form.append("drawing", JSON.stringify(input.drawing));
  else form.append("audio", input.audio, input.audio.type.includes("mp4") ? "a.mp4" : "a.webm");
  const { error } = await supabase.functions.invoke("create-trace", { body: form });
  if (error) throw await functionError(error, "Envoi impossible");
}

// ---------- Admin (RLS: admin role only) ----------

export async function fetchAdminTraces(): Promise<AdminTrace[]> {
  const { data, error } = await supabase.from("traces").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const paths = rows.map((r) => r.audio_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrls(paths, 600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  return rows
    .map((r) => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      trace_type: r.trace_type as TraceType,
      drawing: (r.drawing as TagDrawing | null) ?? null,
      audio_url: r.audio_path ? urls.get(r.audio_path) ?? null : null,
    }))
    // Flagged first, then newest (rows already sorted by date; sort is stable).
    .sort((a, b) => Number(!!b.moderation_flag) - Number(!!a.moderation_flag));
}

export async function deleteTrace(trace: AdminTrace): Promise<void> {
  if (trace.audio_path) {
    const { data, error } = await supabase.storage.from(AUDIO_BUCKET).remove([trace.audio_path]);
    if (error) throw error;
    if (!data?.length) console.warn("Fichier audio déjà absent", trace.audio_path);
  }
  const { data, error } = await supabase.from("traces").delete().eq("id", trace.id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Suppression refusée");
}

export async function approveTrace(id: string): Promise<void> {
  const { error } = await supabase.from("traces").update({ hidden: false, moderation_flag: false }).eq("id", id);
  if (error) throw error;
}

/** Bans the author's device from posting and removes all their traces. */
export async function banAuthor(trace: AdminTrace, all: AdminTrace[]): Promise<string[]> {
  if (!trace.author_key) throw new Error("Auteur inconnu");
  const { error } = await supabase.from("banned_authors").upsert({ author_key: trace.author_key });
  if (error) throw error;
  const theirs = all.filter((t) => t.author_key === trace.author_key);
  for (const t of theirs) await deleteTrace(t);
  return theirs.map((t) => t.id);
}

// ---------- Per-device safety (report / hide / block) ----------

const read = (k: string): string[] => {
  try { return JSON.parse(localStorage.getItem(k) ?? "[]"); } catch { return []; }
};
const add = (k: string, v: string) => localStorage.setItem(k, JSON.stringify([...new Set([...read(k), v])]));

export function deviceId(): string {
  let id = localStorage.getItem("traceon_device");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("traceon_device", id); }
  return id;
}
export const hideTraceLocally = (id: string) => add("traceon_hidden", id);
export const blockAuthorLocally = (author: string) => add("traceon_blocked", author);
export function isFilteredLocally(t: Trace): boolean {
  return read("traceon_hidden").includes(t.id) || read("traceon_blocked").includes(t.author);
}

export async function reportTrace(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke("report-trace", { body: { id, device: deviceId() } });
  if (error) throw await functionError(error, "Signalement impossible");
  hideTraceLocally(id);
}
