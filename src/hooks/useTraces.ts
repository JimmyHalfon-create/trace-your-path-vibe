import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTraces, traceDistance, UNLOCK_RADIUS_METERS, type LatLng, type Trace } from "@/lib/traces";
import { notifyTraceNearby, requestNotificationPermission } from "@/lib/notifications";

export function useTraces() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setTraces(await fetchTraces());
    } catch (e) {
      console.error("Chargement des traces impossible", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { traces, loading, reload };
}

/** Traces within unlock radius + one-time local notification per trace. */
export function useNearbyTraces(position: LatLng | null, traces: Trace[]) {
  const notified = useRef(new Set<string>());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const nearby = position
    ? traces.filter((t) => traceDistance(position, t) <= UNLOCK_RADIUS_METERS)
    : [];

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
