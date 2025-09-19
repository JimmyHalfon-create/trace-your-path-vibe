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

    // Add current position marker (small golden)
    const currentMarker = new mapboxgl.Marker({
      color: '#fbbf24',
      scale: 0.7
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);
    markers.current.push(currentMarker);

    // Add trace markers (custom icon)
    traces.forEach(trace => {
      // Create custom element for the trace icon
      const el = document.createElement('div');
      el.style.backgroundImage = `url(${traceIcon})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.filter = 'brightness(0) saturate(100%) invert(67%) sepia(79%) saturate(1739%) hue-rotate(8deg) brightness(102%) contrast(92%)'; // Apply golden color
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([trace.longitude, trace.latitude])
        .setPopup(new mapboxgl.Popup().setText(trace.message))
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