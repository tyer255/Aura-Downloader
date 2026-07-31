import { PlatformContent } from './components/PlatformContent';
import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import ReloadPrompt from './components/ReloadPrompt';
import NotificationRequest from './components/NotificationRequest';


import { Suspense, lazy } from 'react';
const PrivacyPolicy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsConditions = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.TermsConditions })));
const DMCA = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.DMCA })));
const About = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const Contact = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Contact })));
const FAQ = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.FAQ })));
const NotFound = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.NotFound })));
const ServerError = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ServerError })));
const CookiePolicy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.CookiePolicy })));

import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2, AlertCircle, CheckCircle2, Youtube, History, Download, Film, Music, Tv, MessageSquare, Image as ImageIcon, Instagram, Facebook, ListVideo, User, X, ChevronLeft, ChevronRight, Maximize2, Copy, Check, Sparkles, Sun, Moon, QrCode, Star, Trash2, Upload, ExternalLink, Filter, Calendar, Lock, Archive, Linkedin, Twitter, Plus, Play, Pause, Activity, Scissors, Bookmark, ArrowRight, Share2, Camera, Headphones, HelpCircle, Settings, DownloadCloud } from 'lucide-react';
import { m as motion, LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { subscribeUserToPush } from './push';

import { DownloadResult } from './types';

function getSafeUrl(targetUrl: string, originalUrl?: string) {
  if (!targetUrl) return originalUrl || '';
  if (targetUrl.includes('/api/spotify-resolve') || targetUrl.includes('/api/download') || targetUrl.includes('/api/proxy') || targetUrl.startsWith('/api/')) {
    return originalUrl || '';
  }
  return targetUrl;
}

function getShareText(targetUrl: string, originalUrl?: string) {
  const safeUrl = getSafeUrl(targetUrl, originalUrl) || originalUrl || targetUrl;
  let platform = "this media";
  if (safeUrl.includes("spotify.com") || safeUrl.includes("spotify")) platform = "this Spotify track";
  else if (safeUrl.includes("youtube.com") || safeUrl.includes("youtu.be")) platform = "this YouTube video";
  else if (safeUrl.includes("instagram.com")) platform = "this Instagram post";
  else if (safeUrl.includes("pinterest.com") || safeUrl.includes("pin.it")) platform = "this Pinterest pin";
  else if (safeUrl.includes("tiktok.com")) platform = "this TikTok video";
  else if (safeUrl.includes("snapchat.com")) platform = "this Snapchat media";
  else if (safeUrl.includes("x.com") || safeUrl.includes("twitter.com")) platform = "this X post";
  else if (safeUrl.includes("reddit.com")) platform = "this Reddit post";

  const sourceStr = safeUrl && !safeUrl.includes('/api/') ? `\n\nSource: ${safeUrl}` : '';
  return `I just downloaded ${platform} using AURA Downloader! 🚀${sourceStr}\n\nGet the app: https://aura-download.ai.studio`;
}

import clsx from 'clsx';

import { requestNotificationPermission, showNotification } from './lib/notifications';
import { TermsModal } from './components/TermsModal';
import { SpotifyAudioPlayer } from './components/SpotifyAudioPlayer';

function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl || /\.(mp4|webm|mkv|mov|avi)(\?|$)/i.test(thumbnailUrl)) return [];
  
  // Check if it's a YouTube thumbnail
  if (thumbnailUrl.includes('ytimg.com') || thumbnailUrl.includes('youtube.com') || thumbnailUrl.includes('/vi/')) {
      const videoIdMatch = thumbnailUrl.match(/\/vi(?:_webp)?\/([^\/]+)\//) || thumbnailUrl.match(/vi=([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch && videoIdMatch[1]) {
          const videoId = videoIdMatch[1];
          return [
              { label: "HD Cover (Max Resolution)", url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, ext: "jpg" },
              { label: "Standard Cover", url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, ext: "jpg" }
          ];
      }
  }
  
  // For other platforms, just return the original URL
  return [
      { label: "Original Cover", url: thumbnailUrl, ext: "jpg" }
  ];
}

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  // Never display in Bytes.
  if (bytes < k) {
    return (bytes / k).toFixed(1) + ' KB';
  }
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function cleanSizeLabel(size?: string): string {
  if (!size) return '';
  const s = String(size).trim();
  const lower = s.toLowerCase();
  if (
    lower.includes('unknown') ||
    lower.includes('high definition') ||
    lower.includes('standard hd') ||
    lower.includes('standard definition') ||
    lower.includes('low bandwidth') ||
    lower.includes('audio only') ||
    lower === '0 mb' ||
    lower === '~ 0 mb' ||
    lower === 'original'
  ) {
    return '';
  }
  return s;
}

export function getQualitySizeDisplay(
  q: ProcessedQuality,
  videoLength?: number,
  fetchedSizes?: Record<string, string>,
  titleOrUrl?: string
): string {
  if (fetchedSizes && fetchedSizes[q.url] && fetchedSizes[q.url] !== "Size Unknown") {
    return fetchedSizes[q.url];
  }

  if (q.size) {
    const s = String(q.size).trim();
    if (/\d+\s*(MB|KB|GB|B)/i.test(s)) {
      return s.replace(/^~\s*/, '');
    }
  }

  const label = (q.label || '').toLowerCase();
  const isAudio = q.isAudio || label.includes('mp3') || label.includes('audio') || q.ext === 'mp3';

  const targetStr = (titleOrUrl || '').toLowerCase();
  const isShortMedia = targetStr.includes('/shorts/') || targetStr.includes('/reel/') || targetStr.includes('tiktok') || targetStr.includes('short') || targetStr.includes('montagem') || targetStr.includes('slowed') || targetStr.includes('edit');

  if (videoLength && typeof videoLength === 'number' && videoLength > 0) {
    if (isAudio) {
      const mb = (videoLength * 0.016).toFixed(1);
      return `${Math.max(0.5, parseFloat(mb))} MB`;
    }
    if (label.includes('1080p') || label.includes('1080') || label.includes('full hd') || label.includes('4k') || label.includes('2160p')) {
      const mb = (videoLength * 0.45).toFixed(1);
      return `${Math.max(1.8, parseFloat(mb))} MB`;
    }
    if (label.includes('720p') || label.includes('720') || label.includes('hd')) {
      const mb = (videoLength * 0.25).toFixed(1);
      return `${Math.max(1.2, parseFloat(mb))} MB`;
    }
    if (label.includes('480p') || label.includes('480')) {
      const mb = (videoLength * 0.12).toFixed(1);
      return `${Math.max(0.8, parseFloat(mb))} MB`;
    }
    if (label.includes('360p') || label.includes('360')) {
      const mb = (videoLength * 0.07).toFixed(1);
      return `${Math.max(0.6, parseFloat(mb))} MB`;
    }
    if (label.includes('144p') || label.includes('240p') || label.includes('144') || label.includes('240')) {
      const mb = (videoLength * 0.03).toFixed(1);
      return `${Math.max(0.4, parseFloat(mb))} MB`;
    }
    const mb = (videoLength * 0.28).toFixed(1);
    return `${Math.max(1.0, parseFloat(mb))} MB`;
  }

  if (isShortMedia) {
    if (isAudio) return '1.2 MB';
    if (label.includes('1080p') || label.includes('1080') || label.includes('full hd') || label.includes('4k') || label.includes('2160p')) {
      return '9.1 MB';
    }
    if (label.includes('720p') || label.includes('720') || label.includes('hd')) {
      return '5.4 MB';
    }
    if (label.includes('480p') || label.includes('480')) {
      return '3.2 MB';
    }
    if (label.includes('360p') || label.includes('360')) {
      return '1.8 MB';
    }
    if (label.includes('144p') || label.includes('240p') || label.includes('144') || label.includes('240')) {
      return '0.9 MB';
    }
    return '4.5 MB';
  }

  if (isAudio) {
    return '3.5 MB';
  }
  if (label.includes('1080p') || label.includes('1080') || label.includes('full hd') || label.includes('4k') || label.includes('2160p')) {
    return '18.5 MB';
  }
  if (label.includes('720p') || label.includes('720') || label.includes('hd')) {
    return '11.2 MB';
  }
  if (label.includes('480p') || label.includes('480')) {
    return '6.2 MB';
  }
  if (label.includes('360p') || label.includes('360')) {
    return '3.5 MB';
  }
  if (label.includes('144p') || label.includes('240p') || label.includes('144') || label.includes('240')) {
    return '1.5 MB';
  }

  return '9.5 MB';
}

export interface ProcessedQuality {
  label: string;
  url: string;
  ext: string;
  size?: string;
  isAudio?: boolean;
}

function getMediaKey(item: any): string | null {
  if (!item || typeof item !== 'object') return null;

  // 1. Specific unique media item ID (mediaId, id, child_id, pk, media_id, nodeId)
  const directId = item.mediaId || item.id || item.child_id || item.pk || item.media_id || item.nodeId || item.node_id;
  if (directId !== undefined && directId !== null) {
    const idStr = String(directId).trim();
    if (idStr) return `id:${idStr}`;
  }

  // 2. Shortcode + position/index for carousel slides
  const idx = item.index ?? item.position;
  if (item.shortcode && idx !== undefined && idx !== null) {
    const scStr = String(item.shortcode).trim();
    if (scStr) return `shortcode_idx:${scStr}_${idx}`;
  }

  // 3. Exact download / media / display / url string
  const rawUrl = item.downloadUrl || item.mediaUrl || item.displayUrl || item.url;
  if (rawUrl && typeof rawUrl === 'string') {
    let cleanUrl = rawUrl.trim();
    if (cleanUrl.includes('/api/proxy-download')) {
      try {
        const match = cleanUrl.match(/[?&]url=([^&]+)/);
        if (match && match[1]) {
          cleanUrl = decodeURIComponent(match[1]);
        }
      } catch (e) {
        // fallback
      }
    }
    if (cleanUrl) return `url:${cleanUrl}`;
  }

  // 4. Exact thumbnail URL
  const rawThumb = item.thumbnailUrl || item.thumbnail;
  if (rawThumb && typeof rawThumb === 'string') {
    let cleanThumb = rawThumb.trim();
    if (cleanThumb.includes('/api/proxy-download')) {
      try {
        const match = cleanThumb.match(/[?&]url=([^&]+)/);
        if (match && match[1]) {
          cleanThumb = decodeURIComponent(match[1]);
        }
      } catch (e) {
        // fallback
      }
    }
    if (cleanThumb) return `thumb:${cleanThumb}`;
  }

  // NEVER collapse items based on shortcode alone or parent post URL
  return null;
}

export function deduplicateMediaItems<T = any>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const seenKeys = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    if (!item) continue;

    const key = getMediaKey(item);

    if (!key) {
      uniqueItems.push(item);
      continue;
    }

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

function sanitizeQualities(qualities?: any[], fallbackUrl?: string): ProcessedQuality[] {
  if (!qualities || qualities.length === 0) {
    if (fallbackUrl) {
      return [{
        label: "Original Quality",
        url: fallbackUrl,
        ext: "mp4",
        size: ""
      }];
    }
    return [];
  }

  const validQualities = qualities.filter(q => q && q.url);
  const videoQualities = validQualities.filter(q => q.ext !== 'mp3' && !q.label?.toLowerCase().includes('mp3'));
  const audioQualities = validQualities.filter(q => q.ext === 'mp3' || q.label?.toLowerCase().includes('mp3'));

  const uniqueVideoUrls = new Set(videoQualities.map(q => q.url));

  let finalVideos: ProcessedQuality[] = [];

  if (videoQualities.length > 1 && uniqueVideoUrls.size === 1) {
    const first = videoQualities[0];
    const realSize = cleanSizeLabel(first.size);
    finalVideos = [{
      label: "Original Quality",
      url: first.url,
      ext: first.ext || "mp4",
      size: realSize
    }];
  } else {
    const seenUrls = new Set<string>();
    videoQualities.forEach(q => {
      if (!seenUrls.has(q.url)) {
        seenUrls.add(q.url);
        let label = q.label || "Original Quality";
        if (label.includes("(Full HD)")) label = "1080p";
        else if (label.includes("(HD Video)")) label = "720p";
        else if (label.includes("(SD Video)")) label = "480p";
        else if (label.includes("(Mobile Video)")) label = "360p";

        finalVideos.push({
          label: label,
          url: q.url,
          ext: q.ext || "mp4",
          size: cleanSizeLabel(q.size)
        });
      }
    });
  }

  let finalAudios: ProcessedQuality[] = [];
  audioQualities.forEach(q => {
    finalAudios.push({
      label: "MP3 Audio",
      url: q.url,
      ext: "mp3",
      size: cleanSizeLabel(q.size),
      isAudio: true
    });
  });

  return [...finalVideos, ...finalAudios];
}

const getProxiedUrl = (url?: string, inline = true) => {
  if (!url) return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EzYTNhMyIgc3Ryb2tlPSJub25lIj4KICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0zLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5IDEuOTQtMy41IDMuMjItNiAzLjIyeiIvPgo8L3N2Zz4=`;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // For Instagram/Facebook/TikTok/Reddit CDNs, always proxy to bypass client-side CORS/403 blocks/hotlink protections
  if (
    url.includes('instagram.com') || 
    url.includes('cdninstagram.com') || 
    url.includes('fbcdn.net') || 
    url.includes('tiktokcdn') || 
    url.includes('ttwstatic') || 
    url.includes('redd.it') || 
    url.includes('redditstatic') ||
    url.includes('twimg.com') ||
    url.includes('twitter.com') ||
    url.includes('licdn.com') ||
    url.includes('linkedin.com') ||
    url.includes('snapchat.com') ||
    url.includes('youtube.com') ||
    // url.includes('ytimg.com') ||
    url.includes('ggpht.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('pinterest.com') ||
    url.includes('pinimg.com')
  ) {
    return `/api/proxy-download?url=${encodeURIComponent(url)}&inline=true`;
  }
  // For inline media (thumbnails, video previews), load directly from source CDNs
  // to avoid server-side rate limits and bandwidth bottlenecks.
  if (inline) {
    return url;
  }
  // Only proxy for actual downloads to force the Content-Disposition header
  return `/api/proxy-download?url=${encodeURIComponent(url)}`;
};

type Tab = 'pinterest' | 'youtube' | 'instagram' | 'snapchat' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin' | 'spotify' | 'threads';

const NewBadge = ({ className = "" }: { className?: string }) => (
  <span className={clsx(
    "inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-400 text-black leading-none shadow-md shadow-emerald-500/30 border border-emerald-300/50 shrink-0 select-none animate-pulse",
    className
  )}>
    NEW
  </span>
);

const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; keywords?: string; isNew?: boolean }[] = [
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', title: 'Aura Downloader - Download Pinterest Videos & Images Free', description: 'Best free Pinterest Downloader online. Download Pinterest videos, images, and GIFs in HD quality without watermark using Aura Downloader.', keywords: 'Aura Downloader, Pinterest downloader, download Pinterest video, Pinterest video downloader, Pinterest saver' },
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', title: 'Aura Downloader - YouTube Downloader, Shorts & Reels Saver', description: 'Aura Downloader is the best free YouTube Downloader. Download YouTube videos, Shorts, and Reels in 1080p, 4K HD effortlessly.', keywords: 'Aura Downloader, YouTube downloader, YouTube Shorts downloader, YouTube Reel downloader, download YouTube video, YouTube to mp3' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', title: 'Aura Downloader - Instagram Reels & Video Downloader', description: 'Free online Instagram Downloader by Aura Downloader. Download Instagram reels, photos, videos, IGTV, and stories in high quality easily.', keywords: 'Aura Downloader, Instagram downloader, download Instagram video, Instagram reels downloader, Instagram story saver' },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'Paste Snapchat Spotlight or Story Link', name: 'Snapchat Downloader', title: 'Aura Downloader - Download Snapchat Videos Free', description: 'Free online Snapchat Video Downloader. Download Snapchat Spotlight videos and stories in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, Snapchat downloader, download Snapchat video, Snapchat spotlight downloader, story saver', isNew: true },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', title: 'Aura Downloader - TikTok Downloader Without Watermark', description: 'Best free TikTok Downloader. Download TikTok videos without watermark in HD quality using Aura Downloader.', keywords: 'Aura Downloader, TikTok downloader, download TikTok video, TikTok no watermark, TikTok video downloader' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', title: 'Aura Downloader - Download Facebook Videos & Reels Free', description: 'Free online Facebook Video Downloader by Aura Downloader. Download Facebook reels and videos in HD quality to your device fast and easily.', keywords: 'Aura Downloader, Facebook downloader, download Facebook video, Facebook reels downloader, FB video downloader' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', title: 'Aura Downloader - Download Reddit Videos With Audio', description: 'Free Reddit Video Downloader. Download Reddit videos with sound in HD quality with Aura Downloader.', keywords: 'Aura Downloader, Reddit downloader, download Reddit video with audio, Reddit video saver' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'Paste X / Twitter Link Here', name: 'X / Twitter Downloader', title: 'Aura Downloader - Download Twitter Videos & GIFs Free', description: 'Best free X (Twitter) Downloader. Download videos, GIFs, and media from tweets in HD quality quickly and securely with Aura Downloader.', keywords: 'Aura Downloader, Twitter downloader, X downloader, download Twitter video, save tweet video' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver', isNew: true },
  { id: 'spotify', label: 'Spotify', placeholder: 'Paste Spotify Track or Playlist Link', name: 'Spotify Downloader', title: 'Aura Downloader - Download Spotify Audio Free', description: 'Free online Spotify Audio Downloader. Download Spotify tracks and playlists in MP3 format with Aura Downloader.', keywords: 'Aura Downloader, Spotify downloader, download Spotify audio, Spotify to mp3', isNew: true },
  { id: 'threads', label: 'Threads', placeholder: 'Paste Threads Link Here (Photos, Videos & Carousels)', name: 'Threads Downloader', title: 'Aura Downloader - Download Threads Photos & Videos Free', description: 'Free online Threads Downloader. Download Threads photos, videos, and multi-media carousels in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, Threads downloader, download Threads photo, download Threads video, Threads carousel downloader', isNew: true },
];

const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('spotify.com') || lowercase.includes('spoti.fi') || lowercase.includes('spotify.link')) {
    return 'spotify';
  }
  if (lowercase.includes('threads.net') || lowercase.includes('threads.com')) {
    return 'threads';
  }
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it') || lowercase.includes('pinterest.')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am') || lowercase.includes('instagr.com')) {
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com') || lowercase.includes('vt.tiktok.com') || lowercase.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com') || lowercase.includes('fb.gg') || lowercase.includes('fb.me')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be') || lowercase.includes('youtube-nocookie.com')) {
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com') || lowercase.includes('t.co')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com') || lowercase.includes('lnkd.in')) {
    return 'linkedin';
  }
  if (lowercase.includes('snapchat.com')) {
    return 'snapchat';
  }
  return null;
};

const getTabLabel = (id: Tab): string => {
  const tab = TABS.find(t => t.id === id);
  return tab ? tab.label : id;
};

const render3DGlassIcon = (platform: Tab): React.ReactNode => {
  switch (platform) {
    case 'youtube':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ytBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="50%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#b30000" />
            </linearGradient>
            <linearGradient id="ytGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="ytInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
            </radialGradient>
          </defs>
          <rect x="12" y="22" width="76" height="56" rx="20" fill="url(#ytBaseGrad)" filter="drop-shadow(0 6px 10px rgba(220,38,38,0.4))" />
          <rect x="12" y="22" width="76" height="56" rx="20" fill="url(#ytInnerShadow)" />
          <path d="M41 36 L66 50 L41 64 Z" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))" />
          <path d="M12 42 C12 30.95 20.95 22 32 22 L68 22 C79.05 22 88 30.95 88 42 C68 45 32 45 12 42 Z" fill="url(#ytGlassGrad)" />
          <path d="M14 36 C20 25 80 25 86 36" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="instaBaseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f9ce34" />
              <stop offset="30%" stopColor="#ee2a7b" />
              <stop offset="70%" stopColor="#d82b7d" />
              <stop offset="100%" stopColor="#6228d7" />
            </linearGradient>
            <linearGradient id="instaGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="instaInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="75%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#instaBaseGrad)" filter="drop-shadow(0 6px 12px rgba(238,42,123,0.35))" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#instaInnerShadow)" />
          <rect x="28" y="28" width="44" height="44" rx="13" fill="none" stroke="#ffffff" strokeWidth="5.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          <circle cx="50" cy="50" r="11" fill="none" stroke="#ffffff" strokeWidth="5.5" />
          <circle cx="63" cy="37" r="3.5" fill="#ffffff" />
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#instaGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ttBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#25282a" />
              <stop offset="50%" stopColor="#121315" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="ttGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#ttBaseGrad)" filter="drop-shadow(0 6px 12px rgba(37,244,238,0.25))" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <g transform="translate(30, 30) scale(1.666)">
            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-1.15 4.41-2.91 5.76-1.76 1.34-4.04 1.83-6.2 1.48-2.15-.35-4.06-1.62-5.18-3.46-1.11-1.84-1.34-4.14-.62-6.13.71-1.99 2.37-3.56 4.35-4.12 1.98-.56 4.18-.32 5.96.68v4.18c-1.16-.48-2.52-.43-3.64.13-1.12.56-1.9 1.68-2.13 2.92-.22 1.23.15 2.53 1.01 3.44.85.91 2.15 1.32 3.39 1.1 1.23-.22 2.26-1.04 2.8-2.17.53-1.13.62-2.45.24-3.64V.02z" fill="#fe2c55" opacity="0.8" transform="translate(0.8, 0.8)" />
            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-1.15 4.41-2.91 5.76-1.76 1.34-4.04 1.83-6.2 1.48-2.15-.35-4.06-1.62-5.18-3.46-1.11-1.84-1.34-4.14-.62-6.13.71-1.99 2.37-3.56 4.35-4.12 1.98-.56 4.18-.32 5.96.68v4.18c-1.16-.48-2.52-.43-3.64.13-1.12.56-1.9 1.68-2.13 2.92-.22 1.23.15 2.53 1.01 3.44.85.91 2.15 1.32 3.39 1.1 1.23-.22 2.26-1.04 2.8-2.17.53-1.13.62-2.45.24-3.64V.02z" fill="#25f4ee" opacity="0.8" transform="translate(-0.8, -0.8)" />
            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-1.15 4.41-2.91 5.76-1.76 1.34-4.04 1.83-6.2 1.48-2.15-.35-4.06-1.62-5.18-3.46-1.11-1.84-1.34-4.14-.62-6.13.71-1.99 2.37-3.56 4.35-4.12 1.98-.56 4.18-.32 5.96.68v4.18c-1.16-.48-2.52-.43-3.64.13-1.12.56-1.9 1.68-2.13 2.92-.22 1.23.15 2.53 1.01 3.44.85.91 2.15 1.32 3.39 1.1 1.23-.22 2.26-1.04 2.8-2.17.53-1.13.62-2.45.24-3.64V.02z" fill="#ffffff" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#ttGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fbBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18acfe" />
              <stop offset="100%" stopColor="#0062e0" />
            </linearGradient>
            <linearGradient id="fbGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="fbInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#fbBaseGrad)" filter="drop-shadow(0 6px 12px rgba(24,172,254,0.35))" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#fbInnerShadow)" />
          <path d="M62 24 H54 C46 24 43 28 43 35 V43 H35 V54 H43 V85 H55 V54 H64 L65.5 43 H55 V36 C55 33 56 32 59 32 H65 Z" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#fbGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
      );
    case 'reddit':
      return (
        <div className="w-16 h-16 flex items-center justify-center">
          <BrandIcon id="reddit" className="w-[85%] h-[85%] drop-shadow-xl select-none" />
        </div>
      );
    case 'spotify':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="spGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="spInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#spBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#spInnerShadow)" />
          <g transform="translate(26, 26) scale(2)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
             <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" fill="#1ED760" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#spGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="thBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="thGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="thInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#thBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#thInnerShadow)" />
          <g transform="translate(26, 26) scale(2)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
             <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" fill="#ffffff" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#thGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pinBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e60023" />
              <stop offset="100%" stopColor="#ad081b" />
            </linearGradient>
            <linearGradient id="pinGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="pinInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="36" fill="url(#pinBaseGrad)" filter="drop-shadow(0 6px 12px rgba(230,0,35,0.35))" />
          <circle cx="50" cy="50" r="36" fill="url(#pinInnerShadow)" />
          <path d="M46.7 69 C44.9 59.8 40.5 44 40.5 44 C40.5 44 39.1 41.2 39.1 37.1 C39.1 31.1 42.6 26.6 46.9 26.6 C50.8 26.6 52.7 29.5 52.7 33 C52.7 37 50.1 42.9 48.8 48.3 C47.7 52.8 51.1 56.4 55.5 56.4 C63.6 56.4 69.8 47.9 69.8 35.8 C69.8 25.1 62.1 17.5 48.9 17.5 C33.4 17.5 24.3 29.1 24.3 40.5 C24.3 45.2 26.1 50.1 28.3 52.7 C28.9 53.4 29 53.9 28.8 54.7 C28.4 56.4 27.6 59.7 27.4 60.5 C27.1 61.6 26.2 61.9 25.2 61.5 C18.7 58.5 14.6 48.9 14.6 39.8 C14.6 22 27.5 10 51.1 10 C70 10 84.6 23.5 84.6 41.6 C84.6 60.4 72.8 72 55.9 72 C50.2 72 44.9 69 43.1 65.5 C43.1 65.5 40.3 76.5 39.6 79 C38.1 84.8 33.7 91.5 31.3 95 L29.3 95 C29.7 92.5 32.7 83.5 34.3 77 C35.4 72.1 37.7 62.6 37.7 62.6" fill="#ffffff" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.2))" transform="translate(17.5, 15.5) scale(0.65)" />
          <path d="M14 50 C14 30.12 30.12 14 50 14 C69.88 14 86 30.12 86 50 C62 55 38 55 14 50 Z" fill="url(#pinGlassGrad)" />
          <path d="M18 36 C26 23 74 23 82 36" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="xBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c2c2c" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            <linearGradient id="xGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="xInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </radialGradient>
            <linearGradient id="x3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#xBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#xInnerShadow)" />
          <g transform="translate(36, 36) scale(1.25)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="url(#x3dGrad)" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#xGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      );
    case 'snapchat':
      return (
        <div className="w-16 h-16 flex items-center justify-center">
          <BrandIcon id="snapchat" className="w-[72%] h-[72%] drop-shadow-xl select-none" />
        </div>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="liBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00a0dc" />
              <stop offset="100%" stopColor="#0077b5" />
            </linearGradient>
            <linearGradient id="liGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="liInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
            <linearGradient id="li3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#liBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,119,181,0.35))" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#liInnerShadow)" />
          <g transform="translate(23, 29) scale(1.8)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))">
            <path d="M 6 9.5 h 5 v 15 h -5 z m 2.5 -7.5 a 3 3 0 1 1 0 6 a 3 3 0 1 1 0 -6 z M 13.5 9.5 h 4.5 v 2.2 c .7 -1.4 2.5 -2.5 5 -2.5 c 4 0 6.5 2.5 6.5 7 v 8.3 h -5 v -7.5 c 0 -2 -1 -3 -3 -3 c -2 0 -3 1.5 -3 3.5 v 7 h -5 z" fill="url(#li3dGrad)" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#liGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
};

const getPlatformDetails = (platform: Tab): { icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string } => {
  switch (platform) {
    case 'pinterest':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.62 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.95 1.4-5.95s-.36-.72-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.18.59 2.15 1.75 2.15 2.1 0 3.72-2.22 3.72-5.42 0-2.83-2.04-4.81-4.94-4.81-3.37 0-5.34 2.52-5.34 5.13 0 1.01.39 2.1 0.88 2.7.1.12.11.23.08.35-.09.37-.29 1.19-.33 1.35-.05.21-.18.26-.41.15-1.54-.72-2.5-2.97-2.5-4.78 0-3.89 2.83-7.46 8.14-7.46 4.28 0 7.6 3.05 7.6 7.12 0 4.25-2.67 7.67-6.39 7.67-1.25 0-2.42-.65-2.82-1.42 0 0-.62 2.35-.77 2.94-.28 1.08-1.04 2.43-1.55 3.26C10.15 23.85 11.06 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
          </svg>
        ),
        colorClass: 'text-red-600 dark:text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20'
      };
    case 'instagram':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        ),
        colorClass: 'text-pink-600 dark:text-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/20'
      };
    case 'youtube':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        ),
        colorClass: 'text-red-650 dark:text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20'
      };
    case 'tiktok':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.5-1.25-.93-2.12-2.31-2.45-3.83v9.36c0 1.62-.35 3.29-1.21 4.67-1.15 1.83-3.23 2.96-5.41 3.01-2.1-.03-4.14-1.07-5.26-2.86-1.24-2-1.24-4.66.01-6.66 1.15-1.83 3.25-2.96 5.43-3.01.03 1.34.02 2.68.03 4.02-1.08.01-2.19.46-2.84 1.32-.69.91-.71 2.21-.05 3.14.65.9 1.75 1.41 2.87 1.38 1.11-.03 2.14-.62 2.62-1.63.43-.88.42-1.89.42-2.87V.02z"/>
          </svg>
        ),
        colorClass: 'text-cyan-500 dark:text-cyan-400',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20'
      };
    case 'facebook':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        ),
        colorClass: 'text-blue-650 dark:text-blue-500',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20'
      };
    case 'reddit':
      return {
        icon: (
          <svg viewBox="0 0 40 40" className="w-[22px] h-[22px] drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="reddit-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6314"/>
                <stop offset="100%" stopColor="#CC3D00"/>
              </linearGradient>
              <linearGradient id="reddit-glass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#reddit-3d)" />
            <rect width="40" height="40" rx="10" fill="url(#reddit-glass)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            
            {/* Glossy top highlight */}
            <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 30 0 C 35.5 0 40 4.5 40 10 L 40 15 C 20 15 0 10 0 20 Z" fill="white" fillOpacity="0.1" />

            <g transform="translate(8, 8)">
               <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.23-1.72l1.36-4.3 3.74.8c.04.97.83 1.75 1.8 1.75 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8c-.85 0-1.57.59-1.75 1.38l-4.13-.88c-.24-.05-.48.1-.55.34l-1.5 4.76c-2.45.06-4.73.7-6.4 1.73-.55-.73-1.43-1.19-2.42-1.19-1.65 0-3 1.35-3 3 0 1.13.62 2.1 1.54 2.61-.04.26-.06.52-.06.79 0 3.44 4.02 6.22 9 6.22s9-2.78 9-6.22c0-.27-.02-.53-.06-.79.92-.51 1.54-1.48 1.54-2.61zm-18 1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zm9 3.5c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.5-2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white" style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}/>
            </g>
          </svg>
        ),
        colorClass: 'text-orange-600 dark:text-orange-500',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500/20'
      };
    case 'x':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        ),
        colorClass: 'text-neutral-900 dark:text-neutral-100',
        bgClass: 'bg-neutral-500/10 dark:bg-white/10',
        borderClass: 'border-neutral-500/20 dark:border-white/20'
      };
    case 'linkedin':
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        ),
        colorClass: 'text-blue-700 dark:text-blue-400',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20'
      };
    default:
      return {
        icon: (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.62 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.95 1.4-5.95s-.36-.72-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.98-.28 1.18.59 2.15 1.75 2.15 2.1 0 3.72-2.22 3.72-5.42 0-2.83-2.04-4.81-4.94-4.81-3.37 0-5.34 2.52-5.34 5.13 0 1.01.39 2.1 0.88 2.7.1.12.11.23.08.35-.09.37-.29 1.19-.33 1.35-.05.21-.18.26-.41.15-1.54-.72-2.5-2.97-2.5-4.78 0-3.89 2.83-7.46 8.14-7.46 4.28 0 7.6 3.05 7.6 7.12 0 4.25-2.67 7.67-6.39 7.67-1.25 0-2.42-.65-2.82-1.42 0 0-.62 2.35-.77 2.94-.28 1.08-1.04 2.43-1.55 3.26C10.15 23.85 11.06 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
          </svg>
        ),
        colorClass: 'text-neutral-600 dark:text-neutral-400',
        bgClass: 'bg-neutral-500/10',
        borderClass: 'border-neutral-500/20'
      };
  }
};

const LOADING_STEPS = [
  { text: "Analyzing URL format & initiating platform handshake...", target: 15 },
  { text: "Establishing cloud-allocated secure fetch tunnel...", target: 38 },
  { text: "Extracting structured metadata, stream links & JSON maps...", target: 65 },
  { text: "Locating high-resolution photo frames & video streams...", target: 88 },
  { text: "Packing download buffers and wrapping files for instant download...", target: 98 },
];

function PlaylistItem({ item, index, isLight, onDownloadQueue, activeDownloads }: any) {
  const [qualities, setQualities] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeDownload = selectedQuality ? activeDownloads[selectedQuality] : null;

  const isSpotifyItem = item.type === 'audio' || item.url?.includes('spotify-resolve') || (qualities && qualities.some((q: any) => q.url?.includes('spotify-resolve')));

  useEffect(() => {
    if (fetched || loading) return;
    if (isSpotifyItem) {
      setFetched(true);
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url })
        })
        .then(res => res.json())
        .then(data => {
          setLoading(false);
          setFetched(true);
          if (data.success && data.qualities) {
            const sanitized = sanitizeQualities(data.qualities, item.url);
            setQualities(sanitized);
            if (sanitized.length > 0) {
              setSelectedQuality(sanitized[0].url);
            }
          }
        })
        .catch(() => {
          setLoading(false);
          setFetched(true);
        });
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [fetched, loading, item.url]);

  if (isSpotifyItem) {
    const targetAudioUrl = selectedQuality || item.url || (qualities && qualities[0]?.url) || '';
    const filename = (item.title || "spotify_track").slice(0, 30).trim() + ".mp3";
    return (
      <div ref={containerRef} className="w-full text-left">
        <SpotifyAudioPlayer
          title={item.title || "Spotify Track"}
          thumbnail={item.thumbnail}
          audioUrl={targetAudioUrl}
          isLight={isLight}
          onDownload={() => onDownloadQueue(targetAudioUrl, filename)}
          downloadStatus={activeDownload}
          compact={true}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={clsx("p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center shadow border transition-all group", isLight ? "bg-white border-neutral-200 hover:border-blue-400/50" : "bg-white/5 border-white/10 hover:border-blue-500/50")}>
       <div className="w-24 h-16 sm:w-32 sm:h-20 shrink-0 overflow-hidden rounded-lg bg-black">
         <img src={item.thumbnail} alt={item.title || "Media thumbnail"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" decoding="async" />
       </div>
       <div className="flex-1 min-w-0 w-full text-left">
         <div className={clsx("font-bold truncate text-sm sm:text-base", isLight ? "text-neutral-900" : "text-white")} title={item.title}>{item.title}</div>
         <div className="mt-2 flex items-center gap-2">
            {loading ? (
              <span className="text-xs flex items-center gap-1 text-emerald-500"><Loader2 className="w-3 h-3 animate-spin" /> Fetching quality...</span>
            ) : qualities && qualities.length > 0 ? (
              <select 
                className={clsx("text-xs p-1.5 rounded-lg border outline-none cursor-pointer max-w-full", isLight ? "bg-neutral-50 border-neutral-300 text-neutral-800" : "bg-black/50 border-white/20 text-white")}
                value={selectedQuality}
                onChange={e => setSelectedQuality(e.target.value)}
              >
                {qualities.map((q, i) => (
                   <option key={i} value={q.url}>{q.label} ({getQualitySizeDisplay(q, undefined, fetchedSizes, item.title || item.url)})</option>
                ))}
              </select>
            ) : fetched ? (
              <span className="text-xs text-red-500">Failed to load</span>
            ) : null}
         </div>
       </div>
       <button
         disabled={loading || !qualities || qualities.length === 0 || (activeDownload && activeDownload.status !== 'failed')}
         onClick={() => {
           const qObj = qualities?.find((q: any) => q.url === selectedQuality);
           const ext = qObj?.ext || (selectedQuality.includes('extractAudio=true') ? 'mp3' : 'mp4');
           onDownloadQueue(selectedQuality, (item.title || "video").slice(0, 30).trim() + "." + ext);
         }}
         className={clsx(
           "w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md", 
           activeDownload && activeDownload.status === 'complete' 
             ? "bg-emerald-600 text-white" 
             : isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"
         )}
       >
         {activeDownload ? (
           activeDownload.status === 'complete' ? 'Saved' : 
           activeDownload.status === 'failed' ? 'Retry' : 'Downloading...'
         ) : 'Download'}
       </button>
    </div>
  );
}

// Animated check-mark success icon using framer-motion path animation
function AnimatedCheckMark({ className = "w-5 h-5 text-emerald-500" }: { className?: string }) {
  return (
    <div className={clsx("relative flex items-center justify-center", className)}>
      <motion.div
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 rounded-full border-2 border-current"
      />
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full relative z-10"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
      >
        <motion.path
          d="M20 6L9 17l-5-5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
        />
      </motion.svg>
    </div>
  );
}

// Dedicated component for copy-to-clipboard functionality with a modern transition state
function CopyButton({ url, originalUrl, className, isLight }: { url: string; originalUrl?: string; className?: string; isLight?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const text = getShareText(url, originalUrl);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 font-bold transition-all uppercase tracking-wider border select-none cursor-pointer duration-300 shadow-sm",
        copied
          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
          : isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10",
        className
      )}
      title="Copy Direct Link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 animate-scale-in" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
}

// Reusable component to generate and display a QR code for quick mobile downloads/access
function QRCodeButton({ url, originalUrl, className, isLight }: { url: string; originalUrl?: string; className?: string; isLight?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    try {
      const qrcodeLib = await import('qrcode');
      const dataUrl = await (qrcodeLib.default || qrcodeLib).toDataURL(getShareText(url, originalUrl), {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1516',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR Code');
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    generateQR();
    setIsOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      const text = getShareText(url, originalUrl);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={clsx(
          "inline-flex items-center justify-center gap-1.5 font-bold transition-all uppercase tracking-wider border select-none cursor-pointer duration-300 shadow-sm",
          isLight
            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10",
          className
        )}
        title="Get QR Code for Mobile"
      >
        <QrCode className="w-4 h-4" />
        <span>QR Code</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 border flex flex-col items-center relative transition-all duration-300",
                isLight ? "bg-white border-neutral-200 text-neutral-900" : "bg-[#1c0d0f] border-white/10 text-white"
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer",
                  isLight ? "text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100" : "text-neutral-400 dark:text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              <QrCode className="w-8 h-8 text-[#ff1e42] mb-2" />
              <h3 className="text-lg font-extrabold mb-1 tracking-tight">Scan for Mobile Access</h3>
              <p className={clsx("text-xs text-center mb-6 max-w-[250px] leading-relaxed", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>
                Scan this code with your mobile camera to quickly access or download this file on your phone.
              </p>

              {/* QR Image Frame */}
              
      

    <div className={clsx(
                "p-4 rounded-2xl border flex items-center justify-center mb-6 bg-white shadow-xl transition-all",
                isLight ? "border-neutral-200" : "border-white/5"
              )}>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44 select-none rounded-lg"  loading="lazy" decoding="async" width="400" height="400" />
                ) : error ? (
                  <div className="w-44 min-h-[11rem] flex flex-col items-center justify-center text-red-500 text-[11px] leading-relaxed font-medium text-center px-4 py-2 gap-3">
                    <p>{error.replace(/Please go to RapidAPI.*/, "")}</p>
                    {error.includes("RapidAPI") && (
                       <a 
                         href="https://rapidapi.com/smiash/api/instagram-scraper-api2/pricing" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="px-3 py-1.5 bg-[#ff1e42] text-white rounded-md text-xs font-semibold hover:bg-red-600 transition-colors shadow-sm"
                       >
                         Subscribe for Free
                       </a>
                    )}
                  </div>
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#ff1e42] animate-spin" />
                  </div>
                )}
              </div>

              {/* URL input field so they can also copy/read it */}
              <div className="w-full">
                <span className={clsx("text-[10px] uppercase font-black tracking-wider block mb-1.5", isLight ? "text-neutral-400 dark:text-neutral-400" : "text-neutral-600 dark:text-neutral-400")}>
                  Share App Text:
                </span>
                <div className="flex gap-2">
                  <textarea 
                    readOnly
                    className={clsx(
                      "flex-1 p-2.5 rounded-xl text-[10px] sm:text-xs font-sans font-medium resize-none h-24 outline-none border overflow-y-auto leading-relaxed whitespace-pre-wrap break-words text-left shadow-inner",
                      isLight ? "bg-neutral-50/70 border-neutral-200 text-neutral-700" : "bg-black/40 border-white/10 text-neutral-300"
                    )}
                    value={getShareText(url, originalUrl)}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={clsx(
                      "p-2.5 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                      copied
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : isLight
                          ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                    )}
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function DownloaderView({ routeTab }: { routeTab?: Tab }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(routeTab || 'pinterest');
  
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (routeTab) setActiveTab(routeTab);
  }, [routeTab]);

  useEffect(() => {
    if (activeTab && tabRefs.current[activeTab] && tabsListRef.current) {
      const container = tabsListRef.current;
      const tabElement = tabRefs.current[activeTab];
      if (!tabElement) return;

      const containerWidth = container.clientWidth;
      const tabLeft = tabElement.offsetLeft;
      const tabWidth = tabElement.clientWidth;

      container.scrollTo({
        left: tabLeft - containerWidth / 2 + tabWidth / 2,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<{
    title: string;
    message: string;
    targetTab: Tab;
    targetTabName: string;
  } | null>(null);

  const handleUrlChange = (newUrl: string, explicitTab?: Tab) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setValidationError(null);
      return;
    }
    const currentActive = explicitTab || activeTab;
    const detected = detectPlatformFromUrl(newUrl);
    if (detected && detected !== currentActive) {
      setActiveTab(detected);
      setValidationError(null);
    } else {
      setValidationError(null);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState<number | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});
  const fetchingRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!result || !result.success) return;

    let qualities: any[] = [];
    if (result.qualities && Array.isArray(result.qualities)) {
      qualities = result.qualities;
    } else if (result.media && Array.isArray(result.media)) {
      result.media.forEach((m: any) => {
        if (m.qualities && Array.isArray(m.qualities)) {
          qualities.push(...m.qualities);
        }
      });
    }

    if (qualities.length === 0) return;

    qualities.forEach(async (q) => {
      if (!q.url || fetchingRefs.current.has(q.url)) return;

      fetchingRefs.current.add(q.url);

      try {
        let resolveUrl = q.url;
        if (resolveUrl.startsWith('/api/get-youtube-link')) {
          const ytres = await fetch(resolveUrl);
          const ytdata = await ytres.json();
          if (ytdata && ytdata.url) {
            resolveUrl = ytdata.url;
          }
        }

        const proxyCheckUrl = resolveUrl.startsWith('/api/')
          ? resolveUrl
          : `/api/proxy-download?url=${encodeURIComponent(resolveUrl)}&filename=media`;

        const headRes = await fetch(proxyCheckUrl, { method: 'HEAD' });
        const len = headRes.headers.get('content-length') || headRes.headers.get('estimated-content-length');
        if (len) {
          const bytes = parseInt(len, 10);
          if (bytes > 0) {
            const formatted = formatBytes(bytes);
            if (formatted) {
              setFetchedSizes((prev) => ({ ...prev, [q.url]: formatted }));
            }
          }
        }
      } catch (e) {
        // ignore
      }
    });
  }, [result]);

  const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      subscribeUserToPush();
    }
  }, []);

  const [throttleSetting, setThrottleSetting] = useState<string>(localStorage.getItem('downloadThrottle') || 'unlimited');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('downloadThrottle', throttleSetting);
  }, [throttleSetting]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const [isHistorySpinning, setIsHistorySpinning] = useState(false);
  
  useEffect(() => {
    // Show terms modal on load if they haven't accepted yet
    if (!localStorage.getItem('termsAccepted')) {
      setTimeout(() => {
        setShowTermsModal(true);
      }, 1000);
    }
  }, []);
  const [history, setHistory] = useState<{ url: string; title: string; timestamp: number; platform?: Tab; favorite?: boolean; thumbnail?: string; appName?: string }[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [copiedHistoryUrl, setCopiedHistoryUrl] = useState<string | null>(null);
  const [historyToast, setHistoryToast] = useState<string | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<Record<string, { filename: string; progress: number | null; status: "preparing" | "downloading" | "complete" | "failed" }>>({});

  const triggerHistoryToast = (msg: string) => {
    setHistoryToast(msg);
    setTimeout(() => {
      setHistoryToast(null);
    }, 2500);
  };

  // Glassmorphic features states
  const [vaultQueue, setVaultQueue] = useState<{ url: string; platform: Tab; timestamp: number }[]>(() => {
    try {
      const stored = localStorage.getItem('download_vault');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showVault, setShowVault] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [snapshotCanvasFlash, setSnapshotCanvasFlash] = useState(false);
  
  // Real-time fluctuating latency metrics
  const [platformPings, setPlatformPings] = useState<Record<Tab, number>>({
    pinterest: 45,
    youtube: 78,
    instagram: 120,
    tiktok: 85,
    facebook: 98,
    reddit: 74,
    x: 62,
    linkedin: 88,
    snapchat: 110
  });

  // Periodically fluctuate latency metrics slightly to simulate real system activity
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlatformPings(prev => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach(k => {
          const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
          next[k] = Math.max(12, Math.min(240, next[k] + delta));
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const saveVault = (queue: typeof vaultQueue) => {
    setVaultQueue(queue);
    try {
      localStorage.setItem('download_vault', JSON.stringify(queue));
    } catch (e) {}
  };

  const handleAddToVault = () => {
    if (!url.trim()) return;
    const detected = detectPlatformFromUrl(url) || activeTab;
    if (vaultQueue.some(item => item.url === url.trim())) {
      triggerHistoryToast("Link already in your Batch Vault!");
      return;
    }
    const updated = [...vaultQueue, { url: url.trim(), platform: detected, timestamp: Date.now() }];
    saveVault(updated);
    setUrl('');
    triggerHistoryToast("Added to Batch Vault!");
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text ? text.trim() : "";
      if (cleaned) {
        setUrl(cleaned);
        const detected = detectPlatformFromUrl(cleaned);
        if (detected) {
          setActiveTab(detected);
          triggerHistoryToast(`Platform detected: ${getTabLabel(detected)}`);
        } else {
          triggerHistoryToast("Link pasted!");
        }
      } else {
        triggerHistoryToast("Clipboard is empty");
      }
    } catch (e) {
      
      triggerHistoryToast("Clipboard access blocked. Please tap the input box and paste manually.");
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('download_history');
    setConfirmClearAll(false);
    triggerHistoryToast("History cleared successfully!");
  };

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxMediaList, setLightboxMediaList] = useState<{ url: string; type: "video" | "image"; title?: string; thumbnail?: string }[]>([]);

  const [isLight, setIsLight] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });

  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#fafaf9';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#000000';
      }
    } catch (e) {}
  }, [isLight, activeTab]);



  // Manage loading step label text sequence separately
  React.useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(stepInterval);
  }, [isLoading]);

  // Load history from localstorage
  React.useEffect(() => {
    const stored = localStorage.getItem('download_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  // Handle PWA Web Share Target
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text');
    const sharedUrl = params.get('url');

    let finalUrl = '';
    
    if (sharedUrl && (sharedUrl.startsWith('http://') || sharedUrl.startsWith('https://'))) {
      finalUrl = sharedUrl;
    } else if (sharedText) {
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        finalUrl = urlMatch[0];
      }
    }

    if (finalUrl) {
      const platform = detectPlatformFromUrl(finalUrl);
      if (platform) {
        setActiveTab(platform);
      }
      setUrl(finalUrl);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Lightbox keyboard navigation & body scroll lock
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && lightboxMediaList.length > 1) {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return (prev + 1) % lightboxMediaList.length;
        });
      } else if (e.key === 'ArrowLeft' && lightboxMediaList.length > 1) {
        setLightboxIndex((prev) => {
          if (prev === null) return null;
          return (prev - 1 + lightboxMediaList.length) % lightboxMediaList.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, lightboxMediaList]);

  const activeTabData = TABS.find(t => t.id === activeTab)!;
  React.useEffect(() => { document.title = activeTabData.title; }, [activeTabData]);

  const getYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDownload = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    
    const targetUrl = (overrideUrl || url).trim();

    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    if (!navigator.onLine) {
      alert("PLEASE CONNECT YOUR NETWORK FIRST THAN RETRY");
      return;
    }

    if (!targetUrl) return;

    requestNotificationPermission();

    // Check platform matching before proceeding
    const detected = detectPlatformFromUrl(targetUrl);
    if (!detected) {
      setIsLoading(false);
      setResult({
        success: false,
        error: "This URL is from an unsupported website. Aura Downloader supports links from YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest, X/Twitter, LinkedIn, Snapchat, Spotify, and Threads. Please enter a valid link from a supported platform."
      });
      return;
    }
    if (detected !== activeTab) {
      setActiveTab(detected);
      setValidationError(null);
    }
    
    setLoadingStep(0);
    setIsLoading(true);
    setResult(null);

    // Default multi-platform downloader
    try {
      const detectedPlatform = detectPlatformFromUrl(targetUrl) || activeTab;

      // Internal Production Backend API endpoint usage
      // This routes directly to the existing robust server backend (server.ts)
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      
      // Filter out duplicate media items before updating state or history
      if (data && data.media && Array.isArray(data.media)) {
        console.log("Raw API Items:", data.media.length);
        const originalLength = data.media.length;
        data.media = deduplicateMediaItems(data.media);
        console.log("Parsed Items:", originalLength);
        console.log("After Deduplication:", data.media.length);
        console.log("Rendered Items:", data.media.length);
        
        if (data.media.length === 1) {
          const firstItem = data.media[0];
          if (firstItem) {
            if (firstItem.url && !data.url) data.url = firstItem.url;
            if ((firstItem.thumbnail || firstItem.url) && !data.thumbnail) {
              data.thumbnail = firstItem.thumbnail || firstItem.url;
            }
          }
        }
      }
      
      // Override for broken profiles to prevent ugly empty UI without touching backend logic
      if (data.mediaType === 'profile' && !data.profile?.avatarUrl && !data.profile?.bannerUrl && (!data.profile?.displayName || data.profile?.displayName === "Social Media Post" || data.profile?.displayName.includes("404") || data.profile?.displayName.includes("Not Found"))) {
        data.success = false;
        data.error = "Could not fetch profile metadata. The handle may be incorrect, or the page is blocking access.";
      }

      setResult(data ? { ...data, originalUrl: url.trim() } : null);

      
      if (data.success) {
        const titleText = data.profile 
          ? `Profile: @${data.profile.username}` 
          : (data.title || 'Media Download');
        const detectedPlatform = detectPlatformFromUrl(targetUrl) || activeTab;
        const newEntry = { 
          url: targetUrl, 
          title: titleText, 
          timestamp: Date.now(), 
          platform: detectedPlatform,
          favorite: false,
          thumbnail: data.thumbnail || (data.media && data.media.length > 0 ? (data.media[0].thumbnail || data.media[0].url) : undefined) || data.profile?.avatarUrl,
          appName: TABS.find(t => t.id === detectedPlatform)?.name || 'Aura Downloader'
        };
        const newHistory = [newEntry, ...history.filter(h => h.url !== targetUrl)].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem('download_history', JSON.stringify(newHistory));
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error occurred while trying to contact the media server."
      });
    } finally {
      
      setTimeout(() => {
        setIsLoading(false);
        setExtractionProgress(null);
      }, 300);
    }
  };

  
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);


    const downloadFileClientSide = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    requestNotificationPermission();

    if (url.startsWith("/api/get-youtube-link") || url.startsWith("/api/spotify-resolve")) {
      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: 0, status: "preparing" }
      }));
      setHistoryToast(url.startsWith("/api/spotify-resolve") ? "Resolving Spotify audio... (takes ~10 seconds)" : "Preparing YouTube stream... (takes ~10 seconds)");
      
      // Simulate progress for preparing
      const interval = setInterval(() => {
         setActiveDownloads(prev => {
            const current = prev[url];
            if (current && current.status === "preparing") {
                const nextProg = Math.min((current.progress || 0) + 5, 95);
                return { ...prev, [url]: { ...current, progress: nextProg } };
            }
            return prev;
         });
      }, 500);

      try {
        const res = await fetch(url);
        const data = await res.json();
        clearInterval(interval);
        
        if (data && data.url) {
           const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.url)}&filename=${encodeURIComponent(filename)}`;
           const a = document.createElement('a');
           a.href = proxyUrl;
           a.download = filename || 'download';
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           setActiveDownloads(prev => ({
             ...prev,
             [url]: { filename, progress: 100, status: "complete" }
           }));
           setHistoryToast("Download started!");
           setTimeout(() => {
              setActiveDownloads(prev => {
                const next = { ...prev };
                delete next[url];
                return next;
              });
           }, 3000);
        } else {
           throw new Error("Failed to resolve link");
        }
      } catch (err) {
           clearInterval(interval);
           setActiveDownloads(prev => ({
             ...prev,
             [url]: { filename, progress: null, status: "failed" }
           }));
           setHistoryToast("Failed to prepare video stream.");
           setTimeout(() => {
              setActiveDownloads(prev => {
                const next = { ...prev };
                delete next[url];
                return next;
              });
           }, 3000);
      }
      return;
    }

    const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
      ? url 
      : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const throttleParam = throttleSetting !== "unlimited" ? `&throttle=${throttleSetting}` : "";
    const finalFetchUrl = fetchUrl.includes("?") ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;

    const a = document.createElement('a');
    a.href = finalFetchUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setHistoryToast("Download started!");
    setTimeout(() => setHistoryToast(null), 3000);
  };
  const downloadFileDirect = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    if (url.startsWith("/api/get-youtube-link") || url.startsWith("/api/spotify-resolve")) {
      downloadFileClientSide(url, filename);
      return;
    }
    try {
      requestNotificationPermission();
      setHistoryToast("Direct download started...");
      setTimeout(() => setHistoryToast(null), 3000);

      const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
        ? url 
        : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const throttleParam = throttleSetting !== "unlimited" ? `&throttle=${throttleSetting}` : "";
      const finalFetchUrl = fetchUrl.includes("?") ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;

      const a = document.createElement('a');
      a.href = finalFetchUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);

      showNotification("Download Started", {
        body: `Direct download started for: ${filename}`,
        icon: '/vite.svg'
      });
    } catch (error) {
      console.error('Direct download failed:', error);
      setHistoryToast("Direct download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
    }
  };

  const handleDownloadAll = () => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    if (!result || !result.media) return;
    const mediaList = deduplicateMediaItems(result.media);
    mediaList.forEach((item, index) => {
      setTimeout(() => {
        downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item_" + (index + 1) + (item.type === "video" ? ".mp4" : ".jpg"));
      }, index * 600); // delay to prevent overwhelming
    });
  };

  const [downloadingPlaylist, setDownloadingPlaylist] = useState(false);
  const [playlistProgress, setPlaylistProgress] = useState<{ current: number; total: number; percent: number; currentTitle?: string } | null>(null);

  const handleDownloadAllPlaylists = async () => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    if (!result || result.mediaType !== 'playlist' || !result.media) return;
    setDownloadingPlaylist(true);
    
    const playlistMedia = deduplicateMediaItems(result.media);
    const total = playlistMedia.length;
    const playlistTitle = (result.title || "Playlist").replace(/[/\\?%*:|"<>]/g, '').trim();
    const zipFilename = `${playlistTitle.slice(0, 50)}_Full_Playlist.zip`;

    triggerHistoryToast(`Creating ZIP for ${total} tracks...`);
    setPlaylistProgress({ current: 0, total, percent: 0, currentTitle: 'Initializing ZIP packaging...' });

    const zip = new JSZip();
    const isSpotifyPlaylist = result.source === 'spotify' || (playlistMedia[0]?.url && playlistMedia[0].url.startsWith('/api/spotify-resolve'));

    for (let i = 0; i < total; i++) {
      const item = playlistMedia[i];
      const current = i + 1;
      const percent = Math.round(((i) / total) * 95); // leave 5% for zip compression
      const trackTitle = (item.title || `Track_${current}`).replace(/[/\\?%*:|"<>]/g, '').trim();
      
      setPlaylistProgress({ 
        current, 
        total, 
        percent, 
        currentTitle: `Extracting (${current}/${total}): ${trackTitle}` 
      });

      try {
        let fileBlob: Blob | null = null;
        let extension = 'mp3';

        if (isSpotifyPlaylist || item.url?.includes('spotify-resolve')) {
          extension = 'mp3';
          // Try fetching direct stream URL first
          let streamUrl = item.url;
          if (streamUrl && !streamUrl.includes('stream=true')) {
            streamUrl = streamUrl + (streamUrl.includes('?') ? '&stream=true' : '?stream=true');
          }
          try {
            const response = await fetch(streamUrl);
            if (response.ok) {
              fileBlob = await response.blob();
            }
          } catch(e) {}

          if (!fileBlob && item.url) {
            try {
              const res1 = await fetch(item.url);
              const json = await res1.json();
              if (json.url) {
                const res2 = await fetch(json.url);
                if (res2.ok) fileBlob = await res2.blob();
              }
            } catch(e) {}
          }
        } else {
          extension = 'mp4';
          if (item.url && item.url.startsWith('http')) {
            try {
              const res = await fetch(item.url);
              if (res.ok) fileBlob = await res.blob();
            } catch(e) {}
          }
          if (!fileBlob) {
            try {
              const apiRes = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: item.url })
              });
              const data = await apiRes.json();
              const downloadUrl = data.qualities?.[0]?.url || data.url || item.url;
              if (downloadUrl) {
                const res2 = await fetch(downloadUrl);
                if (res2.ok) fileBlob = await res2.blob();
              }
            } catch(e) {}
          }
        }

        if (fileBlob && fileBlob.size > 0) {
          const paddedNum = String(current).padStart(2, '0');
          const cleanFileName = `${paddedNum} - ${trackTitle.slice(0, 50)}.${extension}`;
          zip.file(cleanFileName, fileBlob);
        }
      } catch (err) {
        console.error(`Failed to pack track ${current}:`, err);
      }
    }

    setPlaylistProgress({
      current: total,
      total,
      percent: 96,
      currentTitle: `Compressing all tracks into ${zipFilename}...`
    });

    triggerHistoryToast(`Packaging into ${zipFilename}...`);

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        const zipPercent = 95 + Math.round((metadata.percent / 100) * 5);
        setPlaylistProgress({
          current: total,
          total,
          percent: Math.min(100, zipPercent),
          currentTitle: `Finalizing ZIP archive (${Math.round(metadata.percent)}%)...`
        });
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = zipFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      triggerHistoryToast(`🎉 Downloaded ZIP: ${zipFilename}`);
    } catch (e: any) {
      console.error("ZIP Generation error:", e);
      triggerHistoryToast("Error creating ZIP file. Please try again.");
    } finally {
      setDownloadingPlaylist(false);
      setPlaylistProgress(null);
    }
  };

  const getBgGlow = (id: Tab) => {
    if (isLight) {
      switch(id) {
        case 'youtube':
        case 'instagram': return 'bg-gradient-to-b from-purple-100/60 via-pink-50/30 to-neutral-50';
        case 'tiktok': return 'bg-gradient-to-b from-cyan-100/60 via-teal-50/20 to-neutral-50';
        case 'facebook': return 'bg-gradient-to-b from-blue-100/60 via-indigo-50/20 to-neutral-50';
        case 'reddit': return 'bg-gradient-to-b from-orange-100/60 via-amber-50/20 to-neutral-50';
        case 'pinterest': return 'bg-gradient-to-b from-rose-100/60 via-pink-50/10 to-neutral-50';
        case 'spotify': return 'bg-gradient-to-b from-green-100/60 via-emerald-50/10 to-neutral-50';
        case 'threads': return 'bg-gradient-to-b from-neutral-200/60 via-neutral-100/40 to-neutral-50';
        default: return 'bg-gradient-to-b from-neutral-100/80 via-neutral-50/40 to-neutral-50';
      }
    }
    switch(id) {
      case 'youtube': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#8B6464_0%,#4A3434_70%,#000000_100%)]';
      case 'instagram': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#836A87_0%,#483A4C_70%,#000000_100%)]';
      case 'tiktok': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#728489_0%,#445155_70%,#000000_100%)]';
      case 'facebook': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#656C80_0%,#3C404D_70%,#000000_100%)]';
      case 'reddit': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#856C64_0%,#4B3C37_70%,#000000_100%)]';
      case 'pinterest': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#8C646A_0%,#4D3539_70%,#000000_100%)]';
      case 'x': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#76787B_0%,#444547_70%,#000000_100%)]';
      case 'linkedin': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#64748B_0%,#334155_70%,#000000_100%)]';
      case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2C2A10_0%,#121105_70%,#000000_100%)]';
      case 'spotify': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2B5536_0%,#1A2E20_70%,#000000_100%)]';
      case 'threads': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#444444_0%,#222222_70%,#000000_100%)]';
      default: return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#737373_0%,#404040_70%,#000000_100%)]';
    }
  };

  return (
    <>
      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        {activeTabData.keywords && <meta name="keywords" content={activeTabData.keywords} />}
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={`https://aura-download.ai.studio/${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}`.replace(/\/$/, '') || 'https://aura-download.ai.studio'} />
        <meta property="og:image" content={window.location.origin + "/banner.jpg"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={activeTabData.title} />
        <meta property="twitter:description" content={activeTabData.description} />
        <meta property="twitter:image" content={window.location.origin + "/banner.jpg"} />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "${activeTabData.title}",
              "description": "${activeTabData.description}",
              "url": "https://aura-download.ai.studio/${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}",
              "publisher": {
                "@type": "Organization",
                "name": "Aura Downloader",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://aura-download.ai.studio/icon-512.png"
                }
              }
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://aura-download.ai.studio/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "${activeTabData.name}",
                  "item": "https://aura-download.ai.studio/${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}"
                }
              ]
            }
          `}
        </script>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "${activeTabData.name}",
              "operatingSystem": "Any",
              "applicationCategory": "UtilitiesApplication",
              "description": "${activeTabData.description}",
              "url": "https://aura-download.ai.studio/${activeTab === 'pinterest' ? '' : activeTab + '-downloader'}",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1284"
              }
            }
          `}
        </script>

      </Helmet>
      <LazyMotion features={domMax}>
    <div className={clsx(
        "min-h-screen flex flex-col items-center pt-24 sm:pt-28 pb-12 px-4 font-sans transition-colors duration-700",
      isLight ? "text-neutral-900 selection:bg-red-500/10" : "text-neutral-50 selection:bg-red-500/30",
      getBgGlow(activeTab)
    )}>
      
      {/* App Branding Header - Glassmorphism Full Width Strip */}
      <div className={clsx(
        "fixed top-0 left-0 right-0 w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 border-b backdrop-blur-xl z-50 transition-colors duration-700 shadow-sm",
        isLight ? "bg-white/80 border-neutral-200/50" : "bg-[#0c0a09]/80 border-white/5"
      )}>
        <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Custom Premium Aura Logo - App Store Style */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl shadow-lg overflow-hidden p-[1px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30" />
          <div className="w-full h-full rounded-[15px] flex items-center justify-center relative overflow-hidden shadow-inner bg-[#0a0f18]">
             {/* Glossy overlay effect and waves */}
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-70">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,50 L0,20 Q25,40 50,20 T100,30 L100,50 Z" fill="url(#wave-grad)"/>
                  <defs>
                    <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0066ff"/>
                      <stop offset="100%" stopColor="#9900ff"/>
                    </linearGradient>
                  </defs>
                </svg>
             </div>
             
             {/* Premium abstract 'A' download icon */}
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="relative z-10 drop-shadow-md">
                <defs>
                   <linearGradient id="a-grad" x1="0.5" y1="0" x2="0.5" y2="1">
                     <stop offset="0%" stopColor="#00e5ff"/>
                     <stop offset="100%" stopColor="#0044ff"/>
                   </linearGradient>
                </defs>
                {/* The "A" shape */}
                <path d="M28 65 L46 22 Q50 14 54 22 L72 65" stroke="url(#a-grad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* The Arrow */}
                <path d="M50 38 L50 58 M42 50 L50 58 L58 50" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* The Tray */}
                <path d="M36 68 L36 72 Q36 78 42 78 L58 78 Q64 78 64 72 L64 68" stroke="#00ccff" strokeWidth="6" strokeLinecap="round" fill="none"/>
             </svg>
          </div>
        </div>

        <div className="relative z-10 ml-1">
           <span className={clsx(
               "text-base sm:text-lg font-black tracking-tight uppercase",
               isLight ? "text-neutral-900" : "text-white"
           )}>AURA Downloader</span>
        </div>
        </div>
        <a 
          href="https://aura-download.ai.studio" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-blue-600 text-white text-xs sm:text-sm px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Install
        </a>
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-12 relative z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className={clsx(
          "flex items-center rounded-full pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 transition-colors border shrink-0 shadow-sm",
          isLight ? "bg-white border-neutral-200 text-neutral-700" : "bg-white/5 border border-white/10 text-neutral-200"
        )}>
          <span className="text-sm sm:text-base font-bold tracking-wide mr-3 sm:mr-4 uppercase whitespace-nowrap">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-sm sm:text-base px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 whitespace-nowrap">
             <Youtube className="w-4 h-4 sm:w-5 sm:h-5" /> Subscribe
          </a>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className={clsx(
                "px-3 sm:px-4 h-11 rounded-full flex items-center justify-center transition-all border shadow-md font-bold text-xs sm:text-sm gap-2 uppercase tracking-wide cursor-pointer select-none",
                isLight 
                   ? "bg-white border-neutral-200 text-blue-600 hover:text-blue-700 hover:bg-neutral-100" 
                   : "bg-blue-500 border border-blue-400 text-white hover:bg-blue-600"
              )}
              title="Install App"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}
          {/* Settings Button */}
          <button 
            onClick={() => setShowSettings(true)}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer"
            />
              
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-150",
                isLight ? "bg-white/40 text-neutral-900 border-l border-white/50" : "bg-[#0c0a09]/50 text-white border-l border-white/10"
              )}
            >
              {/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200/30 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className={clsx("p-2.5 rounded-xl border shadow-inner", isLight ? "bg-neutral-50 border-neutral-200" : "bg-white/[0.03] border-white/5")}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
                    <p className="text-xs opacity-60 mt-0.5">App preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2.5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><DownloadCloud className="w-5 h-5" /> Download Speed</h3>
                  <p className="text-sm opacity-70">Choose your download speed. If your internet is slow or disconnecting, pick a slower speed so your download doesn't fail.</p>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    {[
                      { value: 'unlimited', label: 'Maximum Speed (Default)' },
                      { value: '5', label: 'Fast (Good for most)' },
                      { value: '2', label: 'Medium (For slow Wi-Fi)' },
                      { value: '1', label: 'Slow (For weak mobile data)' },
                    ].map(option => (
                      <label key={option.value} className={clsx(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        throttleSetting === option.value 
                          ? (isLight ? "border-blue-500 bg-blue-50/70 text-blue-700" : "border-blue-500 bg-blue-500/20 text-blue-400")
                          : (isLight ? "border-neutral-200/50 hover:border-neutral-300 bg-white/40" : "border-white/10 hover:border-white/20 bg-black/40")
                      )}>
                        <span className="font-medium">{option.label}</span>
                        <input 
                          type="radio" 
                          name="throttle" 
                          value={option.value} 
                          checked={throttleSetting === option.value}
                          onChange={(e) => setThrottleSetting(e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-200/30 dark:border-white/10">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="w-5 h-5" /> Appearance & Theme</h3>
                  <div className={clsx("flex items-center justify-between p-4 rounded-xl border transition-all", isLight ? "bg-white/40 border-neutral-200/50" : "bg-black/40 border-white/10")}>
                    <div>
                      <div className="font-medium">Dark Mode</div>
                      <div className="text-sm opacity-70">Switch between light and dark themes</div>
                    </div>
                    <button
                      onClick={() => setIsLight(!isLight)}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        !isLight ? "bg-blue-500" : "bg-neutral-300"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                        !isLight && "transform translate-x-6"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-200/30 dark:border-white/10">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><History className="w-5 h-5" /> Activity</h3>
                  <div className={clsx("flex items-center justify-between p-4 rounded-xl border transition-all", isLight ? "bg-white/40 border-neutral-200/50" : "bg-black/40 border-white/10")}>
                    <div>
                      <div className="font-medium">Download History</div>
                      <div className="text-sm opacity-70">View your recently downloaded files</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        setTimeout(() => setShowHistory(true), 300);
                      }}
                      className={clsx(
                        "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                        isLight ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                      )}
                    >
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Ambient Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer"
            />
            
            {/* Premium History Slider Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] ultra-glass z-50 flex flex-col text-white"
            >
              <div className="ambient-highlight"></div>
              
              {/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative">
                {/* Subtle separator line */}
                <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
                
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                    <History className="w-5 h-5 text-white/90" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white/90">History</h2>
                    <p className="text-xs text-white/70 mt-0.5">{history.length} recent activities</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-20">
                  {/* Clear All Header Action */}
                  {history.length > 0 && (
                    <div className="relative">
                      {confirmClearAll ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 p-1 rounded-xl border border-red-500/20">
                          <button
                            onClick={clearAllHistory}
                            className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 font-bold text-white text-[10px] transition-all cursor-pointer uppercase tracking-wider"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmClearAll(false)}
                            className="px-2 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer uppercase tracking-wider bg-white/10 text-neutral-300 hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmClearAll(true)}
                          className="px-3 py-1.5 rounded-full border text-[10px] font-black cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5 bg-white/5 border-white/10 text-white/80 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Close Button */}
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-white/70 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all p-2.5 rounded-full hover:rotate-90 duration-300 cursor-pointer"
                    title="Close Slider"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative z-10">
                {history.length === 0 ? (
                  <div className="px-6 py-4 flex-1 h-full flex flex-col items-center justify-center relative min-h-[350px]">
                    {/* Floating particles / abstract background elements for empty state */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-[50px] pointer-events-none" />

                    <div className="relative flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity duration-500">
                      {/* Glowing Empty Icon */}
                      <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-tr from-white/5 to-white/[0.02] border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] flex items-center justify-center relative group">
                        {/* Subtle pulsing glow */}
                        <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl animate-pulse" />
                        <Archive className="w-8 h-8 text-white/30 relative z-10" />
                      </div>
                      
                      <h3 className="text-base font-medium text-white/80 mb-1.5">No recent history</h3>
                      <p className="text-sm text-white/70 max-w-[220px] leading-relaxed">
                        Items you process or download will automatically appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {history.map((item, idx) => {
                      const platDetails = getPlatformDetails(item.platform || 'pinterest');
                      const isCopied = copiedHistoryUrl === item.url;

                      const handleCopyUrl = async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(item.url);
                          setCopiedHistoryUrl(item.url);
                          triggerHistoryToast("Copied successfully!");
                          setTimeout(() => setCopiedHistoryUrl(null), 2000);
                        } catch (err) {}
                      };

                      const handleDelete = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const updated = history.filter((_, i) => i !== idx);
                        setHistory(updated);
                        localStorage.setItem('download_history', JSON.stringify(updated));
                        triggerHistoryToast("Removed from history");
                      };

                      return (
                        <motion.div
                          key={item.url + '_' + idx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          className="border rounded-2xl p-4 transition-all relative flex flex-col gap-3 group/item overflow-hidden bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-xl border-white/5 hover:border-white/10 shadow-lg shadow-black/30"
                          style={{
                            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.15)"
                          }}
                        >
                          {/* Card Top Header: Platform indicator & Close Button */}
                          <div className="flex items-center justify-between">
                            <span className={clsx(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                              platDetails.bgClass,
                              platDetails.borderClass,
                              platDetails.colorClass
                            )}>
                              {platDetails.icon}
                              <span>{getTabLabel(item.platform || 'pinterest')}</span>
                            </span>
                            
                            {/* Close/Remove Button on the Side of each card */}
                            <button aria-label="Close"
                              onClick={handleDelete}
                              className="p-1.5 rounded-full transition-colors cursor-pointer text-white/70 hover:text-red-400 hover:bg-white/5"
                              title="Remove item"
                            >
                <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Card Body: Title and URL */}
                          <div 
                            onClick={() => {
                              handleUrlChange(item.url, item.platform);
                              if (item.platform) {
                                  navigate(item.platform === 'pinterest' ? '/' : `/${item.platform}-downloader`);
                              }
                              setShowHistory(false);
                              setTimeout(() => {
                                const form = document.querySelector('form');
                                if (form) form.requestSubmit();
                              }, 100);
                            }}
                            className="text-left cursor-pointer flex-1 flex gap-3 mt-1 items-center"
                          >
                            {item.thumbnail && (
                              <div className="w-12 h-12 rounded-lg bg-neutral-950 shrink-0 overflow-hidden border border-white/10 shadow-sm relative group-hover/item:scale-105 transition-transform">
                                <img src={item.thumbnail} alt={item.title || "Playlist track thumbnail"} className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm line-clamp-1 transition-colors text-white/90 hover:text-white group-hover/item:underline decoration-white/30">
                                {item.appName ? `${item.appName} - ` : ''}{item.title}
                              </div>
                              <p className="text-[11px] text-white/70 font-mono truncate mt-0.5 select-all">
                                {item.url}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer actions: Copy & Load */}
                          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-white/5 mt-1">
                            {/* Copy Button */}
                            <button
                              onClick={handleCopyUrl}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all hover:scale-[1.02] active:scale-[0.98] bg-white/5 hover:bg-white/10 border-white/5 text-white"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-white/60" />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </button>

                            {/* Load button */}
                            <button
                              onClick={() => {
                                handleUrlChange(item.url, item.platform);
                                if (item.platform) {
                                  navigate(item.platform === 'pinterest' ? '/' : `/${item.platform}-downloader`);
                                }
                                setShowHistory(false);
                                setTimeout(() => {
                                  const form = document.querySelector('form');
                                  if (form) form.requestSubmit();
                                }, 100);
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-white text-neutral-900 hover:bg-neutral-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Load URL</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                {historyToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute bottom-20 left-6 right-6 z-40 bg-neutral-900 text-white text-[11px] font-bold py-3 px-4 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{historyToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              )}
              </div>
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white/10 text-center hover:scale-[1.01] active:scale-[0.99] bg-white/5 hover:bg-white/10 text-white"
                >
                  Close Slider
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div
        id="tour-tabs"
        ref={tabsListRef}
        className={clsx(
          "w-full max-w-2xl border rounded-2xl p-2 flex items-center overflow-x-auto no-scrollbar mb-8 shadow-2xl relative z-10 transition-colors",
          isLight ? "bg-white/70 backdrop-blur-xl border-neutral-200/80" : "bg-[#1e1516]/70 backdrop-blur-xl border-white/5"
        )}>
          <div className="flex items-center min-w-max gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              
              const getTabColor = (id: Tab) => {
                if (isLight) {
                  switch(id) {
                    case 'youtube': return 'shadow-[0_0_15px_rgba(255,0,0,0.15)]';
                    case 'instagram': return 'shadow-[0_0_15px_rgba(225,48,108,0.15)]';
                    case 'tiktok': return 'shadow-[0_0_15px_rgba(0,242,254,0.15)]';
                    case 'facebook': return 'shadow-[0_0_15px_rgba(24,119,242,0.15)]';
                    case 'reddit': return 'shadow-[0_0_15px_rgba(255,69,0,0.15)]';
                    case 'pinterest': return 'shadow-[0_0_15px_rgba(230,0,35,0.15)]';
                    case 'x': return 'shadow-[0_0_15px_rgba(0,0,0,0.1)]';
                    case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.15)]';
                    case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.15)]';
                    case 'spotify': return 'shadow-[0_0_15px_rgba(29,185,84,0.15)]';
                    case 'threads': return 'shadow-[0_0_15px_rgba(0,0,0,0.1)]';
                    default: return 'shadow-md';
                  }
                }
                switch(id) {
                  case 'youtube': return 'shadow-[0_0_15px_rgba(255,0,0,0.4)]';
                  case 'instagram': return 'shadow-[0_0_15px_rgba(225,48,108,0.4)]';
                  case 'tiktok': return 'shadow-[0_0_15px_rgba(0,242,254,0.4)]';
                  case 'facebook': return 'shadow-[0_0_15px_rgba(24,119,242,0.4)]';
                  case 'reddit': return 'shadow-[0_0_15px_rgba(255,69,0,0.4)]';
                  case 'pinterest': return 'shadow-[0_0_15px_rgba(230,0,35,0.4)]';
                  case 'x': return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
                  case 'linkedin': return 'shadow-[0_0_15px_rgba(10,102,194,0.4)]';
                  case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.4)]';
                  case 'spotify': return 'shadow-[0_0_15px_rgba(29,185,84,0.4)]';
                  case 'threads': return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
                  default: return 'shadow-md';
                }
              };

              return (
                <Link
                  key={tab.id}
                  to={tab.id === 'pinterest' ? '/' : `/${tab.id}-downloader`}
                  ref={(el: any) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setValidationError(null);
                    // Retain the URL if it happens to match the newly selected tab, or clear it if it doesn't
                    const detected = detectPlatformFromUrl(url);
                    if (detected !== tab.id) {
                      setUrl('');
                    } else {
                      setValidationError(null);
                    }
                  }}
                  className={clsx(
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative select-none",
                    isActive 
                      ? isLight 
                        ? "text-white" 
                        : "text-black"
                      : isLight
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-neutral-400 dark:text-neutral-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className={clsx(
                        "absolute inset-0 rounded-xl -z-10 transition-colors duration-500",
                        isLight ? "bg-neutral-900" : "bg-white",
                        getTabColor(tab.id)
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.label}
                    {tab.isNew && <NewBadge />}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab-switching Dynamic Content Wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full flex flex-col items-center"
          >
            {/* Active Tab Badge */}
            <div className={clsx(
              "inline-flex items-center gap-2 border text-sm px-5 py-2 rounded-full mb-8 shadow-sm transition-colors",
              isLight ? "bg-white border-neutral-200 text-neutral-800" : "bg-white/5 border border-white/10 text-neutral-200"
            )}>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              {activeTabData.name}
            </div>

            
            {/* Breadcrumbs */}
            {activeTab !== 'pinterest' && (
                <nav className={clsx("flex items-center justify-center space-x-2 mb-6 text-sm font-medium", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>
                  <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                  <span>/</span>
                  <span className={clsx(isLight ? "text-neutral-900" : "text-white")}>{activeTabData.name}</span>
                </nav>
            )}
            {/* Hero Area */}
            <h1 className={clsx(
              "text-4xl sm:text-5xl leading-[1.1] font-black mb-2 transition-colors",
              isLight ? "text-neutral-900" : "text-white"
            )}>
              Aura <span className="text-primary">Downloader</span>
            </h1>
            <p className={clsx("text-lg sm:text-xl font-bold mb-6 transition-colors", isLight ? "text-neutral-600" : "text-neutral-300")}>
               Free <span className={isLight ? "text-neutral-900" : "text-white"}>{activeTabData.name}</span>
            </p>
            <p className={clsx(
              "text-[1.1rem] leading-relaxed max-w-xl mx-auto mb-16 transition-colors",
              isLight ? "text-neutral-600" : "text-neutral-400 dark:text-neutral-400"
            )}>
              {activeTabData.description}
            </p>

            {/* Platform Mismatch Warning Alert Box */}
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "w-full max-w-2xl p-5 rounded-3xl mb-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-medium transition-colors text-left shadow-lg backdrop-blur-sm",
                    isLight 
                      ? "bg-amber-50/90 border-amber-200 text-amber-900" 
                      : "bg-amber-950/20 border-amber-500/20 text-amber-200"
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-base tracking-tight mb-0.5 truncate">{validationError.title}</div>
                      <p className={clsx("text-xs font-medium leading-relaxed break-words", isLight ? "text-neutral-600" : "text-neutral-400 dark:text-neutral-400")}>
                        {validationError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const prevUrl = url;
                      setActiveTab(validationError.targetTab);
                      setResult(null);
                      setValidationError(null);
                      setUrl(prevUrl);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold transition-all text-xs cursor-pointer shadow-md hover:shadow-lg shadow-amber-500/20 whitespace-nowrap uppercase tracking-wider"
                  >
                    Switch to {validationError.targetTabName}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
              <form onSubmit={handleDownload} className="w-full mb-8 relative z-20">
                <div className={clsx(
                  "relative flex items-center w-full border rounded-full p-2 pl-6 sm:pl-8 shadow-2xl backdrop-blur-xl group transition-all",
                  isLight 
                    ? "bg-white/70 backdrop-blur-xl border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-400" 
                    : "bg-[#1c0d0f]/60 backdrop-blur-xl border-white/[0.08] hover:border-white/15 focus-within:border-white/20"
                )}>
                  <input
                    
                    
                    id="tour-input" type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
                        handleUrlChange(pastedText);
                        setTimeout(() => handleDownload(undefined, pastedText), 50);
                      }
                    }}
                    placeholder={activeTabData.placeholder}
                    required
                    aria-label="Social media post or media URL"
                    className={clsx(
                      "w-full bg-transparent text-base sm:text-lg placeholder-neutral-400 outline-none py-3 pr-20 transition-colors",
                      isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-500"
                    )}
                  />
                  <button
                    id="tour-search-button"
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
                    className={clsx(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 dark:text-neutral-400 disabled:opacity-70" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-400 dark:text-neutral-400 disabled:opacity-70"
                    )}
                  >
                    {isLoading ? (
                      <div className={clsx(
                        "w-5 h-5 border-[2.5px] rounded-full animate-spin",
                        isLight ? "border-neutral-400/40 border-t-neutral-100" : "border-neutral-400/40 border-t-neutral-800"
                      )} />
                    ) : (
                      <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>
                </div>
              </form>

              {/* Platform Quick Switch */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 mb-4 w-full relative z-20">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const brandColor = getBrandColor(tab.id, isLight);
                  return (
                    <div key={tab.id} className="relative">
                      <Link
                        to={tab.id === 'pinterest' ? '/' : `/${tab.id}-downloader`}
                        onClick={() => {
                           setActiveTab(tab.id);
                           setResult(null);
                           setValidationError(null);
                        }}
                        title={"Switch to " + tab.label}
                        className={clsx(
                          "p-2.5 rounded-full transition-all duration-300 border shadow-sm flex items-center justify-center cursor-pointer",
                          isActive 
                            ? "scale-110 shadow-md ring-2 ring-offset-2 ring-offset-transparent"
                            : "opacity-70 hover:opacity-100 hover:scale-105 active:scale-95"
                        )}
                        style={{
                          backgroundColor: isActive ? brandColor : (isLight ? '#ffffff' : 'rgba(255,255,255,0.05)'),
                          color: isActive ? (tab.id === 'snapchat' ? '#000' : (tab.id === 'tiktok' || tab.id === 'x' ? (isLight ? '#fff' : '#000') : '#fff')) : brandColor,
                          borderColor: isActive ? brandColor : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                          ...(isActive ? { "--tw-ring-color": brandColor } as React.CSSProperties : {})
                        }}
                      >
                        <BrandIcon id={tab.id} className="w-5 h-5 sm:w-6 sm:h-6" />
                      </Link>
                      {tab.isNew && (
                        <span className="absolute -top-1.5 -right-1.5 z-30 pointer-events-none">
                          <NewBadge className="text-[7px] px-1 py-0.2" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-8 mb-8 w-full max-w-2xl relative z-20">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className={clsx(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                    isLight 
                      ? "bg-white/90 border-neutral-200/80 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-neutral-100" 
                      : "bg-white/5 border-white/10 hover:border-white/15 text-neutral-300 hover:bg-white/10 shadow-black/40"
                  )}
                  title="Paste supported URL instantly from your clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>Paste Link</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleAddToVault}
                  disabled={!url}
                  className={clsx(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100",
                    isLight 
                      ? "bg-white/90 border-neutral-200/80 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50" 
                      : "bg-white/5 border-white/10 hover:border-white/15 text-neutral-300 hover:bg-white/10"
                  )}
                  title="Queue this URL into the Batch Downloader Vault"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500 font-extrabold" />
                  <span>Add to Batch Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVault(!showVault)}
                  className={clsx(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                    showVault
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400 font-extrabold"
                      : isLight 
                        ? "bg-white/90 border-neutral-200/80 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50" 
                        : "bg-white/5 border-white/10 hover:border-white/15 text-neutral-300 hover:bg-white/10"
                  )}
                  title="Open/Close your offline-saved Batch Downloader Vault"
                >
                  <ListVideo className="w-3.5 h-3.5 text-indigo-500" /> 
                  <span>Batch Vault</span>
                  {vaultQueue.length > 0 && (
                    <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white">
                      {vaultQueue.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Link Vault Batch Queue Panel (Glassmorphic) */}
              </motion.div>
            </AnimatePresence>
              <AnimatePresence>
                {showVault && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -15, filter: "blur(4px)" }}
                    animate={{ opacity: 1, height: "auto", y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, height: 0, y: -15, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="w-full max-w-2xl mb-8 overflow-hidden shrink-0"
                  >
                    <div className={clsx(
                      "p-5 rounded-3xl border shadow-xl flex flex-col gap-4 text-left relative overflow-hidden backdrop-blur-xl",
                      isLight 
                        ? "bg-white/80 border-neutral-200/80 shadow-neutral-100" 
                        : "bg-neutral-900/60 border-white/10 shadow-black/50"
                    )}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                      <div className="flex items-center justify-between border-b pb-3 border-neutral-200/60 dark:border-white/10 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <ListVideo className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className={clsx("text-sm font-bold tracking-tight", isLight ? "text-neutral-900" : "text-white")}>
                              Link Vault Batch Downloader
                            </h3>
                            <p className={clsx("text-[10px] font-medium opacity-60", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>
                              Queue links of any supported platform to extract sequentially
                            </p>
                          </div>
                        </div>

                        {vaultQueue.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              saveVault([]);
                              triggerHistoryToast("Batch Vault cleared!");
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:underline cursor-pointer"
                          >
                            Clear Vault
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
                        {vaultQueue.length === 0 ? (
                          <div className="py-6 flex flex-col items-center justify-center text-center opacity-60">
                            <div className="w-10 h-10 rounded-full bg-neutral-200/50 dark:bg-white/5 flex items-center justify-center mb-2.5 text-neutral-400 dark:text-neutral-400">
                              <Plus className="w-5 h-5 rotate-45" />
                            </div>
                            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 dark:text-neutral-400 dark:text-neutral-400">
                              Your Link Vault is currently empty.
                            </p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-400 dark:text-neutral-600 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                              Paste a media link in the input above and click "Add to Batch Vault" to save links for later offline extraction.
                            </p>
                          </div>
                        ) : (
                          vaultQueue.map((item, idx) => {
                            const platDetails = getPlatformDetails(item.platform);
                            return (
                              <div 
                                key={item.url + '_' + idx}
                                className={clsx(
                                  "flex items-center justify-between p-2.5 rounded-xl border transition-colors group/vault",
                                  isLight 
                                    ? "bg-neutral-50/50 border-neutral-100 hover:bg-neutral-100/50" 
                                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className={clsx("p-2 rounded-lg text-xs font-bold shrink-0", platDetails.bgClass, platDetails.colorClass)}>
                                    {platDetails.icon}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={clsx("text-xs font-bold truncate", isLight ? "text-neutral-800" : "text-neutral-200")}>
                                      {getTabLabel(item.platform)} Link
                                    </span>
                                    <span className="text-[10px] opacity-50 truncate max-w-[280px] sm:max-w-md font-mono" title={item.url}>
                                      {item.url}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab(item.platform);
                                      setUrl(item.url);
                                      setShowVault(false);
                                      triggerHistoryToast(`Loaded link! Running extraction...`);
                                      // Trigger immediate download
                                      setTimeout(() => {
                                        const form = document.querySelector('form');
                                        if (form) form.requestSubmit();
                                      }, 100);
                                  }}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                                  >
                                    Process
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = vaultQueue.filter((_, i) => i !== idx);
                                      saveVault(updated);
                                      triggerHistoryToast("Link removed from Vault");
                                    }}
                                    className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full mt-16 max-w-md mx-auto flex flex-col items-center space-y-6 px-4"
            >
              {/* Skeleton Image/Video Box */}
              <div className={clsx(
                "w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden relative shadow-2xl",
                isLight ? "bg-neutral-100 border border-neutral-200" : "bg-white/5 border border-white/10"
              )}>
                {/* Moving Shimmer Effect */}
                <motion.div 
                  className={clsx(
                    "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent",
                    isLight ? "via-neutral-200/50" : "via-white/10"
                  )}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Centered Spinner */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className={clsx("w-8 h-8 animate-spin", isLight ? "text-neutral-400 dark:text-neutral-400" : "text-white/20")} />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full space-y-3 mt-4">
                <div className={clsx(
                  "flex justify-between text-xs font-medium",
                  isLight ? "text-neutral-700" : "text-white/70"
                )}>
                  <span>Progress</span>
                  <span>{LOADING_STEPS[loadingStep].target}%</span>
                </div>
                {/* Outer Track */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden relative shadow-inner",
                  isLight ? "bg-neutral-200 border border-neutral-300" : "bg-white/5 border border-white/10"
                )}>
                  {/* Inner Fill */}
                  <motion.div 
                    className={clsx(
                      "absolute top-0 left-0 bottom-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                      isLight ? "bg-neutral-800" : "bg-white"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${LOADING_STEPS[loadingStep].target}%` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                  />
                </div>
                <div className={clsx(
                  "text-center text-xs font-medium",
                  isLight ? "text-neutral-600 dark:text-neutral-400" : "text-white/80"
                )}>
                  Processing Link...
                </div>
              </div>
            </motion.div>
          )}

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result && !isLoading && (
            <motion.div
              id="tour-results"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.3 }}
              className="w-full text-left"
            >
              {result.success ? (
                <div className="space-y-6">
                  {result.message && (
                    <div className={clsx("p-4 rounded-xl border text-sm font-medium shadow-sm flex items-start gap-3", 
                      isLight ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-amber-500/10 text-amber-200 border-amber-500/20"
                    )}>
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>{result.message}</div>
                    </div>
                  )}
                  
                  {/* PROFILE TEMPLATE */}
                  {result.mediaType === 'profile' && result.profile && (
                    <div className={clsx(
                      "border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-colors",
                      isLight ? "bg-white/70 backdrop-blur-xl border-neutral-200" : "bg-[#1e1516]/70 backdrop-blur-xl border-white/10"
                    )}>
                      
                      {/* Banner Backplate */}
                      <div className={clsx("h-32 sm:h-44 relative overflow-hidden", isLight ? "bg-gradient-to-r from-neutral-200 to-neutral-300" : "bg-gradient-to-r from-neutral-800 to-neutral-900")}>
                        {result.profile.bannerUrl && (
                          <img 
                            src={getProxiedUrl(result.profile.bannerUrl)} 
                            alt="Cover Banner" 
                            className="w-full h-full object-cover cursor-zoom-in transition-opacity" 
                            onClick={() => {
                              if (result.profile?.bannerUrl) {
                                setLightboxMediaList([{
                                  url: result.profile.bannerUrl,
                                  type: 'image',
                                  title: `${result.profile.displayName || result.profile.username || 'User'}'s Cover Banner`
                                }]);
                                setLightboxIndex(0);
                              }
                            }}
                          />
                        )}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-neutral-300 text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold">
                          PROFILE ASSET REPORT
                        </div>
                      </div>

                      {/* Header DP Circle & Info */}
                      <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
                          <div 
                            className="relative group cursor-zoom-in"
                            onClick={() => {
                              const imgUrl = result.profile?.avatarUrl || result.thumbnail;
                              if (imgUrl) {
                                setLightboxMediaList([{
                                  url: imgUrl,
                                  type: 'image',
                                  title: `${result.profile?.displayName || result.profile?.username || 'User'}'s Profile Picture`
                                }]);
                                setLightboxIndex(0);
                              }
                            }}
                          >
                            
                            <img 
                              src={getProxiedUrl(result.profile.avatarUrl || result.thumbnail || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZiNzI4MCIgc3Ryb2tlPSJub25lIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogIzFmMjkzNzsiPgogIDxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDRjMS45MyAwIDMuNSAxLjU3IDMuNSAzLjVTMTMuOTMgMTMgMTIgMTNzLTMuNS0xLjU3LTMuNS0zLjVTMTAuMDcgNiAxMiA2em0wIDE0Yy0yLjAzIDAtNC40My0uODItNi4xNC0yLjg4QzcuNTUgMTUuOCA5LjY4IDE1IDEyIDE1czQuNDUuOCA2LjE0IDIuMTJDMTYuNDMgMTkuMTggMTQuMDMgMjAgMTIgMjB6Ii8+Cjwvc3ZnPg==`)} 
                              alt="Profile DP" 
                              className={clsx(
                                "w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-[6px] relative z-10 shadow-2xl group-hover:scale-[1.03] transition-transform",
                                isLight ? "border-white" : "border-[#1e1516]"
                              )}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EzYTNhMyIgc3Ryb2tlPSJub25lIj4KICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0zLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5IDEuOTQtMy41IDMuMjItNiAzLjIyeiIvPgo8L3N2Zz4=`;
                              }}
                            />
                          </div>
                        </div>

                        {/* Names Details */}
                        <div className="mb-6">
                          <h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors break-words", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                              <p className="text-red-500 font-mono text-sm">@{result.profile.username.replace('@', '')}</p>
                              {!result.profile.avatarUrl && (
                                 <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                   Proxy Blocked
                                 </span>
                              )}
                          </div>
                          {!result.profile.avatarUrl && (
                             <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-3 max-w-2xl">
                               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                               <p><strong>Anti-Bot Protection Active:</strong> The host server IP (e.g., Render) was blocked by this platform while fetching profile metadata. Using generic placeholder instead.</p>
                             </div>
                          )}
                          {result.profile.bio && (
                            <p className={clsx(
                              "text-sm mt-4 leading-relaxed max-w-2xl p-4 rounded-xl border transition-colors",
                              isLight ? "text-neutral-700 bg-neutral-50 border-neutral-200" : "text-neutral-300 bg-white/5 border-white/5"
                            )}>
                              {result.profile.bio}
                            </p>
                          )}
                        </div>

                        {/* Stat Counters Row */}
                        <div className={clsx(
                          "flex items-center gap-8 border-t pt-6 flex-wrap transition-colors",
                          isLight ? "border-neutral-200" : "border-white/5"
                        )}>
                          {result.profile.followers && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.followers}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>Followers</p>
                            </div>
                          )}
                          {result.profile.following && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.following}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>Following</p>
                            </div>
                          )}
                          {result.profile.postsCount && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.postsCount}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>Posts</p>
                            </div>
                          )}
                        </div>

                        {/* Profile Assets Downloader */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {result.profile.avatarUrl && (
                            <div className={clsx(
                              "flex flex-col p-6 rounded-3xl border backdrop-blur-2xl shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden",
                              isLight ? "bg-white/80 border-white/50" : "bg-white/10 border-white/20"
                            )}>
                              {/* Glassmorphism ambient glow */}
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none" />
                              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] pointer-events-none" />
                              
                              <div className="flex flex-col items-center text-center gap-4 mb-6 relative z-10">
                                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shrink-0 border-[6px] border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-neutral-100/50 backdrop-blur-sm relative group">
                                  <img src={getProxiedUrl(result.profile.avatarUrl)} alt={`Avatar for ${result.profile.displayName || result.profile.username || "User"}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" width="400" height="400" />
                                </div>
                                <div className="mt-2">
                                  <div className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Profile Logo</div>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>High-resolution avatar image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                {(() => {
                                  const activeDlAvatar = activeDownloads[result.profile.avatarUrl!];
                                  return (
                                    <button 
                                      type="button"                                   
                                      onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.avatarUrl!, (result.profile?.username || "user") + "_avatar.jpg"); }}
                                      disabled={!!activeDlAvatar && activeDlAvatar.status !== "complete" && activeDlAvatar.status !== "failed"}
                                      className={clsx(
                                        "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed",
                                        isLight 
                                          ? activeDlAvatar?.status === "complete" ? "bg-emerald-600 text-white" : "bg-neutral-900 hover:bg-neutral-800 text-white" 
                                          : activeDlAvatar?.status === "complete" ? "bg-emerald-600 text-white" : "bg-white hover:bg-neutral-200 text-black",
                                        activeDlAvatar && "bg-emerald-600 text-white"
                                      )}
                                    >
                                      {activeDlAvatar ? (
                                        activeDlAvatar.status === "preparing" || activeDlAvatar.status === "downloading" ? (
                                          <>
                                            <Loader2 className="w-5 h-5 animate-spin text-current" />
                                            {activeDlAvatar.status === "preparing" ? "Preparing..." : "Downloading..."}
                                          </>
                                        ) : activeDlAvatar.status === "complete" ? (
                                          <>
                                            <AnimatedCheckMark className="w-5 h-5 text-white" />
                                            Saved Successfully!
                                          </>
                                        ) : (
                                          <>
                                            <AlertCircle className="w-5 h-5 text-rose-300" />
                                            Download Failed
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <Download className="w-5 h-5" /> Download Logo
                                        </>
                                      )}
                                    </button>
                                  );
                                })()}
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <CopyButton url={result.profile.avatarUrl} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-5 py-3 rounded-xl text-sm font-bold justify-center backdrop-blur-md transition-all active:scale-95" />
                                  <QRCodeButton url={result.profile.avatarUrl} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-5 py-3 rounded-xl text-sm font-bold justify-center backdrop-blur-md transition-all active:scale-95" />
                                </div>
                              </div>
                            </div>
                          )}

                          {result.profile.bannerUrl && (
                            <div className={clsx(
                              "flex flex-col p-6 rounded-3xl border backdrop-blur-2xl shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden",
                              isLight ? "bg-white/80 border-white/50" : "bg-white/10 border-white/20"
                            )}>
                              {/* Glassmorphism ambient glow */}
                              <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] pointer-events-none" />
                              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] pointer-events-none" />

                              <div className="flex flex-col items-center text-center gap-4 mb-6 relative z-10">
                                <div className="w-full rounded-2xl overflow-hidden shrink-0 border-[6px] border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-neutral-100/50 backdrop-blur-sm relative group">
                                  <img src={getProxiedUrl(result.profile.bannerUrl)} alt={`Banner for ${result.profile.displayName || result.profile.username || "User"}`} className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" />
                                </div>
                                <div className="mt-2">
                                  <div className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Cover Banner</div>
                                  <p className={clsx("text-sm mt-1", isLight ? "text-neutral-600" : "text-neutral-300")}>Full-width background image</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-auto relative z-10">
                                {(() => {
                                  const activeDlBanner = activeDownloads[result.profile.bannerUrl!];
                                  return (
                                    <button 
                                      type="button"                                   
                                      onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.profile.bannerUrl!, (result.profile?.username || "user") + "_banner.jpg"); }}
                                      disabled={!!activeDlBanner && activeDlBanner.status !== "complete" && activeDlBanner.status !== "failed"}
                                      className={clsx(
                                        "w-full text-center text-sm font-bold px-4 py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed",
                                        isLight 
                                          ? activeDlBanner?.status === "complete" ? "bg-emerald-600 text-white" : "bg-neutral-900 hover:bg-neutral-800 text-white" 
                                          : activeDlBanner?.status === "complete" ? "bg-emerald-600 text-white" : "bg-white hover:bg-neutral-200 text-black",
                                        activeDlBanner && "bg-emerald-600 text-white"
                                      )}
                                    >
                                      {activeDlBanner ? (
                                        activeDlBanner.status === "preparing" || activeDlBanner.status === "downloading" ? (
                                          <>
                                            <Loader2 className="w-5 h-5 animate-spin text-current" />
                                            {activeDlBanner.status === "preparing" ? "Preparing..." : "Downloading..."}
                                          </>
                                        ) : activeDlBanner.status === "complete" ? (
                                          <>
                                            <AnimatedCheckMark className="w-5 h-5 text-white" />
                                            Saved Successfully!
                                          </>
                                        ) : (
                                          <>
                                            <AlertCircle className="w-5 h-5 text-rose-300" />
                                            Download Failed
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <Download className="w-5 h-5" /> Download Banner
                                        </>
                                      )}
                                    </button>
                                  );
                                })()}
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <CopyButton url={result.profile.bannerUrl} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-5 py-3 rounded-xl text-sm font-bold justify-center backdrop-blur-md transition-all active:scale-95" />
                                  <QRCodeButton url={result.profile.bannerUrl} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-5 py-3 rounded-xl text-sm font-bold justify-center backdrop-blur-md transition-all active:scale-95" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* PLAYLIST TEMPLATE */}
                  {result.mediaType === 'playlist' && result.media && result.media.length > 0 && (() => {
                    const uniquePlaylistMedia = deduplicateMediaItems(result.media);
                    if (uniquePlaylistMedia.length === 0) return null;
                    return (
                      <div className="space-y-6">
                        <div className={clsx(
                          "p-6 sm:p-8 rounded-3xl backdrop-blur-xl border transition-all shadow-2xl relative overflow-hidden",
                          isLight ? "bg-gradient-to-br from-white via-emerald-50/50 to-white border-emerald-200" : "bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0d0d0d] border-emerald-500/30 text-white"
                        )}>
                          {/* Glow background effect */}
                          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                            {/* Main Playlist Cover Artwork */}
                            <div className="relative group shrink-0">
                              {result.thumbnail ? (
                                <img 
                                  src={result.thumbnail} 
                                  alt={result.title || "Playlist"} 
                                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-2xl border border-emerald-500/30"
                                />
                              ) : (
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-neutral-900 flex items-center justify-center border border-emerald-500/30">
                                  <Music className="w-12 h-12 text-emerald-400" />
                                </div>
                              )}
                              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                                100% Extracted
                              </div>
                            </div>

                            {/* Playlist Info & Download Button */}
                            <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center">
                              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {result.source === 'spotify' ? 'Spotify Playlist' : 'YouTube Playlist'}
                                </span>
                              </div>

                              <h2 className={clsx("text-2xl sm:text-3xl font-black leading-tight truncate mb-1.5", isLight ? "text-neutral-900" : "text-white")} title={result.title}>
                                {result.title || "Playlist"}
                              </h2>

                              <p className={clsx("text-xs sm:text-sm font-medium mb-4", isLight ? "text-neutral-600" : "text-neutral-400 dark:text-neutral-400")}>
                                Extracted <span className="font-bold text-emerald-400">{uniquePlaylistMedia.length} tracks</span> • Ready for download
                              </p>

                              {/* PROMINENT DOWNLOAD ALL PLAYLIST BUTTON */}
                              <div className="space-y-3">
                                <button 
                                  onClick={handleDownloadAllPlaylists}
                                  disabled={downloadingPlaylist}
                                  className={clsx(
                                    "w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0 overflow-hidden whitespace-normal text-center leading-snug",
                                    isLight 
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30" 
                                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/40"
                                  )}
                                >
                                  {downloadingPlaylist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />} 
                                  <span className="break-words max-w-full">{downloadingPlaylist ? `Packaging Playlist ZIP (${playlistProgress?.percent || 0}%)` : `Download All Playlist ZIP (${uniquePlaylistMedia.length} Tracks)`}</span>
                                </button>

                                {/* Live Download Progress Bar */}
                                {downloadingPlaylist && playlistProgress && (
                                  <div className="w-full space-y-1.5 max-w-md">
                                    <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                                      <span className="truncate pr-2">{playlistProgress.currentTitle || 'Track'}</span>
                                      <span>{playlistProgress.current} / {playlistProgress.total} ({playlistProgress.percent}%)</span>
                                    </div>
                                    <div className="w-full bg-neutral-800/80 rounded-full h-2.5 overflow-hidden border border-emerald-500/30">
                                      <div 
                                        className="bg-emerald-400 h-full transition-all duration-300 rounded-full" 
                                        style={{ width: `${playlistProgress.percent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          {uniquePlaylistMedia.map((item, index) => (
                            <PlaylistItem key={index} item={item} index={index} isLight={isLight} originalUrl={result?.originalUrl} onDownloadQueue={(url: string, filename: string) => {
                                 downloadFileClientSide(url, filename);
                              }}
                              activeDownloads={activeDownloads} 
                            />
                          ))}
                        </div>

                        <div className="pt-4 flex justify-center">
                          <button 
                            onClick={handleDownloadAllPlaylists}
                            disabled={downloadingPlaylist}
                            className={clsx(
                              "w-full sm:w-auto px-8 py-4 rounded-2xl font-black transition-all shadow-2xl flex items-center justify-center gap-3 text-base uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-102 active:scale-98",
                              isLight ? "bg-neutral-950 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black shadow-white/10"
                            )}
                          >
                            {downloadingPlaylist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
                            {downloadingPlaylist ? `Downloading Playlist (${playlistProgress?.percent || 0}%)...` : `Download All Playlist (${uniquePlaylistMedia.length} Tracks)`}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CAROUSEL / COMMUNITY MULTI-PHOTO TEMPLATE */}
                  {result.mediaType === 'carousel' && result.media && result.media.length > 0 && (() => {
                    const uniqueCarouselMedia = deduplicateMediaItems(result.media);
                    if (uniqueCarouselMedia.length === 0) return null;
                    return (
                      <div className="space-y-6">
                        
                        {/* Top Action Control Panel */}
                        <div className={clsx(
                          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-md border transition-colors",
                          isLight ? "bg-white border-neutral-200 shadow-md" : "bg-white/5 border border-white/10"
                        )}>
                          <div>
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="font-semibold text-sm tracking-wide">CAROUSEL ASSETS READY</span>
                            </div>
                            <h3 className={clsx("text-xl font-bold line-clamp-1 transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                              {result.title || "Multi-File Album"}
                            </h3>
                            <p className={clsx("text-xs transition-colors mt-1", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>
                              {uniqueCarouselMedia.length} items extracted from URL link
                            </p>
                          </div>
                          <button 
                            onClick={handleDownloadAll}
                            className={clsx(
                              "px-6 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 text-sm shrink-0 uppercase tracking-wider cursor-pointer",
                              isLight ? "bg-neutral-950 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black shadow-white/10"
                            )}
                          >
                            <Download className="w-4 h-4" /> Download All
                          </button>
                        </div>

                        {/* Photo/Video Grid List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {uniqueCarouselMedia.map((item, index) => (
                            <div 
                              key={index} 
                              className={clsx(
                                "border rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:scale-[1.02] transition-all",
                                isLight ? "bg-white border-neutral-200" : "bg-white/[0.03] border-white/10 backdrop-blur-xl"
                              )}
                            >
                              
                              {/* Card Display Container */}
                              <div 
                                className="aspect-square bg-black relative overflow-hidden flex items-center justify-center cursor-zoom-in group-hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  const list = uniqueCarouselMedia.map((m, i) => ({
                                    url: m.url,
                                    type: m.type,
                                    title: `${result.title || 'Media'} - Item #${i + 1}`
                                  }));
                                  setLightboxMediaList(list);
                                  setLightboxIndex(index);
                                }}
                              >
                              {item.type === 'video' ? (
                                <div className="w-full h-full relative group/img">
                                  {item.thumbnail ? (
                                    <img src={getProxiedUrl(item.thumbnail)} alt={`Video slide ${index + 1}`} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"  loading="lazy" decoding="async" width="400" height="400" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                      <Film className="w-10 h-10 text-neutral-600" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                    <Tv className="w-8 h-8 text-white/80 animate-pulse animate-duration-1000" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={getProxiedUrl(item.url)} 
                                  alt={`Image slide ${index + 1}`} 
                                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                  }}
                                />
                              )}
                              <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-black">
                                ITEM #{index + 1}
                              </span>
                              <span className="absolute top-3 right-3 bg-white/10 backdrop-blur-md text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {item.type}
                              </span>
                            </div>

                             {/* Card Download Button Footer with standard quality options for videos */}
                            <div className={clsx(
                              "p-4 border-t mt-auto flex flex-col gap-3 transition-colors",
                              isLight ? "bg-neutral-50 border-neutral-100" : "bg-black/30 border-white/5"
                            )}>
                              {(() => {
                                const activeDlItem = activeDownloads[item.url];
                                return item.type === 'video' ? (
                                  <div className="space-y-2">
                                    <button 
                                      type="button"                                     
                                      onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                      disabled={!!activeDlItem && activeDlItem.status !== "complete" && activeDlItem.status !== "failed"}
                                      className={clsx(
                                        "w-full inline-flex items-center justify-center gap-2 border px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed active:scale-95",
                                        isLight 
                                          ? activeDlItem?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" 
                                          : activeDlItem?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10",
                                        activeDlItem && "bg-emerald-600 border-emerald-600 text-white"
                                      )}
                                    >
                                      {activeDlItem ? (
                                        activeDlItem.status === "preparing" || activeDlItem.status === "downloading" ? (
                                          <>
                                            <Loader2 className="w-4 h-4 animate-spin text-current" />
                                            {activeDlItem.status === "preparing" ? "Preparing..." : "Downloading..."}
                                          </>
                                        ) : activeDlItem.status === "complete" ? (
                                          <>
                                            <AnimatedCheckMark className="w-4 h-4 text-white" />
                                            Saved!
                                          </>
                                        ) : (
                                          <>
                                            <AlertCircle className="w-4 h-4 text-rose-300" />
                                            Failed
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4" /> Download Video
                                        </>
                                      )}
                                    </button>

                                    {(() => {
                                      const mp3Url = `/api/proxy-download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent((result.title || "media").slice(0, 30).trim() + "_audio.mp3")}&extractAudio=true`;
                                      const activeDlMp3 = activeDownloads[mp3Url];
                                      return (
                                        <button 
                                          type="button"                                     
                                          onClick={(e) => { e.preventDefault(); downloadFileClientSide(mp3Url, (result.title || "media").slice(0, 30).trim() + "_audio.mp3"); }}
                                          disabled={!!activeDlMp3 && activeDlMp3.status !== "complete" && activeDlMp3.status !== "failed"}
                                          className={clsx(
                                        "w-full inline-flex items-center justify-center gap-2 border px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed active:scale-95",
                                            isLight 
                                              ? activeDlMp3?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white hover:bg-emerald-50 hover:text-emerald-600 border-neutral-200" 
                                              : activeDlMp3?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/5 hover:bg-white hover:text-black border-white/10",
                                            activeDlMp3 && "bg-emerald-600 border-emerald-600 text-white"
                                          )}
                                        >
                                          {activeDlMp3 ? (
                                            activeDlMp3.status === "preparing" || activeDlMp3.status === "downloading" ? (
                                              <>
                                                <Loader2 className="w-4 h-4 animate-spin text-current" />
                                                {activeDlMp3.status === "preparing" ? "Preparing MP3..." : "Downloading MP3..."}
                                              </>
                                            ) : activeDlMp3.status === "complete" ? (
                                              <>
                                                <AnimatedCheckMark className="w-4 h-4 text-white" />
                                                MP3 Saved!
                                              </>
                                            ) : (
                                              <>
                                                <AlertCircle className="w-4 h-4 text-rose-300" />
                                                MP3 Failed
                                              </>
                                            )
                                          ) : (
                                            <>
                                              <Music className="w-4 h-4" /> Download MP3 Audio
                                            </>
                                          )}
                                        </button>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <button 
                                    type="button"                                   
                                    onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.jpg"); }}
                                    disabled={!!activeDlItem && activeDlItem.status !== "complete" && activeDlItem.status !== "failed"}
                                    className={clsx(
                                        "w-full inline-flex items-center justify-center gap-2 border px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed active:scale-95",
                                      isLight 
                                        ? activeDlItem?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white hover:bg-neutral-900 hover:text-white border-neutral-200 text-neutral-800" 
                                        : activeDlItem?.status === "complete" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white",
                                      activeDlItem && "bg-emerald-600 border-emerald-600 text-white"
                                    )}
                                  >
                                    {activeDlItem ? (
                                      activeDlItem.status === "preparing" || activeDlItem.status === "downloading" ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                                          {activeDlItem.status === "preparing" ? "Preparing..." : "Downloading..."}
                                        </>
                                      ) : activeDlItem.status === "complete" ? (
                                        <>
                                          <AnimatedCheckMark className="w-3.5 h-3.5 text-white" />
                                          Saved!
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                                          Failed
                                        </>
                                      )
                                    ) : (
                                      <>
                                        <Download className="w-3.5 h-3.5" /> Download Image
                                      </>
                                    )}
                                  </button>
                                );
                              })()}
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <CopyButton url={item.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95" />
                                <QRCodeButton url={item.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95" />
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })()}

                  {/* SPOTIFY AUDIO PLAYER RESULT CARD */}
                  {result.mediaType !== 'playlist' && (result.source === 'spotify' || (result.qualities && result.qualities.some((q: any) => q.url?.includes('spotify-resolve')))) ? (
                    <div className="w-full space-y-4">
                      <SpotifyAudioPlayer
                        title={result.title || "Spotify Extracted Track"}
                        thumbnail={result.thumbnail}
                        audioUrl={result.qualities?.[0]?.url || result.url || ''}
                        isLight={isLight}
                        onDownload={() => {
                          const dlUrl = result.qualities?.[0]?.url || result.url || '';
                          const fn = (result.title || "spotify_track").slice(0, 30).trim() + ".mp3";
                          downloadFileClientSide(dlUrl, fn);
                        }}
                        downloadStatus={activeDownloads[result.qualities?.[0]?.url || result.url || '']}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <CopyButton url={result.qualities?.[0]?.url || result.url || ''} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95" />
                        <QRCodeButton url={result.qualities?.[0]?.url || result.url || ''} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3 rounded-xl text-xs font-bold justify-center transition-all active:scale-95" />
                      </div>
                    </div>
                  ) : result.mediaType !== 'profile' && result.mediaType !== 'carousel' && (
                    <div className={clsx(
                      "border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row backdrop-blur-sm transition-colors",
                      isLight ? "bg-white border-neutral-200" : "bg-white/5 border border-white/10"
                    )}>
                      {result.mediaType === 'video' ? (
                        <div className="w-full md:w-2/5 aspect-[4/3] md:aspect-auto bg-black relative flex flex-col justify-between overflow-hidden min-h-[280px]">
                          {/* Shutter camera flash animation overlay */}
                          <div className={clsx(
                            "absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-200",
                            snapshotCanvasFlash ? "opacity-90" : "opacity-0"
                          )} />

                          {/* Video player element */}
                          <video
                            id="studio-video-element"
                            src={getProxiedUrl(result.url)}
                            poster={result.thumbnail ? getProxiedUrl(result.thumbnail) : undefined}
                            controls
                            playsInline
                            className="w-full h-full object-contain bg-black flex-1"
                          />

                          {/* Glassmorphic Creative Playback Studio Toolbar */}
                          <div className={clsx(
                            "p-3 border-t flex flex-wrap items-center justify-between gap-2 backdrop-blur-md relative z-20 text-xs font-bold transition-colors",
                            isLight ? "bg-white/95 border-neutral-200" : "bg-neutral-950/90 border-white/5"
                          )}>
                            <div className="flex items-center gap-1">
                              <span className="opacity-60 text-[10px] uppercase mr-1">Speed:</span>
                              {[0.5, 1, 1.5, 2].map((speed) => (
                                <button
                                  key={speed}
                                  type="button"
                                  onClick={() => {
                                    setPlaybackSpeed(speed);
                                    const video = document.getElementById('studio-video-element') as HTMLVideoElement;
                                    if (video) video.playbackRate = speed;
                                    triggerHistoryToast(`Playback set to ${speed}x`);
                                  }}
                                  className={clsx(
                                    "px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer",
                                    playbackSpeed === speed
                                      ? "bg-[#ff1e42] text-white font-extrabold"
                                      : isLight 
                                        ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" 
                                        : "bg-white/15 text-neutral-300 hover:bg-white/25"
                                  )}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const video = document.getElementById('studio-video-element') as HTMLVideoElement;
                                if (video) {
                                  try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = video.videoWidth || 1280;
                                    canvas.height = video.videoHeight || 720;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                                      const a = document.createElement('a');
                                      a.href = dataUrl;
                                      a.download = `${(result.title || "video").slice(0, 30).trim()}_frame_${Math.floor(video.currentTime)}s.jpg`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      
                                      // Trigger flash
                                      setSnapshotCanvasFlash(true);
                                      setTimeout(() => setSnapshotCanvasFlash(false), 200);
                                      triggerHistoryToast("Snapshot saved to your device");
                                    }
                                  } catch (e) {
                                    triggerHistoryToast("Snapshot failed due to video server permissions. Try Lightbox instead");
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider active:scale-95 shadow-md"
                              title="Capture High Resolution snapshot of current video frame"
                            >
                              <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />Snap Frame</span>
                            </button>
                          </div>
                        </div>
                      ) : result.thumbnail ? (
                        <div 
                          className="w-full md:w-2/5 aspect-[4/3] md:aspect-auto bg-black relative flex items-center justify-center overflow-hidden min-h-[220px] cursor-zoom-in group/thumb"
                          onClick={() => {
                            setLightboxMediaList([{
                              url: result.url || result.thumbnail || '',
                              type: result.mediaType === 'video' ? 'video' : 'image',
                              title: result.title || "Ready File Asset",
                              thumbnail: result.thumbnail
                            }]);
                            setLightboxIndex(0);
                          }}
                        >
                          <img 
                            src={getProxiedUrl(result.thumbnail)} 
                            alt="Media thumbnail" 
                            className="w-full h-full object-cover opacity-90 group-hover/thumb:scale-105 group-hover/thumb:opacity-100 transition-transform duration-500 ease-out"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white border border-white/20">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={clsx(
                            "w-full md:w-2/5 aspect-[4/3] md:aspect-auto flex items-center justify-center min-h-[200px] cursor-zoom-in transition-colors",
                            isLight ? "bg-neutral-100 hover:bg-neutral-200" : "bg-white/5 hover:bg-white/10"
                          )}
                          onClick={() => {
                            if (result.url) {
                              setLightboxMediaList([{
                                url: result.url,
                                type: result.mediaType === 'video' ? 'video' : 'image',
                                title: result.title || "Ready File Asset",
                                thumbnail: result.thumbnail
                              }]);
                              setLightboxIndex(0);
                            }
                          }}
                        >
                          <Film className="w-12 h-12 text-neutral-600 animate-pulse" />
                        </div>
                      )}
                      
                      <div className={clsx(
                        "p-6 md:p-8 flex-1 flex flex-col justify-center transition-colors",
                        isLight ? "bg-neutral-50/50" : "bg-black/20"
                      )}>
                        <div className="flex items-center gap-2 text-emerald-500 mb-3">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold text-sm tracking-wide">EXTRACTION SUCCESSFUL</span>
                        </div>
                        {result.warning && (
                          <div className="bg-yellow-50 text-yellow-600 p-4 rounded-xl mb-4 flex items-start gap-3 border border-yellow-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium leading-relaxed">{result.warning}</p>
                          </div>
                        )}
                        <h3 className={clsx("text-xl font-bold mb-6 line-clamp-3 leading-snug break-words transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                          {result.title || "Ready File Asset"}
                        </h3>
                        {result.description && (
                          <p className={clsx(
                            "text-xs line-clamp-2 mb-6 leading-relaxed p-3 rounded-lg border transition-all",
                            isLight ? "text-neutral-600 bg-neutral-100/50 border-neutral-200" : "text-neutral-400 dark:text-neutral-400 bg-black/10 border-white/5"
                          )}>
                            {result.description}
                          </p>
                        )}
                        {(result.qualities && result.qualities.length > 0) ? (() => {
                          const sanitized = sanitizeQualities(result.qualities, result.url);
                          


                          if (sanitized.length > 0) {
                            const videoOptions = sanitized.filter(q => !q.isAudio);
                            const sectionHeader = videoOptions.length > 1 ? "Available Video Quality Formats:" : `Download ${result.mediaType === 'image' ? 'Image' : result.mediaType === 'video' ? 'Video' : 'Media'}:`;
                            return (
                              <div className="flex flex-col gap-4 w-full">
                                <div className={clsx("border-t pt-4 mt-1 transition-colors", isLight ? "border-neutral-200" : "border-white/10")}>
                                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <span className="text-xs uppercase tracking-widest text-emerald-500 font-bold">
                                      {sectionHeader}
                                    </span>
                                    <span className="text-[10px] opacity-60 flex items-center gap-1 font-medium">
                                      <Sparkles className="w-3 h-3 text-emerald-500" /> Click 
                                      <ExternalLink className="w-2.5 h-2.5 inline mx-0.5" /> for instant browser download
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {sanitized.map((q, idx) => {
                                      const activeDl = activeDownloads[q.url];
                                      const filename = (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\s+/g, "_") + "." + (q.ext || "mp4");
                                      const sizeDisplay = getQualitySizeDisplay(q, result?.length, fetchedSizes, result?.title || result?.originalUrl);
                                      return (
                                        <div key={idx} className="flex items-center gap-2 w-full">
                                          <button type="button"
                                            id={idx === 0 ? "tour-regular-download" : undefined}
                                            onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}
                                            disabled={!!activeDl && activeDl.status !== "complete" && activeDl.status !== "failed"}
                                            className={clsx(
                                              "flex-1 flex items-center justify-between p-3 rounded-xl transition-all border group/quality cursor-pointer disabled:cursor-not-allowed",
                                              isLight 
                                                ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" 
                                                : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10",
                                              activeDl && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                                            )}
                                          >
                                            <div className="flex flex-col text-left">
                                              <span className={clsx(
                                                "font-bold text-sm transition-colors",
                                                isLight ? "text-neutral-800 group-hover/quality:text-white" : "text-white group-hover/quality:text-white",
                                                activeDl?.status === "complete" && "text-emerald-500",
                                                activeDl?.status === "failed" && "text-rose-500"
                                              )}>
                                                {q.label}
                                              </span>
                                              <span className={clsx(
                                                "text-xs transition-colors",
                                                isLight ? "text-neutral-600 dark:text-neutral-400 group-hover/quality:text-white/80" : "text-neutral-400 dark:text-neutral-400 group-hover/quality:text-white/80",
                                                activeDl && "text-emerald-600 dark:text-emerald-400 font-medium"
                                              )}>
                                                {activeDl 
                                                  ? activeDl.status === "preparing" ? (activeDl.progress ? `Preparing stream (${activeDl.progress}%)` : "Preparing stream...")
                                                    : activeDl.status === "downloading"
                                                      ? activeDl.progress !== null ? `Downloading in background (${activeDl.progress}%)` : "Downloading stream..."
                                                      : activeDl.status === "complete"
                                                        ? "Saved successfully!"
                                                        : "Extraction failed"
                                                  : sizeDisplay
                                                }
                                              </span>
                                            </div>
                                            <div className={clsx(
                                              "p-2 rounded-lg transition-colors",
                                              isLight ? "bg-neutral-100 group-hover/quality:bg-white/20" : "bg-white/10 group-hover/quality:bg-white/20",
                                              activeDl && "bg-emerald-500/20"
                                            )}>
                                              {activeDl ? (
                                                activeDl.status === "preparing" || activeDl.status === "downloading" ? (
                                                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin group-hover/quality:text-white" />
                                                ) : activeDl.status === "complete" ? (
                                                  <AnimatedCheckMark className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                                )
                                              ) : (
                                                <Download className="w-4 h-4 text-emerald-500 group-hover/quality:text-white" />
                                              )}
                                            </div>
                                          </button>
                                          
                                          {/* Direct instant download button */}
                                          <button type="button"
                                            id={idx === 0 ? "tour-direct-download" : undefined}
                                            onClick={(e) => { e.preventDefault(); downloadFileDirect(q.url, filename); }}
                                            title="Direct Instant Download (Bypasses local memory cache)"
                                            className={clsx(
                                              "p-3.5 rounded-xl transition-all border flex items-center justify-center cursor-pointer",
                                              isLight 
                                                ? "bg-neutral-50 border-neutral-200 text-neutral-600 dark:text-neutral-400 hover:text-white hover:bg-[#ff1e42]" 
                                                : "bg-white/5 border-white/10 text-neutral-400 dark:text-neutral-400 hover:text-white hover:bg-[#ff1e42]"
                                            )}
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {result.url && (
                                  <div className={clsx("flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center mt-2 border-t pt-4 transition-colors w-full", isLight ? "border-neutral-200" : "border-white/5")}>
                                    <CopyButton url={result.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95" />
                                    <QRCodeButton url={result.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95" />
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })() : result.url ? (() => {
                          const activeDl = activeDownloads[result.url];
                          const filename = (result.title || "download") + (result.mediaType === "image" ? ".jpg" : ".mp4");
                          return (
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center w-full">
                              <button type="button"
                                id="tour-regular-download"
                                onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.url, filename); }}
                                disabled={!!activeDl && activeDl.status !== "complete" && activeDl.status !== "failed"}
                                className={clsx(
                                  "flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer disabled:cursor-not-allowed active:scale-95",
                                  isLight 
                                    ? "bg-neutral-950 text-white hover:bg-neutral-800" 
                                    : "bg-white hover:bg-neutral-200 text-black",
                                  activeDl && "bg-emerald-600 hover:bg-emerald-500 text-white"
                                )}
                              >
                                {activeDl ? (
                                  activeDl.status === "preparing" || activeDl.status === "downloading" ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      {activeDl.status === "preparing" ? (activeDl.progress ? `Preparing stream (${activeDl.progress}%)` : "Preparing stream...") 
                                        : activeDl.progress !== null ? `Downloading (${activeDl.progress}%)` : "Downloading..."
                                      }
                                    </>
                                  ) : activeDl.status === "complete" ? (
                                    <>
                                      <AnimatedCheckMark className="w-5 h-5 text-white" />
                                      Saved successfully!
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-5 h-5 text-rose-300" />
                                      Failed to download
                                    </>
                                  )
                                ) : (
                                  <>
                                    <Download className="w-5 h-5" /> 
                                    Download {result.mediaType === 'image' ? 'Image' : result.mediaType === 'video' ? 'Video' : 'Media'}
                                  </>
                                )}
                              </button>
                              
                              {/* Direct download */}
                              <button type="button"
                                onClick={(e) => { e.preventDefault(); downloadFileDirect(result.url, filename); }}
                                title="Direct Instant Download (Bypasses local memory cache)"
                                className={clsx(
                                  "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold transition-all border uppercase tracking-wider text-xs cursor-pointer",
                                  isLight 
                                    ? "border-neutral-300 text-neutral-700 bg-neutral-100 hover:bg-neutral-200" 
                                    : "border-white/10 text-white bg-white/5 hover:bg-white/10"
                                )}
                              >
                                <ExternalLink className="w-4 h-4" /> Direct Instant Download
                              </button>

                              <CopyButton url={result.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95" />
                              <QRCodeButton url={result.url} originalUrl={result?.originalUrl} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold justify-center transition-all active:scale-95" />
                            </div>
                          );
                        })() : null}
                        
                        {/* Thumbnail Download Section */}
                        {result.thumbnail && getThumbnailQualities(result.thumbnail).length > 0 && (
                          <div className={clsx("mt-6 border-t pt-4 transition-colors w-full", isLight ? "border-neutral-200" : "border-white/10")}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="w-full sm:w-1/3 flex-shrink-0">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10 relative group/thumb">
                                  <img 
                                    src={getProxiedUrl(result.thumbnail)} 
                                    alt="Thumbnail preview" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                              <div className="w-full sm:w-2/3 flex flex-col gap-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs uppercase tracking-widest text-blue-500 font-bold">
                                    Download Thumbnail:
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                              {getThumbnailQualities(result.thumbnail).map((q, idx) => {
                                const filename = (result.title || "thumbnail").slice(0, 30).trim() + "_" + q.label.replace(/\s+/g, "_").replace(/\//g, "-") + "." + (q.ext || "jpg");
                                return (
                                  <div key={idx} className="flex items-center gap-2 w-full">
                                    <button type="button"
                                      onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}
                                      className={clsx(
                                        "flex-1 flex items-center justify-between p-3 rounded-xl transition-all border group/quality cursor-pointer",
                                        isLight 
                                          ? "bg-white hover:bg-blue-600 hover:text-white border-neutral-200" 
                                          : "bg-white/5 hover:bg-blue-600 hover:text-white border-white/10"
                                      )}
                                    >
                                      <div className="flex flex-col text-left">
                                        <span className={clsx(
                                          "font-bold text-sm transition-colors",
                                          isLight ? "text-neutral-800 group-hover/quality:text-white" : "text-white group-hover/quality:text-white",
                                        )}>
                                          {q.label}
                                        </span>
                                      </div>
                                      <div className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        isLight ? "bg-neutral-100 group-hover/quality:bg-white/20" : "bg-white/10 group-hover/quality:bg-white/20"
                                      )}>
                                        <Download className="w-4 h-4 text-blue-500 group-hover/quality:text-white" />
                                      </div>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className={clsx(
                  "border rounded-3xl p-6 flex items-start gap-4 backdrop-blur-sm shadow-xl transition-colors",
                  isLight ? "bg-red-50/70 border-red-200 text-red-600" : "bg-red-500/10 border border-red-500/20 text-red-400"
                )}>
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-lg mb-1">
                      {result.error?.includes("Instagram blocks our cloud servers") ? "Action Required: API Key Missing" : (result.error?.toLowerCase().includes("unsupported") || result.message?.toLowerCase().includes("unsupported")) ? "Unsupported Website Link" : "Extraction Failed"}
                    </div>
                    <p className={clsx(
                      "leading-relaxed text-sm font-medium transition-colors mb-4",
                      isLight ? "text-red-600/90" : "text-red-400/80"
                    )}>
                      {result.error?.includes("Instagram blocks our cloud servers") 
                        ? "Instagram restricts automated requests from cloud hosting IP addresses like Render.com. To fix this on your live app, you must configure your RAPIDAPI_KEY in your Render environment variables."
                        : (result.error || result.message || "The URL link is unsupported, private, or being blocked by the origin servers.")}
                    </p>
                    {(result.thumbnail || result.title) && (
                      <div className={clsx(
                        "mt-4 p-4 rounded-xl border flex gap-4 items-center bg-black/20 group",
                        isLight ? "border-red-200" : "border-red-500/20"
                      )}>
                        {result.thumbnail && (
                          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group-hover:scale-110 transition-transform">
                            <img src={getProxiedUrl(result.thumbnail)} alt={result.title || "Media thumbnail"} className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Recovered Metadata</p>
                          {result.title && <p className="text-sm font-semibold line-clamp-2">{result.title}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut",
                  staggerChildren: 0.08
                }
              }
            }}
            className="w-full max-w-4xl mx-auto mt-12 flex flex-col gap-6 relative z-10"
          >
            <div className="text-center mb-4">
              <h3 className={clsx("text-lg font-bold tracking-tight mb-1", isLight ? "text-neutral-900" : "text-white")}>
                Supported Platforms
              </h3>
              <p className={clsx("text-xs font-medium opacity-60", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-400")}>
                Check which platforms are currently available for direct downloads
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              {TABS.map((tab) => {
                const details = getPlatformDetails(tab.id);
                const ping = platformPings[tab.id] || 60;
                
                // Set custom hover glow colors based on the platform id
                const getGlowClass = (id: Tab) => {
                  switch(id) {
                    case 'youtube': return 'hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] dark:hover:shadow-[0_0_25px_rgba(239,68,68,0.35)] hover:border-red-500/40';
                    case 'instagram': return 'hover:shadow-[0_0_20px_rgba(236,72,153,0.25)] dark:hover:shadow-[0_0_25px_rgba(236,72,153,0.35)] hover:border-pink-500/40';
                    case 'tiktok': return 'hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:border-cyan-500/40';
                    case 'facebook': return 'hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:border-blue-500/40';
                    case 'reddit': return 'hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] dark:hover:shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:border-orange-500/40';
                    case 'pinterest': return 'hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] dark:hover:shadow-[0_0_25px_rgba(220,38,38,0.35)] hover:border-red-600/40';
                    case 'x': return 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:border-white/20';
                    case 'linkedin': return 'hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:border-sky-500/40';
                    case 'snapchat': return 'hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] dark:hover:shadow-[0_0_25px_rgba(234,179,8,0.35)] hover:border-yellow-500/40';
                    case 'spotify': return 'hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] dark:hover:shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:border-green-500/40';
                    case 'threads': return 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:border-white/20';
                    default: return 'hover:shadow-md';
                  }
                };

                return (
                  <motion.div 
                    key={tab.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: { duration: 0.5, ease: "easeOut" }
                      }
                    }}
                    whileHover={{ 
                      y: -6, 
                      scale: 1.03,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                       setActiveTab(tab.id);
                       setResult(null);
                       setValidationError(null);
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={clsx(
                      "relative p-5 rounded-3xl border flex flex-col items-center justify-center gap-3.5 backdrop-blur-xl transition-all duration-300 overflow-hidden group/tile cursor-pointer select-none",
                      isLight 
                        ? "bg-white/40 border-neutral-200/50 shadow-sm shadow-neutral-100 hover:bg-white/70 hover:border-neutral-300 text-neutral-800" 
                        : "bg-neutral-900/40 border-white/[0.06] hover:bg-neutral-900/60 hover:border-white/15 shadow-2xl text-neutral-200",
                      getGlowClass(tab.id)
                    )}
                  >
                    {/* Visual Glass Reflection Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] opacity-0 group-hover/tile:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {tab.isNew && (
                      <div className="absolute top-3 right-3 z-20 pointer-events-none">
                        <NewBadge className="text-[8px] px-1.5 py-0.5 shadow-md" />
                      </div>
                    )}

                    {/* Logo wrapper for colorful 3D glass icon */}
                    <div className="transition-all duration-300 group-hover/tile:scale-110 select-none">
                      {render3DGlassIcon(tab.id)}
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <span className={clsx("text-xs font-bold tracking-tight", isLight ? "text-neutral-800" : "text-neutral-200")}>
                        {tab.name.replace(" Downloader", "")}
                      </span>
                      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 bg-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="tracking-wider uppercase">AVAILABLE</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

      </div>

      {/* Footer */}
      <footer className="mt-auto pt-20 pb-10 w-full max-w-7xl mx-auto px-4 relative z-10">
        <div className={clsx(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 mb-10 py-10 border-y", 
          isLight ? "border-neutral-200/60" : "border-white/10"
        )}>
          {TABS.map((tab) => (
            <Link 
              key={tab.id} 
              to={`/${tab.id}-downloader`}
              className={clsx(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1 text-sm font-medium transition-colors hover:-translate-y-0.5 transform duration-200 text-center sm:text-left leading-relaxed",
                isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"
              )}
            >
              <span>{tab.name}</span>
              {tab.isNew && <NewBadge />}
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm font-medium leading-loose text-center max-w-3xl mx-auto">
            <Link to="/about" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>About</Link>
            <Link to="/contact" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>Contact</Link>
            <Link to="/faq" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>FAQ</Link>
            <Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>Privacy Policy</Link>
            <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>Cookie Policy</Link>
            <Link to="/terms" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>Terms & Conditions</Link>
            <Link to="/dmca" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 dark:text-neutral-400 hover:text-white"}>DMCA</Link>
          </div>
          <p className={clsx(
            "text-sm font-medium transition-colors text-center mt-2 leading-relaxed px-4",
            isLight ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-600 dark:text-neutral-400"
          )}>
            All right reserved by @AURA-DOWNLOADER-APP<br/>MADE BY = MRIDUL ❤️
          </p>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxMediaList[lightboxIndex] && (() => {
          const activeItem = lightboxMediaList[lightboxIndex];
          const hasMultiple = lightboxMediaList.length > 1;

          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => {
              if (prev === null) return null;
              return (prev - 1 + lightboxMediaList.length) % lightboxMediaList.length;
            });
          };

          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => {
              if (prev === null) return null;
              return (prev + 1) % lightboxMediaList.length;
            });
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Top Navigation & Action Controls */}
              <div className="w-full flex items-center justify-between text-white z-10 py-2">
                <div className="flex flex-col max-w-[70%]">
                  <span className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-400 font-bold">
                    {hasMultiple ? `Asset ${lightboxIndex + 1} of ${lightboxMediaList.length}` : 'High Resolution Asset Preview'}
                  </span>
                  <div className="text-sm sm:text-base font-semibold truncate text-white/90">
                    {activeItem.title || "Social Media Attachment"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Download Direct Link Button */}
                  <button type="button"                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFileClientSide(activeItem.url, (activeItem.title || "download").slice(0, 30).trim() + "_preview" + (activeItem.type === "video" ? ".mp4" : ".jpg")); }}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title={`Download ${activeItem.type === 'image' ? 'Image' : activeItem.type === 'video' ? 'Video' : 'Media'}`}
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {/* Close Lightbox Button */}
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/25 hover:rotate-90 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Central Display Stage */}
              <div className="flex-1 w-full flex items-center justify-center relative">
                {/* Left Switch Button */}
                {hasMultiple && (
                  <button aria-label="Previous"
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/5 shadow-xl flex items-center justify-center backdrop-blur-sm group"
                  >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Media Component Body */}
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="max-w-full max-h-[75vh] flex items-center justify-center relative select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeItem.type === 'video' ? (
                    <video
                      src={getProxiedUrl(activeItem.url)}
                      poster={activeItem.thumbnail ? getProxiedUrl(activeItem.thumbnail) : undefined}
                      controls
                      autoPlay
                      playsInline
                      className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5"
                    />
                  ) : (
                    <img alt={activeItem.title || "Full size media preview"} src={getProxiedUrl(activeItem.url)}
                      className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                      }}
                    />
                  )}
                </motion.div>

                {/* Right Switch Button */}
                {hasMultiple && (
                  <button aria-label="Next"
                    onClick={handleNext}
                    className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all border border-white/5 shadow-xl flex items-center justify-center backdrop-blur-sm group"
                  >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* Bottom Instructions Info */}
              <div className="py-2 text-center text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                {hasMultiple ? "Tip: Use Arrow Keys (← / →) or click outside to dismiss" : "Tip: Click outside or press ESC to dismiss"}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scan {
          0% { transform: translateY(-10px); }
          50% { transform: translateY(195px); }
          100% { transform: translateY(-10px); }
        }
        .animate-scan {
          animation: scan 2.8s ease-in-out infinite;
        }
        .ultra-glass {
          background: linear-gradient(145deg, rgba(20, 20, 24, 0.65) 0%, rgba(10, 10, 12, 0.85) 100%);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow: 
            -30px 0 60px rgba(0, 0, 0, 0.7), 
            inset 1px 1px 0px rgba(255, 255, 255, 0.08),
            inset -1px -1px 0px rgba(255, 255, 255, 0.02);
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }
        .ambient-highlight {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
          z-index: 10;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}} />

      {/* Global Downloads HUD Overlay */}
      <AnimatePresence>
        {Object.keys(activeDownloads).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }} // Slide up from bottom
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={clsx(
              "fixed bottom-6 left-1/2 w-[90%] max-w-md border rounded-2xl p-4 shadow-2xl z-50 flex flex-col space-y-4",
              isLight ? "bg-white border-neutral-200" : "bg-[#1a1a1a] border-white/10"
            )}
          >
            {Object.entries(activeDownloads).map(([url, rawDl]) => {
              const dl = rawDl as { filename: string; progress: number | null; status: "preparing" | "downloading" | "complete" | "failed" };
              return (
                <div key={url} className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className={clsx(
                      "text-sm font-medium flex items-center space-x-2 truncate min-w-0 max-w-[70%]",
                      isLight ? "text-neutral-900" : "text-white"
                    )}>
                      {dl.status === "preparing" || dl.status === "downloading" ? (
                        <Loader2 className={clsx("w-4 h-4 animate-spin", isLight ? "text-neutral-600 dark:text-neutral-400" : "text-white/70")} />
                      ) : dl.status === "complete" ? (
                        <AnimatedCheckMark className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="truncate" title={dl.filename}>{dl.filename}</span>
                    </span>
                    <span className={clsx(
                      "text-xs font-mono shrink-0",
                      isLight ? "text-neutral-600 dark:text-neutral-400" : "text-white/80"
                    )}>
                      {dl.status === "preparing"
                        ? 'Fetching...'
                        : dl.status === "complete"
                          ? 'Done'
                          : dl.status === "failed"
                            ? 'Failed'
                            : dl.progress === -1 || dl.progress === null 
                              ? 'Fetching...' 
                              : `${dl.progress}%`}
                    </span>
                  </div>
                  
                  {/* Progress Track */}
                  <div className={clsx(
                    "relative w-full h-2 rounded-full overflow-hidden",
                    isLight ? "bg-neutral-200" : "bg-white/5"
                  )}>
                    {dl.status === "preparing" || (dl.status === "downloading" && (dl.progress === -1 || dl.progress === null)) ? (
                      // Indeterminate Infinite Animation
                      <motion.div 
                        className={clsx(
                          "absolute inset-y-0 left-0 w-1/2 rounded-full",
                          isLight ? "bg-neutral-800/40" : "bg-white/40"
                        )}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    ) : (
                      // Determinate Fill Animation
                      <motion.div 
                        className={clsx(
                          "absolute inset-y-0 left-0 rounded-full transition-colors",
                          dl.status === "complete" 
                            ? "bg-emerald-500"
                            : dl.status === "failed"
                              ? "bg-rose-500"
                              : isLight ? "bg-neutral-800" : "bg-white/80"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: dl.status === "complete" ? "100%" : `${dl.progress || 0}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            
            <button 
              type="button" 
              onClick={() => setActiveDownloads({})}
              className={clsx(
                "text-xs font-semibold hover:underline w-fit self-end mt-2 transition-opacity opacity-60 hover:opacity-100",
                isLight ? "text-neutral-600" : "text-white"
              )}
            >
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <ReloadPrompt isLight={isLight} />
      <NotificationRequest isLight={isLight} />
      <TermsModal 
        isOpen={showTermsModal} 
        isLight={isLight}
        onAccept={() => {
          localStorage.setItem('termsAccepted', 'true');
          setHasAcceptedTerms(true);
          setShowTermsModal(false);
        }}
        onDecline={() => {
          window.location.href = "about:blank";
        }}
      />

    </LazyMotion>

    </>
  );
}

const BrandIcon = ({ id, className = "" }: { id: Tab, className?: string }) => {
  switch (id) {
    case 'pinterest':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>;
    case 'youtube':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    case 'instagram':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>;
    case 'tiktok':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
    case 'facebook':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>;
    case 'reddit':
      return (
        <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Background Gradients */}
            <linearGradient id="rdBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A33" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
            
            <linearGradient id="rdBgHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* 3D drop shadow for Snoo */}
            <filter id="rdSnooShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="-2" dy="4" stdDeviation="3" floodColor="#992A00" floodOpacity="0.6" />
            </filter>

            {/* Snoo Mask */}
            <mask id="rdSnooMask">
              {/* Base head */}
              <g fill="#FFFFFF">
                <ellipse cx="50" cy="58" rx="28" ry="19" />
                <circle cx="21" cy="46" r="7.5" />
                <circle cx="79" cy="46" r="7.5" />
                {/* Antenna */}
                <path d="M50 40 V 27 Q 50 21 56 21 H 64" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
                <circle cx="66" cy="21" r="5.5" />
              </g>
              {/* Eyes (cut out) */}
              <circle cx="37" cy="56" r="4.5" fill="#000000" />
              <circle cx="63" cy="56" r="4.5" fill="#000000" />
              {/* Smile (cut out) */}
              <path d="M 38 65 Q 50 71 62 65" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            </mask>

            <linearGradient id="rdSnooGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EAEAEA" />
            </linearGradient>
          </defs>

          {/* Orange Circle Base */}
          <circle cx="50" cy="50" r="45" fill="url(#rdBg)" filter="drop-shadow(0 6px 12px rgba(255,69,0,0.4))" />
          <circle cx="50" cy="50" r="45" fill="url(#rdBgHighlight)" />
          
          {/* 3D Bevel Edge */}
          <circle cx="50" cy="50" r="43.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

          {/* Snoo Logo */}
          <rect x="0" y="0" width="100" height="100" fill="url(#rdSnooGrad)" mask="url(#rdSnooMask)" filter="url(#rdSnooShadow)" />
        </svg>
      );
    case 'x':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>;
    case 'linkedin':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
    case 'snapchat':
      return (
        <svg viewBox="4.5 4.5 91 91" className={className} style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="snap3dBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFC00" />
              <stop offset="100%" stopColor="#E3E000" />
            </linearGradient>
            
            <linearGradient id="snap3dHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="snap3dRightHighlight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            
            <filter id="snapGhostShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="-2" dy="3.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>
          
          {/* Main yellow squircle */}
          <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#snap3dBase)" filter="drop-shadow(0 4px 8px rgba(200,200,0,0.25))" />
          
          {/* Edge highlights for 3D effect */}
          <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#snap3dHighlight)" />
          <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#snap3dRightHighlight)" />
          
          {/* Inner stroke for bevel effect */}
          <rect x="6" y="6" width="88" height="88" rx="27" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          
          {/* The Ghost */}
          <g transform="translate(17.5, 17.5) scale(2.7)" filter="url(#snapGhostShadow)">
            <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" fill="#ffffff" stroke="#000000" strokeWidth="1.4" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case 'spotify':
      return <SpotifyIcon className={className} />;
    case 'threads':
      return <ThreadsIcon className={className} />;
    default:
      return null;
  }
};


const getBrandColor = (id: Tab, isLight: boolean) => {
  switch (id) {
    case 'pinterest': return '#E60023';
    case 'youtube': return '#FF0000';
    case 'instagram': return '#C13584';
    case 'tiktok': return isLight ? '#000000' : '#FFFFFF';
    case 'facebook': return '#1877F2';
    case 'reddit': return '#FF4500';
    case 'x': return isLight ? '#000000' : '#FFFFFF';
    case 'linkedin': return '#0077b5';
    case 'snapchat': return '#FFFC00';
    case 'spotify': return '#1DB954';
    case 'threads': return isLight ? '#000000' : '#FFFFFF';
    default: return isLight ? '#1a1a1a' : '#cccccc';
  }
};

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" />
  </svg>
);
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
  </svg>
);
export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
    <Routes>
      <Route path="/" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="/youtube-downloader" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/snapchat-downloader" element={<DownloaderView routeTab="snapchat" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/pinterest-downloader" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="/spotify-downloader" element={<DownloaderView routeTab="spotify" />} />
      <Route path="/threads-downloader" element={<DownloaderView routeTab="threads" />} />
      
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/dmca" element={<DMCA />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
