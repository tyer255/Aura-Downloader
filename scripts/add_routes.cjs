const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importStatement = "import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError } from './pages/StaticPages';";
content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + importStatement);

const routes = `<Routes>
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
      <Route path="*" element={<NotFound />} />
    </Routes>`;

const oldRoutesRegex = /<Routes>[\s\S]*?<\/Routes>/;
content = content.replace(oldRoutesRegex, routes);

fs.writeFileSync('src/App.tsx', content);
