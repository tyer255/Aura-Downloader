async function run() {
  const { instagramdl } = require('@bochilteam/scraper');
  console.log(await instagramdl('https://www.instagram.com/p/C9Hh90OyzNq/'));
}
run();
