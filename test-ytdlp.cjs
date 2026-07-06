const ytDlp = require('yt-dlp-exec');
async function run() {
  try {
     console.log("YouTube:", await ytDlp("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { dumpJson: true }));
  } catch (e) {
     console.error("Error:", e);
  }
}
run();
