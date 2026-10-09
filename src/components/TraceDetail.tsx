import { Lock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { formatDate, type Trace } from "@/lib/traces";

interface Props {
  trace: Trace;
  unlocked: boolean;
  distance: number | null;
  onClose: () => void;
}

const TraceDetail = ({ trace, unlocked, distance, onClose }: Props) => (
  <Card className="relative space-y-3 p-4 shadow-xl">
    <button onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 text-muted-foreground">
      <X className="h-4 w-4" />
    </button>
    {unlocked ? (
      <>
        {trace.trace_type === "voice" && trace.audio_url ? (
          <AudioPlayer src={trace.audio_url} />
        ) : (
          <p className="pr-6 text-base leading-snug text-foreground">{trace.message}</p>
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

export default TraceDetail;
