import { LocalNotifications } from '@capacitor/local-notifications';

export interface Location {
  lat: number;
  lng: number;
}

export interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: 'text' | 'voice';
  audio_url?: string;
}

// Calcule la distance entre deux points en mètres (formule de Haversine)
export function calculateDistance(pos1: Location, pos2: Location): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

// Vérifie si l'utilisateur est proche d'une trace (dans un rayon de 50 mètres)
// ou si la trace a été créée récemment (dernière heure)
export function isNearTrace(userLocation: Location, trace: Trace, radius = 50): boolean {
  const traceLocation = { lat: trace.latitude, lng: trace.longitude };
  const distance = calculateDistance(userLocation, traceLocation);
  
  // Toujours accessible si créée dans la dernière heure
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const traceCreatedAt = new Date(trace.created_at);
  const isRecentlyCreated = traceCreatedAt > oneHourAgo;
  
  console.log(`Trace ${trace.id}: distance=${Math.round(distance)}m, recent=${isRecentlyCreated}`);
  
  return distance <= radius || isRecentlyCreated;
}

// Trouve les traces à proximité
export function findNearbyTraces(userLocation: Location, traces: Trace[], radius = 50): Trace[] {
  return traces.filter(trace => isNearTrace(userLocation, trace, radius));
}

// Demande les permissions pour les notifications
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('Erreur permissions notifications:', error);
    return false;
  }
}

// Envoie une notification de proximité
export async function sendProximityNotification(trace: Trace): Promise<void> {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Trace découverte !',
          body: trace.trace_type === 'voice' 
            ? 'Un message vocal vous attend ici 🎵' 
            : `"${trace.message.substring(0, 50)}${trace.message.length > 50 ? '...' : ''}"`,
          id: parseInt(trace.id.replace(/-/g, '').substring(0, 8), 16),
          schedule: { at: new Date(Date.now() + 1000) }, // Dans 1 seconde
          sound: 'beep.wav',
          attachments: [],
          actionTypeId: '',
          extra: {
            traceId: trace.id
          }
        }
      ]
    });
  } catch (error) {
    console.error('Erreur envoi notification:', error);
  }
}

// Vérifie les traces à proximité et envoie des notifications
export async function checkProximityAndNotify(
  userLocation: Location, 
  traces: Trace[], 
  notifiedTraces: Set<string>
): Promise<Set<string>> {
  const newNotifiedTraces = new Set(notifiedTraces);
  
  for (const trace of traces) {
    if (isNearTrace(userLocation, trace) && !notifiedTraces.has(trace.id)) {
      await sendProximityNotification(trace);
      newNotifiedTraces.add(trace.id);
    }
  }
  
  return newNotifiedTraces;
}