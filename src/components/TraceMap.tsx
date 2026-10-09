import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LatLng, Trace } from "@/lib/traces";

// Public Mapbox token (publishable, safe in client code).
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamFtZXNoYWxmb24iLCJhIjoiY21nMHR0eG4zMGhxaTJrczlmOGc2aW1zbSJ9.qsZBAk4Ny_SA5RftJOmIXg";

/** Tiny at globe level, grows smoothly when zooming in. */
const zoomScale = (zoom: number) =>
  zoom <= 2 ? 0.15 + zoom * 0.03 : zoom <= 8 ? 0.2 + ((zoom - 2) / 6) * 0.8 : 1 + (zoom - 8) * 0.1;

interface Props {
  user: LatLng | null;
  traces: Trace[];
  isUnlocked: (t: Trace) => boolean;
  onSelect: (t: Trace) => void;
  onReady?: (map: mapboxgl.Map) => void;
}

const TraceMap = ({ user, traces, isUnlocked, onSelect, onReady }: Props) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const traceMarkers = useRef<mapboxgl.Marker[]>([]);
  const centered = useRef(false);

  // Init map once
  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe" as never,
      center: [2.3522, 48.8566],
      zoom: 1.5,
      attributionControl: false,
    });
    m.keyboard.disable();
    m.boxZoom.disable();

    const applyScale = () =>
      container.current?.style.setProperty("--marker-scale", String(zoomScale(m.getZoom())));
    applyScale();
    m.on("zoom", applyScale);

    m.on("style.load", () => {
      m.setFog({
        color: "#0a0a0a",
        "high-color": "#1a1a1a",
        "horizon-blend": 0.05,
        "space-color": "#000000",
        "star-intensity": 0,
      });
      try {
        m.setPaintProperty("country-boundaries", "line-color", "#fbbf24");
        m.setPaintProperty("country-boundaries", "line-opacity", 0.8);
      } catch {
        /* layer may not exist */
      }
    });

    map.current = m;
    onReady?.(m);
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User marker + first centering
  useEffect(() => {
    const m = map.current;
    if (!m || !user) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "user-marker";
      userMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(m);
    } else {
      userMarker.current.setLngLat([user.lng, user.lat]);
    }
    if (!centered.current) {
      centered.current = true;
      m.flyTo({ center: [user.lng, user.lat], zoom: 10, duration: 2000 });
    }
  }, [user]);

  // Trace markers
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    traceMarkers.current.forEach((mk) => mk.remove());
    traceMarkers.current = traces.map((t) => {
      const el = document.createElement("button");
      el.className = `trace-marker ${isUnlocked(t) ? "is-unlocked" : "is-locked"}`;
      el.setAttribute("aria-label", "Trace");
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(t);
      });
      return new mapboxgl.Marker({ element: el }).setLngLat([t.longitude, t.latitude]).addTo(m);
    });
  }, [traces, isUnlocked, onSelect]);

  return <div ref={container} className="absolute inset-0" />;
};

export default TraceMap;
