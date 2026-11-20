// Server-side push: alerts devices whose last known position is near a new trace.
// iOS goes straight to APNs (token-based .p8 key); Android goes through the FCM connector gateway.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const NOTIFY_RADIUS_METERS = 300;
const MAX_AGE_DAYS = 14;
const BUNDLE_ID = "com.jimmy.traceyourpath";
const FCM_URL = "https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send";

const TEXT = {
  fr: { title: "Nouvelle trace près de vous", body: "Quelqu'un vient de laisser une trace dans votre quartier." },
  en: { title: "New trace nearby", body: "Someone just left a trace in your area." },
};

export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let apnsJwt: { token: string; at: number } | null = null;
async function apnsToken() {
  if (apnsJwt && Date.now() - apnsJwt.at < 40 * 60_000) return apnsJwt.token;
  const pem = Deno.env.get("APNS_KEY_P8")!, kid = Deno.env.get("APNS_KEY_ID")!, iss = Deno.env.get("APNS_TEAM_ID")!;
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const input = `${b64url(JSON.stringify({ alg: "ES256", kid }))}.${b64url(JSON.stringify({ iss, iat: Math.floor(Date.now() / 1000) }))}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input));
  apnsJwt = { token: `${input}.${b64url(sig)}`, at: Date.now() };
  return apnsJwt.token;
}

/** Returns true when the token is dead and should be forgotten. */
async function sendApns(token: string, msg: { title: string; body: string }, traceId: string) {
  const res = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: "POST",
    headers: { authorization: `bearer ${await apnsToken()}`, "apns-topic": BUNDLE_ID, "apns-push-type": "alert", "apns-priority": "10" },
    body: JSON.stringify({ aps: { alert: msg, sound: "default" }, traceId }),
  });
  if (res.ok) return false;
  const body = await res.text();
  console.error(`APNs [${res.status}]: ${body}`);
  return res.status === 410 || /BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(body);
}

async function sendFcm(token: string, msg: { title: string; body: string }, traceId: string) {
  const res = await fetch(FCM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("FIREBASE_MESSAGING_API_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { token, notification: msg, data: { traceId } } }),
  });
  if (res.ok) return false;
  const body = await res.text();
  console.error(`FCM [${res.status}]: ${body}`);
  return res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(body);
}

export async function notifyNearby(db: SupabaseClient, trace: { id: string; lat: number; lng: number; authorKey: string }) {
  const dLat = NOTIFY_RADIUS_METERS / 111_000;
  const dLng = dLat / Math.max(0.1, Math.cos(trace.lat * Math.PI / 180));
  const { data, error } = await db.from("push_devices").select("token, platform, author_key, latitude, longitude, lang")
    .gte("latitude", trace.lat - dLat).lte("latitude", trace.lat + dLat)
    .gte("longitude", trace.lng - dLng).lte("longitude", trace.lng + dLng)
    .gte("updated_at", new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString())
    .limit(500);
  if (error) { console.error("push lookup", error.message); return; }
  const targets = (data ?? []).filter((d) => d.author_key !== trace.authorKey &&
    distanceMeters(trace.lat, trace.lng, d.latitude, d.longitude) <= NOTIFY_RADIUS_METERS);
  const dead: string[] = [];
  await Promise.all(targets.map(async (d) => {
    const msg = d.lang === "en" ? TEXT.en : TEXT.fr;
    try {
      const stale = d.platform === "ios" ? await sendApns(d.token, msg, trace.id) : await sendFcm(d.token, msg, trace.id);
      if (stale) dead.push(d.token);
    } catch (e) { console.error("push send", e); }
  }));
  if (dead.length) await db.from("push_devices").delete().in("token", dead);
}
