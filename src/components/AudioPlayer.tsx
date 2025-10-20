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
    // Précharger l'audio avec compatibilité mobile
    const audio = new Audio();
    audio.preload = 'auto';
    (audio as any).playsInline = true;
    audio.crossOrigin = 'anonymous';
    
    // Ajouter timestamp pour éviter le cache
    const urlWithTimestamp = audioUrl.includes('?') 
      ? `${audioUrl}&t=${Date.now()}` 
      : `${audioUrl}?t=${Date.now()}`;
    
    audio.src = urlWithTimestamp;
    
    const handleLoadedMetadata = () => {
      console.log('Audio loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setError(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = (e: Event) => {
      console.error('Audio loading error:', e, audio.error);
      setError(true);
      setIsLoading(false);
    };
    
    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    // Charger l'audio
    audio.load();

    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.src = '';
      }
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    if (!audioRef.current || error) {
      console.error('Cannot play: no audio ref or error state');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Reset si à la fin
        if (audioRef.current.currentTime >= audioRef.current.duration) {
          audioRef.current.currentTime = 0;
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
        setError(true);
        setIsPlaying(false);
      }
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