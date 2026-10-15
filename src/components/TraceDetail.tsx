import TagView from "@/components/TagView";
import { useEffect, useState } from "react";
import { EyeOff, Flag, Loader2, Lock, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { t } from "@/lib/i18n";
import { blockAuthorLocally, hideTraceLocally, reportTrace, fetchTraceContent, formatDate, type LatLng, type Trace, type TraceContent } from "@/lib/traces";

interface Props {
  trace: Trace;
  unlocked: boolean;
  distance: number | null;
  position: LatLng | null;
  onClose: () => void;
  onRemoved: (pred: (t: Trace) => boolean) => void;
}

const TraceDetail = ({ trace, unlocked, distance, position, onClose, onRemoved }: Props) => {
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

  const done = (pred: (t: Trace) => boolean, msg: string) => { onRemoved(pred); toast.success(msg); onClose(); };
  const report = () =>
    reportTrace(trace.id).then(() => done((x) => x.id === trace.id, t.reported)).catch((e: Error) => toast.error(e.message));
  const hide = () => { hideTraceLocally(trace.id); done((x) => x.id === trace.id, t.hidden); };
  const block = () => {
    if (!confirm(t.blockConfirm)) return;
    blockAuthorLocally(trace.author);
    done((x) => x.author === trace.author, t.blocked);
  };
  const action = "flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground";

  return (
    <Card className="relative space-y-3 p-4 shadow-xl">
      <button onClick={onClose} aria-label={t.close} className="absolute right-3 top-3 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
      {unlocked ? (
        <>
          {error ? (
            <p className="pr-6 text-sm text-destructive">{error}</p>
          ) : !content ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : content.trace_type === "tag" && content.drawing ? (
            <TagView drawing={content.drawing} className="mx-auto w-48" />
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
            <p className="font-medium text-foreground">{t.locked}</p>
            <p className="text-sm text-muted-foreground">
              {t.getCloser}
              {distance !== null && ` · ${distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`}`}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1 border-t border-border pt-2">
        <button className={action} onClick={report}><Flag className="h-3.5 w-3.5" /> {t.report}</button>
        <button className={action} onClick={hide}><EyeOff className="h-3.5 w-3.5" /> {t.hide}</button>
        <button className={action} onClick={block}><UserX className="h-3.5 w-3.5" /> {t.block}</button>
      </div>
    </Card>
  );
};

export default TraceDetail;
