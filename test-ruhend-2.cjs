const { igdl } = require('ruhend-scraper');
async function run() {
  console.log(await igdl('https://www.instagram.com/reel/C7pM63fK30K/'));
}
run();
