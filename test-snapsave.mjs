import { snapsave } from "snapsave-media-downloader";
async function run() {
  console.log(await snapsave("https://www.tiktok.com/@mrbeast/video/7387342686127328543"));
  console.log(await snapsave("https://www.instagram.com/p/C-hQ1u4A2L1"));
}
run();
