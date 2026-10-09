import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/traces";

const ERRORS: Record<number, string> = {
  1: "Permission refusée. Activez la localisation dans les réglages du téléphone.",
  2: "Position indisponible. Vérifiez votre GPS.",
  3: "Délai dépassé. Réessayez.",
};

/** Watches the user's position continuously. */
export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setError(null);
      },
      (e) => setError(ERRORS[e.code] ?? "Erreur de géolocalisation"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

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
            setError(ERRORS[e.code] ?? "Erreur de géolocalisation");
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }),
    []
  );

  return { position, error, refresh };
}
