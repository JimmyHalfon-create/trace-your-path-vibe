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

  // Mapbox clusters nearby coordinates; only visible clusters/points get markers.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const sourceId = "trace-clusters";
    const byId = new Map(traces.map((t) => [t.id, t]));
    let disposed = false;
    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: traces.map((t) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [t.longitude, t.latitude] },
        properties: { traceId: t.id },
      })),
    };

    const renderMarkers = () => {
      if (disposed || !m.getSource(sourceId)) return;
      traceMarkers.current.forEach((marker) => marker.remove());
      traceMarkers.current = [];
      const seen = new Set<string>();
      for (const feature of m.querySourceFeatures(sourceId)) {
        if (feature.geometry.type !== "Point") continue;
        const properties = feature.properties;
        if (!properties) continue;
        const clustered = Boolean(properties.cluster);
        const key = clustered ? `cluster-${properties.cluster_id}` : `trace-${properties.traceId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const trace = byId.get(properties.traceId);
        if (!clustered && !trace) continue;
        const coordinates = feature.geometry.coordinates;
        const center: [number, number] = [coordinates[0], coordinates[1]];
        const el = document.createElement("button");
        el.type = "button";
        el.className = clustered
          ? "trace-cluster"
          : `trace-marker ${trace && isUnlocked(trace) ? "is-unlocked" : "is-locked"}`;
        el.setAttribute("aria-label", clustered ? `${properties.point_count} traces — zoomer` : "Trace");
        if (clustered) el.textContent = String(properties.point_count);
        el.addEventListener("click", async (event) => {
          event.stopPropagation();
          if (!clustered) {
            if (trace) onSelect(trace);
            return;
          }
          const source = m.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
          if (!source) return;
          try {
            const zoom = await source.getClusterExpansionZoom(Number(properties.cluster_id));
            if (!disposed) m.easeTo({ center, zoom: Math.min(zoom, m.getMaxZoom()), duration: 600 });
          } catch {
            // A data refresh can retire the clicked cluster before zoom resolves.
          }
        });
        traceMarkers.current.push(new mapboxgl.Marker({ element: el }).setLngLat(center).addTo(m));
      }
    };

    const setupSource = () => {
      if (disposed) return;
      const existing = m.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (existing) existing.setData(data);
      else m.addSource(sourceId, {
        type: "geojson", data, cluster: true, clusterRadius: 32,
        clusterMaxZoom: 22, maxzoom: 24,
      });
      // Invisible layer ensures Mapbox loads and updates the source's visible tiles.
      if (!m.getLayer(sourceId)) m.addLayer({
        id: sourceId, type: "circle", source: sourceId,
        paint: { "circle-radius": 0, "circle-opacity": 0 },
      });
      renderMarkers();
    };
    const onSourceData = (event: mapboxgl.MapSourceDataEvent) => {
      if (event.sourceId === sourceId) renderMarkers();
    };
    m.on("sourcedata", onSourceData);
    m.on("moveend", renderMarkers);
    m.on("zoomend", renderMarkers);
    if (m.isStyleLoaded()) setupSource();
    else m.once("load", setupSource);
    return () => {
      disposed = true;
      m.off("load", setupSource);
      m.off("sourcedata", onSourceData);
      m.off("moveend", renderMarkers);
      m.off("zoomend", renderMarkers);
      traceMarkers.current.forEach((marker) => marker.remove());
      traceMarkers.current = [];
    };
  }, [traces, isUnlocked, onSelect]);

  return <div ref={container} className="absolute inset-0" />;
};

export default TraceMap;
