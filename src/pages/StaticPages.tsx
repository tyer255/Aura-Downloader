import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';
import { StaticPageView } from '../components/StaticPageView';

function useThemeState() {
  const [isLight, setIsLight] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored !== null) return stored === 'light';
      return true;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [isLight]);

  return { isLight, setIsLight };
}

export function PrivacyPolicy() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Privacy Policy" {...theme}>
      <h2 className="text-xl font-bold mb-4 mt-6">1. Introduction</h2>
      <p className="mb-4">Welcome to Aura Downloader. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">2. Data We Collect</h2>
      <p className="mb-4">We do not collect any personal data or store any videos you download through our service. The service acts merely as a proxy to fetch public content from supported platforms. All downloads are processed temporarily and are not retained on our servers.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">3. Cookies</h2>
      <p className="mb-4">We use local storage strictly for functional purposes, such as remembering your theme preference (Light or Dark mode) and maintaining your recent download history locally on your device. We do not use tracking cookies.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">4. Children's Privacy</h2>
      <p className="mb-4">The service is not directed at children under 13 (or applicable minimum age), and does not knowingly collect data from children.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">5. Changes to this Policy</h2>
      <p className="mb-4">The policy may be updated from time to time, with the revision date posted on the page.</p>
    </StaticPageView>
  );
}

export function TermsConditions() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Terms & Conditions" {...theme}>
      <h2 className="text-xl font-bold mb-4 mt-6">1. Acceptance of Terms</h2>
      <p className="mb-4">By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">2. Use License</h2>
      <p className="mb-4">This tool is designed to allow users to download content for personal, non-commercial use only. You are solely responsible for ensuring you have the right to download and use the media you process through this site.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">3. Disclaimer</h2>
      <p className="mb-4">The materials on Aura Downloader are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">4. User Responsibilities</h2>
      <p className="mb-4">Users must comply with the Terms of Service of the platform they are downloading from (YouTube, Instagram, Pinterest, TikTok, etc.). Users must not use the service to download, redistribute, or commercially exploit copyrighted material without permission from the rights holder.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">5. Age restriction</h2>
      <p className="mb-4">Users must be at least 13 years old (or the minimum legal age in their country) to use this service.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">6. Limitation of Liability</h2>
      <p className="mb-4">The service is not liable for any direct, indirect, incidental, or consequential damages arising from use of the service, including copyright or legal claims arising from content downloaded by users.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">7. Modification of Service</h2>
      <p className="mb-4">The company reserves the right to modify, suspend, or discontinue the service at any time without prior notice.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">8. Governing Law</h2>
      <p className="mb-4">These Terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts of Jaipur, India.</p>
    </StaticPageView>
  );
}

export function DMCA() {
  const theme = useThemeState();
  return (
    <StaticPageView title="DMCA Policy" {...theme}>
      <h2 className="text-xl font-bold mb-4 mt-6">Digital Millennium Copyright Act Notice</h2>
      <p className="mb-4">Aura Downloader respects the intellectual property rights of others. We do not host any copyrighted media on our servers. Our tool simply extracts direct links to media files already hosted on public servers of third-party platforms.</p>
      
      <p className="mb-4">If you are a copyright owner and believe that any content accessed through our service infringes upon your copyrights, please note that we cannot remove content from third-party platforms (like YouTube, TikTok, Instagram, etc.). You must contact the respective platform to have the content removed at the source.</p>
      
      <p className="mb-4">However, if you wish to block our tool from processing URLs leading to your copyrighted material, you may send a DMCA notice to our legal/DMCA email address at <strong>mridulnareda56@gmail.com</strong>, and we will implement filters to prevent downloading from those specific URLs. Please include: identification of the copyrighted work, the specific URL(s) processed through the tool, your contact information, and a good-faith statement.</p>
    </StaticPageView>
  );
}

export function About() {
  const theme = useThemeState();
  return (
    <StaticPageView title="About Us" {...theme}>
      <p className="mb-4 text-lg">Aura Downloader is a premium, fast, and secure media downloading utility.</p>
      <p className="mb-4">Our mission is to provide users with a simple and reliable way to save their favorite videos, photos, and audio clips from various social media platforms directly to their devices for offline viewing.</p>
      <p className="mb-4">Built with modern web technologies, our downloader ensures the highest quality media extraction without requiring any software installation or user registration.</p>
    </StaticPageView>
  );
}

export function Contact() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Contact Us" {...theme}>
      <p className="mb-4">Have questions, suggestions, or experiencing issues with our downloader? We'd love to hear from you.</p>
      <div className="p-6 border rounded-xl bg-black/5 dark:bg-white/5 my-6">
        <h3 className="font-bold text-lg mb-2">Support Channel</h3>
        <p className="mb-4">For the fastest response, please reach out to us via our official YouTube channel.</p>
        <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors mb-6">
          Visit Our YouTube Channel
        </a>
        <h3 className="font-bold text-lg mb-2">Email Contact</h3>
        <p className="mb-2">Email: <a href="mailto:mridulnareda56@gmail.com" className="text-blue-500 hover:underline">mridulnareda56@gmail.com</a></p>
        <p>Legal / DMCA inquiries: <a href="mailto:mridulnareda56@gmail.com" className="text-blue-500 hover:underline">mridulnareda56@gmail.com</a></p>
      </div>
    </StaticPageView>
  );
}

export function FAQ() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Frequently Asked Questions" {...theme}>

      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "Is this service free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Aura Downloader is 100% free to use with no hidden fees or subscriptions."
                }
              }, {
                "@type": "Question",
                "name": "Are there any download limits?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, you can download as many videos and images as you want."
                }
              }, {
                "@type": "Question",
                "name": "Why is my download not working?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Some videos might be private, restricted, or deleted. Make sure the URL is correct and the post is publicly accessible."
                }
              }, {
                "@type": "Question",
                "name": "Do you store my downloaded files?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, we do not store any files on our servers. All processing is done on-the-fly and files are delivered directly to your device."
                }
              }]
            }
          `}
        </script>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-1">Is this service free to use?</h3>
          <p className="opacity-80">Yes, Aura Downloader is 100% free to use with no hidden fees or subscriptions.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">Are there any download limits?</h3>
          <p className="opacity-80">No, you can download as many videos and images as you want.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">Why is my download not working?</h3>
          <p className="opacity-80">Some videos might be private, restricted, or deleted. Make sure the URL is correct and the post is publicly accessible.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">Do you store my downloaded files?</h3>
          <p className="opacity-80">No, we do not store any files on our servers. All processing is done on-the-fly and files are delivered directly to your device.</p>
        </div>
      </div>
    </StaticPageView>
  );
}

export function NotFound() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Page Not Found" {...theme}>
      <div className="text-center py-12">
        <h2 className="text-6xl font-black mb-4 opacity-20">404</h2>
        <p className="text-xl font-medium mb-8">Oops! The page you are looking for doesn't exist.</p>
      </div>
    </StaticPageView>
  );
}

export function ServerError() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Server Error" {...theme}>
      <div className="text-center py-12">
        <h2 className="text-6xl font-black mb-4 opacity-20">500</h2>
        <p className="text-xl font-medium mb-8">Something went wrong on our end. Please try again later.</p>
      </div>
    </StaticPageView>
  );
}

export function CookiePolicy() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Cookie Policy" {...theme}>
      <h2 className="text-xl font-bold mb-4 mt-6">1. What are Cookies?</h2>
      <p className="mb-4">Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or improve their efficiency, as well as to provide information to the owners of the site.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">2. How We Use Cookies</h2>
      <p className="mb-4">Our service relies on local storage rather than traditional tracking cookies. We use local storage strictly for functional reasons, such as saving your theme preference (Light/Dark mode) and keeping track of your recent downloads locally on your browser.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">3. Third-Party Cookies</h2>
      <p className="mb-4">We do not use any third-party tracking, advertising, or analytics cookies on this platform. Your data remains private and is not shared with external services.</p>
    </StaticPageView>
  );
}
