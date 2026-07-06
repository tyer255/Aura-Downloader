const nayan = require("nayan-media-downloader");
async function run() {
  try {
     console.log(await nayan.ndown("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
  } catch(e) {
     console.log("Error:", e.message);
  }
}
run();
