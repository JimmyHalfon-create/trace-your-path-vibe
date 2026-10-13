import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export type TraceType = "text" | "voice";

/** Public marker data — never contains text or audio. */
export interface Trace {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: TraceType;
}

/** Content, delivered by the server only within the unlock radius. */
export interface TraceContent {
  id: string;
  trace_type: TraceType;
  message: string | null;
  audio_url: string | null; // short-lived signed URL
  created_at: string;
}

/** Admin view (full row + signed audio URL). */
export interface AdminTrace extends Trace {
  message: string;
  audio_path: string | null;
  audio_url: string | null;
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
  input: { type: "text"; message: string } | { type: "voice"; audio: Blob }
): Promise<void> {
  const form = new FormData();
  form.append("type", input.type);
  form.append("lat", String(position.lat));
  form.append("lng", String(position.lng));
  if (input.type === "text") form.append("message", input.message.trim().slice(0, MAX_TEXT_LENGTH));
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
  return rows.map((r) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    trace_type: r.trace_type as TraceType,
    audio_url: r.audio_path ? urls.get(r.audio_path) ?? null : null,
  }));
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
