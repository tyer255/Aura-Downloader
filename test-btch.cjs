const btch = require("btch-downloader");
async function run() {
  try {
     console.log("YTDL:", await btch.youtube("https://youtube.com/shorts/95DoDH-zPLo?si=gYJjGhk6fApS2qJE"));
  } catch(e) { console.error("yt error", e.message) }
}
run();
