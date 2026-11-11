import { useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import TraceMap from "@/components/TraceMap";
import type { AdminTrace, Trace } from "@/lib/traces";

export default function AdminTraceMap({ traces, onSelect, focus }: { traces: AdminTrace[]; onSelect: (trace: AdminTrace) => void; focus: AdminTrace | null }) {
  const markers = useMemo(() => traces.map((trace) => ({ ...trace, author: "" })), [traces]);
  const byId = useMemo(() => new Map(traces.map((trace) => [trace.id, trace])), [traces]);
  const select = useCallback((trace: Trace) => { const row = byId.get(trace.id); if (row) onSelect(row); }, [byId, onSelect]);
  const unlocked = useCallback(() => true, []);
  const statusClass = useCallback((trace: Trace) => byId.get(trace.id)?.hidden ? "is-suspended" : "", [byId]);
  const label = useCallback((trace: Trace) => `${byId.get(trace.id)?.hidden ? "Suspendue" : "En ligne"} — ${trace.trace_type === "voice" ? "Vocal" : trace.trace_type === "tag" ? "Tag" : "Texte"} — ${trace.latitude.toFixed(5)}, ${trace.longitude.toFixed(5)}`, [byId]);
  const ready = useCallback((map: mapboxgl.Map) => {
    if (focus) { map.jumpTo({ center: [focus.longitude, focus.latitude], zoom: 18.5 }); return; }
    if (!traces.length) return;
    const bounds = new mapboxgl.LngLatBounds();
    traces.forEach((trace) => bounds.extend([trace.longitude, trace.latitude]));
    map.fitBounds(bounds, { padding: 65, maxZoom: 16, duration: 0 });
  }, [traces, focus]);
  return <div className="admin-map relative h-[52vh] min-h-80 overflow-hidden border sm:h-[560px]" aria-label="Localisation des traces"><TraceMap user={null} traces={markers} isUnlocked={unlocked} onSelect={select} onReady={ready} markerClassName={statusClass} markerLabel={label} admin /></div>;
}