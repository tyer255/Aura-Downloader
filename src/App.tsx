import React, { useState, useEffect, useRef } from 'react';
import ReloadPrompt from './components/ReloadPrompt';
import NotificationRequest from './components/NotificationRequest';

import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError, CookiePolicy } from './pages/StaticPages';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2, AlertCircle, CheckCircle2, Youtube, History, Download, Film, Music, Tv, MessageSquare, Image as ImageIcon, Instagram, Facebook, ListVideo, User, X, ChevronLeft, ChevronRight, Maximize2, Copy, Check, Sparkles, Sun, Moon, QrCode, Star, Trash2, Upload, ExternalLink, Filter, Calendar, Lock, Archive, Linkedin, Twitter, Plus, Play, Pause, Activity, Scissors, Bookmark, ArrowRight, Share2, Camera, HelpCircle, Settings, DownloadCloud } from 'lucide-react';
import { m as motion, LazyMotion, domMax, AnimatePresence } from 'motion/react';
import { subscribeUserToPush } from './push';

import { DownloadResult } from './types';
import clsx from 'clsx';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import { requestNotificationPermission, showNotification } from './lib/notifications';
import { TermsModal } from './components/TermsModal';

function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl || /\.(mp4|webm|mkv|mov|avi)(\?|$)/i.test(thumbnailUrl)) return [];
  
  // Check if it's a YouTube thumbnail
  if (thumbnailUrl.includes('ytimg.com/vi/')) {
      const videoIdMatch = thumbnailUrl.match(/\/vi\/([^\/]+)\//);
      if (videoIdMatch && videoIdMatch[1]) {
          const videoId = videoIdMatch[1];
          return [
              { label: "4K / Original (Highest Quality)", url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, ext: "jpg" },
              { label: "Full HD (1080p)", url: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`, ext: "jpg" },
              { label: "HD (720p)", url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, ext: "jpg" },
              { label: "SD (480p)", url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, ext: "jpg" }
          ];
      }
  }
  
  // For other platforms, just return the original URL
  return [
      { label: "Original (Highest Quality)", url: thumbnailUrl, ext: "jpg" }
  ];
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
    url.includes('youtube.com') ||
    url.includes('ytimg.com') ||
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

type Tab = 'pinterest' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'x' | 'linkedin';

const TABS: { id: Tab; label: string; placeholder: string; name: string; description: string; title: string; keywords?: string }[] = [
  { id: 'pinterest', label: 'Pinterest', placeholder: 'Paste Pinterest Link Here', name: 'Pinterest Downloader', title: 'Aura Downloader - Download Pinterest Videos & Images Free', description: 'Best free Pinterest Downloader online. Download Pinterest videos, images, and GIFs in HD quality without watermark using Aura Downloader.', keywords: 'Aura Downloader, Pinterest downloader, download Pinterest video, Pinterest video downloader, Pinterest saver' },
  { id: 'youtube', label: 'YouTube', placeholder: 'Paste YouTube Link (Video, Short, Channel, Playlist)', name: 'YouTube Downloader', title: 'Aura Downloader - YouTube Downloader, Shorts & Reels Saver', description: 'Aura Downloader is the best free YouTube Downloader. Download YouTube videos, Shorts, and Reels in 1080p, 4K HD effortlessly.', keywords: 'Aura Downloader, YouTube downloader, YouTube Shorts downloader, YouTube Reel downloader, download YouTube video, YouTube to mp3' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Paste Instagram Link Here', name: 'Instagram Downloader', title: 'Aura Downloader - Instagram Reels & Video Downloader', description: 'Free online Instagram Downloader by Aura Downloader. Download Instagram reels, photos, videos, IGTV, and stories in high quality easily.', keywords: 'Aura Downloader, Instagram downloader, download Instagram video, Instagram reels downloader, Instagram story saver' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'Paste TikTok Link Here', name: 'TikTok Downloader', title: 'Aura Downloader - TikTok Downloader Without Watermark', description: 'Best free TikTok Downloader. Download TikTok videos without watermark in HD quality using Aura Downloader.', keywords: 'Aura Downloader, TikTok downloader, download TikTok video, TikTok no watermark, TikTok video downloader' },
  { id: 'facebook', label: 'Facebook', placeholder: 'Paste Facebook Link Here', name: 'Facebook Downloader', title: 'Aura Downloader - Download Facebook Videos & Reels Free', description: 'Free online Facebook Video Downloader by Aura Downloader. Download Facebook reels and videos in HD quality to your device fast and easily.', keywords: 'Aura Downloader, Facebook downloader, download Facebook video, Facebook reels downloader, FB video downloader' },
  { id: 'reddit', label: 'Reddit', placeholder: 'Paste Reddit Link Here', name: 'Reddit Downloader', title: 'Aura Downloader - Download Reddit Videos With Audio', description: 'Free Reddit Video Downloader. Download Reddit videos with sound in HD quality with Aura Downloader.', keywords: 'Aura Downloader, Reddit downloader, download Reddit video with audio, Reddit video saver' },
  { id: 'x', label: 'X (Twitter)', placeholder: 'Paste X / Twitter Link Here', name: 'X / Twitter Downloader', title: 'Aura Downloader - Download Twitter Videos & GIFs Free', description: 'Best free X (Twitter) Downloader. Download videos, GIFs, and media from tweets in HD quality quickly and securely with Aura Downloader.', keywords: 'Aura Downloader, Twitter downloader, X downloader, download Twitter video, save tweet video' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Paste LinkedIn Post Link Here', name: 'LinkedIn Downloader', title: 'Aura Downloader - Download LinkedIn Videos Free', description: 'Free online LinkedIn Video Downloader. Download LinkedIn videos, images, and documents in high quality directly to your device with Aura Downloader.', keywords: 'Aura Downloader, LinkedIn downloader, download LinkedIn video, LinkedIn video saver' },
];

const detectPlatformFromUrl = (url: string): Tab | null => {
  const lowercase = url.trim().toLowerCase();
  if (!lowercase) return null;
  
  if (lowercase.includes('pinterest.com') || lowercase.includes('pin.it')) {
    return 'pinterest';
  }
  if (lowercase.includes('instagram.com') || lowercase.includes('instagr.am')) {
    return 'instagram';
  }
  if (lowercase.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.watch') || lowercase.includes('fb.com')) {
    return 'facebook';
  }
  if (lowercase.includes('reddit.com') || lowercase.includes('redd.it')) {
    return 'reddit';
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercase.includes('x.com') || lowercase.includes('twitter.com')) {
    return 'x';
  }
  if (lowercase.includes('linkedin.com')) {
    return 'linkedin';
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
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rdBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5700" />
              <stop offset="100%" stopColor="#cc3300" />
            </linearGradient>
            <linearGradient id="rdGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="rdInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
            <linearGradient id="rd3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#rdBaseGrad)" filter="drop-shadow(0 6px 12px rgba(255,87,0,0.35))" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#rdInnerShadow)" />
          <g transform="translate(26, 26) scale(1.6)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))">
            <path d="M 29.5 16 c 0 -2 -1.5 -3.5 -3.5 -3.5 c -0.9 0 -1.6 0.3 -2.2 0.8 c -3 -1.8 -6.9 -3 -11.3 -3.2 l 2 -6.2 l 5.2 1.1 c 0.1 1.5 1.4 2.8 3 2.8 c 1.7 0 3 -1.3 3 -3 c 0 -1.7 -1.3 -3 -3 -3 c -1.4 0 -2.6 1 -2.9 2.3 l -5.8 -1.2 c -0.2 0 -0.4 0.1 -0.5 0.3 l -2.3 7 c -4.5 0.2 -8.5 1.4 -11.5 3.2 c -0.6 -0.5 -1.4 -0.8 -2.2 -0.8 c -2 0 -3.5 1.5 -3.5 3.5 c 0 1.4 0.9 2.6 2.1 3.1 c -0.1 0.5 -0.1 1 -0.1 1.6 c 0 6 8.3 11 18.5 11 s 18.5 -5 18.5 -11 c 0 -0.5 0 -1 -0.1 -1.6 c 1.3 -0.5 2.2 -1.7 2.2 -3.1 z m -25.2 9 c 0 -1.4 1.1 -2.5 2.5 -2.5 s 2.5 1.1 2.5 2.5 s -1.1 2.5 -2.5 2.5 s -2.5 -1.1 -2.5 -2.5 z m 10 4 c -2.2 2.2 -6.2 2.2 -8.4 0 c -0.3 -0.3 -0.3 -0.7 0 -0.9 c 0.3 -0.3 0.7 -0.3 0.9 0 c 1.7 1.7 5 1.7 6.6 0 c 0.3 -0.3 0.7 -0.3 0.9 0 c 0.3 0.2 0.3 0.7 0 0.9 z m 0.8 -4 c 0 -1.4 1.1 -2.5 2.5 -2.5 s 2.5 1.1 2.5 2.5 s -1.1 2.5 -2.5 2.5 s -2.5 -1.1 -2.5 -2.5 z" fill="url(#rd3dGrad)" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#rdGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
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
        colorClass: 'text-neutral-500',
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

  useEffect(() => {
    if (fetched || loading) return;
    
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
            setQualities(data.qualities);
            if (data.qualities.length > 0) {
              setSelectedQuality(data.qualities[0].url);
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

  return (
    <div ref={containerRef} className={clsx("p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center shadow border transition-all", isLight ? "bg-white border-neutral-200" : "bg-white/5 border-white/10")}>
       <img src={item.thumbnail} alt="thumbnail" className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-lg shrink-0 bg-black" />
       <div className="flex-1 min-w-0 w-full text-left">
         <h4 className={clsx("font-bold truncate text-sm sm:text-base", isLight ? "text-neutral-900" : "text-white")} title={item.title}>{item.title}</h4>
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
                   <option key={i} value={q.url}>{q.label} {q.size && q.size !== 'Original' && q.size !== 'Unknown' ? `(${q.size})` : ''}</option>
                ))}
              </select>
            ) : fetched ? (
              <span className="text-xs text-red-500">Failed to load</span>
            ) : null}
         </div>
       </div>
       <button
         disabled={loading || !qualities || qualities.length === 0 || (activeDownload && activeDownload.status !== 'failed')}
         onClick={() => onDownloadQueue(selectedQuality, (item.title || "video").slice(0, 30).trim() + ".mp4")}
         className={clsx(
           "w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md", 
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
function CopyButton({ url, className, isLight }: { url: string; className?: string; isLight?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
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
function QRCodeButton({ url, className, isLight }: { url: string; className?: string; isLight?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    try {
      const qrcodeLib = await import('qrcode');
      const dataUrl = await (qrcodeLib.default || qrcodeLib).toDataURL(url, {
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
      await navigator.clipboard.writeText(url);
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
                  isLight ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100" : "text-neutral-400 hover:text-white hover:bg-white/10"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              <QrCode className="w-8 h-8 text-[#ff1e42] mb-2" />
              <h3 className="text-lg font-extrabold mb-1 tracking-tight">Scan for Mobile Access</h3>
              <p className={clsx("text-xs text-center mb-6 max-w-[250px] leading-relaxed", isLight ? "text-neutral-500" : "text-neutral-400")}>
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
                <span className={clsx("text-[10px] uppercase font-black tracking-wider block mb-1.5", isLight ? "text-neutral-400" : "text-neutral-500")}>
                  Target Direct Link:
                </span>
                <div className="flex gap-2">
                  <div className={clsx(
                    "flex-1 p-2.5 rounded-xl text-xs font-mono truncate select-all border",
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-600" : "bg-black/40 border-white/5 text-neutral-400"
                  )}>
                    {url}
                  </div>
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
      setValidationError({
        title: "Platform Mismatch Detected",
        message: `This URL belongs to ${getTabLabel(detected)}. It won't work correctly on the ${getTabLabel(currentActive)} downloader.`,
        targetTab: detected,
        targetTabName: getTabLabel(detected)
      });
    } else {
      setValidationError(null);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DownloadResult | null>(null);
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
  
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Prev',
      showButtons: ['next', 'previous', 'close'],
      steps: [
        { element: '#tour-tabs', popover: { title: 'Select Platform', description: 'First, choose the platform you want to download from (e.g., Pinterest).', side: "bottom", align: 'start' } },
        { element: '#tour-input', popover: { title: 'Paste Link', description: 'Paste the link of the video or image you want to download.', side: "bottom", align: 'start' } },
        { 
          element: '#tour-search-button', 
          popover: { 
            title: 'Search', 
            description: 'Click the search button to fetch the media.', 
            side: "bottom", align: 'start',
            onNextClick: () => {
              // Mock a result to show the next steps
              setResult({
                success: true,
                title: "Example Media Result",
                mediaType: "video",
                url: "https://example.com/video.mp4",
                thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500",
                qualities: [
                  { label: "HD Video", url: "https://example.com/video.mp4", ext: "mp4", size: "10 MB" }
                ]
              });
              setTimeout(() => {
                driverObj.moveNext();
              }, 300);
            }
          } 
        },
        { element: '#tour-results', popover: { title: 'Check Results', description: 'Check the results at the bottom.', side: "top", align: 'start' } },
        { element: '#tour-direct-download', popover: { title: 'Direct Download', description: 'Click this button for an instant direct download from the source.', side: "top", align: 'start' } },
        { element: '#tour-regular-download', popover: { title: 'Wait a bit', description: 'Click this button to download through our secure server if the direct download fails.', side: "top", align: 'start' } },
      ],
      onDestroyStarted: () => {
        localStorage.setItem('hasSeenTour', 'true');
        setResult(null);
        driverObj.destroy();
        
        // After tour completes, show terms modal if they haven't accepted
        if (!localStorage.getItem('termsAccepted')) {
          setShowTermsModal(true);
        }
      }
    });
    driverObj.drive();
  };

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour();
      }, 1000);
    } else {
      // If they have already seen the tour but haven't accepted terms (returning user before this feature was added)
      if (!localStorage.getItem('termsAccepted')) {
        setShowTermsModal(true);
      }
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
    linkedin: 88
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

  const getYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    if (!navigator.onLine) {
      alert("PLEASE CONNECT YOUR NETWORK FIRST THAN RETRY");
      return;
    }

    if (!url.trim()) return;

    requestNotificationPermission();

    // Check platform matching before proceeding
    const detected = detectPlatformFromUrl(url);
    if (detected && detected !== activeTab) {
      setValidationError({
        title: "Platform Mismatch Detected",
        message: `This URL belongs to ${getTabLabel(detected)}. It won't work correctly on the ${getTabLabel(activeTab)} downloader.`,
        targetTab: detected,
        targetTabName: getTabLabel(detected)
      });
      return;
    }

    
    setLoadingStep(0);
    setIsLoading(true);
    setResult(null);

    // Default multi-platform downloader
    try {
      const detectedPlatform = detectPlatformFromUrl(url.trim()) || activeTab;

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await res.json();
      
      // Override for broken profiles to prevent ugly empty UI without touching backend logic
      if (data.mediaType === 'profile' && !data.profile?.avatarUrl && !data.profile?.bannerUrl && (!data.profile?.displayName || data.profile?.displayName === "Social Media Post" || data.profile?.displayName.includes("404") || data.profile?.displayName.includes("Not Found"))) {
        data.success = false;
        data.error = "Could not fetch profile metadata. The handle may be incorrect, or the page is blocking access.";
      }
      
      setResult(data);
      
      if (data.success) {
        const titleText = data.profile 
          ? `Profile: @${data.profile.username}` 
          : (data.title || 'Media Download');
        const detectedPlatform = detectPlatformFromUrl(url.trim()) || activeTab;
        const newEntry = { 
          url: url.trim(), 
          title: titleText, 
          timestamp: Date.now(), 
          platform: detectedPlatform,
          favorite: false,
          thumbnail: data.thumbnail || (data.media && data.media.length > 0 ? (data.media[0].thumbnail || data.media[0].url) : undefined) || data.profile?.avatarUrl,
          appName: TABS.find(t => t.id === detectedPlatform)?.name || 'Unknown'
        };
        const newHistory = [newEntry, ...history.filter(h => h.url !== url.trim())].slice(0, 50);
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
      }, 300);
    }
  };

  
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);


  const downloadFileClientSide = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    try {
      requestNotificationPermission();
      setDownloadProgress(0);
      setHistoryToast("Preparing download stream...");

      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: 0, status: "preparing" }
      }));

      const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
        ? url 
        : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const throttleParam = throttleSetting !== "unlimited" ? `&throttle=${throttleSetting}` : "";
      const finalFetchUrl = fetchUrl.includes("?") ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;
      
      const response = await fetch(finalFetchUrl);
      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: 0, status: "downloading" }
      }));

      const contentLength = response.headers.get('content-length') || response.headers.get('estimated-content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body stream reader available");

      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            const pct = Math.round((loaded / total) * 100);
            setDownloadProgress(pct);
            setActiveDownloads(prev => ({
              ...prev,
              [url]: { filename, progress: pct, status: "downloading" }
            }));
          } else {
            setActiveDownloads(prev => ({
              ...prev,
              [url]: { filename, progress: null, status: "downloading" }
            }));
          }
        }
      }

      const blob = new Blob(chunks);
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      setDownloadProgress(null);
      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: 100, status: "complete" }
      }));
      setHistoryToast("Download complete!");
      setTimeout(() => setHistoryToast(null), 3000);
      showNotification("Download Complete", {
        body: `Successfully downloaded: ${filename}`,
        icon: '/vite.svg'
      });

      // Keep it complete for 3.5s then clear
      setTimeout(() => {
        setActiveDownloads(prev => {
          const next = { ...prev };
          delete next[url];
          return next;
        });
      }, 3500);

    } catch (error: any) {
      console.error('Download setup failed:', error);
      setDownloadProgress(null);
      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: null, status: "failed" }
      }));
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
      showNotification("Download Failed", {
        body: `Failed to download: ${filename}`,
        icon: '/vite.svg'
      });

      setTimeout(() => {
        setActiveDownloads(prev => {
          const next = { ...prev };
          delete next[url];
          return next;
        });
      }, 4000);
    }
  };

  const downloadFileDirect = (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    try {
      requestNotificationPermission();
      setHistoryToast("Direct download started instantly...");
      setTimeout(() => setHistoryToast(null), 3000);

      const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
        ? url 
        : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const throttleParam = throttleSetting !== "unlimited" ? `&throttle=${throttleSetting}` : "";
      const finalFetchUrl = fetchUrl.includes("?") ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;

      const a = document.createElement('a');
      a.href = finalFetchUrl;
      a.download = filename;
      a.target = "_blank"; // Safely streams without interrupting page
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
    result.media.forEach((item, index) => {
      setTimeout(() => {
        downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item_" + (index + 1) + (item.type === "video" ? ".mp4" : ".jpg"));
      }, index * 600); // delay to prevent overwhelming
    });
  };

  const [downloadingPlaylist, setDownloadingPlaylist] = useState(false);
  const handleDownloadAllPlaylists = async () => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    if (!result || result.mediaType !== 'playlist' || !result.media) return;
    setDownloadingPlaylist(true);
    triggerHistoryToast("Fetching best qualities and downloading...");
    for (let i = 0; i < result.media.length; i++) {
      const item = result.media[i];
      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url })
        });
        const data = await res.json();
        if (data.success && data.qualities && data.qualities.length > 0) {
           const bestQuality = data.qualities[0].url;
           await new Promise<void>((resolve) => {
             downloadFileClientSide(bestQuality, (result.title || "playlist").slice(0, 30).trim() + "_item_" + (i + 1) + ".mp4");
             setTimeout(resolve, 1500);
           });
        }
      } catch (e) {
        console.error("Failed to extract for playlist item", i);
      }
    }
    setDownloadingPlaylist(false);
    triggerHistoryToast("Playlist download complete");
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
        <meta property="og:image" content={window.location.origin + "/banner.jpg"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={activeTabData.title} />
        <meta property="twitter:description" content={activeTabData.description} />
        <meta property="twitter:image" content={window.location.origin + "/banner.jpg"} />
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
           <h1 className={clsx(
               "text-base sm:text-lg font-black tracking-tight uppercase",
               isLight ? "text-neutral-900" : "text-white"
           )}>AURA Downloader</h1>
        </div>
        </div>
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
                "px-3 sm:px-4 h-11 rounded-full flex items-center justify-center transition-all border shadow-md font-bold text-xs sm:text-sm gap-2 uppercase tracking-wide cursor-pointer",
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
                    <p className="text-xs text-white/40 mt-0.5">{history.length} recent activities</p>
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
                    className="text-white/40 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all p-2.5 rounded-full hover:rotate-90 duration-300 cursor-pointer"
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
                      <p className="text-sm text-white/40 max-w-[220px] leading-relaxed">
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
                              className="p-1.5 rounded-full transition-colors cursor-pointer text-white/40 hover:text-red-400 hover:bg-white/5"
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
                            }}
                            className="text-left cursor-pointer flex-1 flex gap-3 mt-1 items-center"
                          >
                            {item.thumbnail && (
                              <div className="w-12 h-12 rounded-lg bg-neutral-950 shrink-0 overflow-hidden border border-white/10 shadow-sm relative group-hover/item:scale-105 transition-transform">
                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm line-clamp-1 transition-colors text-white/90 hover:text-white group-hover/item:underline decoration-white/30">
                                {item.appName ? `${item.appName} - ` : ''}{item.title}
                              </h4>
                              <p className="text-[11px] text-white/40 font-mono truncate mt-0.5 select-all">
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
                  default: return 'shadow-md';
                }
              };

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
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
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative",
                    isActive 
                      ? isLight 
                        ? "text-white" 
                        : "text-black"
                      : isLight
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-neutral-400 hover:text-white"
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
                  <span className="relative z-10">{tab.label}</span>
                </button>
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

            {/* Hero Area */}
            <h1 className={clsx(
              "text-4xl sm:text-5xl leading-[1.1] font-bold mb-6 transition-colors",
              isLight ? "text-neutral-900" : "text-white"
            )}>
              Free <span className="text-primary">{activeTabData.name}</span>
            </h1>
            <p className={clsx(
              "text-[1.1rem] leading-relaxed max-w-xl mx-auto mb-16 transition-colors",
              isLight ? "text-neutral-600" : "text-neutral-400"
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
                    <AlertCircle className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base tracking-tight mb-0.5 truncate">{validationError.title}</h4>
                      <p className={clsx("text-xs font-medium leading-relaxed break-words", isLight ? "text-neutral-600" : "text-neutral-400")}>
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
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-70" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-400 disabled:opacity-70"
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
                    <button
                      key={tab.id}
                      type="button"
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
                        color: isActive ? (tab.id === 'tiktok' || tab.id === 'x' ? (isLight ? '#fff' : '#000') : '#fff') : brandColor,
                        borderColor: isActive ? brandColor : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                        ...(isActive ? { "--tw-ring-color": brandColor } as React.CSSProperties : {})
                      }}
                    >
                      <BrandIcon id={tab.id} className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
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
                            <p className={clsx("text-[10px] font-medium opacity-60", isLight ? "text-neutral-500" : "text-neutral-400")}>
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
                            <div className="w-10 h-10 rounded-full bg-neutral-200/50 dark:bg-white/5 flex items-center justify-center mb-2.5 text-neutral-400">
                              <Plus className="w-5 h-5 rotate-45" />
                            </div>
                            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                              Your Link Vault is currently empty.
                            </p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-sm mt-1 leading-relaxed">
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
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                  <Loader2 className={clsx("w-8 h-8 animate-spin", isLight ? "text-neutral-400" : "text-white/20")} />
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
                  isLight ? "text-neutral-500" : "text-white/50"
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
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Followers</p>
                            </div>
                          )}
                          {result.profile.following && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.following}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Following</p>
                            </div>
                          )}
                          {result.profile.postsCount && (
                            <div>
                              <span className={clsx("text-xl sm:text-2xl font-black transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                                {result.profile.postsCount}
                              </span>
                              <p className={clsx("text-xs uppercase tracking-wider mt-0.5", isLight ? "text-neutral-500" : "text-neutral-400")}>Posts</p>
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
                                  <img src={getProxiedUrl(result.profile.avatarUrl)} alt="Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" width="400" height="400" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Profile Logo</h4>
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
                                  <CopyButton url={result.profile.avatarUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                  <QRCodeButton url={result.profile.avatarUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
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
                                  <img src={getProxiedUrl(result.profile.bannerUrl)} alt="Banner" className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"  loading="lazy" decoding="async" />
                                </div>
                                <div className="mt-2">
                                  <h4 className={clsx("font-extrabold text-lg sm:text-xl", isLight ? "text-neutral-900" : "text-white")}>Cover Banner</h4>
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
                                  <CopyButton url={result.profile.bannerUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                  <QRCodeButton url={result.profile.bannerUrl} isLight={isLight} className="w-full sm:flex-1 px-4 py-3.5 rounded-xl text-sm justify-center backdrop-blur-md" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* PLAYLIST TEMPLATE */}
                  {result.mediaType === 'playlist' && result.media && result.media.length > 0 && (
                    <div className="space-y-6">
                      <div className={clsx(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl backdrop-blur-md border transition-colors",
                        isLight ? "bg-white border-neutral-200 shadow-md" : "bg-white/5 border border-white/10"
                      )}>
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold text-sm tracking-wide">PLAYLIST READY</span>
                          </div>
                          <h3 className={clsx("text-xl font-bold line-clamp-1 transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.title || "YouTube Playlist"}
                          </h3>
                          <p className={clsx("text-xs transition-colors mt-1", isLight ? "text-neutral-500" : "text-neutral-400")}>
                            {result.media.length} videos extracted
                          </p>
                        </div>
                        <button 
                          onClick={handleDownloadAllPlaylists}
                          disabled={downloadingPlaylist}
                          className={clsx(
                            "px-6 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 text-sm shrink-0 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed",
                            isLight ? "bg-neutral-950 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black shadow-white/10"
                          )}
                        >
                          {downloadingPlaylist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                          {downloadingPlaylist ? "Downloading..." : "Download All Playlists"}
                        </button>
                      </div>

                      <div className="flex flex-col gap-4">
                        {result.media.map((item, index) => (
                          <PlaylistItem 
                            key={index}
                            item={item}
                            index={index}
                            isLight={isLight}
                            onDownloadQueue={(url: string, filename: string) => {
                               downloadFileClientSide(url, filename);
                            }}
                            activeDownloads={activeDownloads} 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CAROUSEL / COMMUNITY MULTI-PHOTO TEMPLATE */}
                  {result.mediaType === 'carousel' && result.media && result.media.length > 0 && (
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
                          <p className={clsx("text-xs transition-colors mt-1", isLight ? "text-neutral-500" : "text-neutral-400")}>
                            {result.media.length} items extracted from URL link
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
                        {result.media.map((item, index) => (
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
                                if (result.media) {
                                  const list = result.media.map((m, i) => ({
                                    url: m.url,
                                    type: m.type,
                                    title: `${result.title || 'Media'} - Item #${i + 1}`
                                  }));
                                  setLightboxMediaList(list);
                                  setLightboxIndex(index);
                                }
                              }}
                            >
                              {item.type === 'video' ? (
                                <div className="w-full h-full relative">
                                  {item.thumbnail ? (
                                    <img src={getProxiedUrl(item.thumbnail)} alt={`Video slide ${index + 1}`} className="w-full h-full object-cover opacity-80"  loading="lazy" decoding="async" width="400" height="400" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                      <Film className="w-10 h-10 text-neutral-600" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Tv className="w-8 h-8 text-white/80 animate-pulse animate-duration-1000" />
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={getProxiedUrl(item.url)} 
                                  alt={`Image slide ${index + 1}`} 
                                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
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
                                  <div className="space-y-1.5">
                                    <button 
                                      type="button"                                     
                                      onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                      disabled={!!activeDlItem && activeDlItem.status !== "complete" && activeDlItem.status !== "failed"}
                                      className={clsx(
                                        "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed",
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
                                  </div>
                                ) : (
                                  <button 
                                    type="button"                                   
                                    onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.jpg"); }}
                                    disabled={!!activeDlItem && activeDlItem.status !== "complete" && activeDlItem.status !== "failed"}
                                    className={clsx(
                                      "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider disabled:cursor-not-allowed",
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
                                <CopyButton url={item.url} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />
                                <QRCodeButton url={item.url} isLight={isLight} className="w-full sm:flex-1 rounded-xl px-3 py-2.5 text-xs justify-center" />
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* STANDARD SINGLE FILE TEMPLATE */}
                  {result.mediaType !== 'profile' && result.mediaType !== 'carousel' && (
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
                              className="px-2 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider"
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
                            className="w-full h-full object-cover opacity-90 group-hover/thumb:scale-105 group-hover/thumb:opacity-100 transition-all duration-300"
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
                            isLight ? "text-neutral-600 bg-neutral-100/50 border-neutral-200" : "text-neutral-400 bg-black/10 border-white/5"
                          )}>
                            {result.description}
                          </p>
                        )}
                        {result.qualities && result.qualities.length > 0 ? (
                          <div className="flex flex-col gap-4 w-full">
                            <div className={clsx("border-t pt-4 mt-1 transition-colors", isLight ? "border-neutral-200" : "border-white/10")}>
                              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <span className="text-xs uppercase tracking-widest text-emerald-500 font-bold">
                                  Available Video Quality Formats:
                                </span>
                                <span className="text-[10px] opacity-60 flex items-center gap-1 font-medium">
                                  <Sparkles className="w-3 h-3 text-emerald-500" /> Click 
                                  <ExternalLink className="w-2.5 h-2.5 inline mx-0.5" /> for instant browser download
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {result.qualities.map((q, idx) => {
                                  const activeDl = activeDownloads[q.url];
                                  const filename = (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\s+/g, "_") + "." + (q.ext || "mp4");
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
                                            isLight ? "text-neutral-500 group-hover/quality:text-white/80" : "text-neutral-400 group-hover/quality:text-white/80",
                                            activeDl && "text-emerald-600 dark:text-emerald-400 font-medium"
                                          )}>
                                            {activeDl 
                                              ? activeDl.status === "preparing"
                                                ? "Preparing stream (fetching URL)..."
                                                : activeDl.status === "downloading"
                                                  ? activeDl.progress !== null ? `Downloading in background (${activeDl.progress}%)` : "Downloading stream..."
                                                  : activeDl.status === "complete"
                                                    ? "Saved successfully!"
                                                    : "Extraction failed"
                                              : q.size || "Standard Quality"
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
                                            ? "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-white hover:bg-[#ff1e42]" 
                                            : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-[#ff1e42]"
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
                                <CopyButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                                <QRCodeButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3 rounded-full text-xs" />
                              </div>
                            )}
                          </div>
                        ) : result.url ? (() => {
                          const activeDl = activeDownloads[result.url];
                          const filename = (result.title || "download") + (result.mediaType === "image" ? ".jpg" : ".mp4");
                          return (
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center w-full">
                              <button type="button"
                                id="tour-regular-download"
                                onClick={(e) => { e.preventDefault(); downloadFileClientSide(result.url, filename); }}
                                disabled={!!activeDl && activeDl.status !== "complete" && activeDl.status !== "failed"}
                                className={clsx(
                                  "flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl uppercase tracking-wider text-sm cursor-pointer disabled:cursor-not-allowed",
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
                                      {activeDl.status === "preparing" 
                                        ? "Preparing stream..." 
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
                                    Download Media File
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

                              <CopyButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm" />
                              <QRCodeButton url={result.url} isLight={isLight} className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm" />
                            </div>
                          );
                        })() : null}
                        
                        {/* Thumbnail Download Section */}
                        {result.thumbnail && getThumbnailQualities(result.thumbnail).length > 0 && (
                          <div className={clsx("mt-6 border-t pt-4 transition-colors w-full", isLight ? "border-neutral-200" : "border-white/10")}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="w-full sm:w-1/3 flex-shrink-0">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10 relative">
                                  <img 
                                    src={getProxiedUrl(result.thumbnail)} 
                                    alt="Thumbnail preview" 
                                    className="w-full h-full object-cover"
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
                    <h4 className="font-bold text-lg mb-1">Extraction Failed</h4>
                    <p className={clsx(
                      "leading-relaxed text-sm font-medium transition-colors mb-4",
                      isLight ? "text-red-600/90" : "text-red-400/80"
                    )}>
                      {result.error || result.message || "The URL link is unsupported, private, or being blocked by the origin servers."}
                    </p>
                    {(result.thumbnail || result.title) && (
                      <div className={clsx(
                        "mt-4 p-4 rounded-xl border flex gap-4 items-center bg-black/20",
                        isLight ? "border-red-200" : "border-red-500/20"
                      )}>
                        {result.thumbnail && (
                          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10">
                            <img src={getProxiedUrl(result.thumbnail)} alt="Thumbnail" className="w-full h-full object-cover"  loading="lazy" decoding="async" width="400" height="400" />
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
              <p className={clsx("text-xs font-medium opacity-60", isLight ? "text-neutral-500" : "text-neutral-400")}>
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
                "flex items-center justify-center sm:justify-start px-2 py-1 text-sm font-medium transition-colors hover:-translate-y-0.5 transform duration-200 text-center sm:text-left leading-relaxed",
                isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm font-medium leading-loose text-center max-w-3xl mx-auto">
            <Link to="/about" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>About</Link>
            <Link to="/contact" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Contact</Link>
            <Link to="/faq" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>FAQ</Link>
            <Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>
            <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Cookie Policy</Link>
            <Link to="/terms" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Terms & Conditions</Link>
            <Link to="/dmca" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>DMCA</Link>
          </div>
          <p className={clsx(
            "text-sm font-medium transition-colors text-center mt-2 leading-relaxed px-4",
            isLight ? "text-neutral-500" : "text-neutral-500"
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
                  <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                    {hasMultiple ? `Asset ${lightboxIndex + 1} of ${lightboxMediaList.length}` : 'High Resolution Asset Preview'}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold truncate text-white/90">
                    {activeItem.title || "Social Media Attachment"}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {/* Download Direct Link Button */}
                  <button type="button"                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFileClientSide(activeItem.url, (activeItem.title || "download").slice(0, 30).trim() + "_preview" + (activeItem.type === "video" ? ".mp4" : ".jpg")); }}
                    className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 shadow-lg flex items-center justify-center"
                    title="Download Media File"
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
                    <img                       src={getProxiedUrl(activeItem.url)}
                      alt={activeItem.title || "Full Resolution Preview"}
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
              <div className="py-2 text-center text-xs text-neutral-500 font-medium">
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
                        <Loader2 className={clsx("w-4 h-4 animate-spin", isLight ? "text-neutral-500" : "text-white/70")} />
                      ) : dl.status === "complete" ? (
                        <AnimatedCheckMark className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="truncate" title={dl.filename}>{dl.filename}</span>
                    </span>
                    <span className={clsx(
                      "text-xs font-mono shrink-0",
                      isLight ? "text-neutral-500" : "text-white/50"
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
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"/></svg>;
    case 'x':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>;
    case 'linkedin':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
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
    default: return isLight ? '#1a1a1a' : '#cccccc';
  }
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DownloaderView routeTab="pinterest" />} />
      <Route path="/youtube-downloader" element={<DownloaderView routeTab="youtube" />} />
      <Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/pinterest-downloader" element={<DownloaderView routeTab="pinterest" />} />
      
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
  );
}
