const btch = require('btch-downloader');
async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  console.log(await btch.igdl(url));
}
run();
