import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type mapboxgl from "mapbox-gl";
import { MessageSquare, Navigation, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TraceMap from "@/components/TraceMap";
import TraceComposer from "@/components/TraceComposer";
import TraceDetail from "@/components/TraceDetail";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyTraces, useTraces } from "@/hooks/useTraces";
import { traceDistance, UNLOCK_RADIUS_METERS, type Trace } from "@/lib/traces";

const Index = () => {
  const navigate = useNavigate();
  const { position, error: geoError, refresh } = useGeolocation();
  const { traces, loading, reload } = useTraces();
  const nearby = useNearbyTraces(position, traces);
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<Trace | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const isUnlocked = useCallback(
    (t: Trace) => !!position && traceDistance(position, t) <= UNLOCK_RADIUS_METERS,
    [position]
  );

  const recenter = async () => {
    const pos = await refresh();
    if (!pos) return toast.error(geoError ?? "Position introuvable");
    mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 15, duration: 1500 });
  };

  const onReady = useCallback((m: mapboxgl.Map) => (mapRef.current = m), []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <TraceMap user={position} traces={traces} isUnlocked={isUnlocked} onSelect={setSelected} onReady={onReady} />

      {/* Header */}
      <header className="safe-top absolute inset-x-4 z-10 flex items-center justify-between">
        <span className="w-9" />
        <Card className="bg-card/80 px-5 py-2 backdrop-blur">
          <h1 className="text-xl font-bold tracking-widest text-primary">TRACE</h1>
        </Card>
        <button onClick={() => navigate("/auth")} aria-label="Admin" className="p-2 opacity-30">
          <Shield className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Side widgets */}
      <div className="safe-top-widgets absolute right-4 z-10 flex flex-col items-end gap-2">
        <Card className="flex items-center gap-2 bg-card/80 px-3 py-1.5 text-sm backdrop-blur">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-medium">{traces.length}</span>
          {loading && <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />}
        </Card>
        {nearby.length > 0 && (
          <Card className="flex items-center gap-2 border-primary/50 bg-primary/15 px-3 py-1.5 text-sm backdrop-blur">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
            <span className="text-primary">{nearby.length} proche{nearby.length > 1 ? "s" : ""}</span>
          </Card>
        )}
        <Button size="icon" variant="secondary" onClick={recenter} aria-label="Ma position" className="bg-card/80 backdrop-blur">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom sheet */}
      <div className="safe-bottom absolute inset-x-4 z-20 mx-auto max-w-md">
        {composing ? (
          <TraceComposer position={position} onClose={() => setComposing(false)} onCreated={reload} />
        ) : selected ? (
          <TraceDetail
            trace={selected}
            unlocked={isUnlocked(selected)}
            distance={position ? traceDistance(position, selected) : null}
            onClose={() => setSelected(null)}
          />
        ) : (
          <Button size="lg" className="h-14 w-full text-lg font-semibold shadow-lg" onClick={() => setComposing(true)}>
            <Plus className="mr-2 h-6 w-6" /> Laisser une Trace
          </Button>
        )}
      </div>
    </div>
  );
};

export default Index;
