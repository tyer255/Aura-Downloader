const { snapsave } = require('@bochilteam/scraper-snapsave');
async function run() {
  console.log(await snapsave('https://www.instagram.com/reel/C7pM63fK30K/'));
}
run();
