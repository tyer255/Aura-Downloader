const { igdl, igdl2 } = require('ruhend-scraper');
async function run() {
  console.log("=== igdl ===");
  try {
    console.log(await igdl('https://www.instagram.com/p/C9Hh90OyzNq/'));
  } catch(e) { console.log(e.message); }
  
  console.log("=== igdl2 ===");
  try {
    console.log(await igdl2('https://www.instagram.com/p/C9Hh90OyzNq/'));
  } catch(e) { console.log(e.message); }
}
run();
