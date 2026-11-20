// Registers the phone for server push so it can be alerted about new nearby traces with the app closed.
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { isFrench } from "@/lib/i18n";
import { deviceId, type LatLng } from "./traces";

let token: string | null = null;
let started = false;
let last: { lat: number; lng: number; at: number } | null = null;

function shouldSend(p: LatLng) {
  if (!last) return true;
  const moved = Math.hypot((p.lat - last.lat) * 111_000, (p.lng - last.lng) * 111_000 * Math.cos(p.lat * Math.PI / 180));
  return moved > 100 || Date.now() - last.at > 30 * 60_000;
}

export async function syncPushPosition(p: LatLng | null) {
  if (!Capacitor.isNativePlatform() || !p) return;
  if (!started) {
    started = true;
    try {
      await PushNotifications.addListener("registration", (t) => { token = t.value; last = null; void syncPushPosition(p); });
      await PushNotifications.addListener("registrationError", () => { /* ignore */ });
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === "granted") await PushNotifications.register();
    } catch { /* push unavailable on this build */ }
    return;
  }
  if (!token || !shouldSend(p)) return;
  last = { ...p, at: Date.now() };
  await supabase.functions.invoke("register-push", {
    body: { token, platform: Capacitor.getPlatform(), device: deviceId(), lat: p.lat, lng: p.lng, lang: isFrench ? "fr" : "en" },
  }).catch(() => { last = null; });
}
