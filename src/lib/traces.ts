import { supabase } from "@/integrations/supabase/client";

export type TraceType = "text" | "voice";

export interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: TraceType;
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
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export async function fetchTraces(): Promise<Trace[]> {
  const { data, error } = await supabase
    .from("traces")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trace[];
}

export async function createTrace(
  position: LatLng,
  input: { type: "text"; message: string } | { type: "voice"; audio: Blob }
): Promise<void> {
  let audioUrl: string | null = null;

  if (input.type === "voice") {
    const ext = input.audio.type.includes("mp4") ? "mp4" : "webm";
    const fileName = `trace_${Date.now()}_${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, input.audio, { contentType: input.audio.type, upsert: false });
    if (uploadError) throw uploadError;
    audioUrl = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(fileName).data.publicUrl;
  }

  const { error } = await supabase.from("traces").insert({
    latitude: position.lat,
    longitude: position.lng,
    message: input.type === "text" ? input.message.trim().slice(0, MAX_TEXT_LENGTH) : "Message vocal",
    trace_type: input.type,
    audio_url: audioUrl,
  });
  if (error) throw error;
}

export async function deleteTrace(trace: Trace): Promise<void> {
  if (trace.audio_url) {
    const fileName = trace.audio_url.split(`/${AUDIO_BUCKET}/`)[1];
    if (fileName) await supabase.storage.from(AUDIO_BUCKET).remove([fileName]);
  }
  const { error } = await supabase.from("traces").delete().eq("id", trace.id);
  if (error) throw error;
}
