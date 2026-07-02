const dylux = require('api-dylux');
async function run() {
  try {
    console.log("ig:", await dylux.igdl('https://www.instagram.com/p/C-Xy1xSOPkG/'));
  } catch(e) { console.error("ig error", e.message); }
  try {
    console.log("tt:", await dylux.tiktok('https://www.tiktok.com/@mrbeast/video/7279138407425150250'));
  } catch(e) { console.error("tt error", e.message); }
}
run();
