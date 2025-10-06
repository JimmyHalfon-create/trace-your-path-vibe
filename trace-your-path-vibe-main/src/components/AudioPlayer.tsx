import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-secondary/20 rounded-lg ${className}`}>
      <Button
        onClick={togglePlay}
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      
      <Volume2 className="w-4 h-4 text-muted-foreground" />
      
      <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs min-w-[40px]">
          {duration > 0 ? formatTime(currentTime) : '0:00'}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;