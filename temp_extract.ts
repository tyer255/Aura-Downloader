async function extractSpotify(url: string) {
    try {
        const axios = (await import('axios')).default;
        if (url.includes('spoti.fi') || url.includes('spotify.link')) {
            try {
                const redirectRes = await axios.get(url, { maxRedirects: 5, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
                if (redirectRes.request?.res?.responseUrl) {
                    url = redirectRes.request.res.responseUrl;
                }
            } catch(e) {}
        }

        const isPlaylist = url.includes('/playlist/') || url.includes('/album/');
        const trackIdMatch = url.match(/track[\/:]([a-zA-Z0-9]+)/);

        if (!isPlaylist && trackIdMatch && trackIdMatch[1]) {
            const trackId = trackIdMatch[1];
            const details = await getSpotifyTrackDetails(trackId);

            const title = details.trackName
              ? details.trackName + (details.primaryArtist ? ` - ${details.primaryArtist}` : "")
              : "Spotify Track";

            let lyrics = "";
            let syncedLyrics = "";
            try {
              const lyricsRes = await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(details.trackName)}&artist_name=${encodeURIComponent(details.primaryArtist)}`, { timeout: 2000 });
              if (lyricsRes.data && lyricsRes.data.length > 0) {
                lyrics = lyricsRes.data[0].plainLyrics || "";
                syncedLyrics = lyricsRes.data[0].syncedLyrics || "";
              }
            } catch (e) {
              // Ignore lyrics fetch errors
            }

            const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(details.trackName)}&artist=${encodeURIComponent(details.primaryArtist)}&artists=${encodeURIComponent(details.allArtists.join(','))}&durationMs=${details.durationMs}&isrc=${encodeURIComponent(details.isrc)}`;

            return {
              success: true,
              mediaType: 'audio',
              title: title,
              thumbnail: details.thumbnail,
              source: "spotify",
              lyrics,
              syncedLyrics,
              qualities: [
                {
                  label: "MP3 Audio",
                  url: resolveUrl,
                  ext: "mp3",
                  isAudio: true,
                  size: "Unknown Size",
                  _query: `${details.trackName} ${details.primaryArtist}`
                }
              ]
            };
        }

        let embedUrl = url;
        if (url.includes('open.spotify.com/')) {
            embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
        } else {
            embedUrl = `https://open.spotify.com/embed/${url.split('spotify.com/')[1] || ''}`;
        }
        
        const res = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const nextMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!nextMatch) return { success: false, message: 'Spotify extraction failed: No data found' };
        
        const json = JSON.parse(nextMatch[1]);
        const entity = json?.props?.pageProps?.state?.data?.entity;
        
        if (!entity) return { success: false, message: 'Spotify data not found in page' };
        
        if (isPlaylist) {
            const tracks = entity.trackList || [];
            const playlistCover = entity.visualIdentity?.image?.[0]?.url || "";

            const resolvedTracks = await Promise.all(tracks.map(async (t: any) => {
                if (!t.title) return null;
                const trackName = t.title;
                const artistName = t.subtitle || (t.artists && t.artists[0] ? t.artists[0].name : "");
                let trackId = "";
                if (t.uri && t.uri.includes('track:')) {
                    trackId = t.uri.split(':')[2] || "";
                }
                let thumb = t.image?.[0]?.url || "";

                if (!thumb && trackId) {
                    try {
                        const oemb = await axios.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`, { timeout: 2500 });
                        if (oemb.data && oemb.data.thumbnail_url) {
                            thumb = oemb.data.thumbnail_url;
                        }
                    } catch(e) {}
                }

                if (!thumb) {
                    thumb = playlistCover;
                }

                const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&durationMs=${t.duration || 0}`;

                return {
                    type: "audio",
                    url: resolveUrl,
                    thumbnail: thumb,
                    title: trackName + (artistName ? ` - ${artistName}` : ""),
                    qualities: [
                        { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName}` }
                    ]
                };
            }));

            const media = resolvedTracks.filter(Boolean);

            return {
                success: true,
                mediaType: 'playlist',
                title: entity.name || "Spotify Playlist",
                thumbnail: playlistCover,
                source: "spotify",
                media: media
            };
        } else {
            const trackName = entity.title || entity.name;
            const artistName = entity.artists?.[0]?.name || "";
            const thumb = entity.visualIdentity?.image?.[0]?.url || "";
            const trackId = entity.id || "";
            const durationMs = entity.duration || 0;

            const resolveUrl = `/api/spotify-resolve?trackId=${encodeURIComponent(trackId)}&title=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}&durationMs=${durationMs}`;
            
            let lyrics = "";
            let syncedLyrics = "";
            try {
              const lyricsRes = await axios.get(`https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`, { timeout: 2000 });
              if (lyricsRes.data && lyricsRes.data.length > 0) {
                lyrics = lyricsRes.data[0].plainLyrics || "";
                syncedLyrics = lyricsRes.data[0].syncedLyrics || "";
              }
            } catch (e) {
              // Ignore lyrics fetch errors
            }
            
            return {
                success: true,
                mediaType: 'audio',
                title: trackName + (artistName ? ` - ${artistName}` : ""),
                thumbnail: thumb,
                source: "spotify",
                lyrics,
                syncedLyrics,
                qualities: [
                    { label: "MP3 Audio", url: resolveUrl, ext: "mp3", isAudio: true, size: "Unknown Size", _query: `${trackName} ${artistName}` }
                ]
            };
        }
    } catch(e: any) {
