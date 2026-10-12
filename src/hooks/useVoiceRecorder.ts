import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_VOICE_SECONDS } from "@/lib/traces";

/**
 * The container must match a codec the platform can also play back.
 * iOS: AAC inside .mp4. Chrome/Android: Opus inside .webm.
 * Bare "audio/mp4" is last on purpose — Chromium muxes Opus into .mp4, which Safari cannot play.
 */
const pickMimeType = () =>
  ["audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
    (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
  ) ?? "";

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };

  const stop = useCallback(() => {
    clearTimers();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    setAudio(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      setAudio(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start(100);
    recorderRef.current = recorder;
    setElapsed(0);
    setIsRecording(true);

    const startedAt = Date.now();
    timers.current.push(
      window.setInterval(() => {
        const s = Math.min(MAX_VOICE_SECONDS, Math.floor((Date.now() - startedAt) / 1000));
        setElapsed(s);
        if (s >= MAX_VOICE_SECONDS) stop();
      }, 200)
    );
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setAudio(null);
    setElapsed(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { isRecording, elapsed, audio, start, stop, reset };
}
