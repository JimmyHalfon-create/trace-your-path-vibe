import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast({
            title: "Localisation requise",
            description: "TRACE a besoin de votre position pour fonctionner.",
            variant: "destructive",
          });
        }
      );
    }
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
          <MapPin className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold text-foreground">TRACE</h1>
          <p className="text-muted-foreground">Localisation en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">TRACE</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Write Trace Button/Form */}
        {!isWriting ? (
          <Button
            onClick={() => setIsWriting(true)}
            className="w-full h-16 text-lg font-semibold"
            size="lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Laisser une Trace
          </Button>
        ) : (
          <Card className="p-4 space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre trace anonyme (max 280 caractères)..."
              maxLength={280}
              className="min-h-[100px] resize-none"
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

        {/* Traces List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Traces à cet endroit</h2>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {traces.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Aucune trace ici. Soyez le premier à en laisser une.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {traces.map((trace) => (
                <Card key={trace.id} className="p-4">
                  <p className="text-foreground mb-2">{trace.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(trace.created_at)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={loadTracesAtLocation}
          disabled={isLoading}
          className="w-full"
        >
          Actualiser les traces
        </Button>
      </div>
    </div>
  );
};

export default Index;