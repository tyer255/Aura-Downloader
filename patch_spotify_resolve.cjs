const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  app.get("/api/spotify-resolve", async (req, res) => {
    try {
      let trackId = (req.query.trackId as string) || "";
      let title = (req.query.title as string) || (req.query.trackName as string) || "";
      let artist = (req.query.artist as string) || (req.query.artistName as string) || "";
      let artistsParam = (req.query.artists as string) || "";
      let durationMs = parseInt((req.query.durationMs as string) || (req.query.duration as string) || "0") || 0;
      let isrc = (req.query.isrc as string) || "";
      const query = (req.query.query as string) || "";

      // Check if query itself contains a Spotify track URL or trackId
      if (!trackId && query) {
        const urlMatch = query.match(/track[\\/:]([a-zA-Z0-9]+)/);
        if (urlMatch && urlMatch[1]) {
          trackId = urlMatch[1];
        }
      }

      let allArtists: string[] = artistsParam ? artistsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (artist && !allArtists.includes(artist)) {
        allArtists.unshift(artist);
      }

      let albumName = "";

      // If trackId is available, fetch complete details from Spotify to guarantee 100% accuracy
      if (trackId) {
        const details = await getSpotifyTrackDetails(trackId);
        if (details.trackName) {
          title = details.trackName;
          artist = details.primaryArtist || artist;
          allArtists = details.allArtists.length > 0 ? details.allArtists : allArtists;
          albumName = details.albumName || "";
          isrc = details.isrc || isrc;
          durationMs = details.durationMs || durationMs;
        }
      }

      // Fallback if title is missing but query was passed
      if (!title && query) {
        title = query.replace(/\\s*(full song|official audio|audio)\\s*/gi, '').trim();
      }

      // If title or query is still missing, return error
      if (!title && !trackId) {
        return res.status(400).json({ success: false, message: "Missing track identifiers or query" });
      }

      const videoId = await resolveSpotifyTrackToYouTube({
        trackName: title,
        primaryArtist: artist,
        allArtists: allArtists.length > 0 ? allArtists : [artist],
        albumName,
        isrc,
        durationMs
      });

      if (!videoId) {
        return res.status(404).json({ success: false, message: "Could not resolve Spotify audio track" });
      }

      const videoUrl = \`https://www.youtube.com/watch?v=\${videoId}\`;
      const { ytmp3 } = await import("@vreden/youtube_scraper");

      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {}; console.log = () => {};

      let result;
      try {
        result = await ytmp3(videoUrl);
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }

      let finalAudioUrl = "";
      if (result && result.status && result.download && result.download.url) {
        finalAudioUrl = result.download.url;
      } else {
        finalAudioUrl = \`/api/proxy-download?url=\${encodeURIComponent(videoUrl)}\`;
      }

      if (req.query.stream === 'true') {
        if (finalAudioUrl.startsWith("http")) {
          return res.redirect(302, finalAudioUrl);
        } else {
          return pipeUrlStream(finalAudioUrl, res, "spotify_audio.mp3", true);
        }
      }

      return res.json({ success: true, url: finalAudioUrl, videoId });
    } catch(e: any) {
      return res.status(500).json({ success: false, message: "Extraction failed. Please try again later." });
    }
  });`;

const replacement = `  app.get("/api/spotify-resolve", async (req, res) => {
    const isSSE = req.query.sse === 'true';
    if (isSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }
    const sendProgress = (percent: number, msg: string) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify({ progress: percent, message: msg })}\\n\\n\`);
      }
    };
    const sendError = (msg: string) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify({ success: false, message: msg })}\\n\\n\`);
        res.end();
      } else {
        res.status(500).json({ success: false, message: msg });
      }
    }
    const sendSuccess = (data: any) => {
      if (isSSE) {
        res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
        res.end();
      } else {
        res.json(data);
      }
    }

    try {
      sendProgress(10, "Initializing...");

      let trackId = (req.query.trackId as string) || "";
      let title = (req.query.title as string) || (req.query.trackName as string) || "";
      let artist = (req.query.artist as string) || (req.query.artistName as string) || "";
      let artistsParam = (req.query.artists as string) || "";
      let durationMs = parseInt((req.query.durationMs as string) || (req.query.duration as string) || "0") || 0;
      let isrc = (req.query.isrc as string) || "";
      const query = (req.query.query as string) || "";

      // Check if query itself contains a Spotify track URL or trackId
      if (!trackId && query) {
        const urlMatch = query.match(/track[\\/:]([a-zA-Z0-9]+)/);
        if (urlMatch && urlMatch[1]) {
          trackId = urlMatch[1];
        }
      }

      let allArtists: string[] = artistsParam ? artistsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (artist && !allArtists.includes(artist)) {
        allArtists.unshift(artist);
      }

      let albumName = "";

      sendProgress(25, "Resolving metadata...");

      // Optimization: Only fetch details if title is completely missing
      // If we already have the title and artist from the previous extract step, we don't need to re-fetch NEXT_DATA
      if (trackId && !title) {
        const details = await getSpotifyTrackDetails(trackId);
        if (details.trackName) {
          title = details.trackName;
          artist = details.primaryArtist || artist;
          allArtists = details.allArtists.length > 0 ? details.allArtists : allArtists;
          albumName = details.albumName || "";
          isrc = details.isrc || isrc;
          durationMs = details.durationMs || durationMs;
        }
      }

      // Fallback if title is missing but query was passed
      if (!title && query) {
        title = query.replace(/\\s*(full song|official audio|audio)\\s*/gi, '').trim();
      }

      // If title or query is still missing, return error
      if (!title && !trackId) {
        return sendError("Missing track identifiers or query");
      }

      sendProgress(40, "Matching tracks...");

      const videoId = await resolveSpotifyTrackToYouTube({
        trackName: title,
        primaryArtist: artist,
        allArtists: allArtists.length > 0 ? allArtists : [artist],
        albumName,
        isrc,
        durationMs
      });

      if (!videoId) {
        return sendError("Could not resolve Spotify audio track");
      }

      sendProgress(65, "Extracting audio...");

      const videoUrl = \`https://www.youtube.com/watch?v=\${videoId}\`;
      const { ytmp3 } = await import("@vreden/youtube_scraper");

      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = () => {}; console.log = () => {};

      let result;
      try {
        result = await ytmp3(videoUrl);
      } catch(e) {} finally {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }

      sendProgress(95, "Finalizing extraction...");

      let finalAudioUrl = "";
      if (result && result.status && result.download && result.download.url) {
        finalAudioUrl = result.download.url;
      } else {
        finalAudioUrl = \`/api/proxy-download?url=\${encodeURIComponent(videoUrl)}\`;
      }

      sendProgress(100, "Done!");

      if (req.query.stream === 'true') {
        if (finalAudioUrl.startsWith("http")) {
          // not compatible with SSE, but stream parameter isn't used with SSE right now
          return res.redirect(302, finalAudioUrl);
        } else {
          return pipeUrlStream(finalAudioUrl, res, "spotify_audio.mp3", true);
        }
      }

      return sendSuccess({ success: true, url: finalAudioUrl, videoId });
    } catch(e: any) {
      return sendError("Extraction failed. Please try again later.");
    }
  });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts with SSE support for spotify-resolve!");
} else {
  console.log("Target not found!");
}
