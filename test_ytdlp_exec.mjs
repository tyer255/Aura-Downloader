import ytdl from 'youtube-dl-exec';
const start = Date.now();
try {
    const res = await ytdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        noPlaylist: true,
        youtubeSkipDashManifest: true,
        youtubeSkipHlsManifest: true,
        noCheckFormats: true,
        checkFormats: "no"
    });
    console.log("Time default:", Date.now() - start);
} catch(e) {
    console.error(e.message);
}
