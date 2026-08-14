import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Repeat,
  ChevronDown
, Mic2, Gauge, MoreHorizontal, Share2} from 'lucide-react';
import clsx from 'clsx';

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" />
  </svg>
);

const bgColors = [
  '#1e1014', // Subtle Dark Crimson
  '#0d141f', // Subtle Dark Navy
  '#170e1c', // Subtle Dark Amethyst
  '#1c140d', // Subtle Dark Amber
  '#0e1712', // Subtle Dark Emerald
  '#121212'  // Classic Spotify Dark
];

interface SpotifyAudioPlayerProps {
  title: string;
  thumbnail?: string;
  audioUrl: string;
  isLight?: boolean;
  onDownload?: () => void;
  downloadStatus?: { status: "preparing" | "downloading" | "complete" | "failed"; progress: number | null } | null;
  compact?: boolean;
  lyrics?: string;
  syncedLyrics?: string;
}

export function SpotifyAudioPlayer({
  title,
  thumbnail,
  audioUrl,
  isLight = false,
  onDownload,
  downloadStatus,
  compact = false,
  lyrics,
  syncedLyrics
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
  const [resolveProgress, setResolveProgress] = useState(0);
  const [resolveMessage, setResolveMessage] = useState("Resolving Spotify source...");
  const [showLyrics, setShowLyrics] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<{time: number, text: string}[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number>();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target;
      if (!target.closest('#options-menu') && !target.closest('#options-btn')) {
        setShowOptions(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
    if (audioRef.current) {
      audioRef.current.playbackRate = speeds[nextIdx];
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  
  useEffect(() => {
    if (resolvedUrl && isPlaying && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(err => {
        console.error("Autoplay failed:", err);
        setIsPlaying(false);
      });
    }
  }, [resolvedUrl, isPlaying]);

  useEffect(() => {
    if (syncedLyrics) {
      const lines = syncedLyrics.split('\n');
      const parsed = lines.map(line => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseFloat(match[2]);
          const text = match[3].trim();
          return { time: minutes * 60 + seconds, text };
        }
        return null;
      }).filter(Boolean) as {time: number, text: string}[];
      setParsedLyrics(parsed);
    }
  }, [syncedLyrics]);

  useEffect(() => {
    if (showLyrics && parsedLyrics.length > 0) {
      const idx = parsedLyrics.findIndex((l, i) => {
        const next = parsedLyrics[i + 1];
        // 0.15s offset for perfect millisecond beat sync
        const offset = 0.15;
        return currentTime >= (l.time - offset) && (!next || currentTime < (next.time - offset));
      });
      if (idx !== activeLyricIndex) {
        setActiveLyricIndex(idx);
        if (lyricsContainerRef.current) {
          const container = lyricsContainerRef.current;
          const activeEl = container.children[idx] as HTMLElement;
          if (activeEl) {
            const containerCenter = container.clientHeight / 2;
            const elCenter = activeEl.offsetTop + (activeEl.clientHeight / 2);
            container.scrollTo({
              top: elCenter - containerCenter,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }, [currentTime, showLyrics, parsedLyrics, activeLyricIndex]);

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

    const resolveStream = () => {
      if (!audioUrl) return;

      if (audioUrl.startsWith('/api/spotify-resolve')) {
        setIsResolving(true);
        setIsLoading(true);
        setResolveProgress(0);
        
        try {
          const sseUrl = audioUrl + (audioUrl.includes('?') ? '&' : '?') + 'sse=true';
          const source = new EventSource(sseUrl);

          source.onmessage = (event) => {
            if (!isMounted) {
                source.close();
                return;
            }
            try {
                const data = JSON.parse(event.data);
                if (data.progress !== undefined) {
                    setResolveProgress(data.progress);
                    if (data.message) setResolveMessage(data.message);
                } else if (data.success !== undefined) {
                    source.close();
                    setIsResolving(false);
                    if (data.success && data.url) {
                        setResolvedUrl(data.url);
                        setIsLoading(false);
                        setIsPlaying(true); // Auto-play when ready
                    } else {
                        setResolvedUrl(`${audioUrl}&stream=true`);
                        setIsLoading(false);
                    }
                }
            } catch(e) {}
          };

          source.onerror = () => {
            source.close();
            if (isMounted) {
              setIsResolving(false);
              setResolvedUrl(`${audioUrl}&stream=true`);
              setIsLoading(false);
            }
          };
          
          return () => source.close();
        } catch (e) {
          if (isMounted) {
            setIsResolving(false);
            setResolvedUrl(`${audioUrl}&stream=true`);
            setIsLoading(false);
          }
        }
      } else {
        setResolvedUrl(audioUrl);
        setIsLoading(false);
      }
    };

    const cleanupSSE = resolveStream();

    return () => {
      isMounted = false;
      if (typeof cleanupSSE === "function") cleanupSSE();
    };
  }, [audioUrl, compact]);

  // Removed fake progress animation in favor of real SSE progress

  // Audio Event Handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleWaiting = () => {
    if (isPlaying) {
      setIsLoading(true);
    }
  };

  const handleStalled = () => {
    if (isPlaying) {
      setIsLoading(true);
    }
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
      setIsLoading(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        setIsLoading(false);
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
        setIsLoading(false);
      })
      .catch(() => {
        setIsResolving(false);
        setResolvedUrl(`${audioUrl}&stream=true&t=${Date.now()}`);
        setIsLoading(false);
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
            onCanPlayThrough={handleCanPlayThrough}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onWaiting={handleWaiting}
            onStalled={handleStalled}
            
            onEnded={handleEnded}
            onError={handleError}
            preload="none"
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {thumbnail ? (
              <img src={thumbnail} alt={`Cover art for ${title}`} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-emerald-500/20" />
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
                  "p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm active:scale-95",
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
    <div className={clsx("glass-player-wrapper", isLight && "light-mode")}>
      <style dangerouslySetInnerHTML={{__html: `
        .glass-player-wrapper {
            --bg-gradient: linear-gradient(135deg, #0f172a, #1e1b4b, #312e81);
            --glass-bg: rgba(255, 255, 255, 0.03);
            --glass-border: rgba(255, 255, 255, 0.05);
            --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            --text-main: #ffffff;
            --text-muted: #94a3b8;
            --accent: #818cf8;
            --progress-bg: rgba(255, 255, 255, 0.1);
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
        }

        .glass-player-wrapper.light-mode {
            --bg-gradient: linear-gradient(135deg, #e2e8f0, #c7d2fe, #ddd6fe);
            --glass-bg: rgba(255, 255, 255, 0.4);
            --glass-border: rgba(255, 255, 255, 0.5);
            --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
            --text-main: #1e293b;
            --text-muted: #64748b;
            --accent: #4f46e5;
            --progress-bg: rgba(0, 0, 0, 0.1);
        }

        .glass-player-wrapper.light-mode .glass-panel {
            box-shadow: 12px 12px 24px #d1d5db, -12px -12px 24px #ffffff;
            background: #f3f4f6;
            border: none;
        }

        .glass-player-wrapper.light-mode .glass-button {
            box-shadow: 6px 6px 12px #d1d5db, -6px -6px 12px #ffffff;
            background: #f3f4f6;
            border: none;
        }

        .glass-player-wrapper.light-mode .glass-button:active {
            box-shadow: inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff;
        }

        .glass-panel {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            box-shadow: var(--glass-shadow);
        }

        .glass-button {
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            transition: all 0.3s ease;
        }

        .glass-button:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .glass-player-wrapper.light-mode .glass-button:hover {
            background: rgba(255, 255, 255, 0.7);
        }

        .text-gradient {
            background: linear-gradient(to right, #c7d2fe, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .glass-player-wrapper.light-mode .text-gradient {
            background: linear-gradient(to right, #312e81, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .active-control {
            color: var(--accent) !important;
        }
        
        .active-control::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--accent);
        }

        /* Minimized Player Styles */
        .minimized-player {
            width: 100% !important;
            max-width: 480px !important;
            height: 90px !important;
            flex-direction: row !important;
            padding: 12px 20px !important;
            justify-content: space-between !important;
            border-radius: 2.5rem !important;
            cursor: pointer;
            align-items: center;
            gap: 12px;
            margin: 0 auto;
        }

        .minimized-player .top-nav, 
        .minimized-player .progress-section {
            display: none !important;
        }

        .minimized-player .album-art {
            width: 56px !important;
            height: 56px !important;
            margin-bottom: 0 !important;
            border-radius: 50% !important;
            animation: spin 10s linear infinite;
            flex-shrink: 0;
        }
        
        .minimized-player .album-art.paused {
            animation-play-state: paused !important;
        }

        /* Show track info and align left when minimized */
        .minimized-player .track-info {
            min-width: 0;
            display: flex !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            flex: 1 !important;
            justify-content: flex-start !important;
        }
        
        .minimized-player .track-info > div {
            min-width: 0;
            align-items: flex-start !important;
            text-align: left !important;
            width: 100%;
        }

        .minimized-player .track-info h2 {
            font-size: 1rem !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            margin-bottom: 0 !important;
            text-align: left;
        }

        .minimized-player .track-info p {
            font-size: 0.75rem !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            text-align: left;
        }

        /* Adjust controls to fit nicely in minimized mode */
        .minimized-player .playback-controls {
            width: auto !important;
            flex-shrink: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            display: flex !important;
            gap: 10px !important;
        }

        .minimized-player .playback-controls > div.w-10 {
            display: none !important;
        }

        .minimized-player .playback-controls .flex.items-center.gap-4 {
            gap: 0.5rem !important;
        }

        .minimized-player .main-play-btn {
            width: 44px !important;
            height: 44px !important;
        }
        
        .minimized-player .main-play-btn svg {
            width: 1.5rem !important;
            height: 1.5rem !important;
        }

        @media (max-width: 480px) {
            .minimized-player .skip-btn.skip-btn-rewind {
                display: none !important;
            }
        }
        .minimized-player .skip-btn {
            width: 36px !important;
            height: 36px !important;
        }
        
        .minimized-player .skip-btn svg {
            width: 1.1rem !important;
            height: 1.1rem !important;
        }
        
        .minimized-player .extra-controls {
            display: none !important;
            width: 30px !important;
            padding: 0 !important;
            margin-left: 4px;
        }
        
        .minimized-player .extra-controls svg {
            width: 1.1rem !important;
            height: 1.1rem !important;
        }

        @keyframes spin {
            100% { transform: rotate(360deg); }
        }

        .dimmed {
            filter: brightness(0.3) blur(4px);
        }
        
        .custom-range {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
            position: absolute;
            inset: 0;
            z-index: 20;
            cursor: pointer;
        }
        .custom-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .group:hover .custom-range::-webkit-slider-thumb {
            opacity: 1;
        }
        .custom-range::-webkit-slider-runnable-track {
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
        }
      `}} />

      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          loop={isLooping}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlayThrough}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onStalled={handleStalled}
          onEnded={handleEnded}
          onError={handleError}
          preload="metadata"
        />
      )}

      <div 
        id="player-card" 
        className={clsx(
          "glass-panel w-full max-w-sm rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col items-center relative transition-all duration-500",
          isMinimized ? "minimized-player" : ""
        )}
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false);
          }
        }}
      >
        
        {/* Options Menu Dropdown */}
        <div id="options-menu" className={clsx(
          "absolute top-20 right-8 w-48 glass-panel rounded-2xl p-2 z-50 flex flex-col gap-1 transition-all duration-300 transform",
          showOptions ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-2"
        )}>
            {(parsedLyrics.length > 0 || lyrics) && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLyrics(true);
                  setShowOptions(false);
                }}
                className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/10 text-[var(--text-main)] text-sm transition-colors flex items-center gap-2"
              >
                <Mic2 className="w-4 h-4" /> Show Lyrics
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                cycleSpeed();
              }}
              className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/10 text-[var(--text-main)] text-sm transition-colors flex items-center gap-2"
            >
              <Gauge className="w-4 h-4" /> Speed: {playbackRate}x
            </button>
            
            <div className="h-[1px] w-full bg-white/10 my-1"></div>
            
            {onDownload && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                  setShowOptions(false);
                }}
                disabled={downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading"}
                className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/10 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 text-sm transition-colors flex items-center gap-2"
              >
                {downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )} 
                Download
              </button>
            )}
        </div>

        <div className="top-nav w-full flex justify-between items-center mb-6 sm:mb-8 relative z-10">
            <button 
              id="minimize-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] transition-colors"
            >
                <ChevronDown className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">Now Playing</span>
            <button 
              id="options-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] transition-colors"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>

        <div className={clsx(
          "album-art relative w-full aspect-square rounded-3xl sm:rounded-[2rem] overflow-hidden mb-6 sm:mb-8 shadow-2xl transition-all duration-500 flex-shrink-0 z-0",
          !isPlaying && isMinimized ? "paused" : ""
        )}>
            {thumbnail ? (
              <img 
                  id="album-image"
                  src={thumbnail} 
                  alt={title} 
                  className={clsx(
                    "w-full h-full object-cover transition-all duration-500",
                    showOptions ? "dimmed" : "",
                    isPlaying && !isMinimized ? "scale-105" : "scale-100"
                  )}
              />
            ) : (
              <div className={clsx(
                "w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 transition-all duration-500",
                showOptions ? "dimmed" : "",
                isPlaying && !isMinimized ? "scale-105" : "scale-100"
              )}>
                <Music className="w-16 h-16 text-white/50" />
              </div>
            )}
            
            {/* Overlay for glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 transform rotate-45 pointer-events-none filter blur-xl"></div>
        </div>

        <div className="track-info w-full flex justify-center items-end mb-6 sm:mb-8 px-2 transition-all duration-300 relative z-10">
            <div className="flex flex-col items-center text-center overflow-hidden whitespace-nowrap min-w-0 w-full">
                <h2 className="text-2xl font-semibold text-gradient tracking-tight mb-1 truncate w-full">
                  {isResolving ? resolveMessage : title}
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-light truncate w-full">
                  {isResolving ? "Loading..." : "Spotify Audio"}
                </p>
            </div>
        </div>

        <div className="progress-section w-full mb-6 sm:mb-8 transition-all duration-300 relative z-10">
            <div className="flex justify-between text-[10px] font-medium text-[var(--text-muted)] mb-2 px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--progress-bg)] rounded-full overflow-hidden relative group">
                <div 
                  className="absolute top-0 left-0 h-full bg-[var(--accent)] rounded-full pointer-events-none"
                  style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                ></div>
                
                <input 
                  type="range" 
                  value={currentTime} 
                  min="0" 
                  max={duration || 100} 
                  step="0.01" 
                  onChange={handleSeek}
                  className="custom-range"
                />
            </div>
        </div>

        <div className="playback-controls w-full flex justify-between items-center px-1 mb-2 transition-all duration-300 relative z-10">
            
            {/* Download Button */}
            {onDownload ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                disabled={downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading"}
                className="extra-controls w-10 transition-colors p-2 flex justify-center relative text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-50"
              >
                {downloadStatus?.status === "preparing" || downloadStatus?.status === "downloading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            ) : (
              <div className="w-10"></div>
            )}

            <div className="flex items-center gap-4">
                {/* Backward 10s */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    skipTime(-10);
                  }}
                  disabled={!duration || isResolving}
                  className="skip-btn skip-btn-rewind w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] hover:text-white disabled:opacity-50" 
                  title="Rewind 10s"
                >
                    <Rewind className="w-5 h-5 fill-current" />
                </button>

                {/* Play/Pause */}
                <button 
                  id="play-pause-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  disabled={isResolving}
                  className="main-play-btn w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center glass-button shadow-lg relative group disabled:opacity-50"
                >
                    <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                    {isLoading || isResolving ? (
                      <div className="relative flex items-center justify-center w-full h-full z-10">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 p-[2px]" viewBox="0 0 100 100">
                          <circle 
                            cx="50" cy="50" r="46" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            className="text-white/10 dark:text-neutral-900/10" 
                          />
                          <circle 
                            cx="50" cy="50" r="46" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            strokeDasharray="289.026" 
                            strokeDashoffset={289.026 - (289.026 * ((resolveProgress || 0) / 100))}
                            strokeLinecap="round"
                            className="text-[var(--text-main)] transition-all duration-300 ease-out" 
                          />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">{Math.round(resolveProgress || 0)}%</span>
                      </div>
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8 fill-current text-[var(--text-main)] relative z-10" />
                    ) : (
                      <Play className="w-8 h-8 fill-current text-[var(--text-main)] translate-x-[2px] relative z-10" />
                    )}
                </button>

                {/* Forward 10s */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    skipTime(10);
                  }}
                  disabled={!duration || isResolving}
                  className="skip-btn w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-button text-[var(--text-main)] hover:text-white disabled:opacity-50" 
                  title="Forward 10s"
                >
                    <FastForward className="w-5 h-5 fill-current" />
                </button>
            </div>

            {/* Repeat */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsLooping(!isLooping);
              }}
              className={clsx(
                "extra-controls w-10 transition-colors p-2 flex justify-center relative",
                isLooping ? "active-control" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              )}
            >
                <Repeat className="w-5 h-5" />
            </button>
        </div>
      </div>
      {/* Immersive Lyrics Pane */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLyrics && parsedLyrics.length > 0 && (
            <motion.div key="immersive-lyrics"
            initial={{ opacity: 0, y: '100vh' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100vh' }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[9999] immersive-lyrics-wrapper flex flex-col items-center justify-between overflow-hidden"
          >
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&display=swap');
              
              .immersive-lyrics-wrapper {
                  font-family: 'Poppins', sans-serif;
                  background-color: #050505;
                  color: white;
              }
              
              .immersive-lyrics-wrapper ::-webkit-scrollbar { display: none; }
              .immersive-lyrics-wrapper * { -ms-overflow-style: none; scrollbar-width: none; }
              
              #dynamic-bg {
                  position: absolute;
                  inset: 0;
                  z-index: 0;
                  transition: background-color 2s ease-in-out;
              }
              
              .lyrics-mask {
                  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
                  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
              }
              
              .lyric-line {
                  transition: all 0.5s ease-out;
                  transform-origin: left center;
                  opacity: 0.4;
                  transform: scale(0.98);
                  filter: blur(1px);
                  cursor: pointer;
                  text-align: left;
                  padding: 0.75rem 0;
                  letter-spacing: -0.02em;
              }
              
              .lyric-line:hover {
                  opacity: 0.7;
              }
              
              .lyric-line.active {
                  opacity: 1;
                  transform: scale(1);
                  filter: blur(0px);
                  color: #ffffff;
                  font-weight: 800;
              }
              
              .glass-dock {
                  background: rgba(25, 25, 25, 0.4);
                  backdrop-filter: blur(24px);
                  -webkit-backdrop-filter: blur(24px);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  transition: box-shadow 0.3s ease;
              }
              
              .glass-dock input[type=range] {
                  -webkit-appearance: none;
                  width: 100%;
                  background: transparent;
                  height: 24px;
              }
              .glass-dock input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 16px;
                  width: 16px;
                  border-radius: 50%;
                  background: #fff;
                  cursor: pointer;
                  margin-top: -6px;
                  box-shadow: 0 0 15px rgba(255,255,255,0.8);
                  transition: transform 0.2s;
              }
              .glass-dock input[type=range]::-webkit-slider-thumb:hover {
                  transform: scale(1.3);
              }
              .glass-dock input[type=range]::-webkit-slider-runnable-track {
                  width: 100%;
                  height: 4px;
                  cursor: pointer;
                  background: rgba(255, 255, 255, 0.15);
                  border-radius: 2px;
              }
            `}</style>
            
            <div id="dynamic-bg" style={{ backgroundColor: bgColors[activeLyricIndex % bgColors.length] || '#121212' }} />
            
            {/* Close Button */}
            <button 
                onClick={() => setShowLyrics(false)}
                className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all text-white/70 hover:text-white"
            >
                <ChevronDown className="w-8 h-8" />
            </button>

            {/* Lyrics Container */}
            <div 
                ref={lyricsContainerRef}
                className="relative lyrics-mask z-10 flex-1 w-full max-w-4xl px-6 md:px-16 py-[45vh] overflow-y-auto scroll-smooth flex flex-col space-y-6 md:space-y-10"
            >
                {parsedLyrics.map((lyric, idx) => (
                    <div 
                        key={idx}
                        className={`lyric-line text-2xl md:text-3xl lg:text-4xl font-bold ${activeLyricIndex === idx ? 'active' : ''}`}
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.currentTime = lyric.time;
                            }
                        }}
                    >
                        {lyric.text || "♪"}
                    </div>
                ))}
            </div>

            {/* Glass Dock */}
            <div 
              className="z-20 w-[95%] md:w-[80%] max-w-3xl mb-6 px-6 py-5 glass-dock rounded-3xl flex flex-col items-center absolute bottom-0"
              style={{ boxShadow: isPlaying ? '0 -10px 40px rgba(107, 33, 168, 0.4)' : '0 -10px 40px rgba(0,0,0,0.5)' }}
            >
                {/* Track Info */}
                <div className="flex items-center justify-between w-full mb-4">
                    <div className="flex items-center space-x-4 min-w-0 pr-4">
                        {thumbnail ? (
                            <img src={thumbnail} alt="Cover art" className="w-12 h-12 rounded-lg shadow-lg object-cover shrink-0" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg animate-pulse shrink-0"></div>
                        )}
                        <div className="text-left min-w-0 flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-white leading-tight truncate">{title}</h2>
                            <p className="text-xs md:text-sm text-gray-300 truncate">Spotify Extracted</p>
                        </div>
                    </div>
                    
                    {/* Play/Pause Button */}
                    <button 
                        onClick={togglePlay}
                        className="w-14 h-14 shrink-0 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-7 h-7 animate-spin text-black" />
                        ) : isPlaying ? (
                            <Pause className="w-7 h-7 fill-black" />
                        ) : (
                            <Play className="w-7 h-7 fill-black ml-1" />
                        )}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full flex items-center space-x-4">
                    <span className="text-xs text-gray-400 font-medium w-10 text-right shrink-0">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 group flex items-center">
                        <input 
                            type="range" 
                            value={currentTime} 
                            min="0" 
                            max={duration || 100} 
                            step="0.01" 
                            onChange={handleSeek}
                            className="w-full absolute z-20"
                        />
                        {/* Glowing Progress fill */}
                        <div 
                            className="absolute left-0 h-1 bg-white rounded-full z-10 shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none" 
                            style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-400 font-medium w-10 text-left shrink-0">{formatTime(duration)}</span>
                </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
