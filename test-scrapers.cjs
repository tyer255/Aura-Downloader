const { ttdl, youtube, twitter, fbdown, igdl, terabox } = require("btch-downloader");
async function run() {
  try {
     console.log("IGDL:", await igdl("https://www.instagram.com/p/C-hQ1u4A2L1"));
     console.log("TWITTER:", await twitter("https://x.com/SpaceX/status/1785834898144604561"));
  } catch (e) {
     console.error("Error:", e);
  }
}
run();
