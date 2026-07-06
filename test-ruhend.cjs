const scraper = require("ruhend-scraper");
async function run() {
  try {
     console.log("TTDL:", await scraper.ttdl("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
  } catch(e) { console.log(e); }
  try {
     console.log("IGDL:", await scraper.igdl("https://www.instagram.com/p/C-hQ1u4A2L1"));
  } catch(e) { console.log(e); }
}
run();
