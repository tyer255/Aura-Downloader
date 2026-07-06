const tiktok = require("@mrnima/tiktok-downloader");
async function run() {
  try {
     const data = await tiktok.tiktokdl("https://www.tiktok.com/@mrbeast/video/7387342686127328543");
     console.log(data);
  } catch(e) {
     console.log(e);
  }
}
run();
