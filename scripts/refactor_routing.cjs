const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add imports
if (!content.includes('react-router-dom')) {
  content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';\nimport { Helmet } from 'react-helmet-async';");
}

// Rename export default function App() to function DownloaderView({ routeTab }: { routeTab?: Tab })
content = content.replace('export default function App() {', 'function DownloaderView({ routeTab }: { routeTab?: Tab }) {\n  const navigate = useNavigate();');

// Update activeTab initialization
content = content.replace("const [activeTab, setActiveTab] = useState<Tab>('pinterest');", "const [activeTab, setActiveTab] = useState<Tab>(routeTab || 'pinterest');\n  \n  useEffect(() => {\n    if (routeTab) setActiveTab(routeTab);\n  }, [routeTab]);");

// Add Helmet logic right inside DownloaderView return
const helmetCode = `
      <Helmet>
        <title>{activeTabData.name} | Social Downloader</title>
        <meta name="description" content={activeTabData.description} />
        <meta property="og:title" content={\`\${activeTabData.name} | Social Downloader\`} />
        <meta property="og:description" content={activeTabData.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
`;
content = content.replace('<div className={clsx(', helmetCode + '\n    <div className={clsx(');

// Now, handle the onClick for tabs. We need to find where activeTab is set.
// It's probably `onClick={() => setActiveTab(tab.id)}` or similar.
content = content.replace(/onClick=\{\(\) => setActiveTab\(tab.id\)\}/g, "onClick={() => navigate(tab.id === 'pinterest' ? '/' : `/${tab.id}-downloader`)}");
// Just in case it's setActiveTab(...)
content = content.replace(/setActiveTab\(item.platform\)/g, "navigate(item.platform === 'pinterest' ? '/' : `/${item.platform}-downloader`)");
content = content.replace(/setActiveTab\(detected\)/g, "navigate(detected === 'pinterest' ? '/' : `/${detected}-downloader`)");


// Create the new export default function App
const appCode = `
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
      <Route path="*" element={<DownloaderView routeTab="pinterest" />} />
    </Routes>
  );
}
`;

content += '\n' + appCode;

fs.writeFileSync('src/App.tsx', content);
