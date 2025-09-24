import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, MessageSquare, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MapboxGlobe from "@/components/MapboxGlobe";

interface Trace {
  id: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
  trace_type: 'text' | 'voice';
  audio_url?: string;
}

const Index = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [message, setMessage] = useState("");
  const [traceType, setTraceType] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
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

  // Load all traces globally (not just nearby)
  const loadAllTraces = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("traces")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTraces((data || []) as Trace[]);
    } catch (error) {
      console.error("Error loading traces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load all traces when component mounts
    loadAllTraces();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const submitTrace = async () => {
    if (!location) {
      toast({
        title: "Erreur",
        description: "Veuillez vous géolocaliser",
        variant: "destructive",
      });
      return;
    }

    if (traceType === 'text' && !message) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un message",
        variant: "destructive",
      });
      return;
    }

    if (traceType === 'voice' && !audioBlob) {
      toast({
        title: "Erreur",
        description: "Veuillez enregistrer un message vocal",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      let audioUrl = null;
      
      if (traceType === 'voice' && audioBlob) {
        const fileName = `trace_${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-traces')
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('voice-traces')
          .getPublicUrl(fileName);
        
        audioUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('traces')
        .insert([
          {
            latitude: location.lat,
            longitude: location.lng,
            message: traceType === 'text' ? message : 'Message vocal',
            trace_type: traceType,
            audio_url: audioUrl,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Trace laissée",
        description: "Votre trace a été ajoutée avec succès !",
      });
      
      setMessage("");
      setAudioBlob(null);
      setIsWriting(false);
      loadAllTraces();
    } catch (error) {
      console.error('Error submitting trace:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la trace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-black relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Full Screen Globe */}
      <div className="absolute inset-0" style={{ top: 'env(safe-area-inset-top)' }}>
        <MapboxGlobe
          center={location}
          traces={traces}
          onGlobeClick={(newLocation) => {
            setLocation(newLocation);
          }}
        />
      </div>

      {/* Floating Header */}
      <div className="absolute top-8 left-4 right-4 z-10" style={{ top: `calc(env(safe-area-inset-top) + 3rem)` }}>
        <Card className="p-3 shadow-lg bg-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-primary">TRACE</h1>
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-16 left-6 right-6 z-10">
        {!isWriting ? (
          <Button
            onClick={() => setIsWriting(true)}
            className="w-full h-14 text-lg font-semibold shadow-lg"
            size="lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Laisser une Trace
          </Button>
        ) : null}
        
        {isWriting && (
          <Card className="absolute bottom-20 left-4 right-4 mx-auto max-w-md p-4 bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={traceType === 'text' ? 'default' : 'outline'}
                  onClick={() => setTraceType('text')}
                  className="flex-1"
                >
                  Texte
                </Button>
                <Button 
                  variant={traceType === 'voice' ? 'default' : 'outline'}
                  onClick={() => setTraceType('voice')}
                  className="flex-1"
                >
                  Vocal
                </Button>
              </div>
              
              {traceType === 'text' ? (
                <div>
                  <Label htmlFor="message">Votre message</Label>
                  <Textarea
                    id="message"
                    placeholder="Laissez votre trace ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1"
                  />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  {!isRecording && !audioBlob && (
                    <Button onClick={startRecording} variant="outline" className="w-full">
                      🎤 Commencer l'enregistrement
                    </Button>
                  )}
                  
                  {isRecording && (
                    <div className="space-y-2">
                      <div className="text-red-500 font-medium">🔴 Enregistrement en cours...</div>
                      <Button onClick={stopRecording} variant="destructive" className="w-full">
                        Arrêter l'enregistrement
                      </Button>
                    </div>
                  )}
                  
                  {audioBlob && !isRecording && (
                    <div className="space-y-2">
                      <div className="text-green-600 font-medium">✅ Message vocal prêt</div>
                      <audio 
                        controls 
                        src={URL.createObjectURL(audioBlob)}
                        className="w-full"
                      />
                      <Button 
                        onClick={() => {
                          setAudioBlob(null);
                          startRecording();
                        }} 
                        variant="outline" 
                        className="w-full"
                      >
                        Réenregistrer
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={submitTrace} disabled={isLoading} className="flex-1">
                  {isLoading ? "Envoi..." : "Laisser la trace"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsWriting(false);
                    setAudioBlob(null);
                    if (isRecording) stopRecording();
                  }}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Traces Count Indicator */}
      <div className="absolute top-28 right-4 z-10" style={{ top: `calc(env(safe-area-inset-top) + 7rem)` }}>
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