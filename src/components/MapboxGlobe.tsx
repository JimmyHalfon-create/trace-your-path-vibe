import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import traceIcon from '@/assets/trace-icon.svg';

interface MapboxGlobeProps {
  center: { lat: number; lng: number };
  onGlobeClick?: (location: { lat: number; lng: number }) => void;
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

const MapboxGlobe = ({ center, onGlobeClick, traces = [] }: MapboxGlobeProps) => {
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

    // Click handler
    map.current.on('click', (e) => {
      if (onGlobeClick) {
        onGlobeClick({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        });
      }
    });

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
  }, [center.lat, center.lng, onGlobeClick]);

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

    // Add trace markers (persistent at all zoom levels)
    traces.forEach(trace => {
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#fbbf24';
      el.style.border = '2px solid #000';
      el.style.cursor = 'pointer';
      el.style.zIndex = '9998';
      el.style.position = 'relative';
      el.style.boxShadow = '0 0 8px rgba(251, 191, 36, 0.5)';
      
      // Add cross symbol
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
      
      // Add click event to open popup
      el.addEventListener('click', (e) => {
        e.stopPropagation();
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
        .setLngLat([trace.longitude, trace.latitude])
        .setPopup(new mapboxgl.Popup({ 
          closeButton: false,
          closeOnClick: true,
          maxWidth: '300px'
        }).setHTML(`
          <div class="text-sm p-2">
            <p class="font-medium mb-2">${trace.message}</p>
            ${trace.trace_type === 'voice' && trace.audio_url ? 
              `<div class="mt-2">
                <audio controls preload="metadata" style="width: 100%; height: 32px;">
                  <source src="${trace.audio_url}" type="audio/webm">
                  <source src="${trace.audio_url}" type="audio/wav">
                  <source src="${trace.audio_url}" type="audio/mp3">
                  Votre navigateur ne supporte pas l'audio.
                </audio>
              </div>` : ''
            }
            <p class="text-xs text-gray-500 mt-2">${new Date(trace.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit'
            })}</p>
          </div>
        `))
        .addTo(map.current!);
      markers.current.push(marker);
    });
  }, [traces, center]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxGlobe;