const nayan = require("nayan-media-downloader");

async function run() {
  try {
     const res1 = await nayan.igdl("https://www.instagram.com/p/C-hQ1u4A2L1");
     console.log("IG:", res1);
     const res2 = await nayan.twitterdown("https://x.com/SpaceX/status/1785834898144604561");
     console.log("TWITTER:", res2);
  } catch(e) {
     console.log(e)
  }
}
run();
