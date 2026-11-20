import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTraces, isFilteredLocally, traceDistance, UNLOCK_RADIUS_METERS, type LatLng, type Trace } from "@/lib/traces";
import { notifyTraceNearby, requestNotificationPermission } from "@/lib/notifications";

export const LIVE_REFRESH_MS = 30_000;

export function useTraces() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setTraces((await fetchTraces()).filter((t) => !isFilteredLocally(t)));
    } catch (e) {
      console.error("Chargement des traces impossible", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Live refresh: new traces from others appear without reopening the app.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") reload(true);
    };
    const id = window.setInterval(tick, LIVE_REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [reload]);

  const remove = useCallback((pred: (t: Trace) => boolean) => setTraces((p) => p.filter((t) => !pred(t))), []);
  return { traces, loading, reload, remove };
}

/** Traces within unlock radius + one-time local notification per trace. */
export function useNearbyTraces(position: LatLng | null, traces: Trace[], enabled = true) {
  const notified = useRef(new Set<string>());

  useEffect(() => {
    if (enabled) requestNotificationPermission();
  }, [enabled]);

  const nearby = useMemo(
    () => (position ? traces.filter((t) => traceDistance(position, t) <= UNLOCK_RADIUS_METERS) : []),
    [position, traces]
  );

  useEffect(() => {
    nearby.forEach((t) => {
      if (!notified.current.has(t.id)) {
        notified.current.add(t.id);
        notifyTraceNearby(t);
      }
    });
  }, [nearby]);

  return nearby;
}
