import ytdl from 'youtube-dl-exec';

async function extractWithYtDlp(url) {
    let options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: true,
      noCheckFormats: true,
      extractorArgs: "youtube:player_client=android"
    };
    
    const data = await ytdl(url, options);
    
    let qualities = [];
    let mediaUrl = data.url;
    
    if (data.formats && data.formats.length > 0) {
      const audioFormats = data.formats.filter((f) => f.acodec !== 'none' && f.vcodec === 'none');
      const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

      const videoFormats = data.formats.filter((f) => f.vcodec !== 'none');
      
      const heights = new Map();
      videoFormats.forEach((f) => {
        if (!f.height) return;
        const current = heights.get(f.height);
        if (!current || (current.acodec === 'none' && f.acodec !== 'none')) {
           heights.set(f.height, f);
        }
      });
      
      const sortedHeights = Array.from(heights.keys()).sort((a, b) => b - a);
      
      sortedHeights.forEach((h) => {
         const f = heights.get(h);
         let qUrl = f.url;
         
         if (f.acodec === 'none' && bestAudio) {
            qUrl = `/api/proxy-download?url=${encodeURIComponent(f.url)}&audioUrl=${encodeURIComponent(bestAudio.url)}&mux=true&filename=video_${h}p.mp4`;
         }
         
         qualities.push({
            label: `${h}p`,
            url: qUrl,
            ext: "mp4",
            size: `~ ${Math.round((f.filesize || f.filesize_approx || 0) / 1024 / 1024)} MB`
         });
      });
      
      if (bestAudio) {
         qualities.push({
            label: "Audio (MP3)",
            url: `/api/proxy-download?url=${encodeURIComponent(bestAudio.url)}&filename=${encodeURIComponent(data.title || "audio")}.mp3&extractAudio=true`,
            ext: "mp3",
            size: "Audio Only"
         });
      }
      
      if (qualities.length > 0) {
         mediaUrl = qualities[0].url;
      }
    }

    return {
      success: true,
      title: data.title,
      url: mediaUrl,
      thumbnail: data.thumbnail,
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities
    };
}

const start = Date.now();
const res = await extractWithYtDlp("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
console.log("Time:", Date.now() - start, "ms");
console.log("Title:", res.title);
console.log("Thumbnail:", res.thumbnail);
console.log("Qualities count:", res.qualities.length);
console.log("Qualities:", res.qualities.map(q => q.label));
