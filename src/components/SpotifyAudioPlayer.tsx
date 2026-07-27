import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download, 
  Music, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  FastForward, 
  Rewind,
  Check,
  Repeat
} from 'lucide-react';
import clsx from 'clsx';

interface SpotifyAudioPlayerProps {
  title: string;
  thumbnail?: string;
  audioUrl: string;
  isLight?: boolean;
  onDownload?: () => void;
  downloadStatus?: { status: "preparing" | "downloading" | "complete" | "failed"; progress: number | null } | null;
  compact?: boolean;
}

export function SpotifyAudioPlayer({
  title,
  thumbnail,
  audioUrl,
  isLight = false,
  onDownload,
  downloadStatus,
  compact = false
}: SpotifyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  // Resolve Spotify Audio Stream
  useEffect(() => {
    let isMounted = true;
    setError(null);

    if (compact) {
      // In compact mode (for playlist items), do not run eager background fetch on mount for all tracks.
      // Use direct stream URL so audio element loads on-demand when played.
      setResolvedUrl(audioUrl.startsWith('/api/spotify-resolve') ? `${audioUrl}&stream=true` : audioUrl);
      setIsLoading(false);
      setIsResolving(false);
      return;
    }

    setIsLoading(true);

    const resolveStream = async () => {
      if (!audioUrl) return;

      if (audioUrl.startsWith('/api/spotify-resolve')) {
        setIsResolving(true);
        try {
          const res = await fetch(audioUrl);
          const data = await res.json();
          if (isMounted) {
            setIsResolving(false);
            if (data.success && data.url) {
              setResolvedUrl(data.url);
            } else {
              setResolvedUrl(`${audioUrl}&stream=true`);
            }
          }
        } catch (e) {
          if (isMounted) {
            setIsResolving(false);
            setResolvedUrl(`${audioUrl}&stream=true`);
          }
        }
      } else {
        setResolvedUrl(audioUrl);
      }
    };

    resolveStream();

    return () => {
      isMounted = false;
    };
  }, [audioUrl, compact]);

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    setError("Failed to load audio stream. Click retry to re-resolve.");
  };

  const togglePlay = () => {
    if (!audioRef.current || !resolvedUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Playback error:", err);
        setError("Audio playback blocked by browser or stream unavailable.");
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const retryResolve = () => {
    setError(null);
    setIsResolving(true);
    setIsLoading(true);
    const retryUrl = `${audioUrl.replace(/&stream=true/, '')}&t=${Date.now()}`;
    fetch(retryUrl)
      .then(res => res.json())
      .then(data => {
        setIsResolving(false);
        if (data.success && data.url) {
          setResolvedUrl(data.url);
        } else {
          setResolvedUrl(`${audioUrl}&stream=true&t=${Date.now()}`);
        }
      })
      .catch(() => {
        setIsResolving(false);
        setResolvedUrl(`${audioUrl}&stream=true&t=${Date.now()}`);
      });
  };

  if (compact) {
    return (
      <div className={clsx("p-3 rounded-2xl border flex flex-col gap-2 transition-all", isLight ? "bg-emerald-50/60 border-emerald-200" : "bg-[#121212]/90 border-emerald-500/30")}>
        {resolvedUrl && (
          <audio
            ref={audioRef}
            src={resolvedUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
            onError={handleError}
            preload="none"
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {thumbnail ? (
              <img src={thumbnail} alt="Cover" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-emerald-500/20" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-emerald-500" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Spotify Audio Stream
              </div>
              <h5 className={clsx("text-xs font-bold truncate", isLight ? "text-neutral-900" : "text-white")}>{title}</h5>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                disabled={downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading"}
                className={clsx(
                  "p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm",
                  downloadStatus?.status === "complete"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : isLight
                      ? "bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900"
                      : "bg-white hover:bg-neutral-200 text-black border-white"
                )}
                title="Download MP3"
              >
                {downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                ) : downloadStatus?.status === "complete" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isResolving || !!error}
              className="p-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-80">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!duration}
            className="flex-1 h-1.5 accent-[#1DB954] bg-neutral-700/40 rounded-lg cursor-pointer"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      "w-full rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden transition-all backdrop-blur-xl",
      isLight 
        ? "bg-gradient-to-br from-white via-emerald-50/40 to-white border-emerald-200" 
        : "bg-gradient-to-br from-[#121212] via-[#181818] to-[#0a0a0a] border-emerald-500/30 text-white"
    )}>
      {/* Spotify Green Glow Background Effect */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#1DB954]/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#1DB954]/10 rounded-full blur-[80px] pointer-events-none" />

      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          loop={isLooping}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
          onError={handleError}
          preload="metadata"
        />
      )}

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/30">
            <Music className="w-4 h-4 fill-black text-black" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-[#1DB954]">
            Spotify Extracted Audio Preview
          </span>
        </div>

        {/* Equalizer Visualizer */}
        <div className="flex items-end gap-0.5 h-4 px-2 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20">
          {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3].map((height, i) => (
            <div
              key={i}
              className={clsx(
                "w-0.5 bg-[#1DB954] rounded-full transition-all duration-150",
                isPlaying ? "animate-pulse" : "opacity-40"
              )}
              style={{
                height: isPlaying ? `${Math.floor(Math.random() * 12 + 4)}px` : `${height * 10}px`,
                animationDelay: `${i * 120}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Track Details Row */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 relative z-10">
        {/* Album Artwork */}
        <div className="relative group shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className={clsx(
                "w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-2xl border border-white/10 transition-transform duration-500",
                isPlaying && "scale-105 shadow-[#1DB954]/20"
              )}
            />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-neutral-900 flex items-center justify-center border border-white/10">
              <Music className="w-12 h-12 text-[#1DB954]" />
            </div>
          )}

          {isPlaying && (
            <div className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg animate-bounce">
                <Music className="w-5 h-5 text-black" />
              </div>
            </div>
          )}
        </div>

        {/* Track Title and Controls */}
        <div className="flex-1 min-w-0 w-full text-center sm:text-left flex flex-col justify-center">
          <h4 className={clsx("text-lg sm:text-xl font-black leading-tight truncate mb-1", isLight ? "text-neutral-900" : "text-white")} title={title}>
            {title}
          </h4>
          <p className={clsx("text-xs font-medium mb-3", isLight ? "text-neutral-600" : "text-neutral-400")}>
            Testing high-quality 320kbps extracted MP3 track
          </p>

          {/* Status Indicators */}
          {isResolving ? (
            <div className="inline-flex items-center gap-2 text-xs text-[#1DB954] bg-[#1DB954]/10 border border-[#1DB954]/20 px-3 py-1.5 rounded-full font-semibold w-max mx-auto sm:mx-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resolving audio stream from Spotify source...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl font-medium w-max mx-auto sm:mx-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
              <button onClick={retryResolve} className="underline font-bold hover:text-rose-400 ml-1">Retry</button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Audio Stream Loaded & Ready to Test
            </div>
          )}
        </div>
      </div>

      {/* Main Seek Bar */}
      <div className="space-y-1.5 mb-6 relative z-10">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={!duration || isResolving}
          className="w-full h-2 accent-[#1DB954] bg-neutral-700/50 rounded-lg cursor-pointer transition-all hover:h-2.5 disabled:opacity-40"
        />
        <div className="flex items-center justify-between text-xs font-mono font-medium opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 pt-2 border-t border-white/5">
        
        {/* Playback Speeds */}
        <div className="flex items-center gap-1 order-2 sm:order-1">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mr-1">Speed:</span>
          {[1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changeSpeed(rate)}
              className={clsx(
                "px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                playbackRate === rate
                  ? "bg-[#1DB954] text-black shadow-md shadow-[#1DB954]/20"
                  : isLight ? "bg-neutral-200/70 text-neutral-800 hover:bg-neutral-300" : "bg-white/10 text-neutral-300 hover:bg-white/20"
              )}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Center Play / Pause / Rewind / Fast Forward / Loop */}
        <div className="flex items-center gap-3 order-1 sm:order-2">
          <button
            type="button"
            onClick={toggleLoop}
            className={clsx(
              "p-2.5 rounded-full transition-all cursor-pointer relative",
              isLooping
                ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/30"
                : isLight ? "hover:bg-neutral-200 text-neutral-600" : "hover:bg-white/10 text-neutral-400"
            )}
            title={isLooping ? "Loop On (Repeating track continuously)" : "Loop Off (Click to loop track)"}
          >
            <Repeat className="w-5 h-5" />
            {isLooping && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipTime(-10)}
            disabled={!duration || isResolving}
            className={clsx(
              "p-2 rounded-full transition-all cursor-pointer disabled:opacity-40",
              isLight ? "hover:bg-neutral-200 text-neutral-700" : "hover:bg-white/10 text-neutral-300"
            )}
            title="Rewind 10s"
          >
            <Rewind className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={isResolving || !!error}
            className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-black flex items-center justify-center shadow-xl shadow-[#1DB954]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isResolving || isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipTime(10)}
            disabled={!duration || isResolving}
            className={clsx(
              "p-2 rounded-full transition-all cursor-pointer disabled:opacity-40",
              isLight ? "hover:bg-neutral-200 text-neutral-700" : "hover:bg-white/10 text-neutral-300"
            )}
            title="Fast Forward 10s"
          >
            <FastForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume & Download CTA */}
        <div className="flex items-center gap-3 order-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={clsx(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                isLight ? "hover:bg-neutral-200 text-neutral-700" : "hover:bg-white/10 text-neutral-300"
              )}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1.5 accent-[#1DB954] bg-neutral-700/50 rounded-lg cursor-pointer"
            />
          </div>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading"}
              className={clsx(
                "px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md uppercase tracking-wider cursor-pointer shrink-0 disabled:cursor-not-allowed",
                downloadStatus?.status === "complete"
                  ? "bg-emerald-600 text-white"
                  : isLight
                    ? "bg-neutral-900 hover:bg-neutral-800 text-white"
                    : "bg-white hover:bg-neutral-200 text-black"
              )}
            >
              {downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Downloading...</span>
                </>
              ) : downloadStatus?.status === "complete" ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download MP3</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
