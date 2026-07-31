import ytdl from 'youtube-dl-exec';
const start = Date.now();
try {
    const res = await ytdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        noPlaylist: true,
        extractorArgs: "youtube:player_client=android"
    });
    console.log("Time optimized:", Date.now() - start);
} catch(e) {
    console.error(e.message);
}
