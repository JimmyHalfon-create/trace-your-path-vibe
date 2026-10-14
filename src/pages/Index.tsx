import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type mapboxgl from "mapbox-gl";
import { Loader2, MapPinOff, MessageSquare, Navigation, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TraceMap from "@/components/TraceMap";
import TraceComposer from "@/components/TraceComposer";
import TraceDetail from "@/components/TraceDetail";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyTraces, useTraces } from "@/hooks/useTraces";
import OpeningSplash, { shouldShowSplash } from "@/components/OpeningSplash";
import { t } from "@/lib/i18n";
import { traceDistance, UNLOCK_RADIUS_METERS, type Trace } from "@/lib/traces";

const Index = () => {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(shouldShowSplash);
  const [mapReady, setMapReady] = useState(false);
  const { position, error: geoError, refresh } = useGeolocation(!splash);
  const { traces, loading, reload } = useTraces();
  const nearby = useNearbyTraces(position, traces, !splash);
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<Trace | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const isUnlocked = useCallback(
    (t: Trace) => !!position && traceDistance(position, t) <= UNLOCK_RADIUS_METERS,
    [position]
  );

  const recenter = async () => {
    const pos = await refresh();
    if (!pos) return toast.error(geoError ?? t.positionNotFound);
    mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 15, duration: 1500 });
  };

  const onReady = useCallback((m: mapboxgl.Map) => {
    mapRef.current = m;
    if (m.loaded()) setMapReady(true);
    else m.once("load", () => setMapReady(true));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {splash && <OpeningSplash onDone={() => setSplash(false)} />}
      {!splash && !mapReady && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" role="status" aria-label={t.loadingMap}>
          <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
        </div>
      )}
      <TraceMap user={position} traces={traces} isUnlocked={isUnlocked} onSelect={setSelected} onReady={onReady} />

      {/* Header */}
      <header className="safe-top absolute inset-x-4 z-10 flex items-center justify-between">
        <span className="w-9" />
        <Card className="bg-card/80 px-5 py-2 backdrop-blur">
          <h1 className="text-xl font-bold tracking-widest text-primary">TraceOn</h1>
        </Card>
        <span className="w-9" />
      </header>

      {/* Geolocation status banner */}
      {geoError ? (
        <Card className="absolute inset-x-4 top-20 z-30 flex items-center gap-3 border-destructive/50 bg-card/90 p-3 text-sm backdrop-blur">
          <MapPinOff className="h-4 w-4 shrink-0 text-destructive" />
          <span>{geoError}</span>
        </Card>
      ) : (
        !position && (
          <Card className="absolute inset-x-4 top-20 z-30 flex items-center gap-3 bg-card/80 p-3 text-sm text-muted-foreground backdrop-blur">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span>{t.searchingPosition}</span>
          </Card>
        )
      )}

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
            <span className="text-primary">{t.nearby(nearby.length)}</span>
          </Card>
        )}
        <Button size="icon" variant="secondary" onClick={recenter} aria-label={t.myPosition} className="bg-card/80 backdrop-blur">
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
            position={position}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="space-y-2">
            <Button size="lg" className="h-14 w-full text-lg font-semibold shadow-lg" onClick={() => setComposing(true)}>
              <Plus className="mr-2 h-6 w-6" /> {t.leaveTrace}
            </Button>
            <p className="text-center">
              <Link to="/privacy" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                {t.privacy}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
