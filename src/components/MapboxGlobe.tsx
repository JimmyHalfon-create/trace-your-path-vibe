import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import traceIcon from '@/assets/trace-icon.svg';

interface Trace {
  id: string;
  latitude: number;
  longitude: number;
  message: string;
  created_at: string;
  trace_type: 'text' | 'voice';
  audio_url?: string;
}

interface MapboxGlobeProps {
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  isTraceAccessible: (trace: Trace) => boolean;
  getDistanceToTrace: (trace: Trace) => number | null;
  traces?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    message: string;
    created_at: string;
    trace_type: 'text' | 'voice';
    audio_url?: string;
  }>;
}

const MapboxGlobe = ({ center, traces = [], userLocation, isTraceAccessible, getDistanceToTrace }: MapboxGlobeProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFtZXNoYWxmb24iLCJhIjoiY21mcW5heHk2MDBnMDJpczk0czdvOXUzNSJ9.Y4ToOLdwjWzuJxIn_v9EBg';

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [center.lng, center.lat],
      pitch: 0,
    });

    // Enable zoom and rotation for interaction
    map.current.boxZoom.disable();
    map.current.doubleClickZoom.enable();
    map.current.dragRotate.enable();
    map.current.keyboard.disable();
    map.current.scrollZoom.enable();
    map.current.touchZoomRotate.enable();

    // Style customization for outline look
    map.current.on('style.load', () => {
      // Try to customize borders with app colors (golden)
      try {
        map.current?.setPaintProperty('country-boundaries', 'line-color', '#fbbf24');
        map.current?.setPaintProperty('country-boundaries', 'line-width', 1.5);
        map.current?.setPaintProperty('country-boundaries', 'line-opacity', 0.8);
      } catch (e) {
        // Fallback if layer doesn't exist
        console.log('Style customization not available');
      }
      
      // Add fog effects (without stars)
      map.current?.setFog({
        color: '#0a0a0a',
        'high-color': '#1a1a1a',
        'horizon-blend': 0.05,
        'space-color': '#000000',
        'star-intensity': 0,
      });
    });

    // Rotation animation (disabled - no auto rotation)
    let userInteracting = false;

    // Click handler removed - user location is fixed

    // Interaction handlers
    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; });
    map.current.on('touchend', () => { userInteracting = false; });

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [center.lat, center.lng]);

  // Update markers when traces change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add current position marker (persistent at all zoom levels)
    const currentEl = document.createElement('div');
    currentEl.style.width = '16px';
    currentEl.style.height = '16px';
    currentEl.style.borderRadius = '50%';
    currentEl.style.backgroundColor = '#fbbf24';
    currentEl.style.border = '2px solid #000';
    currentEl.style.boxShadow = '0 0 10px rgba(251, 191, 36, 0.6)';
    currentEl.style.zIndex = '9999';
    currentEl.style.pointerEvents = 'none';
    
    const currentMarker = new mapboxgl.Marker({
      element: currentEl,
      anchor: 'center',
      pitchAlignment: 'map',
      rotationAlignment: 'map'
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);
    markers.current.push(currentMarker);

    // Add trace markers with proximity check
    console.log('Rendering traces:', traces.length);
    traces.forEach(trace => {
      const isAccessible = isTraceAccessible(trace);
      const distance = getDistanceToTrace(trace);
      
      console.log(`Trace ${trace.id}: accessible=${isAccessible}, distance=${distance ? Math.round(distance) : 'null'}m`);
      
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #000';
      el.style.cursor = isAccessible ? 'pointer' : 'not-allowed';
      el.style.zIndex = '9998';
      el.style.position = 'relative';
      
      // Vérifier si la trace est récente (dernière heure)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const traceCreatedAt = new Date(trace.created_at);
      const isRecentlyCreated = traceCreatedAt > oneHourAgo;
      
      // Style différent selon l'accessibilité
      if (isAccessible) {
        if (isRecentlyCreated) {
          el.style.backgroundColor = '#fbbf24'; // Jaune si accessible
          el.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.8)'; // Halo plus fort pour les nouvelles traces
          el.style.border = '3px solid #f59e0b'; // Bordure plus épaisse
        } else {
          el.style.backgroundColor = '#fbbf24'; // Jaune si accessible
          el.style.boxShadow = '0 0 8px rgba(251, 191, 36, 0.5)';
        }
      } else {
        el.style.backgroundColor = '#4b5563'; // Gris foncé contrasté si non accessible
        el.style.boxShadow = '0 0 8px rgba(75, 85, 99, 0.4)';
        el.style.opacity = '0.8';
      }
      
      // Add cross symbol (toujours le même symbole)
      const cross = document.createElement('div');
      cross.innerHTML = '⊕';
      cross.style.color = '#000';
      cross.style.fontSize = '14px';
      cross.style.fontWeight = 'bold';
      cross.style.position = 'absolute';
      cross.style.top = '50%';
      cross.style.left = '50%';
      cross.style.transform = 'translate(-50%, -50%)';
      cross.style.pointerEvents = 'none';
      el.appendChild(cross);
      
      // Add click event - only works if accessible
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (!isAccessible) {
          // Créer une popup d'information sur la distance
          const distanceText = distance ? `${Math.round(distance)}m` : 'loin';
          
          const infoPopup = new mapboxgl.Popup({ 
            closeButton: false,
            closeOnClick: true,
            maxWidth: '200px'
          }).setHTML(`
            <div class="text-sm p-3 text-center" style="font-family: system-ui, -apple-system, sans-serif;">
              <p style="color: #4b5563; font-weight: 500; margin-bottom: 4px;">Trace non accessible</p>
              <p style="color: #6b7280; font-size: 11px;">Rapprochez-vous pour la découvrir</p>
              <p style="color: #fbbf24; font-size: 11px; font-weight: bold;">Distance: ${distanceText}</p>
            </div>
          `);
          
          marker.setPopup(infoPopup);
          marker.togglePopup();
          return;
        }

        // Close any open popups first
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => popup.remove());
        
        // Open this marker's popup
        marker.togglePopup();
      });
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport'
      })
        .setLngLat([trace.longitude, trace.latitude]);

      // Add popup only if accessible
      if (isAccessible) {
        marker.setPopup(new mapboxgl.Popup({ 
          closeButton: false,
          closeOnClick: true,
          maxWidth: '280px'
        }).setHTML(`
          <div class="text-sm p-3" style="font-family: system-ui, -apple-system, sans-serif;">
            ${trace.trace_type === 'voice' ? 
              `<div class="flex flex-col items-center gap-2 mb-2">
                <button id="playBtn-${trace.id}" onclick="
                  const audio = this.nextElementSibling;
                  const btn = this;
                  if (audio.paused) {
                    audio.play();
                    btn.innerHTML = '⏸';
                    audio.onended = () => { btn.innerHTML = '▶'; };
                    audio.onpause = () => { btn.innerHTML = '▶'; };
                  } else {
                    audio.pause();
                    btn.innerHTML = '▶';
                  }
                " style="background: #fbbf24; color: #000; border: none; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; font-weight: bold;">
                  ▶
                </button>
                <audio preload="metadata" style="display: none;">
                  <source src="${trace.audio_url}" type="audio/webm">
                  <source src="${trace.audio_url}" type="audio/wav">
                  <source src="${trace.audio_url}" type="audio/mp3">
                </audio>
              </div>` 
              : 
              `<p style="color: #111827; font-weight: 500; margin-bottom: 8px; line-height: 1.4;">${trace.message}</p>`
            }
            <p style="color: #6b7280; font-size: 11px; margin: 0;">${new Date(trace.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit'
            })}</p>
          </div>
        `));
      }
      
      marker.addTo(map.current!);
      markers.current.push(marker);
    });
  }, [traces, center, isTraceAccessible, getDistanceToTrace]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxGlobe;