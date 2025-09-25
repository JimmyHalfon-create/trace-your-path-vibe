import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";

const SimpleIndex = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getLocation = () => {
    console.log("🔄 Bouton cliqué - Début de getLocation");
    setIsGettingLocation(true);
    console.log("🔄 isGettingLocation mis à true");
    
    if (navigator.geolocation) {
      console.log("✅ Géolocalisation disponible");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Position obtenue:", position.coords);
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsGettingLocation(false);
          console.log("✅ State mis à jour");
        },
        (error) => {
          console.error("❌ Erreur géolocalisation:", error);
          // Position par défaut (Paris)
          setLocation({
            lat: 48.8566,
            lng: 2.3522,
          });
          setIsGettingLocation(false);
          console.log("⚠️ Position par défaut utilisée");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force une nouvelle localisation
        }
      );
    } else {
      console.log("❌ Géolocalisation non disponible");
      // Position par défaut si pas de géolocalisation
      setLocation({
        lat: 48.8566,
        lng: 2.3522,
      });
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">TRACE</h1>
        <p className="text-gray-300">Version simple - Test iOS</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <Globe className="w-24 h-24 text-yellow-400 animate-pulse" />
        
        {!location ? (
          <Card className="p-6 w-full max-w-md bg-gray-900 border-gray-700">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Géolocalisation</h2>
              <p className="text-sm text-gray-400">
                Cette app a besoin de votre position pour fonctionner
              </p>
              <Button 
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Localisation...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Obtenir ma position
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 w-full max-w-md bg-gray-900 border-gray-700">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-green-400">Position trouvée !</h2>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Latitude: {location.lat.toFixed(6)}</p>
                <p>Longitude: {location.lng.toFixed(6)}</p>
              </div>
              <Button 
                onClick={getLocation}
                disabled={isGettingLocation}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
                    Actualisation...
                  </>
                ) : (
                  "Actualiser la position"
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Test de l'app native iOS
          </p>
          <p className="text-xs text-gray-600">
            Si vous voyez ceci, l'app fonctionne !
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleIndex;