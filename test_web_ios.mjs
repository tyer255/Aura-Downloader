import ytdl from 'youtube-dl-exec';

const start = Date.now();
const data = await ytdl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
  dumpSingleJson: true,
  noWarnings: true,
  noCheckCertificate: true,
  noPlaylist: true,
  extractorArgs: "youtube:player_client=web,ios"
});

const videoFormats = data.formats.filter(f => f.vcodec !== 'none' && f.height);
const heights = [...new Set(videoFormats.map(f => f.height))].sort((a,b) => b-a);
console.log(`Time: ${Date.now() - start}ms`);
console.log("Heights:", heights.join(', '));
console.log("Title:", data.title);
console.log("Thumbnail:", data.thumbnail);
