import { useEffect, useMemo, useState } from "react";
import { Mic, MessageSquare, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import AudioPlayer from "@/components/AudioPlayer";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { createTrace, MAX_TEXT_LENGTH, MAX_VOICE_SECONDS, type LatLng, type TraceType } from "@/lib/traces";

interface Props {
  position: LatLng | null;
  onClose: () => void;
  onCreated: () => void;
}

const TraceComposer = ({ position, onClose, onCreated }: Props) => {
  const [type, setType] = useState<TraceType>("text");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const rec = useVoiceRecorder();

  const previewUrl = useMemo(() => (rec.audio ? URL.createObjectURL(rec.audio) : null), [rec.audio]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const startRecording = async () => {
    try {
      await rec.start();
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const canSubmit = !!position && !sending && (type === "text" ? message.trim().length > 0 : !!rec.audio);

  const submit = async () => {
    if (!position) return toast.error("Position introuvable, activez la localisation");
    setSending(true);
    try {
      await createTrace(
        position,
        type === "text" ? { type: "text", message } : { type: "voice", audio: rec.audio! }
      );
      toast.success("Trace déposée !");
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Impossible de déposer la trace");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="space-y-4 p-4 shadow-xl">
      <div className="flex gap-2">
        <Button variant={type === "text" ? "default" : "outline"} className="flex-1" onClick={() => setType("text")}>
          <MessageSquare className="mr-2 h-4 w-4" /> Texte
        </Button>
        <Button
          variant={type === "voice" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setType("voice")}
        >
          <Mic className="mr-2 h-4 w-4" /> Vocal
        </Button>
      </div>

      {type === "text" ? (
        <div className="space-y-1">
          <Textarea
            autoFocus
            rows={3}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Laissez votre trace ici..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/{MAX_TEXT_LENGTH}
          </p>
        </div>
      ) : rec.isRecording ? (
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-destructive">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" /> Enregistrement
          </div>
          <p className="text-4xl font-bold text-primary">
            {MAX_VOICE_SECONDS - rec.elapsed}s
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${(rec.elapsed / MAX_VOICE_SECONDS) * 100}%` }}
            />
          </div>
          <Button variant="destructive" className="w-full" onClick={rec.stop}>
            <Square className="mr-2 h-4 w-4" /> Arrêter
          </Button>
        </div>
      ) : previewUrl ? (
        <div className="space-y-2">
          <AudioPlayer src={previewUrl} />
          <Button variant="outline" className="w-full" onClick={startRecording}>
            <RotateCcw className="mr-2 h-4 w-4" /> Réenregistrer
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={startRecording}>
          <Mic className="mr-2 h-4 w-4" /> Enregistrer ({MAX_VOICE_SECONDS}s max)
        </Button>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
          {sending ? "Envoi..." : "Laisser la trace"}
        </Button>
        <Button variant="outline" disabled={sending} onClick={() => { rec.reset(); onClose(); }}>
          Annuler
        </Button>
      </div>
    </Card>
  );
};

export default TraceComposer;
