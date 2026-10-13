import { useEffect, useState } from "react";
import { Loader2, Lock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { fetchTraceContent, formatDate, type LatLng, type Trace, type TraceContent } from "@/lib/traces";

interface Props {
  trace: Trace;
  unlocked: boolean;
  distance: number | null;
  position: LatLng | null;
  onClose: () => void;
}

const TraceDetail = ({ trace, unlocked, distance, position, onClose }: Props) => {
  const [content, setContent] = useState<TraceContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canLoad = unlocked && !!position;

  useEffect(() => {
    setContent(null);
    setError(null);
    if (!canLoad || !position) return;
    let active = true;
    fetchTraceContent(trace.id, position)
      .then((c) => active && setContent(c))
      .catch((e) => active && setError(e.message));
    return () => { active = false; };
    // Load once per trace when it becomes unlocked; not on every GPS tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace.id, canLoad]);

  return (
    <Card className="relative space-y-3 p-4 shadow-xl">
      <button onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
      {unlocked ? (
        <>
          {error ? (
            <p className="pr-6 text-sm text-destructive">{error}</p>
          ) : !content ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : content.trace_type === "voice" && content.audio_url ? (
            <AudioPlayer src={content.audio_url} />
          ) : (
            <p className="pr-6 text-base leading-snug text-foreground">{content.message}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(trace.created_at)}</p>
        </>
      ) : (
        <div className="flex items-center gap-3 pr-6">
          <Lock className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Trace verrouillée</p>
            <p className="text-sm text-muted-foreground">
              Rapprochez-vous pour la découvrir
              {distance !== null && ` · ${distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`}`}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TraceDetail;
