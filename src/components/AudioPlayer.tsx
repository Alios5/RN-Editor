import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { panelColors } from "@/lib/panelColors";
import { Play, Pause, SkipBack, SkipForward, Square, Radio, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/hooks/useTranslation";

export interface AudioPlayerRef {
  togglePlay: () => void;
  stop: () => void;
  seekBackward: (seconds?: number) => void;
  seekForward: (seconds?: number) => void;
}

interface AudioPlayerProps {
  audioUrl?: string;
  volume: number;
  pitch: number;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  externalSeek?: number;
  onDurationChange?: (duration: number) => void;
  autoFollowPlayback?: boolean;
  onAutoFollowChange?: (enabled: boolean) => void;
  onResetScroll?: () => void;
  scrollPosition?: number;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ audioUrl, volume, pitch, onTimeUpdate, onPlayStateChange, externalSeek, onDurationChange, autoFollowPlayback = false, onAutoFollowChange, onResetScroll, scrollPosition = 0 }, ref) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>();

  // Mise à jour du temps avec requestAnimationFrame - synchronisé avec audio.currentTime
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio && !audio.paused && !audio.ended) {
        // Utiliser directement audio.currentTime (source de vérité absolue)
        // Sans throttling artificiel pour éviter les désynchronisations sur ordinateurs moins performants
        const time = audio.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, onTimeUpdate]);

  // Chargement de la métadonnée pour la durée
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => setDuration(audio.duration);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  // Update volume when volume prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  // Update playback rate (pitch) when pitch prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = pitch;
  }, [pitch]);

  // Reset playback when audio URL changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Arrêter la lecture
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    
    // Réinitialiser les états
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Notifier le parent
    onPlayStateChange?.(false);
    onTimeUpdate?.(0);
  }, [audioUrl, onPlayStateChange, onTimeUpdate]);

  // Handle audio metadata load (duration)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (onDurationChange) {
        onDurationChange(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioUrl, onDurationChange]);

  // Handle external seek requests (from waveform clicks)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || externalSeek === undefined) return;
    
    audio.currentTime = externalSeek;
    setCurrentTime(externalSeek);
    onTimeUpdate?.(externalSeek);
  }, [externalSeek, onTimeUpdate]);

  // Synchroniser l'état React avec les événements natifs de l'audio
  // (contrôles média du casque, Media Session API, etc.)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      // Quand la musique se termine, revenir à zéro comme un stop
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
      onTimeUpdate?.(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onPlayStateChange]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const newPlayState = !isPlaying;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        setIsPlaying(false);
        onPlayStateChange?.(false);
        return;
      });
    }
    setIsPlaying(newPlayState);
    onPlayStateChange?.(newPlayState);
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayStateChange?.(false);
    onTimeUpdate?.(0);
  };

  const handleSkipBackward = (seconds: number = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, audio.currentTime - seconds);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  const handleSkipForward = (seconds: number = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.min(audio.duration, audio.currentTime + seconds);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
    onTimeUpdate?.(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Exposer les fonctions via ref
  useImperativeHandle(ref, () => ({
    togglePlay,
    stop: handleStop,
    seekBackward: handleSkipBackward,
    seekForward: handleSkipForward,
  }));

  return (
    <div className="h-16 backdrop-blur-sm border-t border-border/50 px-6 flex items-center gap-4" style={{ backgroundColor: panelColors.background() }}>
      <audio ref={audioRef} src={audioUrl} />
      
      <span className="text-xs text-muted-foreground w-14 text-center font-mono">
        {formatTime(currentTime)}
      </span>

      <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: panelColors.sectionBackground() }}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkipBackward(5)} disabled={!audioUrl} title="Reculer de 5s">
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={togglePlay} disabled={!audioUrl} title={isPlaying ? "Pause" : "Lecture"}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStop} disabled={!audioUrl} title="Arrêter">
          <Square className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkipForward(5)} disabled={!audioUrl} title="Avancer de 5s">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={0.1}
        onValueChange={handleSeek}
        disabled={!audioUrl}
        className="flex-1"
      />

      <span className="text-xs text-muted-foreground w-14 text-center font-mono">
        {formatTime(duration)}
      </span>

      <Button 
        variant="ghost"
        size="icon" 
        onClick={onResetScroll}
        title={t("editor.resetScroll")}
        disabled={!audioUrl || scrollPosition === 0}
      >
        <RotateCcw className="h-5 w-5" />
      </Button>

      <Button 
        variant={autoFollowPlayback ? "default" : "ghost"}
        size="icon" 
        onClick={() => onAutoFollowChange?.(!autoFollowPlayback)}
        title={autoFollowPlayback ? t("editor.autoFollowEnabled") : t("editor.autoFollowDisabled")}
        disabled={!audioUrl}
      >
        <Radio className="h-5 w-5" />
      </Button>
    </div>
  );
});
