const ab = require('ab-downloader');
async function run() {
  console.log(await ab.igdl('https://www.instagram.com/p/C9Hh90OyzNq/'));
}
run();
