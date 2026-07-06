const snapsave = require('snapsave-media-downloader');
const ruhend = require('ruhend-scraper');

async function run() {
  try {
     console.log("SnapSave IG:", await snapsave.instagram("https://www.instagram.com/p/C-hQ1u4A2L1"));
  } catch(e) {
     console.log("SnapSave Error", e.message)
  }
  try {
     console.log("Ruhend TT:", await ruhend.ttdl("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
  } catch(e) {
     console.log("Ruhend Error", e.message)
  }
}
run();
