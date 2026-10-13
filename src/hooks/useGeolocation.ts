import { useCallback, useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { LatLng } from "@/lib/traces";

const ERRORS = t.geoErrors;

/** Watches the user's position continuously. */
export function useGeolocation(enabled = true) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setError(t.geoUnsupported);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setError(null);
      },
      (e) => setError(ERRORS[e.code] ?? t.geoError),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  const refresh = useCallback(
    () =>
      new Promise<LatLng | null>((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (p) => {
            const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
            setPosition(pos);
            resolve(pos);
          },
          (e) => {
            setError(ERRORS[e.code] ?? t.geoError);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }),
    []
  );

  return { position, error, refresh };
}
