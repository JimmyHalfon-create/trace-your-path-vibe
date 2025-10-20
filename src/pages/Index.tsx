import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, MessageSquare, Globe, Mic, Square, Navigation, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MapboxGlobe from "@/components/MapboxGlobe";
import { useProximity } from "@/hooks/useProximity";

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
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();
  const [mapRef, setMapRef] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [recordingTime, setRecordingTime] = useState(0);

  // Système de proximité
  const { nearbyTraces, isTraceAccessible, getDistanceToTrace } = useProximity(location, traces);

  // Get user's current location with high accuracy for iOS Safari
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          setMapError(null);
          
          // Recentrer la carte sur la nouvelle position
          if (mapRef) {
            mapRef.flyTo({
              center: [newLocation.lng, newLocation.lat],
              zoom: 10,
              duration: 2000
            });
          }
          
          toast({
            title: "Position mise à jour",
            description: "La carte est recentrée sur votre position",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Erreur de géolocalisation";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permission refusée. Activez la géolocalisation dans les réglages iOS : Réglages > Confidentialité > Services de localisation";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Position indisponible. Vérifiez votre connexion GPS.";
              break;
            case error.TIMEOUT:
              errorMessage = "Délai d'attente dépassé. Réessayez.";
              break;
          }
          
          setMapError(errorMessage);
          
          toast({
            title: "Géolocalisation",
            description: errorMessage,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 secondes pour iOS
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setMapError("Géolocalisation non supportée");
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      });
    }
  };

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, []);

  // Update location periodically et initialize avec position par défaut
  useEffect(() => {
    // Toujours définir une position par défaut au démarrage
    setLocation({
      lat: 48.8566, // Paris par défaut
      lng: 2.3522,
    });
    
    // Puis essayer d'obtenir la vraie position
    requestLocation();
    const interval = setInterval(requestLocation, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Utiliser le format le plus compatible possible
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
        
      const recorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        setRecordingTime(0);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // Collecte les données toutes les 100ms
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Compte à rebours
      const countdownInterval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 8) {
            clearInterval(countdownInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Auto-stop après 8 secondes
      setTimeout(() => {
        clearInterval(countdownInterval);
        if (recorder.state === 'recording') {
          stopRecording();
          toast({
            title: "Enregistrement terminé",
            description: "Durée maximale de 8 secondes atteinte",
          });
        }
      }, 8000);
    } catch (error) {
      console.error('Recording error:', error);
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
        // Déterminer l'extension en fonction du type
        const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `trace_${Date.now()}.${extension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-traces')
          .upload(fileName, audioBlob, {
            contentType: audioBlob.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
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

  // Toujours afficher l'app, même avec position par défaut
  return (
    <div className="min-h-screen bg-black relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Mapbox Token Input Modal */}
      {showTokenInput && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Token Mapbox requis</h2>
              <p className="text-sm text-muted-foreground">
                Pour afficher la mappemonde 3D, entrez votre token public Mapbox
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="mapbox-token">Token public Mapbox</Label>
              <input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              />
              <div className="text-xs text-muted-foreground">
                Récupérez votre token sur{' '}
                <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  mapbox.com
                </a>{' '}
                dans la section "Tokens"
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (mapboxToken.trim()) {
                    setShowTokenInput(false);
                  }
                }}
                disabled={!mapboxToken.trim()}
                className="flex-1"
              >
                Valider
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowTokenInput(false)}
              >
                Ignorer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Full Screen Globe */}
      <div className="absolute inset-0" style={{ top: 'env(safe-area-inset-top)' }}>
        {location ? (
          <MapboxGlobe
            center={location}
            traces={traces}
            userLocation={location}
            isTraceAccessible={isTraceAccessible}
            getDistanceToTrace={getDistanceToTrace}
            customToken={mapboxToken || undefined}
            onMapReady={setMapRef}
          />
        ) : (
          // Écran de secours si location pas encore définie
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center space-y-4">
              <Globe className="w-16 h-16 text-primary mx-auto animate-pulse" />
              <h1 className="text-3xl font-bold text-primary">TRACE</h1>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Header */}
      <div className="absolute top-8 left-4 right-4 z-10" style={{ top: `calc(env(safe-area-inset-top) + 3rem)` }}>
        <Card className="p-3 shadow-lg bg-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-primary">TRACE</h1>
          </div>
        </Card>
      </div>

      {/* Admin Button - Very discreet */}
      <button
        onClick={() => navigate('/auth')}
        className="absolute top-8 right-4 z-10 opacity-60 active:opacity-100 transition-opacity duration-300 p-2"
        style={{ top: `calc(env(safe-area-inset-top) + 3rem)` }}
        aria-label="Admin"
      >
        <Shield className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Floating Action Button */}
      <div className="absolute bottom-16 left-6 right-6 z-[10000]">
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
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Texte
                </Button>
                <Button 
                  variant={traceType === 'voice' ? 'default' : 'outline'}
                  onClick={() => setTraceType('voice')}
                  className="flex-1"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Vocal
                </Button>
              </div>
              
              {traceType === 'text' ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="message">Votre message</Label>
                    <span className={`text-xs ${message.length > 70 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                      {message.length}/70
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Laissez votre trace ici..."
                    value={message}
                    onChange={(e) => {
                      if (e.target.value.length <= 70) {
                        setMessage(e.target.value);
                      }
                    }}
                    className="mt-1"
                    maxLength={70}
                  />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  {!isRecording && !audioBlob && (
                    <Button onClick={startRecording} variant="outline" className="w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700">
                      <Mic className="w-4 h-4 mr-2" />
                      Commencer l'enregistrement
                    </Button>
                  )}
                  
                  {isRecording && (
                    <div className="space-y-3">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          Enregistrement en cours...
                        </div>
                        <div className="text-4xl font-bold text-primary">
                          {recordingTime}s / 8s
                        </div>
                        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${(recordingTime / 8) * 100}%` }}
                          />
                        </div>
                      </div>
                      <Button onClick={stopRecording} variant="destructive" className="w-full">
                        <Square className="w-4 h-4 mr-2" />
                        Arrêter l'enregistrement
                      </Button>
                    </div>
                  )}
                  
                  {audioBlob && !isRecording && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Message vocal prêt
                      </div>
                      <audio 
                        controls 
                        preload="auto"
                        src={URL.createObjectURL(audioBlob)}
                        className="w-full"
                        style={{ maxHeight: '40px' }}
                        playsInline
                        webkit-playsinline="true"
                      />
                      <Button 
                        onClick={() => {
                          setAudioBlob(null);
                          startRecording();
                        }} 
                        variant="outline" 
                        className="w-full"
                      >
                        <Mic className="w-4 h-4 mr-2" />
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

      {/* Traces Count and Location Update */}
      <div className="absolute top-28 right-4 z-10 space-y-2" style={{ top: `calc(env(safe-area-inset-top) + 7rem)` }}>
        {/* Compteur de traces */}
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
        
        {/* Traces à proximité */}
        {nearbyTraces.length > 0 && (
          <Card className="p-2 shadow-lg bg-yellow-500/20 backdrop-blur-sm border-yellow-500/50">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-yellow-700">{nearbyTraces.length}</span>
              <span className="text-yellow-600 text-xs">proche{nearbyTraces.length > 1 ? 's' : ''}</span>
            </div>
          </Card>
        )}
        
        {/* Bouton de géolocalisation */}
        <Card className="p-2 shadow-lg bg-background/80 backdrop-blur-sm border-border/50">
          <Button
            onClick={requestLocation}
            variant="ghost"
            size="sm"
            className="w-full p-1 h-8"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Index;