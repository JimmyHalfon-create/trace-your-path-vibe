import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      style: 'mapbox://styles/mapbox/satellite-v9',
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
    map.current.scrollZoom.enable(); // Permet le zoom avec la molette
    map.current.touchZoomRotate.enable(); // Permet le zoom tactile

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(5, 5, 15)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(0, 0, 0)',
        'star-intensity': 0.8,
      });
    });

    // Rotation animation
    const secondsPerRevolution = 120;
    let userInteracting = false;

    function spinGlobe() {
      if (!map.current || userInteracting) return;
      
      const distancePerSecond = 360 / secondsPerRevolution;
      const center = map.current.getCenter();
      center.lng -= distancePerSecond;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    }

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
    map.current.on('mouseup', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 1000);
    });
    map.current.on('touchend', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 1000);
    });
    map.current.on('moveend', () => {
      if (!userInteracting) spinGlobe();
    });

    // Start spinning
    spinGlobe();

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

    // Add current position marker
    const currentMarker = new mapboxgl.Marker({
      color: '#ef4444',
      scale: 1.2
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);
    markers.current.push(currentMarker);

    // Add trace markers
    traces.forEach(trace => {
      const marker = new mapboxgl.Marker({
        color: '#fbbf24',
        scale: 0.8
      })
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