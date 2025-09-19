import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { MapPin, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyTraces, setNearbyTraces] = useState<Trace[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  const initializeMap = async (apiKey: string) => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(userLocation);

            const map = new google.maps.Map(mapRef.current!, {
              center: userLocation,
              zoom: 16,
              styles: [
                {
                  elementType: 'geometry',
                  stylers: [{ color: '#1a1a1a' }]
                },
                {
                  elementType: 'labels.text.stroke',
                  stylers: [{ color: '#1a1a1a' }]
                },
                {
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#f5f5f5' }]
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#2a2a2a' }]
                }
              ],
              disableDefaultUI: true,
              zoomControl: true
            });

            mapInstanceRef.current = map;

            // Add user location marker
            new google.maps.Marker({
              position: userLocation,
              map,
              title: 'Votre position',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#fbbf24',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2
              }
            });

            loadNearbyTraces(userLocation.lat, userLocation.lng);
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
            toast.error('Impossible d\'accéder à votre position');
          }
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement de Google Maps:', error);
      toast.error('Erreur lors du chargement de la carte');
    }
  };

  const loadNearbyTraces = async (lat: number, lng: number, radius = 0.001) => {
    try {
      const { data, error } = await supabase
        .from('traces')
        .select('*')
        .gte('latitude', lat - radius)
        .lte('latitude', lat + radius)
        .gte('longitude', lng - radius)
        .lte('longitude', lng + radius)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNearbyTraces(data || []);

      // Add markers for traces
      if (mapInstanceRef.current && data) {
        data.forEach((trace) => {
          new google.maps.Marker({
            position: { lat: parseFloat(trace.latitude.toString()), lng: parseFloat(trace.longitude.toString()) },
            map: mapInstanceRef.current!,
            title: `Trace du ${new Date(trace.created_at).toLocaleDateString()}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#ef4444',
              fillOpacity: 0.8,
              strokeColor: '#fff',
              strokeWeight: 1
            }
          });
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traces:', error);
    }
  };

  const submitTrace = async () => {
    if (!message.trim() || !currentLocation) return;

    try {
      const { error } = await supabase
        .from('traces')
        .insert({
          message: message.trim(),
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        });

      if (error) throw error;

      toast.success('Trace déposée avec succès');
      setMessage('');
      setShowMessageForm(false);
      loadNearbyTraces(currentLocation.lat, currentLocation.lng);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la trace:', error);
      toast.error('Erreur lors du dépôt de la trace');
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
      initializeMap(apiKey);
    }
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Configuration Google Maps</h2>
          <p className="text-muted-foreground mb-4">
            Veuillez entrer votre clé API Google Maps pour utiliser TRACE.
          </p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Clé API Google Maps"
            className="w-full p-2 border rounded mb-4 bg-input"
          />
          <Button onClick={handleApiKeySubmit} className="w-full">
            Démarrer TRACE
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-background">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary bg-card/90 px-4 py-2 rounded-lg backdrop-blur-sm">
            TRACE
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMessageForm(!showMessageForm)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Laisser une Trace
            </Button>
          </div>
        </div>
      </div>

      {/* Message Form */}
      {showMessageForm && currentLocation && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="p-4 bg-card/95 backdrop-blur-sm">
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-medium">Position actuelle</p>
                <p className="text-xs text-muted-foreground">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Laissez votre trace anonyme ici..."
              maxLength={280}
              className="mb-3 resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {message.length}/280 caractères
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMessageForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={submitTrace}
                  disabled={!message.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Déposer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Nearby Traces */}
      {nearbyTraces.length > 0 && !showMessageForm && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="p-4 bg-card/95 backdrop-blur-sm max-h-64 overflow-y-auto">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Traces à proximité ({nearbyTraces.length})
            </h3>
            <div className="space-y-3">
              {nearbyTraces.slice(0, 3).map((trace) => (
                <div key={trace.id} className="border-l-2 border-primary pl-3">
                  <p className="text-sm">{trace.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(trace.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapView;