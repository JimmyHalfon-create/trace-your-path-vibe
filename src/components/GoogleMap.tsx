import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  traces?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    message: string;
    created_at: string;
  }>;
}

const GoogleMap = ({ center, zoom = 15, onMapClick, traces = [] }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    console.log("GoogleMap useEffect déclenché, center:", center);
    if (!mapRef.current) return;
    
    const initMap = async () => {
      console.log("Initialisation de la carte...");
      const loader = new Loader({
        apiKey: "AIzaSyA1I3Y6cWJgIv0ln6Qe5R_ifHSH4oGEaTE",
        version: "weekly",
        libraries: ["places"]
      });
      console.log("Loader Google Maps créé");

      try {
        console.log("Chargement de Google Maps API...");
        await loader.load();
        console.log("Google Maps API chargé avec succès");
        
        if (mapRef.current && !map) {
          console.log("Création de l'instance de carte...");
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeId: google.maps.MapTypeId.SATELLITE, // Style Earth-like
            tilt: 45, // Vue 3D comme Google Earth
            styles: [
              {
                stylers: [
                  { saturation: -20 },
                  { lightness: -10 }
                ]
              }
            ],
            // Supprimer tous les contrôles pour interface épurée
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            rotateControl: false,
            scaleControl: false,
            panControl: false,
            gestureHandling: 'greedy',
            disableDefaultUI: true,
          });

          setMap(mapInstance);
          console.log("Carte créée avec succès");

          // Add click listener
          if (onMapClick) {
            mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                onMapClick({
                  lat: event.latLng.lat(),
                  lng: event.latLng.lng(),
                });
              }
            });
          }

          // Add user location marker
          new google.maps.Marker({
            position: center,
            map: mapInstance,
            title: "Votre position",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "hsl(42, 100%, 70%)",
              fillOpacity: 1,
              strokeColor: "hsl(220, 15%, 8%)",
              strokeWeight: 2,
            },
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    if (!map) {
      initMap();
    }
  }, [center, zoom, onMapClick, map]);

  // Update trace markers when traces change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Add new trace markers
    const newMarkers = traces.map(trace => {
      const marker = new google.maps.Marker({
        position: { lat: trace.latitude, lng: trace.longitude },
        map,
        title: trace.message.substring(0, 50) + "...",
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "hsl(42, 100%, 70%)",
          fillOpacity: 0.8,
          strokeColor: "hsl(220, 15%, 8%)",
          strokeWeight: 1,
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #1a1a1a; max-width: 200px;">
            <p style="margin: 0 0 8px 0; font-weight: 500;">${trace.message}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date(trace.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, traces]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "400px" }}
    />
  );
};

export default GoogleMap;