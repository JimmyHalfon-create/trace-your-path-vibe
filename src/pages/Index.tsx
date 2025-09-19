import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, MessageSquare, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GoogleMap from "@/components/GoogleMap";

interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const Index = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [message, setMessage] = useState("");
  const [traces, setTraces] = useState<Trace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get user's current location
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Use a default location (Paris) if geolocation fails
          setLocation({
            lat: 48.8566,
            lng: 2.3522,
          });
          toast({
            title: "Géolocalisation non disponible",
            description: "Position par défaut utilisée (Paris). Cliquez sur la carte pour changer de lieu.",
          });
        }
      );
    } else {
      // Fallback to default location if geolocation is not supported
      setLocation({
        lat: 48.8566,
        lng: 2.3522,
      });
      toast({
        title: "Géolocalisation non supportée",
        description: "Position par défaut utilisée (Paris). Cliquez sur la carte pour changer de lieu.",
      });
    }
  };

  useEffect(() => {
    requestLocation();
  }, [toast]);

  // Load traces at current location
  const loadTracesAtLocation = async () => {
    if (!location) return;

    setIsLoading(true);
    try {
      // Query traces within ~50 meters of current location
      const latRange = 0.0005; // approximately 50 meters
      const lngRange = 0.0005;

      const { data, error } = await supabase
        .from("traces")
        .select("*")
        .gte("latitude", location.lat - latRange)
        .lte("latitude", location.lat + latRange)
        .gte("longitude", location.lng - lngRange)
        .lte("longitude", location.lng + lngRange)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTraces(data || []);
    } catch (error) {
      console.error("Error loading traces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      loadTracesAtLocation();
    }
  }, [location]);

  // Submit a new trace
  const submitTrace = async () => {
    if (!location || !message.trim()) return;

    try {
      const { error } = await supabase.from("traces").insert({
        message: message.trim(),
        latitude: location.lat,
        longitude: location.lng,
      });

      if (error) throw error;

      toast({
        title: "Trace déposée",
        description: "Votre message a été laissé ici.",
      });

      setMessage("");
      setIsWriting(false);
      loadTracesAtLocation(); // Reload traces
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déposer la trace.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Globe className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <h1 className="text-3xl font-bold text-foreground">TRACE</h1>
          <p className="text-muted-foreground">Initialisation de la mappemonde...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Full Screen Map */}
      <div className="absolute inset-0" style={{ top: 'env(safe-area-inset-top)' }}>
        <GoogleMap
          center={location}
          zoom={15}
          traces={traces}
          onMapClick={(newLocation) => {
            setLocation(newLocation);
          }}
        />
      </div>

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-10" style={{ top: `calc(env(safe-area-inset-top) + 1rem)` }}>
        <Card className="p-3 shadow-lg bg-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">TRACE</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="w-4 h-4 mr-1" />
              Mappemonde
            </div>
          </div>
        </Card>
      </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          {!isWriting ? (
            <Button
              onClick={() => setIsWriting(true)}
              className="w-full h-14 text-lg font-semibold shadow-lg"
              size="lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Laisser une Trace
            </Button>
          ) : (
            <Card className="p-4 space-y-4 shadow-xl">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre trace anonyme (max 280 caractères)..."
                maxLength={280}
                className="min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {message.length}/280
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWriting(false);
                      setMessage("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={submitTrace}
                    disabled={!message.trim()}
                  >
                    Déposer
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

      {/* Traces Count Indicator */}
      <div className="absolute top-20 right-4 z-10" style={{ top: `calc(env(safe-area-inset-top) + 5rem)` }}>
        <Card className="p-2 shadow-lg bg-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-medium">{traces.length}</span>
            <span className="text-muted-foreground">traces</span>
            {isLoading && (
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;