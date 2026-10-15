import TagView from "@/components/TagView";
import { useEffect, useState } from "react";
import { ArrowLeft, EyeOff, Flag, Loader2, Lock, RotateCw, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [flipped, setFlipped] = useState(false);
  const [reporting, setReporting] = useState(false);
  const canLoad = unlocked && !!position;

  useEffect(() => {
    setContent(null);
    setError(null);
    setFlipped(false);
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
  const report = async () => {
    if (reporting) return;
    setReporting(true);
    try { await reportTrace(trace.id); done((x) => x.id === trace.id, t.reported); }
    catch (e) { toast.error(e instanceof Error ? e.message : t.appError); }
    finally { setReporting(false); }
  };
  const hide = () => { hideTraceLocally(trace.id); done((x) => x.id === trace.id, t.hidden); };
  const block = () => {
    if (!confirm(t.blockConfirm)) return;
    blockAuthorLocally(trace.author);
    done((x) => x.author === trace.author, t.blocked);
  };
  return (
    <div className="trace-flip relative" data-testid="trace-detail">
      <Button size="icon" variant="ghost" onClick={onClose} aria-label={t.close} className="absolute right-1 top-1 z-30 text-muted-foreground">
        <X className="h-4 w-4" />
      </Button>
      <div className={`trace-flip-inner ${flipped ? "is-flipped" : ""}`}>
      <Card className="trace-flip-face trace-flip-front relative min-h-44 space-y-3 p-4 pb-12 shadow-xl" aria-hidden={flipped}>
      <Button variant="ghost" aria-label={t.traceActions} tabIndex={flipped ? -1 : 0} onClick={() => setFlipped(true)} className="absolute inset-0 z-10 h-full w-full rounded-lg hover:bg-transparent">
        <RotateCw className="absolute bottom-3 right-4 text-primary" />
      </Button>
      <div className="pointer-events-none space-y-3">
      {unlocked ? (
        <>
          {error ? (
            <p className="pr-6 text-sm text-destructive">{error}</p>
          ) : !content ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : content.trace_type === "tag" && content.drawing ? (
            <TagView drawing={content.drawing} className="mx-auto w-48" />
          ) : content.trace_type === "voice" && content.audio_url ? (
            <div className="pointer-events-auto relative z-20 mr-8"><AudioPlayer src={content.audio_url} /></div>
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
      </div>
      </Card>
      <Card className="trace-flip-face trace-flip-back relative flex min-h-44 flex-col justify-center p-4 pt-12 shadow-xl" aria-hidden={!flipped}>
        <Button size="icon" variant="ghost" aria-label={t.backToTrace} tabIndex={flipped ? 0 : -1} onClick={() => setFlipped(false)} className="absolute left-1 top-1 text-muted-foreground"><ArrowLeft /></Button>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" disabled={!flipped || reporting} onClick={report} className="h-auto min-h-20 flex-col whitespace-normal px-1 py-3 text-center text-xs leading-snug">
            {reporting ? <Loader2 className="animate-spin" /> : <Flag className="text-destructive" />} {t.report}
          </Button>
          <Button variant="secondary" disabled={!flipped || reporting} onClick={hide} className="h-auto min-h-20 flex-col whitespace-normal px-1 py-3 text-center text-xs leading-snug"><EyeOff className="text-primary" /> {t.hide}</Button>
          <Button variant="secondary" disabled={!flipped || reporting} onClick={block} className="h-auto min-h-20 flex-col whitespace-normal px-1 py-3 text-center text-xs leading-snug"><UserX className="text-primary" /> {t.block}</Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default TraceDetail;
