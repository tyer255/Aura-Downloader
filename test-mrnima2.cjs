const ig = require("@mrnima/instagram-downloader");
async function run() {
  try {
     const data = await ig.igdl("https://www.instagram.com/p/C-hQ1u4A2L1");
     console.log(data);
  } catch(e) {
     console.log(e);
  }
}
run();
