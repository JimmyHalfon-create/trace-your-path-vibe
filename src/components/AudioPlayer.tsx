import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (t: number) =>
  isFinite(t) ? `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}` : "0:00";

/** Custom yellow/black player, mobile WebView friendly (no native controls). */
const AudioPlayer = ({ src, className }: { src: string; className?: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setError(false);
  }, [src]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) return a.pause();
    try {
      if (a.ended) a.currentTime = 0;
      await a.play();
    } catch (e) {
      console.error("Lecture audio impossible", e);
      setError(true);
    }
  };

  // Webm/mp4 recordings often report Infinity duration until fully read.
  const onMeta = () => {
    const a = audioRef.current!;
    if (isFinite(a.duration)) return setDuration(a.duration);
    a.currentTime = 1e6;
    a.ontimeupdate = () => {
      a.ontimeupdate = null;
      setDuration(a.duration);
      a.currentTime = 0;
    };
  };

  return (
    <div className={cn("flex items-center gap-3 rounded-lg bg-secondary/40 p-2", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        playsInline
        onLoadedMetadata={onMeta}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={error}
        aria-label={playing ? "Pause" : "Lecture"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition active:scale-95 disabled:opacity-40"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      {error ? (
        <span className="text-sm text-destructive">Lecture impossible</span>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: duration ? `${Math.min(100, (time / duration) * 100)}%` : "0%" }}
            />
          </div>
          <span className="min-w-[72px] text-right text-xs text-muted-foreground">
            {fmt(time)} / {fmt(duration)}
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
