const { execSync } = require('child_process');
try {
  const out = execSync('yt-dlp -j --no-warnings "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', { maxBuffer: 1024*1024*10 });
  const data = JSON.parse(out.toString());
  console.log({
     title: data.title,
     thumbnail: data.thumbnail
  });
} catch(e) { console.log("error", e.message); }
