const btch = require('btch-downloader');
async function run() {
  try {
    console.log("ig:", await btch.igdl('https://www.instagram.com/p/C-Xy1xSOPkG/'));
  } catch(e) { console.error("ig error", e.message); }
}
run();
