import React from 'react';
import clsx from 'clsx';
import { Tab } from '../types';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export function PlatformContent({ activeTab, isLight }: { activeTab: Tab; isLight: boolean }) {
  const contentMap: Record<Tab, React.ReactNode> = {
    pinterest: <PinterestContent isLight={isLight} />,
    youtube: <YouTubeContent isLight={isLight} />,
    instagram: <InstagramContent isLight={isLight} />,
    snapchat: <SnapchatContent isLight={isLight} />,
    tiktok: <TikTokContent isLight={isLight} />,
    facebook: <FacebookContent isLight={isLight} />,
    reddit: <RedditContent isLight={isLight} />,
    x: <XContent isLight={isLight} />,
    linkedin: <LinkedInContent isLight={isLight} />,
    spotify: <SpotifyContent isLight={isLight} />,
    threads: <ThreadsContent isLight={isLight} />
  };

  return (
    <div className={clsx("w-full max-w-4xl mx-auto mt-16 px-4 text-left", isLight ? "text-neutral-700" : "text-neutral-300")}>
      {contentMap[activeTab]}
      <EEATSection isLight={isLight} />
    </div>
  );
}

function EEATSection({ isLight }: { isLight: boolean }) {
  return (
    <div className={clsx("mt-16 p-6 sm:p-8 rounded-2xl border", isLight ? "bg-neutral-50 border-neutral-200" : "bg-white/5 border-white/10")}>
      <h3 className={clsx("text-lg font-bold mb-4", isLight ? "text-neutral-900" : "text-white")}>About Aura Downloader</h3>
      <p className="text-sm leading-relaxed mb-4">
        Aura Downloader is an independent, free utility tool created to help users save their favorite moments from social media platforms for offline viewing. We believe in providing a fast, secure, and privacy-focused experience. 
      </p>
      <div className="flex flex-col sm:flex-row gap-6 text-sm">
        <div className="flex-1">
          <strong className={clsx("block mb-1", isLight ? "text-neutral-900" : "text-white")}>Transparency & Privacy</strong>
          <ul className="list-disc pl-4 space-y-1 opacity-80">
            <li>No user data or downloaded files are stored on our servers.</li>
            <li>All processing happens on-the-fly and is strictly confidential.</li>
            <li>We do not track your download history.</li>
          </ul>
        </div>
        <div className="flex-1">
          <strong className={clsx("block mb-1", isLight ? "text-neutral-900" : "text-white")}>Trust & Security</strong>
          <ul className="list-disc pl-4 space-y-1 opacity-80">
            <li>100% free with no hidden subscriptions.</li>
            <li>Fully encrypted HTTPS connection.</li>
            <li>Regularly updated to support the latest platform changes.</li>
            <li>Last Updated: <time dateTime={new Date().toISOString()}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</time></li>
          </ul>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-inherit text-xs opacity-60">
        <p>Disclaimer: Aura Downloader is not affiliated with, endorsed, or sponsored by YouTube, Instagram, TikTok, Facebook, Twitter, Pinterest, or any other platform. Users are solely responsible for ensuring they have the right to download and use the media according to the respective platform's terms of service and copyright laws. Do not download copyrighted materials without permission.</p>
      </div>
    </div>
  );
}
// Platform components will follow...

const headingClass = (isLight: boolean) => clsx("text-2xl font-bold mt-8 mb-4", isLight ? "text-neutral-900" : "text-white");
const subHeadingClass = (isLight: boolean) => clsx("text-lg font-bold mt-6 mb-3", isLight ? "text-neutral-800" : "text-neutral-100");
const textClass = "leading-relaxed mb-4 text-[15px]";
const listClass = "list-disc pl-5 space-y-2 mb-6 text-[15px]";

function YouTubeContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "How to download YouTube videos in 1080p?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Simply copy the YouTube video link, paste it into Aura Downloader, and select the 1080p MP4 option from the download list."
                }
              }, {
                "@type": "Question",
                "name": "Can I download YouTube Shorts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Aura Downloader fully supports downloading YouTube Shorts in high quality. Just paste the Short link."
                }
              }]
            }
          `}
        </script>
      </Helmet>
      <h2 className={headingClass(isLight)}>The Best Free YouTube Video Downloader</h2>
      <p className={textClass}>Aura Downloader is a premium, high-speed YouTube Video Downloader that lets you save your favorite videos, Shorts, and Reels directly to your device for offline viewing. Whether you need educational content, music videos, or podcasts, our tool extracts the highest available quality—up to 4K and 1080p HD—completely free.</p>
      
      <h3 className={subHeadingClass(isLight)}>Why Use Our YouTube Downloader?</h3>
      <ul className={listClass}>
        <li><strong>High Definition Quality:</strong> Download videos in crisp 1080p, 4K (when available), or choose lower resolutions to save data.</li>
        <li><strong>YouTube Shorts Support:</strong> Easily save trending YouTube Shorts without installing extra apps.</li>
        <li><strong>No Watermarks:</strong> Keep the original video quality exactly as the creator uploaded it.</li>
        <li><strong>Fast & Secure:</strong> Lightning-fast conversion and download speeds over a secure, encrypted connection.</li>
      </ul>

      <h3 className={subHeadingClass(isLight)}>How to Download YouTube Videos & Shorts</h3>
      <ol className={clsx("list-decimal pl-5 space-y-2 mb-6 text-[15px]")}>
        <li>Open the YouTube app or website and find the video or Short you want to save.</li>
        <li>Tap the <strong>Share</strong> button and select <strong>Copy Link</strong>.</li>
        <li>Paste the copied link into the search box above.</li>
        <li>Wait a moment for Aura Downloader to fetch the video details.</li>
        <li>Select your preferred quality and format (MP4 or MP3) and click Download.</li>
      </ol>

      <p className={textClass}>Also check out our <Link to="/instagram-downloader" className="text-primary hover:underline font-medium">Instagram Downloader</Link> and <Link to="/tiktok-downloader" className="text-primary hover:underline font-medium">TikTok Downloader</Link> for more social media content.</p>
    </article>
  );
}

function InstagramContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "How do I download Instagram Reels?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Copy the share link of the Instagram Reel, paste it into Aura Downloader, and click download to get the MP4 file."
                }
              }, {
                "@type": "Question",
                "name": "Can I download private Instagram videos?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, Aura Downloader only supports public Instagram accounts to respect user privacy."
                }
              }]
            }
          `}
        </script>
      </Helmet>
      <h2 className={headingClass(isLight)}>Free Instagram Reels, Video & Photo Downloader</h2>
      <p className={textClass}>Discover the easiest way to save content from Instagram. Aura Downloader's Instagram Downloader is built to handle Reels, IGTV videos, timeline posts, and carousel images seamlessly. No login required, no watermarks—just high-quality downloads straight to your phone or computer.</p>
      
      <h3 className={subHeadingClass(isLight)}>Features of Our Instagram Saver</h3>
      <ul className={listClass}>
        <li><strong>Reels Downloader:</strong> Save those viral, short-form Reels with their original audio track intact.</li>
        <li><strong>Photo & Carousel Downloader:</strong> Extract full-resolution photos from single posts or multi-image carousels.</li>
        <li><strong>Anonymous Browsing:</strong> Download public content without needing an Instagram account or logging in.</li>
      </ul>

      <h3 className={subHeadingClass(isLight)}>Step-by-Step Guide to Saving Instagram Media</h3>
      <ol className={clsx("list-decimal pl-5 space-y-2 mb-6 text-[15px]")}>
        <li>Open Instagram and navigate to the post, Reel, or photo.</li>
        <li>Tap the three dots (options) or the share icon and select <strong>Copy Link</strong>.</li>
        <li>Paste the link into the Aura Downloader input field above.</li>
        <li>Choose the video or image you wish to save and tap download.</li>
      </ol>
    </article>
  );
}

function TikTokContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>TikTok Video Downloader Without Watermark</h2>
      <p className={textClass}>Aura Downloader provides a powerful TikTok Downloader that allows you to save TikTok videos in high-definition without the intrusive platform watermark. Perfect for creators, editors, and anyone who wants a clean copy of their favorite viral trends.</p>
      
      <h3 className={subHeadingClass(isLight)}>Why Remove the TikTok Watermark?</h3>
      <p className={textClass}>Downloading TikToks via the official app adds a bouncing watermark and end-screen logo. Our tool extracts the raw MP4 video directly from TikTok's servers, giving you a clean file ideal for repurposing, sharing on other networks like <Link to="/youtube-downloader" className="text-primary hover:underline font-medium">YouTube Shorts</Link>, or personal archiving.</p>
      
      <h3 className={subHeadingClass(isLight)}>How to Download TikToks Without Watermark</h3>
      <ol className={clsx("list-decimal pl-5 space-y-2 mb-6 text-[15px]")}>
        <li>Find the video on the TikTok app or website.</li>
        <li>Tap the <strong>Share</strong> arrow on the right side of the screen.</li>
        <li>Tap <strong>Copy Link</strong>.</li>
        <li>Paste it here on Aura Downloader and select the "No Watermark" HD video option.</li>
      </ol>
    </article>
  );
}

function FacebookContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Facebook Video & Reels Downloader in HD</h2>
      <p className={textClass}>Aura Downloader is your go-to Facebook Downloader for saving FB Videos, Watch clips, and Facebook Reels. Whether it's a funny clip, a tutorial, or a live stream recording, our tool helps you store it locally in HD (1080p, 720p) or standard definition.</p>
      <h3 className={subHeadingClass(isLight)}>Key Benefits</h3>
      <ul className={listClass}>
        <li><strong>Facebook Reels Support:</strong> Easily save short-form Facebook Reels.</li>
        <li><strong>Multiple Resolutions:</strong> Choose between HD and SD qualities based on your device storage and data limits.</li>
        <li><strong>Private Video Note:</strong> Please ensure the Facebook post is set to "Public". Private group videos or restricted profiles cannot be accessed.</li>
      </ul>
    </article>
  );
}

function PinterestContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Free Pinterest Video, GIF & Image Downloader</h2>
      <p className={textClass}>Pinterest is a treasure trove of inspiration. With Aura Downloader's Pinterest Downloader, you can easily save high-resolution images, animated GIFs, and Story Pins directly to your gallery. Build your mood boards offline and never lose a great idea.</p>
      <h3 className={subHeadingClass(isLight)}>How to Save from Pinterest</h3>
      <ol className={clsx("list-decimal pl-5 space-y-2 mb-6 text-[15px]")}>
        <li>Open the Pinterest pin you love.</li>
        <li>Click the Share icon or the three dots and select <strong>Copy Link</strong>.</li>
        <li>Paste the pin link above to extract the original high-quality media file.</li>
      </ol>
    </article>
  );
}


function RedditContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Reddit Video Downloader with Audio</h2>
      <p className={textClass}>Downloading videos from Reddit can be tricky because Reddit often separates the video and audio streams. Aura Downloader solves this by automatically merging the high-quality video track with the audio track, delivering a perfect MP4 file ready for playback.</p>
      <h3 className={subHeadingClass(isLight)}>Features</h3>
      <ul className={listClass}>
        <li><strong>Audio Included:</strong> Never deal with silent Reddit videos again.</li>
        <li><strong>Supports v.redd.it:</strong> Seamlessly handles Reddit's native video hosting.</li>
        <li><strong>GIF Downloads:</strong> Save Reddit GIFs as standard MP4s or GIF files.</li>
      </ul>
    </article>
  );
}

function XContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Twitter (X) Video & GIF Downloader</h2>
      <p className={textClass}>Save breaking news, viral memes, and engaging content from X (formerly Twitter). The official app doesn't allow video downloads, but Aura Downloader's Twitter Video Downloader makes it simple to extract MP4 videos and GIFs from any public tweet.</p>
      <h3 className={subHeadingClass(isLight)}>How it works</h3>
      <p className={textClass}>Just click the share icon on the tweet, select "Copy link to Tweet", and paste it here. We'll provide options to download the video in various bitrates and resolutions.</p>
    </article>
  );
}

function LinkedInContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>LinkedIn Video Downloader for Professionals</h2>
      <p className={textClass}>Archive important webinars, professional presentations, and insightful video posts from your LinkedIn feed. Our LinkedIn Downloader extracts the video file in high quality so you can watch offline, reference materials for your career, or share with colleagues.</p>
    </article>
  );
}

function SnapchatContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Snapchat Spotlight & Story Downloader</h2>
      <p className={textClass}>Save hilarious snaps and viral Spotlight videos using the Aura Downloader Snapchat tool. While Snapchat is built on ephemeral content, sometimes you find a Spotlight video you just have to keep. Paste the public share link to download it safely to your device.</p>
    </article>
  );
}

function SpotifyContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Spotify Track Cover & Canvas Downloader</h2>
      <p className={textClass}>Extract high-resolution album art, track covers, and the looping Canvas videos from your favorite Spotify tracks. Just paste the Spotify track or album link to preview and download the visual media associated with the music.</p>
      <p className={textClass}><em>Note: This tool downloads the visual assets (album covers, canvas videos) from public Spotify links. It does not download copyrighted audio tracks.</em></p>
    </article>
  );
}

function ThreadsContent({ isLight }: { isLight: boolean }) {
  return (
    <article>
      <h2 className={headingClass(isLight)}>Threads Video & Image Downloader</h2>
      <p className={textClass}>Meta's Threads app is growing fast. Keep up with the conversation by downloading engaging videos, GIFs, and images from public Threads posts. Fast, free, and optimized for mobile devices.</p>
    </article>
  );
}
