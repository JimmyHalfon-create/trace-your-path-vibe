import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Précharger l'audio
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(false);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      setError(true);
      setIsLoading(false);
    });

    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        setError(true);
      });
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-destructive/20 rounded-lg ${className}`}>
        <span className="text-sm text-destructive">Erreur de lecture audio</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-secondary/20 rounded-lg ${className}`}>
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        )}
      </button>
      
      <Volume2 className="w-4 h-4 text-muted-foreground" />
      
      <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs min-w-[80px]">
          {isLoading ? '...' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;