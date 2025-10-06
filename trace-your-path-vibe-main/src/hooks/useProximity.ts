import { useState, useEffect, useRef } from 'react';
import { 
  calculateDistance, 
  isNearTrace, 
  requestNotificationPermissions, 
  checkProximityAndNotify,
  type Location,
  type Trace 
} from '@/utils/proximity';

export function useProximity(userLocation: Location | null, traces: Trace[]) {
  const [notifiedTraces, setNotifiedTraces] = useState<Set<string>>(new Set());
  const [nearbyTraces, setNearbyTraces] = useState<Trace[]>([]);
  const previousLocationRef = useRef<Location | null>(null);

  // Initialise les permissions au montage
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Vérifie la proximité quand la position ou les traces changent
  useEffect(() => {
    if (!userLocation) return;

    const checkProximity = async () => {
      // Vérifie si l'utilisateur a bougé significativement (plus de 10 mètres)
      const hasMovedSignificantly = !previousLocationRef.current || 
        calculateDistance(userLocation, previousLocationRef.current) > 10;

      if (hasMovedSignificantly) {
        previousLocationRef.current = userLocation;
        
        // Met à jour les traces à proximité
        const nearby = traces.filter(trace => isNearTrace(userLocation, trace));
        setNearbyTraces(nearby);

        // Vérifie et envoie les notifications
        const newNotifiedTraces = await checkProximityAndNotify(
          userLocation, 
          traces, 
          notifiedTraces
        );
        setNotifiedTraces(newNotifiedTraces);
      }
    };

    checkProximity();
  }, [userLocation, traces, notifiedTraces]);

  // Fonction pour vérifier si une trace est accessible
  const isTraceAccessible = (trace: Trace): boolean => {
    if (!userLocation) return false;
    return isNearTrace(userLocation, trace);
  };

  // Fonction pour obtenir la distance d'une trace
  const getDistanceToTrace = (trace: Trace): number | null => {
    if (!userLocation) return null;
    return calculateDistance(userLocation, { lat: trace.latitude, lng: trace.longitude });
  };

  return {
    nearbyTraces,
    isTraceAccessible,
    getDistanceToTrace,
    notifiedTraces: Array.from(notifiedTraces)
  };
}