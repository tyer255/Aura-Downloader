const scraper = require('@selxyzz/instagram-dl');
async function run() {
  try {
    const res = await scraper.igdl('https://www.instagram.com/p/C9Hh90OyzNq/');
    console.log(JSON.stringify(res, null, 2));
  } catch(e) { console.log(e.message) }
}
run();
