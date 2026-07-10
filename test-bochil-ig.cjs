const scraper = require('@bochilteam/scraper-instagram');
async function run() {
  console.log(await scraper.instagramdl('https://www.instagram.com/p/C9Hh90OyzNq/'));
}
run();
