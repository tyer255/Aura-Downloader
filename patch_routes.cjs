const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const oldRoutes = `<Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />
      <Route path="/snapchat-downloader" element={<DownloaderView routeTab="snapchat" />} />`;

const newRoutes = `<Route path="/instagram-downloader" element={<DownloaderView routeTab="instagram" />} />
      <Route path="/snapchat-downloader" element={<DownloaderView routeTab="snapchat" />} />
      <Route path="/tiktok-downloader" element={<DownloaderView routeTab="tiktok" />} />
      <Route path="/facebook-downloader" element={<DownloaderView routeTab="facebook" />} />
      <Route path="/reddit-downloader" element={<DownloaderView routeTab="reddit" />} />
      <Route path="/x-downloader" element={<DownloaderView routeTab="x" />} />
      <Route path="/linkedin-downloader" element={<DownloaderView routeTab="linkedin" />} />`;

if (appContent.includes(oldRoutes)) {
  appContent = appContent.replace(oldRoutes, newRoutes);
  fs.writeFileSync('src/App.tsx', appContent);
  console.log("Patched routes successfully.");
} else {
  console.log("Could not find routes string.");
}
