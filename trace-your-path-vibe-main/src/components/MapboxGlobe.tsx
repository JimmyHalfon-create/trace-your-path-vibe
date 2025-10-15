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
  customToken?: string;
  onLoad?: () => void;
  onError?: () => void;
  onMapReady?: (map: any) => void;
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

const MapboxGlobe = ({ center, traces = [], userLocation, isTraceAccessible, getDistanceToTrace, customToken, onLoad, onError, onMapReady }: MapboxGlobeProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const currentMarker = useRef<mapboxgl.Marker | null>(null);
  const MAPBOX_TOKEN = customToken || 'pk.eyJ1IjoiamFtZXNoYWxmb24iLCJhIjoiY21nMHR0eG4zMGhxaTJrczlmOGc2aW1zbSJ9.qsZBAk4Ny_SA5RftJOmIXg';

  useEffect(() => {
    if (!mapContainer.current) return;

    // Prevent errors from bubbling up that could cause redirects
    const errorHandler = (e: ErrorEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Mapbox error handled:', e.error);
    };
    window.addEventListener('error', errorHandler);

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [center.lng, center.lat],
      pitch: 0,
      antialias: true
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
      
      // Call onLoad callback when map is ready
      if (onLoad) {
        // Add a small delay to ensure everything is rendered
        setTimeout(() => {
          onLoad();
        }, 1000);
      }
    });

    // Handle map errors
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      if (onError) {
        onError();
      }
    });

    // Rotation animation (disabled - no auto rotation)
    let userInteracting = false;

    // Click handler removed - user location is fixed

    // Interaction handlers
    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; });
    map.current.on('touchend', () => { userInteracting = false; });

    // Handle zoom changes to resize markers
    map.current.on('zoom', () => {
      updateMarkerSizes();
    });

    // Pass map reference to parent component
    if (onMapReady) {
      onMapReady(map.current);
    }

    // Cleanup
    return () => {
      // Remove error handler
      window.removeEventListener('error', errorHandler);
      
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      if (currentMarker.current) {
        currentMarker.current.remove();
      }
      map.current?.remove();
    };
  }, [center.lat, center.lng, onMapReady]);

  // Function to calculate marker size based on zoom level
  const getMarkerSize = (baseSize: number, isUserMarker: boolean = false) => {
    if (!map.current) return baseSize;
    
    const zoom = map.current.getZoom();
    // Zoom scale: 1.5 (globe view) to 15+ (street level)
    // At zoom 1.5: markers should be smaller (50% of base size)
    // At zoom 8+: markers should be full size (100% of base size)
    
    let scale;
    if (zoom <= 2) {
      scale = 0.6; // Plus visible au zoom globe
    } else if (zoom <= 4) {
      scale = 0.8; // Plus visible
    } else if (zoom <= 6) {
      scale = 1.0; // Taille normale
    } else {
      scale = 1.2; // Encore plus grand en zoom proche
    }
    
    // Le marqueur utilisateur est toujours un peu plus petit
    if (isUserMarker) {
      scale *= 0.8;
    }
    
    return Math.max(baseSize * scale, 12); // Minimum 12px (au lieu de 8px)
  };

  // Function to update all marker sizes based on current zoom
  const updateMarkerSizes = () => {
    if (!map.current) return;

    // Update user marker size
    if (currentMarker.current) {
      const userEl = currentMarker.current.getElement();
      const newSize = getMarkerSize(14, true);
      userEl.style.width = `${newSize}px`;
      userEl.style.height = `${newSize}px`;
      
      // Update pulse size too
      const pulse = userEl.querySelector('div');
      if (pulse) {
        const pulseSize = newSize + 12;
        pulse.style.width = `${pulseSize}px`;
        pulse.style.height = `${pulseSize}px`;
        pulse.style.top = `-${(pulseSize - newSize) / 2}px`;
        pulse.style.left = `-${(pulseSize - newSize) / 2}px`;
      }
    }

    // Update trace markers size
    markers.current.forEach(marker => {
      const el = marker.getElement();
      if (el && !el.classList.contains('user-marker')) {
        const newSize = getMarkerSize(24);
        el.style.width = `${newSize}px`;
        el.style.height = `${newSize}px`;
      }
    });
  };

  // Update markers when traces change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers (except user marker)
    markers.current.forEach(marker => {
      if (!marker.getElement().classList.contains('user-marker')) {
        marker.remove();
      }
    });
    markers.current = markers.current.filter(marker => 
      marker.getElement().classList.contains('user-marker')
    );

    // Add current position marker (persistent at all zoom levels)
    if (currentMarker.current) {
      currentMarker.current.remove();
    }
    
    const userSize = getMarkerSize(14, true);
    const currentEl = document.createElement('div');
    currentEl.className = 'user-marker';
    currentEl.style.width = `${userSize}px`;
    currentEl.style.height = `${userSize}px`;
    currentEl.style.borderRadius = '50%';
    currentEl.style.backgroundColor = '#9ca3af'; // Gris clair
    currentEl.style.border = '3px solid #ffffff'; // Bordure blanche
    currentEl.style.boxShadow = '0 0 12px rgba(156, 163, 175, 0.8)';
    currentEl.style.zIndex = '10000'; // Plus haut que les traces
    currentEl.style.pointerEvents = 'none';
    
    // Add pulse animation
    const pulseSize = userSize + 12;
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.top = `-${(pulseSize - userSize) / 2}px`;
    pulse.style.left = `-${(pulseSize - userSize) / 2}px`;
    pulse.style.width = `${pulseSize}px`;
    pulse.style.height = `${pulseSize}px`;
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = 'rgba(156, 163, 175, 0.2)';
    pulse.style.animation = 'pulse 2s infinite';
    pulse.style.pointerEvents = 'none';
    currentEl.appendChild(pulse);
    
    // Add CSS animation for pulse if not already added
    if (!document.querySelector('#user-pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'user-pulse-animation';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
    
    currentMarker.current = new mapboxgl.Marker({
      element: currentEl,
      anchor: 'center',
      pitchAlignment: 'map',
      rotationAlignment: 'map'
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);
    markers.current.push(currentMarker.current);

    // Add trace markers with proximity check
    console.log('Rendering traces:', traces.length);
    traces.forEach(trace => {
      const isAccessible = isTraceAccessible(trace);
      const distance = getDistanceToTrace(trace);
      
      console.log(`Trace ${trace.id}: accessible=${isAccessible}, distance=${distance ? Math.round(distance) : 'null'}m`);
      
      const traceSize = getMarkerSize(32); // Taille de base augmentée de 24 à 32
      const el = document.createElement('div');
      el.style.width = `${traceSize}px`;
      el.style.height = `${traceSize}px`;
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #000'; // Bordure plus épaisse
      el.style.cursor = isAccessible ? 'pointer' : 'not-allowed';
      el.style.zIndex = '9998';
      el.style.position = 'relative';
      el.style.transition = 'all 0.2s ease';
      
      // Style différent selon l'accessibilité avec glow plus prononcé
      if (isAccessible) {
        el.style.backgroundColor = '#fbbf24'; // Orange/jaune si accessible
        el.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.9), 0 0 40px rgba(251, 191, 36, 0.5)'; // Double glow orange
        el.style.opacity = '1';
      } else {
        el.style.backgroundColor = '#6b7280'; // Gris si non accessible
        el.style.boxShadow = '0 0 16px rgba(107, 116, 128, 0.7), 0 0 32px rgba(107, 116, 128, 0.4)'; // Double glow gris
        el.style.opacity = '0.75';
      }
      
      // Add cross symbol (ajusté selon la taille)
      const cross = document.createElement('div');
      cross.innerHTML = '⊕';
      cross.style.color = '#000';
      cross.style.fontSize = `${Math.max(traceSize * 0.6, 10)}px`; // Ajusté selon la taille du marqueur
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
              <p style="color: #dc2626; font-weight: 600; margin-bottom: 4px;">🔒 Trace verrouillée</p>
              <p style="color: #6b7280; font-size: 11px;">Rapprochez-vous pour la découvrir</p>
              <p style="color: #ef4444; font-size: 12px; font-weight: bold;">Distance: ${distanceText}</p>
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
        pitchAlignment: 'map',
        rotationAlignment: 'map'
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
                    audio.onended = () => { 
                      btn.innerHTML = '▶'; 
                    };
                    audio.onpause = () => { 
                      btn.innerHTML = '▶';
                    };
                  } else {
                    audio.pause();
                    btn.innerHTML = '▶';
                  }
                " style="background: #fbbf24; color: #000; border: none; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
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