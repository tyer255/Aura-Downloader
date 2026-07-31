import ytdl from 'youtube-dl-exec';

const clients = [
  undefined,
  "youtube:player_client=ios",
  "youtube:player_client=web",
  "youtube:player_client=mweb",
  "youtube:player_client=tv"
];

for (let c of clients) {
    try {
        let options = {
          dumpSingleJson: true,
          noWarnings: true,
          noCheckCertificate: true,
          noPlaylist: true,
        };
        if (c) options.extractorArgs = c;
        const start = Date.now();
        const data = await ytdl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", options);
        const videoFormats = data.formats.filter(f => f.vcodec !== 'none' && f.height);
        const heights = [...new Set(videoFormats.map(f => f.height))].sort((a,b) => b-a);
        console.log(`Client: ${c || 'default'}, Time: ${Date.now() - start}ms, Heights: ${heights.join(', ')}`);
    } catch(e) {
        console.log(`Client: ${c}, Error: ${e.message.split('\n')[0]}`);
    }
}
