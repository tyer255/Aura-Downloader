const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const spotifyExtractorCode = `
async function extractSpotify(url: string) {
    try {
        const isPlaylist = url.includes('/playlist/');
        const embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        const axios = (await import('axios')).default;
        
        const res = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const nextMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\\/json">(.*?)<\\/script>/);
        if (!nextMatch) return { success: false, message: 'Spotify extraction failed: No data found' };
        
        const json = JSON.parse(nextMatch[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        
        if (!entity) return { success: false, message: 'Spotify data not found in page' };
        
        if (isPlaylist) {
            const tracks = entity.trackList || [];
            let media: any[] = [];
            for (let t of tracks) {
                if (!t.title) continue;
                const trackName = t.title;
                const artistName = t.subtitle || (t.artists && t.artists[0] ? t.artists[0].name : "");
                const thumb = t.image?.[0]?.url || entity.visualIdentity?.image?.[0]?.url || "";
                
                const query = \`\${trackName} \${artistName} audio\`;
                const resolveUrl = \`/api/spotify-resolve?query=\${encodeURIComponent(query)}\`;
                
                media.push({
                    type: "audio",
                    url: resolveUrl,
                    thumbnail: thumb,
                    title: trackName + (artistName ? \` - \${artistName}\` : ""),
                    qualities: [
                        { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: query }
                    ]
                });
            }
            return {
                success: true,
                mediaType: 'playlist',
                title: entity.name || "Spotify Playlist",
                thumbnail: entity.visualIdentity?.image?.[0]?.url || "",
                source: "spotify",
                media: media
            };
        } else {
            const trackName = entity.title || entity.name;
            const artistName = entity.artists?.[0]?.name || "";
            const thumb = entity.visualIdentity?.image?.[0]?.url || "";
            const query = \`\${trackName} \${artistName} audio\`;
            const resolveUrl = \`/api/spotify-resolve?query=\${encodeURIComponent(query)}\`;
            
            return {
                success: true,
                mediaType: 'audio',
                title: trackName + (artistName ? \` - \${artistName}\` : ""),
                thumbnail: thumb,
                source: "spotify",
                qualities: [
                    { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: query }
                ]
            };
        }
    } catch(e: any) {
        return { success: false, message: e.message };
    }
}
`;

const extractWithAITarget = `export async function extractWithAI(url: string, isProfile: boolean): Promise<any> {`;

code = code.replace(extractWithAITarget, spotifyExtractorCode + '\n' + extractWithAITarget);

const addSpotifyToRace = `        if (rapidKey) {            try {`;

const raceSpotifyTarget = `        console.log("Racing " + racePromises.length + " extractors for speed...");`;

const raceSpotifyCode = `        if (platform === 'spotify') {
            console.log("Spotify URL detected, using Spotify extractor...");
            racePromises.push(extractSpotify(trimmedUrl));
        }

        console.log("Racing " + racePromises.length + " extractors for speed...");`;

code = code.replace(raceSpotifyTarget, raceSpotifyCode);

const endpointTarget = `  app.get("/api/get-youtube-link", async (req, res) => {`;
const endpointCode = `  app.get("/api/spotify-resolve", async (req, res) => {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ success: false, message: "Missing query" });
    try {
        const YouTube = (await import('youtube-sr')).default;
        const ytRes = await YouTube.searchOne(query);
        if (!ytRes || !ytRes.id) {
            return res.status(404).json({ success: false, message: "Could not find audio on YouTube" });
        }
        const videoUrl = \`https://www.youtube.com/watch?v=\${ytRes.id}\`;
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
        if (result && result.status && result.download && result.download.url) {
            return res.json({ success: true, url: result.download.url });
        } else {
            return res.status(500).json({ success: false, message: "Failed to fetch direct audio URL." });
        }
    } catch(e: any) {
        return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/get-youtube-link", async (req, res) => {`;

code = code.replace(endpointTarget, endpointCode);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with Spotify extractor");
