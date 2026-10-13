import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Trace } from "./traces";

const isNative = () => Capacitor.isNativePlatform();

export async function requestNotificationPermission() {
  if (!isNative()) return;
  try {
    await LocalNotifications.requestPermissions();
  } catch {
    /* ignore */
  }
}

export async function notifyTraceNearby(trace: Trace) {
  if (!isNative()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(trace.id.replace(/-/g, "").slice(0, 7), 16),
          title: "Trace découverte !",
          body:
            trace.trace_type === "voice"
              ? "Un message vocal vous attend ici"
              : "Un message vous attend ici",
          extra: { traceId: trace.id },
        },
      ],
    });
  } catch {
    /* ignore */
  }
}
