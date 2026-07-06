const { TiktokDL } = require("@tobyg74/tiktok-api-dl");
const igdl = require("@sasmeee/igdl");

async function run() {
  try {
     console.log("TTDL:", await TiktokDL("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
  } catch (e) {
     console.error("TTDL Error:", e.message);
  }
  try {
     console.log("IGDL:", await igdl("https://www.instagram.com/p/C-hQ1u4A2L1"));
  } catch (e) {
     console.error("IGDL Error:", e.message);
  }
}
run();
