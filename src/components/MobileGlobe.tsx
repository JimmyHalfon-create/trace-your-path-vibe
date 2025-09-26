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
}

const MobileGlobe = ({ center, traces, userLocation, isTraceAccessible, getDistanceToTrace, customToken }: MobileGlobeProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset error state when props change
    setHasError(false);
    setIsLoaded(false);
    
    // Add a timeout to detect if the globe fails to load
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [center]);

  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="p-6 mx-4 text-center space-y-4 bg-background/90 backdrop-blur-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Vue simplifiée</h2>
            <p className="text-sm text-muted-foreground">
              La carte 3D n'est pas disponible sur cet appareil
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Position actuelle</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-secondary-foreground" />
                <span className="text-sm font-medium">Traces totales</span>
              </div>
              <span className="text-sm font-semibold">{traces.length}</span>
            </div>
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
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <Globe className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h1 className="text-3xl font-bold text-primary">TRACE</h1>
            <p className="text-muted-foreground">Chargement de la mappemonde...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGlobe;