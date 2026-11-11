import { AlertTriangle, Check, EyeOff, Flag, MapPin, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import TagView from "@/components/TagView";
import { formatDate, type AdminTrace } from "@/lib/traces";

interface Props {
  trace: AdminTrace;
  busy: boolean;
  onRestore: (trace: AdminTrace) => void;
  onRemove: (trace: AdminTrace) => void;
  onBan: (trace: AdminTrace) => void;
  onLocate?: (trace: AdminTrace) => void;
}

export default function AdminTraceCard({ trace: t, busy, onRestore, onRemove, onBan, onLocate }: Props) {
  return (
    <Card className={`min-w-0 space-y-3 p-4 ${t.hidden ? "border-destructive/60 bg-destructive/5" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-primary">{t.trace_type === "voice" ? "Vocal" : t.trace_type === "tag" ? "Tag" : "Texte"}</span>
        <span className={`flex items-center gap-1 ${t.hidden ? "text-destructive" : "text-primary"}`}>
          {t.hidden ? <EyeOff className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {t.hidden ? "Suspendue" : "En ligne"}
        </span>
        <span className="text-muted-foreground">{formatDate(t.created_at)}</span>
      </div>
      {t.report_count > 0 && <p className="flex items-center gap-1 text-xs text-destructive"><Flag className="h-3 w-3" />{t.report_count} signalement(s) à examiner</p>}
      {t.moderation_flag && <p className="flex items-start gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3 shrink-0" />{t.moderation_reason ?? "Signalée par l’IA"}</p>}
      {t.trace_type === "tag" && t.drawing ? <TagView drawing={t.drawing} className="w-32" /> : t.trace_type === "voice" && t.audio_url ? <><AudioPlayer src={t.audio_url} />{t.transcript && <p className="break-words text-sm italic text-muted-foreground">« {t.transcript} »</p>}</> : <p className="break-words text-foreground">{t.message}</p>}
      <p className="text-xs text-muted-foreground">{t.latitude.toFixed(5)}, {t.longitude.toFixed(5)}</p>
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {t.hidden && <Button size="sm" onClick={() => onRestore(t)} disabled={busy}><Check className="mr-1 h-4 w-4" />Remettre en ligne</Button>}
        {onLocate && <Button variant="outline" size="icon" title="Voir sur la carte" aria-label="Voir sur la carte" onClick={() => onLocate(t)}><MapPin className="h-4 w-4" /></Button>}
        {t.author_key && <Button variant="outline" size="icon" title="Exclure l’auteur" aria-label="Exclure l’auteur" disabled={busy} onClick={() => onBan(t)}><UserX className="h-4 w-4" /></Button>}
        <Button variant="destructive" size="icon" title="Supprimer la trace" aria-label="Supprimer la trace" disabled={busy} onClick={() => onRemove(t)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </Card>
  );
}