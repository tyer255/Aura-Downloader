const axios = require('axios');

async function extractSpotify(url) {
    try {
        const isPlaylist = url.includes('/playlist/');
        const embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        
        const res = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const nextMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!nextMatch) return { success: false, message: 'Spotify extraction failed' };
        
        const json = JSON.parse(nextMatch[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        
        if (!entity) return { success: false, message: 'Spotify data not found' };
        
        if (isPlaylist) {
            const tracks = entity.trackList || [];
            let media = [];
            for (let t of tracks) {
                if (!t.title) continue;
                const trackName = t.title;
                const artistName = t.subtitle || (t.artists && t.artists[0] ? t.artists[0].name : "");
                const thumb = t.image?.[0]?.url || entity.visualIdentity?.image?.[0]?.url || "";
                media.push({
                    type: "audio",
                    url: "spotify_placeholder",
                    thumbnail: thumb,
                    title: trackName + (artistName ? ` - ${artistName}` : ""),
                    qualities: [
                        { label: "MP3 Audio", ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName} audio` }
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
            return {
                success: true,
                mediaType: 'audio',
                title: trackName + (artistName ? ` - ${artistName}` : ""),
                thumbnail: entity.visualIdentity?.image?.[0]?.url || "",
                source: "spotify",
                qualities: [
                    { label: "MP3 Audio", ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName} audio` }
                ]
            };
        }
    } catch(e) {
        return { success: false, message: e.message };
    }
}
extractSpotify('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M').then(r => console.log("Playlist:", r.media?.length));
extractSpotify('https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3').then(r => console.log("Track:", r.title));
