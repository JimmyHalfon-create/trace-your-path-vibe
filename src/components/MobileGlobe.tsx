import { useEffect, useState } from 'react';
import { Globe, MapPin, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import MapboxGlobe from './MapboxGlobe';

interface MobileGlobeProps {
  center: { lat: number; lng: number };
  traces: any[];
  userLocation: { lat: number; lng: number };
  isTraceAccessible: (trace: any) => boolean;
  getDistanceToTrace: (trace: any) => number | null;
  customToken?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const MobileGlobe = ({ center, traces, userLocation, isTraceAccessible, getDistanceToTrace, customToken, onLoad, onError }: MobileGlobeProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initialisation...');

  useEffect(() => {
    // Reset error state when props change
    setHasError(false);
    setIsLoaded(false);
    setLoadingStatus('Démarrage du chargement...');
    
    // Give more time for Mapbox to load and don't auto-switch to fallback
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.log('Mapbox loading taking longer than expected - keeping map visible');
        setLoadingStatus('Chargement en cours...');
        // Don't set hasError, just update status
      }
    }, 15000); // 15 seconds, but don't switch to fallback

    return () => clearTimeout(timeout);
  }, [center, isLoaded]);

  // Debug: Log when callbacks are called
  const handleLoad = () => {
    console.log('Mapbox loaded successfully');
    setIsLoaded(true);
    setLoadingStatus('Mappemonde chargée !');
    onLoad?.();
  };

  const handleError = (error?: any) => {
    console.error('Mapbox error:', error);
    setLoadingStatus('Erreur détectée - basculement en vue simplifiée');
    setTimeout(() => setHasError(true), 2000);
    onError?.();
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="p-6 mx-4 text-center space-y-4 bg-background/90 backdrop-blur-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">TRACE</h2>
            <p className="text-sm text-muted-foreground">
              Application mobile - Vue simplifiée
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Position</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-secondary-foreground" />
                <span className="text-sm font-medium">Traces</span>
              </div>
              <span className="text-sm font-semibold">{traces.length}</span>
            </div>
            {traces.filter(trace => isTraceAccessible(trace)).length > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Accessibles</span>
                </div>
                <span className="text-sm font-semibold text-green-700">
                  {traces.filter(trace => isTraceAccessible(trace)).length}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <MapboxGlobe
        center={center}
        traces={traces}
        userLocation={userLocation}
        isTraceAccessible={isTraceAccessible}
        getDistanceToTrace={getDistanceToTrace}
        customToken={customToken}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <Globe className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h1 className="text-3xl font-bold text-primary">TRACE</h1>
            <p className="text-muted-foreground">{loadingStatus}</p>
            <div className="text-xs text-muted-foreground mt-4 max-w-xs">
              Token: {customToken ? `${customToken.substring(0, 10)}...` : 'Aucun'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGlobe;