const xct = require("@xct007/tiktok-scraper");
async function run() {
  console.log(await xct.default("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
}
run();
